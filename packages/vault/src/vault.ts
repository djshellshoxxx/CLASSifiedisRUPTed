import { ok, type Storage, type StoredRecord, type RepoDef, type Tx, type Result, type TxMode } from '@classrup/kernel';
import { openIndexedDbStorage, type IndexedDbOptions } from '@classrup/kernel/browser';
import { createIdentity, unlockIdentity, seal, unseal, type ProtectedIdentity, type UnlockedIdentity, type Sealed } from '@classrup/identity';
import { signEnvelope, verifyEnvelope } from '@classrup/federation';

const KEY_TENANT = 'local-vault';
const KEY_TYPE = 'vault.identity';
const KEY_ID = 'root';
const MAX_RECORDS = 10000;
const MAX_BACKUP_BYTES = 16 * 1024 * 1024;
const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });

/** Explicit domain schema and indexes; unknown record types never pass restore. */
export interface BackupCodec {
  readonly type: string;
  parse(input: unknown): unknown;
  validate?(input: unknown): Promise<void>;
  /** Rebuild derived state after trust validation; applied only during restore. */
  restoreData?(input: unknown, principal: string): Promise<unknown>;
  indexes(input: unknown): readonly [string | null, string | null, string | null, string | null];
}
export function backupCodec<T, K extends string>(repo: RepoDef<T, K>): BackupCodec {
  return {
    type: repo.type,
    parse: input => repo.schema.parse(input),
    indexes(input) {
      const data = repo.schema.parse(input);
      const indexes: [string | null, string | null, string | null, string | null] = [null, null, null, null];
      for (const key of Object.keys(repo.indexes) as K[]) indexes[repo.slots[key] - 1] = repo.indexes[key](data) ?? null;
      return indexes;
    },
  };
}
export interface VaultOptions extends IndexedDbOptions { readonly codecs?: readonly BackupCodec[] }
export interface UnlockedVault {
  readonly principal: string;
  readonly identity: UnlockedIdentity;
  readonly storage: Storage;
  /** Closes this connection and revokes this session; reopen before unlocking again. */
  lock(): Promise<void>;
  /** Alpha record backup, not the complete IOX export/recovery/rotation protocol. */
  exportBackup(passphrase: string): Promise<Sealed>;
}
export interface Vault {
  isInitialized(): Promise<boolean>;
  create(passphrase: string): Promise<UnlockedVault>;
  unlock(passphrase: string): Promise<UnlockedVault>;
  restoreBackup(input: unknown, passphrase: string): Promise<UnlockedVault>;
  close(): Promise<void>;
}

export async function openVault(options: VaultOptions): Promise<Vault> {
  if (!/^[A-Za-z0-9 _-]{1,80}$/.test(options.name)) throw new Error('Use a vault name of 1–80 letters, digits, spaces, _ or -');
  return vaultFromStorage(await openIndexedDbStorage({ ...options, name: `classrup-vault:${options.name}` }), options.codecs);
}

/** Composition seam for contract tests; production callers use openVault's IndexedDB adapter. */
export function vaultFromStorage(raw: Storage, codecs: readonly BackupCodec[] = []): Vault {
  const byType = new Map(codecs.map(codec => [codec.type, codec]));
  if (byType.size !== codecs.length || byType.has(KEY_TYPE)) throw new Error('Invalid backup codecs');
  let session: UnlockedVault | undefined;
  let closed = false;
  let opening = false;
  const check = (): void => { if (closed) throw new Error('Vault closed'); };
  const key = (): Promise<StoredRecord<ProtectedIdentity> | undefined> => { check(); return raw.read(tx => tx.records.get<ProtectedIdentity>(KEY_TENANT, KEY_TYPE, KEY_ID)); };
  const close = async (): Promise<void> => {
    closed = true;
    session?.identity.lock();
    session = undefined;
    await raw.close();
  };
  const exclusive = async <T>(fn: () => Promise<T>): Promise<T> => {
    check();
    if (opening || session) throw new Error('Vault session already open');
    opening = true;
    try { return await fn(); } finally { opening = false; }
  };
  function activate(identity: UnlockedIdentity, protectedIdentity: ProtectedIdentity): UnlockedVault {
    if (closed) { identity.lock(); throw new Error('Vault closed'); }
    let active = true;
    const guard = (): void => { check(); if (!active) throw new Error('Vault locked'); };
    const storage: Storage = {
      kind: raw.kind,
      transaction<T, E>(fn: (tx: Tx) => Result<T, E> | Promise<Result<T, E>>, opts?: { readonly mode?: TxMode }) {
        guard();
        return raw.transaction(async tx => { guard(); const result = await fn(tx); guard(); return result; }, opts);
      },
      async read<T>(fn: (tx: Tx) => T | Promise<T>) { guard(); return raw.read(async tx => { guard(); const result = await fn(tx); guard(); return result; }); },
      async ping() { guard(); return raw.ping(); },
      close,
    };
    const unlocked: UnlockedVault = {
      principal: identity.principal, identity, storage,
      async lock() { active = false; identity.lock(); await close(); },
      async exportBackup(passphrase) {
        guard();
        // Confirm the entered passphrase really decrypts this identity. Never emit an unusable kit.
        const checked = await unlockIdentity(protectedIdentity, passphrase);
        checked.lock();
        guard();
        const records = await storage.read(tx => {
          const out: StoredRecord[] = [];
          for (const codec of codecs) {
            const rows = tx.records.query({ tenant: identity.principal, type: codec.type, filters: [], orderSlot: 0, dir: 'asc', limit: MAX_RECORDS + 1 });
            for (const row of rows) out.push({ ...row, data: codec.parse(row.data) });
            if (out.length > MAX_RECORDS) throw new Error('Backup record limit exceeded');
          }
          return out;
        });
        for (const row of records) await byType.get(row.type)?.validate?.(row.data);
        const exportedAt = new Date().toISOString();
        const manifest = await signEnvelope(identity, { type: 'classrup.vault.alpha_backup/v1', createdAt: exportedAt, seq: 1, prev: null, payload: { principal: identity.principal, protectedIdentity, recordTypes: codecs.map(c => c.type).sort(), records } });
        const plaintext = encoder.encode(JSON.stringify(manifest));
        try { const result = await seal(plaintext, passphrase); guard(); return result; }
        finally { plaintext.fill(0); }
      },
    };
    session = unlocked;
    return unlocked;
  }
  const vault: Vault = {
    async isInitialized() { return (await key()) !== undefined; },
    create: passphrase => exclusive(async () => {
      if (await key()) throw new Error('Vault already exists');
      const created = await createIdentity(passphrase);
      try {
        check();
        const saved = await raw.transaction(tx => tx.records.put({ tenant: KEY_TENANT, type: KEY_TYPE, id: KEY_ID, data: created.protectedIdentity, idx: [null, null, null, null], expectedRevision: 0, now: Date.now() }));
        if (!saved.ok) throw new Error('Vault initialization conflict');
        return activate(created.identity, created.protectedIdentity);
      } catch (error) { created.identity.lock(); throw error; }
    }),
    unlock: passphrase => exclusive(async () => {
      const stored = await key();
      if (!stored) throw new Error('Vault does not exist');
      const identity = await unlockIdentity(stored.data, passphrase);
      return activate(identity, stored.data);
    }),
    restoreBackup: (input, passphrase) => exclusive(async () => {
      if (await key()) throw new Error('Restore requires a new empty vault');
      // The sealed parser bounds inputs and fixes KDF costs before any expensive computation.
      const plaintext = await unseal(input, passphrase);
      let parsed: unknown;
      try {
        if (plaintext.length > MAX_BACKUP_BYTES) throw new Error('Backup too large');
        parsed = JSON.parse(decoder.decode(plaintext)) as unknown;
      } finally { plaintext.fill(0); }
      const envelope = await verifyEnvelope(parsed, { expectedType: 'classrup.vault.alpha_backup/v1' });
      const data = envelope.payload as Record<string, unknown>;
      if (!data || typeof data !== 'object' || Array.isArray(data) || Object.keys(data).sort().join(',') !== 'principal,protectedIdentity,recordTypes,records' || data.principal !== envelope.author || !Array.isArray(data.records) || data.records.length > MAX_RECORDS || !Array.isArray(data.recordTypes) || JSON.stringify(data.recordTypes) !== JSON.stringify(codecs.map(c => c.type).sort())) throw new Error('Invalid or unsupported backup scope');
      const identity = await unlockIdentity(data.protectedIdentity, passphrase);
      try {
        if (identity.principal !== envelope.author) throw new Error('Backup identity mismatch');
        const ids = new Set<string>();
        const records = data.records.map((input: unknown) => {
          if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid backup record');
          const row = input as Record<string, unknown>;
          if (Object.keys(row).sort().join(',') !== 'createdAt,data,id,revision,tenantId,type,updatedAt' || row.tenantId !== identity.principal || typeof row.type !== 'string' || typeof row.id !== 'string' || row.id.length < 1 || row.id.length > 256 || /[\u0000-\u001f\u007f]/u.test(row.id) || !Number.isSafeInteger(row.revision) || (row.revision as number) < 1 || typeof row.createdAt !== 'string' || typeof row.updatedAt !== 'string' || !Number.isFinite(Date.parse(row.createdAt)) || !Number.isFinite(Date.parse(row.updatedAt)) || new Date(row.createdAt).toISOString() !== row.createdAt || new Date(row.updatedAt).toISOString() !== row.updatedAt || row.updatedAt < row.createdAt) throw new Error('Invalid backup record');
          const codec = byType.get(row.type);
          if (!codec) throw new Error('Unsupported backup record type');
          const id = `${row.type}\u0000${row.id}`;
          if (ids.has(id)) throw new Error('Duplicate backup record');
          ids.add(id);
          const parsedData = codec.parse(row.data);
          return { record: { ...row, data: parsedData } as unknown as StoredRecord, idx: codec.indexes(parsedData) };
        });
        for (const entry of records) {
          const codec = byType.get(entry.record.type)!;
          if (codec.restoreData) {
            const normalized = codec.parse(await codec.restoreData(entry.record.data, identity.principal));
            entry.record = { ...entry.record, data: normalized };
            entry.idx = codec.indexes(normalized);
          }
          await codec.validate?.(entry.record.data);
        }
        check();
        const saved = await raw.transaction(tx => {
          const identityWrite = tx.records.put({ tenant: KEY_TENANT, type: KEY_TYPE, id: KEY_ID, data: data.protectedIdentity, idx: [null, null, null, null], expectedRevision: 0, now: Date.now() });
          if (!identityWrite.ok) return identityWrite;
          for (const { record, idx } of records) {
            const restored = tx.records.restore(record, idx);
            if (!restored.ok) return restored;
          }
          return ok(undefined);
        });
        if (!saved.ok) throw new Error('Backup restore conflict');
        return activate(identity, data.protectedIdentity as ProtectedIdentity);
      } catch (error) { identity.lock(); throw error; }
    }),
    close,
  };
  return vault;
}
