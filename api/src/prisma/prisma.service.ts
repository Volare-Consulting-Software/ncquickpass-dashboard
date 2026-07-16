import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../generated/prisma/client';

/**
 * Prisma 7 client for the app's SQLite database. Uses the better-sqlite3 driver
 * adapter (no query-engine binary). The database file comes from DATABASE_URL
 * (e.g. `file:./dev.db` in dev, `file:/data/hov.db` in the container).
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(config: ConfigService) {
    const url = config.get<string>('DATABASE_URL', 'file:./dev.db');
    super({ adapter: new PrismaBetterSqlite3({ url }) });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Connected to SQLite via better-sqlite3 adapter');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
