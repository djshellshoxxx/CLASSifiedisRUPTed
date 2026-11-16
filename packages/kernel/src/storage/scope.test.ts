import { describe, expect, it } from 'vitest';
import * as z from 'zod';
import { createFakeClock } from '../clock/clock.ts';
import { ok } from '../errors/result.ts';
import { createDeterministicIds } from '../ids/uuidv7.ts';
import { defineRepo } from './repo.ts';
import { writeScope } from './scope.ts';
import { createMemoryStorage } from './storage.ts';
import type { Tx } from './tx.ts';

describe('tenant scoping (PS-119)', () => {
  it('TEST-PS-119-09.T06 repositories, leases and sync entries are confined to the scope tenant', async () => {
    const clock = createFakeClock();
    const ids = createDeterministicIds({ now: () => clock.now() });
    const repoDef = defineRepo({ type: 'test.thing', schema: z.strictObject({ v: z.int() }), indexes: { v: (d) => String(d.v) } });
    const s = createMemoryStorage();
    const sc = (tx: Tx, tenantId: string) => writeScope({ tx, tenantId, clock, ids, deliveryEligible: true });
    await s.transaction((tx) => {
      sc(tx, 'A').repo(repoDef).put('x', { v: 1 }, { expectedRevision: 0 });
      sc(tx, 'A').leases.acquire('res', 'h1');
      sc(tx, 'A').sync.enqueue('relay:r', { cid: 'sha256-a', type: 't/v1' });
      return ok(undefined);
    });
    const viewB = await s.read((tx) => {
      const b = sc(tx, 'B');
      const q = b.repo(repoDef).query({ where: { v: '1' } });
      return { get: b.repo(repoDef).get('x'), items: q.ok ? q.value.items.length : -1, lease: b.leases.get('res'), sync: b.sync.list().length };
    });
    expect(viewB).toEqual({ get: undefined, items: 0, lease: undefined, sync: 0 });
    const upd = await s.transaction((tx) => sc(tx, 'B').repo(repoDef).put('x', { v: 2 }, { expectedRevision: 1 }));
    expect(!upd.ok && upd.error.code).toBe('NOT_FOUND');
    expect((await s.transaction((tx) => sc(tx, 'B').leases.acquire('res', 'h2'))).ok).toBe(true);
    expect((await s.transaction((tx) => sc(tx, 'B').repo(repoDef).put('x', { v: 3 }, { expectedRevision: 0 }))).ok).toBe(true);
    expect(await s.read((tx) => sc(tx, 'A').repo(repoDef).get('x')?.data)).toEqual({ v: 1 });
    const foreign = await s.read((tx) => sc(tx, 'A').sync.list()[0]?.id ?? '');
    expect(await s.read((tx) => sc(tx, 'B').sync.get(foreign))).toBeUndefined();
  });
});
