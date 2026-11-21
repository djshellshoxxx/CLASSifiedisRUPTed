import { describe, expect, it } from 'vitest';
import { MemoryState, createMemoryDriver } from '../../packages/kernel/src/storage/memory-driver.ts';
import { createMemoryStorage } from '../../packages/kernel/src/storage/storage.ts';
import { ok } from '../../packages/kernel/src/errors/result.ts';

describe('ephemeral in-memory group indexes', () => {
  it('evicts the final key without disturbing another tenant or a surviving holder', () => {
    const state = new MemoryState();
    const owner = { tenant: 'group-owner', ref: 'blob:sha256-owner', holder: 'listing/1' };
    const second = { ...owner, holder: 'listing/2' };
    const foreign = { tenant: 'group-foreign', ref: owner.ref, holder: 'listing/foreign' };
    state.write('blob_refs', 'owner-first', owner);
    state.write('blob_refs', 'owner-second', second);
    state.write('blob_refs', 'foreign-first', foreign);
    expect(state.groups.size).toBe(2);
    expect(state.blobRefKeys('group-owner').size).toBe(2);
    expect(state.blobRefKeys('group-foreign').size).toBe(1);

    state.write('blob_refs', 'owner-first', undefined);
    expect(state.groups.size).toBe(2);
    expect(state.blobRefKeys('group-owner').size).toBe(1);
    state.write('blob_refs', 'owner-second', undefined);
    expect(state.groups.size).toBe(1);
    expect(state.blobRefKeys('group-owner').size).toBe(0);
    expect(state.blobRefKeys('group-foreign').size).toBe(1);

    // Undo and reattachment rebuild the original bounded index without stale buckets.
    state.write('blob_refs', 'owner-first', owner);
    expect(state.groups.size).toBe(2);
    expect(state.blobRefKeys('group-owner').size).toBe(1);
    state.write('blob_refs', 'owner-first', undefined);
    state.write('blob_refs', 'foreign-first', undefined);
    expect(state.groups.size).toBe(0);
    expect(state.blobRefKeysByTenant.size).toBe(0);
  });

  it('does not retain empty record, inbox, or attachment group buckets under churn', () => {
    const state = new MemoryState();
    for (let i = 0; i < 128; i++) {
      const recordKey = `record-${i}`;
      const inboxKey = `inbox-${i}`;
      const blobKey = `holder-${i}`;
      state.write('records', recordKey, { tenant: `tenant-${i}`, type: 'kind' });
      state.write('inbox', inboxKey, { consumer: `consumer-${i}` });
      state.write('blob_refs', blobKey, { tenant: `tenant-${i}`, ref: `ref-${i}`, holder: 'last' });
      expect(state.groups.size).toBe(3);
      state.write('records', recordKey, undefined);
      state.write('inbox', inboxKey, undefined);
      state.write('blob_refs', blobKey, undefined);
      expect(state.groups.size).toBe(0);
      expect(state.blobRefKeysByTenant.size).toBe(0);
    }
  });
  it('does not let caller mutation of a loaded snapshot corrupt holder index cleanup', async () => {
    const owner = 'snapshot-owner';
    const ref = 'blob:sha256-snapshot-fixture';
    const holder = 'listing/1';
    const row = { tenant: owner, ref, holder };
    // Durable snapshots use the same compound-key encoding as the memory driver.
    const key = [owner, ref, holder].join('\u0001');
    const driver = createMemoryDriver({ snapshot: { blob_refs: [[key, row]] } });
    try {
      expect(driver.begin('read').blobs.holders(owner, ref)).toBe(1);
      await driver.commit();

      // A caller retaining the snapshot must not be able to change indexed row data.
      row.tenant = 'unrelated-tenant';
      row.ref = 'blob:sha256-mutated';

      driver.begin('write').blobs.detach(owner, ref, holder);
      await driver.commit();
      expect(driver.begin('read').blobs.holders(owner, ref)).toBe(0);
      await driver.commit();
    } finally {
      await driver.close();
    }
  });

  it('detaches snapshot record and binary values from caller-owned objects', async () => {
    const owner = 'snapshot-record-owner';
    const type = 'test.snapshot';
    const id = 'one';
    const original = '{"text":"unchanged"}';
    const record = {
      tenant: owner, type, id, revision: 1, data: original,
      idx: [null, null, null, null] as const,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    const bytes = new Uint8Array([1, 2, 3]);
    const ref = 'blob:sha256-owned-snapshot';
    const blob = {
      tenant: owner, ref, bytes, size: 3, contentType: 'application/octet-stream',
      privacy: 'P0', encrypted: false, createdAt: '2026-01-01T00:00:00.000Z',
    };
    const driver = createMemoryDriver({ snapshot: {
      records: [[[owner, type, id].join('\u0001'), record]],
      blobs: [[[owner, ref].join('\u0001'), blob]],
    } });
    try {
      record.data = '{"text":"mutated-outside"}';
      bytes[0] = 99;
      const tx = driver.begin('read');
      expect(tx.records.get(owner, type, id)?.data).toBe(original);
      expect([...tx.blobs.get(owner, ref)!.bytes]).toEqual([1, 2, 3]);
      await driver.commit();
    } finally {
      await driver.close();
    }
  });

  it('preserves a newly stored unreferenced blob when detaching a nonexistent holder', async () => {
    const storage = createMemoryStorage();
    const tenant = 'detached-owner';
    const bytes = new Uint8Array([3, 1, 4, 1, 5]);
    try {
      const created = await storage.transaction(tx => tx.blobs.put({
        tenant, bytes, contentType: 'application/octet-stream',
        privacy: 'P0', encrypted: false, now: Date.UTC(2026, 0, 1),
      }));
      expect(created.ok).toBe(true);
      if (!created.ok) throw new Error('Could not create blob fixture');
      const ref = created.value.ref;
      expect(created.value.holders).toBe(0);

      // A detach with no matching reference must not delete fresh upload bytes.
      const missing = await storage.transaction(tx => ok(tx.blobs.detach(tenant, ref, 'listing/absent')));
      expect(missing).toEqual(ok({ deleted: false, shred: false }));
      const stillStored = await storage.read(tx => tx.blobs.get(tenant, ref));
      expect(stillStored && [...stillStored.bytes]).toEqual([...bytes]);

      // An actual last-holder detach should retain the existing delete semantics.
      const attached = await storage.transaction(tx => tx.blobs.attach(tenant, ref, 'listing/present'));
      expect(attached.ok).toBe(true);
      const removed = await storage.transaction(tx => ok(tx.blobs.detach(tenant, ref, 'listing/present')));
      expect(removed).toEqual(ok({ deleted: true, shred: false }));
      expect(await storage.read(tx => tx.blobs.get(tenant, ref))).toBeUndefined();
    } finally {
      await storage.close();
    }
  });

  it('rejects invalid orphan sweep limits without deleting unattached blob bytes', async () => {
    const storage = createMemoryStorage();
    const tenant = 'orphan-sweep-owner';
    const cutoff = Date.UTC(2026, 0, 2);
    try {
      const first = await storage.transaction(tx => tx.blobs.put({
        tenant, bytes: new Uint8Array([1, 2, 3]), contentType: 'application/octet-stream',
        privacy: 'P0', encrypted: false, now: Date.UTC(2026, 0, 1),
      }));
      const second = await storage.transaction(tx => tx.blobs.put({
        tenant, bytes: new Uint8Array([4, 5, 6]), contentType: 'application/octet-stream',
        privacy: 'P0', encrypted: false, now: Date.UTC(2026, 0, 1),
      }));
      expect(first.ok && second.ok).toBe(true);
      if (!first.ok || !second.ok) throw new Error('Could not create orphan fixtures');
      const refs = [first.value.ref, second.value.ref];

      // SQLite LIMIT -1 means no limit; memory Array#slice(0, -1) also
      // selects rows. Neither may turn a bad caller limit into a bulk purge.
      for (const invalid of [-1, 0, 1.5, Number.NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
        await expect(storage.transaction(tx => ok(tx.blobs.collectOrphans(cutoff, invalid))))
          .rejects.toThrow(RangeError);
        for (const ref of refs) {
          expect(await storage.read(tx => tx.blobs.info(tenant, ref))).toBeDefined();
        }
      }

      const removed = await storage.transaction(tx => ok(tx.blobs.collectOrphans(cutoff, 1)));
      expect(removed).toEqual(ok(1));
      const survivors = await Promise.all(refs.map(ref => storage.read(tx => tx.blobs.info(tenant, ref))));
      expect(survivors.filter(Boolean)).toHaveLength(1);
    } finally {
      await storage.close();
    }
  });

  it('keeps live holder indexes isolated from a persistence callback changing its change rows', async () => {
    const owner = 'persist-owner';
    const ref = 'blob:sha256-persist-owner';
    const holder = 'listing/persist';
    const driver = createMemoryDriver({
      persist: async (changes) => {
        for (const change of changes) if (change.table === 'blob_refs' && change.row) {
          // A callback must not receive the same object indexed by the live driver.
          (change.row as { tenant: string }).tenant = 'unexpected-tenant';
        }
      },
    });
    try {
      driver.begin('write').blobs.attach(owner, ref, holder);
      await driver.commit();
      expect(driver.begin('read').blobs.holders(owner, ref)).toBe(1);
      await driver.commit();

      driver.begin('write').blobs.detach(owner, ref, holder);
      await driver.commit();
      const tx = driver.begin('read');
      expect(tx.blobs.holders(owner, ref)).toBe(0);
      expect(tx.blobs.holders('unexpected-tenant', ref)).toBe(0);
      await driver.commit();
    } finally {
      await driver.close();
    }
  });

  it('keeps committed blob bytes isolated from a persistence callback changing its change rows', async () => {
    const owner = 'persist-bytes-owner';
    const ref = 'blob:sha256-persist-bytes';
    const driver = createMemoryDriver({
      persist: async (changes) => {
        for (const change of changes) if (change.table === 'blobs' && change.row) {
          (change.row as { bytes: Uint8Array }).bytes[0] = 99;
        }
      },
    });
    try {
      driver.begin('write').blobs.upsert({
        tenant: owner, ref, bytes: new Uint8Array([1, 2, 3]), size: 3,
        contentType: 'application/octet-stream', privacy: 'P0',
        encrypted: false, createdAt: '2026-01-01T00:00:00.000Z',
      });
      await driver.commit();
      const tx = driver.begin('read');
      expect([...tx.blobs.get(owner, ref)!.bytes]).toEqual([1, 2, 3]);
      await driver.commit();
    } finally {
      await driver.close();
    }
  });

});
