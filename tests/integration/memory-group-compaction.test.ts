import { describe, expect, it } from 'vitest';
import { MemoryState, createMemoryDriver } from '../../packages/kernel/src/storage/memory-driver.ts';

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
    const key = [owner, ref, holder].join('\\u0001');
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
      records: [[[owner, type, id].join('\\u0001'), record]],
      blobs: [[[owner, ref].join('\\u0001'), blob]],
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

});
