import { expect, it } from 'vitest';
import { createMemoryStorage, z } from '@classrup/kernel';
import { vaultFromStorage, type BackupCodec } from './vault.ts';

const passphrase = 'class codec private-state regression';
const dataSchema = z.strictObject({ id: z.string(), text: z.string() });

class ClassCodec implements BackupCodec {
  readonly type = 'test.class_codec';
  #schema = dataSchema;
  #index = 'class-private-index';
  readonly calls: string[] = [];
  parse(input: unknown) { this.calls.push('parse'); return this.#schema.parse(input); }
  indexes(input: unknown): readonly [string, null, null, null] {
    this.calls.push('indexes'); this.#schema.parse(input); return [this.#index, null, null, null];
  }
  recordId(input: unknown) { this.calls.push('recordId'); return this.#schema.parse(input).id; }
  async validate(input: unknown) { this.calls.push('validate'); this.#schema.parse(input); }
  async restoreData(input: unknown, principal: string) {
    this.calls.push('restoreData'); expect(principal).toMatch(/^did:key:/); return this.#schema.parse(input);
  }
}

function replaceSuppliedRegistry(codec: ClassCodec, supplied: BackupCodec[]): void {
  const changed = () => { throw new Error('caller replaced accepted codec method'); };
  Object.assign(codec, { type: 'changed.by_caller', parse: changed, indexes: changed, validate: changed, restoreData: changed, recordId: changed });
  supplied.length = 0;
}

it('retains class codec methods, private receiver state and accepted references across export and restore', async () => {
  const original = new ClassCodec();
  const supplied: BackupCodec[] = [original];
  const source = vaultFromStorage(createMemoryStorage(), supplied);
  replaceSuppliedRegistry(original, supplied);
  const receiving = new ClassCodec();
  const incoming: BackupCodec[] = [receiving];
  const destination = vaultFromStorage(createMemoryStorage(), incoming);
  replaceSuppliedRegistry(receiving, incoming);
  try {
    const session = await source.create(passphrase);
    const saved = await session.storage.transaction(tx => tx.records.put({ tenant: session.principal, type: 'test.class_codec', id: 'one', data: { id: 'one', text: 'private test record' }, idx: ['class-private-index', null, null, null], expectedRevision: 0, now: 0 }));
    expect(saved.ok).toBe(true);
    expect((await session.backupCoverage()).registeredRecordTypes).toEqual(['test.class_codec']);
    const backup = await session.exportBackup(passphrase);
    const restored = await destination.restoreBackup(backup, passphrase);
    expect(restored.principal).toBe(session.principal);
    const records = await restored.storage.read(tx => tx.records.query({ tenant: restored.principal, type: 'test.class_codec', filters: [{ slot: 1, op: 'eq', value: 'class-private-index' }], orderSlot: 0, dir: 'asc', limit: 2 }));
    expect(records).toHaveLength(1);
    expect(records[0]?.data).toEqual({ id: 'one', text: 'private test record' });
    expect(original.calls).toEqual(['parse', 'recordId', 'parse', 'recordId', 'indexes', 'validate', 'restoreData', 'parse', 'indexes', 'recordId', 'validate']);
    expect(receiving.calls).toEqual(['parse', 'recordId', 'indexes', 'restoreData', 'parse', 'indexes', 'recordId', 'validate']);
  } finally { await source.close(); await destination.close(); }
}, 30000);
