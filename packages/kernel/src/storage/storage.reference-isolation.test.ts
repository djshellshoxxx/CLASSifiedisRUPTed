import { describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { ok } from '../errors/result.ts';
import { createMemoryStorage, type Storage } from './storage.ts';
import { openIndexedDbStorage } from './indexeddb.ts';
import { openSqliteStorage } from './sqlite.ts';
import type { MigrationRow } from './driver.ts';
import type { Tx } from './tx.ts';

const adapters: Array<[string, () => Promise<Storage>]> = [
  ['memory', async () => createMemoryStorage()],
  ['indexeddb', () => openIndexedDbStorage({ name: 'reference-isolation', indexedDB: new IDBFactory() })],
  ['sqlite', async () => openSqliteStorage({ path: ':memory:' })],
];
const at = '2026-11-19T00:00:00.000Z';
const query = (tx: Tx, value: string) => tx.records.query({ tenant: 'owner', type: 'test.note', filters: [{ slot: 1, op: 'eq', value }], orderSlot: 0, dir: 'asc', limit: 10 }).map(row => row.id);
const originalMigration = { id: 'data:test-reference', checksum: 'original-checksum', appliedAt: at };

for (const [name, open] of adapters) describe(`${name} storage reference isolation`, () => {
  it.each(['put', 'restore'] as const)('copies %s index tuples before storing them', async operation => {
    const storage = await open();
    const idx: [string | null, string | null, string | null, string | null] = ['original', null, null, null];
    let inside: string[] = [];
    try {
      const saved = await storage.transaction(tx => {
        const result = operation === 'put'
          ? tx.records.put({ tenant: 'owner', type: 'test.note', id: 'one', data: { value: 'original' }, idx, expectedRevision: 0, now: Date.parse(at) })
          : tx.records.restore({ tenantId: 'owner', type: 'test.note', id: 'one', data: { value: 'original' }, revision: 1, createdAt: at, updatedAt: at }, idx);
        idx[0] = 'changed-before-commit';
        inside = query(tx, 'original');
        return result.ok ? ok(undefined) : result;
      });
      expect(saved.ok).toBe(true);
      idx[0] = 'changed-without-transaction';
      const after = await storage.read(tx => ({ original: query(tx, 'original'), changed: query(tx, 'changed-without-transaction'), record: tx.records.get('owner', 'test.note', 'one') }));
      expect({ inside, original: after.original, changed: after.changed }).toEqual({ inside: ['one'], original: ['one'], changed: [] });
      expect(after.record).toMatchObject({ revision: 1, data: { value: 'original' }, updatedAt: at });
    } finally { await storage.close(); }
  });

  it('copies inserted migration rows before the caller changes them', async () => {
    const storage = await open();
    const row = { ...originalMigration };
    try {
      await storage.transaction(tx => {
        tx.migrations.insert(row);
        row.id = 'changed-before-commit';
        row.checksum = 'changed-before-commit';
        row.appliedAt = '2030-01-01T00:00:00.000Z';
        return ok(undefined);
      });
      row.checksum = 'changed-without-transaction';
      const stored = await storage.read(tx => tx.migrations.list().find(item => item.id === originalMigration.id));
      expect(stored).toEqual(originalMigration);
      expect(await storage.read(tx => tx.migrations.list().some(item => item.id === row.id))).toBe(false);
    } finally { await storage.close(); }
  });

  it('detaches listed migration rows from read-only and completed transactions', async () => {
    const storage = await open();
    let retained!: MigrationRow;
    try {
      await storage.transaction(tx => { tx.migrations.insert({ ...originalMigration }); return ok(undefined); });
      await expect(storage.read(tx => {
        retained = tx.migrations.list().find(row => row.id === originalMigration.id)!;
        Object.assign(retained, { checksum: 'changed-through-read' });
        throw new Error('rollback this read');
      })).rejects.toThrow('rollback this read');
      Object.assign(retained, { checksum: 'changed-after-read', appliedAt: '2030-01-01T00:00:00.000Z' });
      const stored = await storage.read(tx => tx.migrations.list().find(row => row.id === originalMigration.id));
      expect(stored).toEqual(originalMigration);
    } finally { await storage.close(); }
  });
});
