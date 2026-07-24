import { ConfigService } from '@nestjs/config';
import { CredentialVaultService } from '../../../src/endpoints/schedule/credential-vault.service';
import { DbClient } from '../../../src/database/db-client';

const KEY = 'a'.repeat(64); // 32 bytes hex

function config(key: string | undefined): ConfigService {
  return { get: (k: string) => (k === 'CREDENTIAL_KEY_LOCAL' ? key : undefined) } as unknown as ConfigService;
}

function dbWithStore() {
  let stored: Record<string, string> | null = null;
  const db = {
    credential: {
      upsert: jest.fn(async ({ create }: { create: Record<string, string> }) => {
        stored = create;
        return stored;
      }),
      findUnique: jest.fn(async () => stored),
      count: jest.fn(async () => (stored ? 1 : 0)),
      deleteMany: jest.fn(async () => {
        stored = null;
        return { count: 1 };
      }),
    },
  };
  return {
    db: db as unknown as DbClient,
    get: () => stored,
    set: (v: Record<string, string> | null) => {
      stored = v;
    },
  };
}

describe('CredentialVaultService', () => {
  it('store_thenLoad_roundTripsPlaintext', async () => {
    const store = dbWithStore();
    const vault = new CredentialVaultService(config(KEY), store.db);
    await vault.store('ACC', 'user@example.com', 's3cret!');
    await expect(vault.load('ACC')).resolves.toEqual({
      username: 'user@example.com',
      password: 's3cret!',
    });
  });

  it('load_withTamperedAuthTag_throws', async () => {
    const store = dbWithStore();
    const vault = new CredentialVaultService(config(KEY), store.db);
    await vault.store('ACC', 'u', 'p');
    const row = store.get()!;
    store.set({ ...row, authTag: Buffer.alloc(16).toString('base64') }); // valid length, wrong tag
    await expect(vault.load('ACC')).rejects.toThrow();
  });

  it('store_withoutKey_isDisabledAndThrows', async () => {
    const store = dbWithStore();
    const vault = new CredentialVaultService(config(''), store.db);
    expect(vault.enabled).toBe(false);
    await expect(vault.store('ACC', 'u', 'p')).rejects.toThrow();
  });
});
