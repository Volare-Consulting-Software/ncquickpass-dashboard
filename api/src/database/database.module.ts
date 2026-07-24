import { Global, Module } from '@nestjs/common';
import { DbClient } from './db-client';

/** Global so any feature module can inject DbClient without re-importing. */
@Global()
@Module({
  providers: [DbClient],
  exports: [DbClient],
})
export class DatabaseModule {}
