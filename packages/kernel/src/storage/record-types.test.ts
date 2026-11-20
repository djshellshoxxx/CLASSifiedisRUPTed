import { describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { ok } from '../errors/result.ts';
import { createMemoryStorage, type Storage } from './storage.ts';
import { openIndexedDbStorage } from './indexeddb.ts';
import { openSqliteStorage } from './sqlite.ts';
import type { Tx } from './tx.ts';

const adapters: Array<[string, () => Promise<Storage>]> = [
  ['memory', async () => createMemoryStorage()],
  ['indexeddb', () => openIndexedDbStorage({ name: 'record-types', indexedDB: new IDBFactory() })],
  ['sqlite', async () => openSqliteStorage({ path: ':memory:' })],
];

for (const [name, open] of adapters) describe(`${name} record type inventory`, () => {
  it('returns bounded distinct types for exactly one tenant in UTF-8 order', async () => {
    const storage = await open();
    try {
      await storage.transaction(tx => {
        for (const [tenant, type, id] of [['owner', 'z.note', '1'], ['owner', 'a.note', '2'], ['owner', 'a.note', '3'], ['other', 'foreign.secret', '4'], ['owner', '\u{10000}', '5'], ['owner', '\uE000', '6']] as const) {
          const saved = tx.records.put({ tenant, type, id, data: { private: true }, idx: [null, null, null, null], expectedRevision: 0, now: 0 });
          if (!saved.ok) return saved;
        }
        return ok(undefined);
      });
      expect(await storage.read(tx => tx.records.listTypes('owner', 10))).toEqual([{ type: 'a.note', count: 2 }, { type: 'z.note', count: 1 }, { type: '\uE000', count: 1 }, { type: '\u{10000}', count: 1 }]);
      expect(await storage.read(tx => tx.records.listTypes('owner', 1))).toEqual([{ type: 'a.note', count: 2 }]);
      expect(await storage.read(tx => tx.records.listTypes('other', 10))).toEqual([{ type: 'foreign.secret', count: 1 }]);
      expect(await storage.read(tx => tx.records.listTypes('empty', 10))).toEqual([]);
    } finally { await storage.close(); }
  });

  it('rejects invalid limits and revokes a retained method', async () => {
    const storage = await open();
    let retained!: Tx['records']['listTypes'];
    try {
      await storage.read(tx => {
        retained = tx.records.listTypes;
        for (const limit of [0, -1, 1.5, 10002, Infinity, NaN]) expect(() => tx.records.listTypes('owner', limit)).toThrow(RangeError);
        expect(tx.records.listTypes('owner', 10001)).toEqual([]);
      });
      expect(() => retained('owner', 1)).toThrow('Transaction is no longer active');
    } finally { await storage.close(); }
  });
});
