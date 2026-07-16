import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ScheduleDayDto } from './schedule-day.dto';

/** Upsert the weekly schedule for one transponder. */
export class PutScheduleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  transponderNumber!: string;

  @IsBoolean()
  enabled!: boolean;

  /** IANA timezone the day/time ranges are expressed in. Defaults to Eastern. */
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleDayDto)
  days!: ScheduleDayDto[];
}
