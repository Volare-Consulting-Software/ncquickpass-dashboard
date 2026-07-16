/** An active window within a day, in minutes-from-midnight (schedule timezone). */
export interface ScheduleTimeRange {
  startMinute: number;
  endMinute: number;
}
