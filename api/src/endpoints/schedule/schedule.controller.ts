import { Body, Controller, Delete, Get, Put, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/session/auth.guard';
import { CurrentSession } from '../auth/session/current-session.decorator';
import type { NcqpSession } from '../auth/session/session';
import { PutScheduleDto } from '../../models/schedule/put-schedule.dto';
import { ScheduleService, ScheduleView } from './schedule.service';

@Controller('hov/schedule')
@UseGuards(AuthGuard)
export class ScheduleController {
  constructor(private readonly schedule: ScheduleService) {}

  @Get()
  get(
    @CurrentSession() session: NcqpSession,
    @Query('transponder') transponder: string,
  ): Promise<ScheduleView> {
    return this.schedule.getSchedule(session.accountId, transponder);
  }

  @Put()
  put(
    @CurrentSession() session: NcqpSession,
    @Body() dto: PutScheduleDto,
  ): Promise<ScheduleView> {
    return this.schedule.putSchedule(session.accountId, dto);
  }

  @Delete()
  remove(
    @CurrentSession() session: NcqpSession,
    @Query('transponder') transponder: string,
  ): Promise<{ deleted: boolean }> {
    return this.schedule.deleteSchedule(session.accountId, transponder);
  }
}
