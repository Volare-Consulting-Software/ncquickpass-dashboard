import { IsInt, Max, Min } from 'class-validator';

/** A single active window within a day, in minutes-from-midnight (0..1440). */
export class TimeRangeDto {
  @IsInt()
  @Min(0)
  @Max(1440)
  startMinute!: number;

  @IsInt()
  @Min(0)
  @Max(1440)
  endMinute!: number;
}
