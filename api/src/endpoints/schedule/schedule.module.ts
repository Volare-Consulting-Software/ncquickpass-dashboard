import { Module } from '@nestjs/common';
import { NcqpModule } from '../ncqp/ncqp.module';
import { AuthModule } from '../auth/auth.module';
import { ScheduleController } from './schedule.controller';
import { CronController } from './cron.controller';
import { ScheduleService } from './schedule.service';
import { MaterializationService } from './materialization.service';
import { CredentialVaultService } from './credential-vault.service';
import { ScheduleCron } from './schedule.cron';

/**
 * Weekly HOV schedule: persistence, materialization into NCQP declarations, the
 * encrypted credential vault, and the background reconcile cron. DbClient
 * comes from the global DatabaseModule; NcqpService from NcqpModule.
 */
@Module({
  imports: [NcqpModule, AuthModule],
  controllers: [ScheduleController, CronController],
  providers: [ScheduleService, MaterializationService, CredentialVaultService, ScheduleCron],
})
export class HovScheduleModule {}
