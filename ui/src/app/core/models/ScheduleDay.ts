import { ScheduleTimeRange } from './ScheduleTimeRange';

/** One day of the recurring week. allDay ignores ranges (whole day active). */
export interface ScheduleDay {
  dayOfWeek: number; // 0=Sun .. 6=Sat
  allDay: boolean;
  ranges: ScheduleTimeRange[];
}
