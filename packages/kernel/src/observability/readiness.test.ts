import { describe, expect, it } from 'vitest';
import { err, ok } from '../errors/result.ts';
import { appError } from '../errors/app-error.ts';
import { runMigrations } from '../storage/migrations.ts';
import { createMemoryStorage, type Storage } from '../storage/storage.ts';
import { createFakeClock } from '../clock/clock.ts';
import { createReadiness } from './readiness.ts';

describe('readiness (CTR-OBS-001 OBS-6)', () => {
  it('TEST-PS-121-09.T08 ready only with writable storage, current migrations and lag < 60 s; probe failures report unready', async () => {
    const storage = createMemoryStorage();
    const migrations = [{ id: 'test:0001', up: () => ok(undefined) }];
    let lag = 0;
    const probe = createReadiness({ storage, migrations, lagMs: () => lag });
    expect(await probe.check()).toEqual({ ready: false, checks: { storage: true, migrations: false, outboxLag: true }, lagMs: 0 });
    await runMigrations(storage, migrations, createFakeClock());
    expect((await probe.check()).ready).toBe(true);
    lag = 60_000;
    expect(await probe.check()).toEqual({ ready: false, checks: { storage: true, migrations: true, outboxLag: false }, lagMs: 60_000 });
    const throwing = createReadiness({ storage, lagMs: () => { throw new Error('x'); } });
    expect(await throwing.check()).toEqual({ ready: false, checks: { storage: true, migrations: true, outboxLag: false }, lagMs: -1 });
    const broken: Storage = { ...storage, ping: async () => false };
    expect((await createReadiness({ storage: broken }).check()).checks).toEqual({ storage: false, migrations: false, outboxLag: true });
    await storage.close();
    expect((await createReadiness({ storage }).check()).ready).toBe(false);
    void err(appError('INTERNAL'));
  });
});
