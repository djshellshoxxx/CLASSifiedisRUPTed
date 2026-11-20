import { describe, expect, it } from 'vitest';
import * as z from 'zod';
import { createFakeClock } from '../clock/clock.ts';
import { ok } from '../errors/result.ts';
import { createDeterministicIds } from '../ids/uuidv7.ts';
import { defineRepo } from './repo.ts';
import { writeScope } from './scope.ts';
import { createMemoryStorage } from './storage.ts';
import { blobRefOf, type Tx } from './tx.ts';

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

  it('keeps the scope tenant, supplied bytes and clock authoritative over extra blob metadata', async () => {
    const clock = createFakeClock();
    const ids = createDeterministicIds({ now: () => clock.now() });
    const storage = createMemoryStorage();
    const bytes = new Uint8Array([1, 2, 3]);
    const suppliedRef = await blobRefOf(bytes);
    // A structurally compatible value can carry extra fields without a type assertion.
    const metadata = { contentType: 'image/png', privacy: 'P2' as const, encrypted: true,
      tenant: 'B', bytes: new Uint8Array([9, 8, 7]), now: 0 };
    try {
      const result = await storage.transaction(tx => writeScope({ tx, tenantId: 'A', clock, ids,
        deliveryEligible: false }).blobs.put(bytes, metadata));
      expect(result.ok && result.value).toMatchObject({ ref: suppliedRef, size: 3,
        contentType: 'image/png', privacy: 'P2', encrypted: true, createdAt: clock.iso() });
      expect(await storage.read(tx => tx.blobs.get('A', suppliedRef)?.bytes)).toEqual(bytes);
      expect(await storage.read(tx => tx.blobs.get('B', suppliedRef))).toBeUndefined();
      const alternateRef = await blobRefOf(metadata.bytes);
      expect(await storage.read(tx => tx.blobs.get('B', alternateRef))).toBeUndefined();
    } finally { await storage.close(); }
  });

  it('cannot downgrade another tenant\'s private blob through extra metadata', async () => {
    const clock = createFakeClock();
    const ids = createDeterministicIds({ now: () => clock.now() });
    const storage = createMemoryStorage();
    const bytes = new Uint8Array([4, 5, 6]);
    const ref = await blobRefOf(bytes);
    const scope = (tx: Tx, tenantId: string) => writeScope({ tx, tenantId, clock, ids, deliveryEligible: false });
    const metadata = { contentType: 'image/png', privacy: 'P0' as const, tenant: 'B' };
    try {
      const initial = await storage.transaction(tx => scope(tx, 'B').blobs.put(bytes,
        { contentType: 'image/png', privacy: 'P2', encrypted: true }));
      expect(initial.ok).toBe(true);
      const result = await storage.transaction(tx => scope(tx, 'A').blobs.put(bytes, metadata));
      expect(result.ok).toBe(true);
      expect(await storage.read(tx => scope(tx, 'B').blobs.info(ref)))
        .toMatchObject({ privacy: 'P2', encrypted: true });
      expect(await storage.read(tx => scope(tx, 'A').blobs.info(ref)))
        .toMatchObject({ privacy: 'P0', encrypted: false });
    } finally { await storage.close(); }
  });
});
