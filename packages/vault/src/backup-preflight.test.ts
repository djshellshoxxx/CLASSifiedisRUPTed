import { describe, expect, it } from 'vitest';
import { createMemoryStorage, defineRepo, z } from '@classrup/kernel';
import { unseal } from '@classrup/identity';
import { verifyEnvelope } from '@classrup/federation';
import { backupCodec, vaultFromStorage, type BackupCodec } from './vault.ts';

const passphrase = 'preflight original vault passphrase';
const note = defineRepo({ type: 'test.recoverable', schema: z.strictObject({ key: z.string(), nested: z.strictObject({ state: z.string() }) }), indexes: { state: data => data.nested.state } });
const original = { key: 'one', nested: { state: 'original' } };
const put = (principal: string) => ({ tenant: principal, type: note.type, id: 'one', data: original, idx: ['original', null, null, null] as const, expectedRevision: 0, now: 0 });

describe('shared backup recovery preflight', () => {
  it('validates detached recovery data while preserving exported evidence, live records and signing identity', async () => {
    const codec: BackupCodec = { ...backupCodec(note), recordId: input => note.schema.parse(input).key,
      async restoreData(input) {
        const data = input as typeof original;
        data.nested.state = 'recovered';
        return data;
      },
      async validate(input) {
        const data = note.schema.parse(input);
        expect(['original', 'recovered']).toContain(data.nested.state);
        // Validator side effects must not rewrite the exported or staged recovery data.
        (input as typeof original).nested.state = 'validator-only';
      },
    };
    const source = vaultFromStorage(createMemoryStorage(), [codec]);
    const session = await source.create(passphrase);
    try {
      await session.storage.transaction(tx => tx.records.put(put(session.principal)));
      const message = new Uint8Array([10, 20, 30]);
      const signature = await session.identity.sign(message);
      const backup = await session.exportBackup(passphrase);
      const bytes = await unseal(backup, passphrase);
      try {
        const manifest = await verifyEnvelope(JSON.parse(new TextDecoder().decode(bytes)), { expectedType: 'classrup.vault.alpha_backup/v1' });
        expect(manifest.author).toBe(session.principal);
        expect((manifest.payload as { records: { data: unknown }[] }).records[0]!.data).toEqual(original);
      } finally { bytes.fill(0); }
      expect(await session.storage.read(tx => tx.records.get(session.principal, note.type, 'one')?.data)).toEqual(original);
      expect(await session.identity.sign(message)).toEqual(signature);
      const destination = vaultFromStorage(createMemoryStorage(), [codec]);
      const restored = await destination.restoreBackup(backup, passphrase);
      try {
        expect(restored.principal).toBe(session.principal);
        expect(await restored.identity.sign(message)).toEqual(signature);
        const rows = await restored.storage.read(tx => tx.records.query({ tenant: restored.principal, type: note.type, filters: [{ slot: 1, op: 'eq', value: 'recovered' }], orderSlot: 0, dir: 'asc', limit: 5 }));
        expect(rows).toHaveLength(1);
        expect(rows[0]!.data).toEqual({ key: 'one', nested: { state: 'recovered' } });
      } finally { await restored.lock(); }
    } finally { await session.lock(); }
  }, 30000);

  it('rejects a recovery normalization that would change the canonical record key before export', async () => {
    const codec: BackupCodec = { ...backupCodec(note), recordId: input => note.schema.parse(input).key,
      async restoreData(input) { return { ...note.schema.parse(input), key: 'different' }; },
    };
    const session = await vaultFromStorage(createMemoryStorage(), [codec]).create(passphrase);
    try {
      await session.storage.transaction(tx => tx.records.put(put(session.principal)));
      await expect(session.exportBackup(passphrase)).rejects.toThrow('Backup record key mismatch');
      expect(await session.storage.read(tx => tx.records.get(session.principal, note.type, 'one')?.data)).toEqual(original);
    } finally { await session.lock(); }
  }, 30000);

  it('returns no artifact when the session locks during asynchronous recovery preflight', async () => {
    let entered!: () => void;
    let release!: () => void;
    const ready = new Promise<void>(resolve => { entered = resolve; });
    const held = new Promise<void>(resolve => { release = resolve; });
    const codec: BackupCodec = { ...backupCodec(note), async restoreData(input) { entered(); await held; return input; } };
    const session = await vaultFromStorage(createMemoryStorage(), [codec]).create(passphrase);
    await session.storage.transaction(tx => tx.records.put(put(session.principal)));
    const outcome = session.exportBackup(passphrase).then(value => ({ value, error: undefined }), error => ({ value: undefined, error }));
    try {
      await ready;
      await session.lock();
      release();
      const settled = await outcome;
      expect(settled.value).toBeUndefined();
      expect(settled.error).toEqual(new Error('Vault closed'));
    } finally { release(); await outcome; await session.lock(); }
  }, 30000);
});
