import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, Max, Min, ValidateNested } from 'class-validator';
import { TimeRangeDto } from './TimeRangeDto';

/** One day of the recurring week. allDay ignores ranges (whole day is active). */
export class ScheduleDayDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number; // 0=Sun .. 6=Sat

  @IsBoolean()
  allDay!: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeRangeDto)
  ranges!: TimeRangeDto[];
}
