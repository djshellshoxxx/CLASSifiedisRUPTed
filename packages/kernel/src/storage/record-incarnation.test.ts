import { describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { appError } from '../errors/app-error.ts';
import { err } from '../errors/result.ts';
import { openIndexedDbStorage } from './indexeddb.ts';
import { openSqliteStorage } from './sqlite.ts';
import { createMemoryStorage, type Storage } from './storage.ts';

const adapters: Array<[string, () => Promise<Storage>]> = [
  ['memory', async () => createMemoryStorage()],
  ['indexeddb', () => openIndexedDbStorage({ name: 'record-incarnation', indexedDB: new IDBFactory() })],
  ['sqlite', async () => openSqliteStorage({ path: ':memory:' })],
];

for (const [name, open] of adapters) describe(name + ' record incarnation', () => {
  it('preserves creation markers on update and rollback; recreation differs and v1 restore remains unknown', async () => {
    const s = await open();
    const tenant = 'tenant-a', type = 'test.item', id = 'one';
    const idx = [null, null, null, null] as const;
    const input = { tenant, type, id, data: { text: 'same' }, idx, now: Date.parse('2026-11-24T00:00:00.000Z') };
    const marker = () => s.read(tx => tx.records.incarnation(tenant, type, id));
    try {
      const first = await s.transaction(tx => tx.records.put({ ...input, expectedRevision: 0 }));
      if (!first.ok) throw new Error('Fixture creation failed');
      const original = await marker();
      expect(original).toMatch(/^[A-Za-z0-9_-]{21}[AQgw]$/);
      expect(first.value).not.toHaveProperty('incarnation');
      expect(await s.read(tx => tx.records.incarnation('tenant-b', type, id))).toBeUndefined();
      expect((await s.transaction(tx => tx.records.put({ ...input, expectedRevision: 1 }))).ok).toBe(true);
      expect(await marker()).toBe(original);
      expect((await s.transaction(tx => tx.records.put({ ...input, expectedRevision: 1 }))).ok).toBe(false);
      expect(await marker()).toBe(original);
      const rolledBack = await s.transaction(tx => {
        const removed = tx.records.remove(tenant, type, id, 2);
        if (!removed.ok) return err(removed.error);
        const recreated = tx.records.put({ ...input, expectedRevision: 0 });
        if (!recreated.ok) return err(recreated.error);
        expect(tx.records.incarnation(tenant, type, id)).not.toBe(original);
        return err(appError('CONFLICT_STATE'));
      });
      expect(rolledBack.ok).toBe(false);
      expect(await marker()).toBe(original);
      expect(await s.read(tx => tx.records.get(tenant, type, id)?.revision)).toBe(2);
      expect((await s.transaction(tx => tx.records.remove(tenant, type, id, 2))).ok).toBe(true);
      expect(await marker()).toBeUndefined();
      expect((await s.transaction(tx => tx.records.put({ ...input, expectedRevision: 0 }))).ok).toBe(true);
      const recreated = await marker();
      expect(recreated).toMatch(/^[A-Za-z0-9_-]{21}[AQgw]$/);
      expect(recreated).not.toBe(original);
      expect((await s.transaction(tx => tx.records.restore(first.value, idx))).ok).toBe(true);
      expect(await marker()).toBe(recreated);
      expect((await s.transaction(tx => tx.records.remove(tenant, type, id, 1))).ok).toBe(true);
      expect((await s.transaction(tx => tx.records.restore(first.value, idx))).ok).toBe(true);
      expect(await marker()).toBeUndefined();
      expect((await s.transaction(tx => tx.records.put({ ...input, expectedRevision: 1 }))).ok).toBe(true);
      expect(await marker()).toBeUndefined();
    } finally { await s.close(); }
  });
});
