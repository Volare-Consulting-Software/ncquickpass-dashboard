import { Module } from '@nestjs/common';
import { ScheduleController } from './schedule.controller';
import { ScheduleService } from './schedule.service';

/** Weekly HOV schedule persistence. PrismaService comes from the global PrismaModule. */
@Module({
  controllers: [ScheduleController],
  providers: [ScheduleService],
})
export class HovScheduleModule {}
