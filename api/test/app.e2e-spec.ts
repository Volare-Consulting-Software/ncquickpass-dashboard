import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { DbClient } from './../src/database/db-client';

// These routes don't touch the database, so stub DbClient: it avoids a real
// SQLite connection and sidesteps Prisma 7's WASM query compiler, which needs
// dynamic import() that Jest can't load without --experimental-vm-modules.
const dbStub = {
  onModuleInit: async () => undefined,
  onModuleDestroy: async () => undefined,
  $connect: async () => undefined,
  $disconnect: async () => undefined,
};

describe('AppModule (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DbClient)
      .useValue(dbStub)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  it('getHealth_always_returnsOk', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('getHovStatus_withoutSession_returnsUnauthorized', () => {
    return request(app.getHttpServer()).get('/api/hov/status').expect(401);
  });

  afterEach(async () => {
    await app.close();
  });
});
