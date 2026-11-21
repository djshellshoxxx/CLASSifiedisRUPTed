import { describe, expect, it } from 'vitest';
import { MemoryState } from '../../packages/kernel/src/storage/memory-driver.ts';

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
});
