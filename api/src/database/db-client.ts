import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

/**
 * The application's database client. Backed by Prisma 7 over the node-postgres
 * (`pg`) driver adapter (no query-engine binary). The connection string comes
 * from DATABASE_URL — a local Postgres container in dev/compose, Neon in prod.
 * Neon speaks standard TCP Postgres with SSL, so the same adapter serves both.
 */
@Injectable()
export class DbClient
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(DbClient.name);

  constructor(config: ConfigService) {
    const connectionString = config.get<string>('DATABASE_URL');
    super({ adapter: new PrismaPg({ connectionString }) });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Connected to Postgres');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
