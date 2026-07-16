import { ScheduleDay } from './ScheduleDay';

/** A vehicle's weekly HOV schedule, as returned by GET /api/hov/schedule. */
export interface WeeklySchedule {
  transponderNumber: string;
  enabled: boolean;
  timezone: string;
  horizonDays: number;
  days: ScheduleDay[];
  /** Whether the account has stored credentials for unattended scheduling. */
  credentialOnFile: boolean;
}
