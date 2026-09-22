import { MaterializationService } from '../../../src/endpoints/schedule/materialization.service';
import { DbClient } from '../../../src/database/db-client';
import { NcqpHovClient } from '../../../src/endpoints/ncqp/ncqp-hov.client';
import { RoadGroupService } from '../../../src/roads/road-group.service';
import { DeclarationStatus } from '../../../src/endpoints/schedule/schedule.constants';

const CTX = { token: 't', userId: 'u', accountId: 'ACC' };
const TZ = 'America/New_York';
const FIXED = new Date('2026-07-15T12:00:00Z');

function allDayWeek() {
  return Array.from({ length: 7 }, (_, dayOfWeek) => ({ dayOfWeek, allDay: true, ranges: [] }));
}

function makeMocks(schedule: unknown, existing: unknown[]) {
  const db = {
    weeklySchedule: { findFirst: jest.fn().mockResolvedValue(schedule) },
    hOVDeclaration: {
      findMany: jest.fn().mockResolvedValue(existing),
      upsert: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
    },
  };
  const ncqp = {
    activateHov: jest.fn().mockResolvedValue(111),
    cancelHov: jest.fn().mockResolvedValue('Canceled'),
  };
  const roads = { defaultHovLocation: jest.fn().mockReturnValue('Road A') };
  const service = new MaterializationService(
    db as unknown as DbClient,
    ncqp as unknown as NcqpHovClient,
    roads as unknown as RoadGroupService,
  );
  return { db, ncqp, service };
}

describe('MaterializationService.reconcileSchedule', () => {
  beforeAll(() => jest.useFakeTimers({ now: FIXED }));
  afterAll(() => jest.useRealTimers());

  it('reconcileSchedule_missingWindows_createsDeclarations', async () => {
    const schedule = {
      id: 's1',
      accountId: 'ACC',
      enabled: true,
      transponderNumber: 'TAG1',
      timezone: TZ,
      horizonDays: 7,
      days: allDayWeek(),
    };
    const { ncqp, db, service } = makeMocks(schedule, []);
    const result = await service.reconcileSchedule(CTX, 's1');
    expect(ncqp.activateHov).toHaveBeenCalled();
    expect(db.hOVDeclaration.upsert).toHaveBeenCalled();
    expect(result.created).toBeGreaterThan(0);
    expect(ncqp.cancelHov).not.toHaveBeenCalled();
  });

  it('reconcileSchedule_removedWindow_cancels', async () => {
    // Enabled schedule with no active days -> nothing desired; the future row is stale.
    const schedule = {
      id: 's1',
      accountId: 'ACC',
      enabled: true,
      transponderNumber: 'TAG1',
      timezone: TZ,
      horizonDays: 7,
      days: [],
    };
    const existing = [
      {
        id: 'row1',
        windowStart: new Date('2030-01-01T00:00:00Z'),
        windowEnd: new Date('2030-01-01T01:00:00Z'),
        ncqpDeclarationId: '999',
      },
    ];
    const { ncqp, db, service } = makeMocks(schedule, existing);
    const result = await service.reconcileSchedule(CTX, 's1');
    expect(ncqp.cancelHov).toHaveBeenCalledWith('t', '999', 'u');
    expect(db.hOVDeclaration.update).toHaveBeenCalledWith({
      where: { id: 'row1' },
      data: { status: DeclarationStatus.Canceled },
    });
    expect(ncqp.activateHov).not.toHaveBeenCalled();
    expect(result.canceled).toBe(1);
  });

  it('reconcileSchedule_disabledSchedule_doesNothing', async () => {
    const schedule = { id: 's1', accountId: 'ACC', enabled: false, days: [] };
    const { ncqp, service } = makeMocks(schedule, []);
    const result = await service.reconcileSchedule(CTX, 's1');
    expect(ncqp.activateHov).not.toHaveBeenCalled();
    expect(ncqp.cancelHov).not.toHaveBeenCalled();
    expect(result).toEqual({ created: 0, canceled: 0 });
  });
});

interface UpsertArg {
  create: { windowStart: Date; windowEnd: Date; ncqpDeclarationId: string };
}

describe('MaterializationService.reconcileSchedule across consecutive daily runs', () => {
  const schedule = {
    id: 's1',
    accountId: 'ACC',
    enabled: true,
    transponderNumber: 'TAG1',
    timezone: TZ,
    horizonDays: 7,
    days: allDayWeek(),
  };
  // Two 03:00 America/New_York cron runs a day apart (EDT, UTC-4).
  const FIRST_RUN = new Date('2026-07-15T07:00:00.000Z');
  const SECOND_RUN = new Date('2026-07-16T07:00:00.123Z');

  function rowsFrom(db: ReturnType<typeof makeMocks>['db']) {
    const calls = db.hOVDeclaration.upsert.mock
      .calls as unknown as UpsertArg[][];
    return calls.map(([arg], index) => ({
      id: `row${index}`,
      windowStart: arg.create.windowStart,
      windowEnd: arg.create.windowEnd,
      ncqpDeclarationId: String(arg.create.ncqpDeclarationId),
    }));
  }

  it('reconcileSchedule_secondDailyRunUnchangedSchedule_addsHorizonDayAndCancelsNothing', async () => {
    jest.useFakeTimers({ now: FIRST_RUN });
    const first = makeMocks(schedule, []);
    await first.service.reconcileSchedule(CTX, 's1');
    const persisted = rowsFrom(first.db);

    jest.setSystemTime(SECOND_RUN);
    const stillFuture = persisted.filter((row) => row.windowEnd >= SECOND_RUN);
    const second = makeMocks(schedule, stillFuture);
    const result = await second.service.reconcileSchedule(CTX, 's1');
    jest.useRealTimers();

    expect(result.canceled).toBe(0);
    expect(second.ncqp.cancelHov).not.toHaveBeenCalled();
    // The horizon rolled forward one day; every other window already existed.
    expect(result.created).toBe(1);
  });
});
