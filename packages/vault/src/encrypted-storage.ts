// The synchronous driver works on decrypted rows only while the vault is unlocked.
// All durable changes are encrypted before opening the atomic IndexedDB transaction.
import { createStorage, createSystemClock, runRetentionSweep, AppErrorException, type Storage } from '@classrup/kernel';
import { openIndexedDbConnection, createMemoryDriver, TABLES, type IndexedDbOptions, type Snapshot, type TableName, type Change } from '@classrup/kernel/browser';
import { seal, unseal, encodeBase64url, decodeBase64url } from '@classrup/identity';

const FORMAT = 'classrup.storage-row/v1';
const HEADER = 'vault.encryption/v1';
const INVENTORY = 'vault.inventory/v1';
const IDENTITY = 'local-vault\u0001vault.identity\u0001root';
const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });
const MAX_ROW_BYTES = 32 * 1024 * 1024;
const identityRow = (table: TableName, key: string): boolean => table === 'records' && key === IDENTITY;

interface EncryptedRow { readonly format: typeof FORMAT; readonly nonce: string; readonly ciphertext: string }
function aad(name: string, table: TableName, key: string): Uint8Array<ArrayBuffer> {
  return encoder.encode(JSON.stringify([FORMAT, name, table, key]));
}
function encodeRow(table: TableName, id: string, row: object): Uint8Array<ArrayBuffer> {
  const value = table === 'blobs' ? { ...row, bytes: encodeBase64url((row as { bytes: Uint8Array }).bytes) } : row;
  const bytes = encoder.encode(JSON.stringify({ key: id, row: value }));
  if (bytes.length > MAX_ROW_BYTES) { bytes.fill(0); throw new Error('Encrypted storage row too large'); }
  return bytes;
}
function decodeRow(table: TableName, bytes: Uint8Array): { key: string; row: object } {
  const value = JSON.parse(decoder.decode(bytes)) as Record<string, unknown>;
  if (!value || typeof value !== 'object' || Object.keys(value).sort().join(',') !== 'key,row' || typeof value.key !== 'string') throw new Error('Invalid encrypted storage row');
  const row = value.row as Record<string, unknown>;
  if (!row || typeof row !== 'object' || Array.isArray(row)) throw new Error('Invalid encrypted storage row');
  if (table === 'blobs') row.bytes = decodeBase64url(row.bytes, MAX_ROW_BYTES);
  return { key: value.key, row };
}

export async function openEncryptedStorage(options: IndexedDbOptions): Promise<{ storage: Storage; unlock(passphrase: string, required: boolean, replacement?: object): Promise<void> }> {
  const connection = await openIndexedDbConnection(options);
  const { invalidation } = connection;
  let current: Storage | undefined;
  let candidate: Storage | undefined;
  let key: CryptoKey | undefined;
  let addressKey: CryptoKey | undefined;
  let state: 'root-only' | 'opening' | 'ready' | 'closed' = 'root-only';
  let closeSettlement: Promise<void> | undefined;
  let preparedHeader: object | undefined;
  let inventory = new Map<string, string>();
  const check = (): void => { if (state === 'closed' || invalidation.aborted) throw new Error('Vault closed'); };
  const rootOnly = (snapshot: Snapshot): Storage => createStorage(createMemoryDriver({ kind: 'indexeddb',
    snapshot: { records: (snapshot.records ?? []).filter(([id]) => id === IDENTITY) } }), { invalidation });
  function discardSecrets(): void {
    key = undefined;
    addressKey = undefined;
    preparedHeader = undefined;
    inventory.clear();
  }
  try {
    const initial = await connection.snapshot();
    // The protected signing identity is the only row readable before passphrase verification.
    current = rootOnly(initial);
  } catch (error) {
    try { await connection.close(); } catch { /* preserve snapshot error */ }
    throw error;
  }

  async function address(table: TableName, id: string): Promise<string> {
    if (!addressKey) throw new Error('Vault storage locked');
    return encodeBase64url(new Uint8Array(await crypto.subtle.sign('HMAC', addressKey, aad(options.name, table, id))));
  }
  async function encrypt(table: TableName, id: string, durableId: string, row: object): Promise<EncryptedRow> {
    const usedKey = key;
    if (!usedKey) throw new Error('Vault storage locked');
    const nonce = crypto.getRandomValues(new Uint8Array(12));
    const bytes = encodeRow(table, id, row);
    try {
      const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce, additionalData: aad(options.name, table, durableId) }, usedKey, bytes);
      check();
      return { format: FORMAT, nonce: encodeBase64url(nonce), ciphertext: encodeBase64url(new Uint8Array(ciphertext)) };
    } finally { bytes.fill(0); }
  }
  async function encryptedChanges(changes: readonly Change[]): Promise<Change[]> {
    const result: Change[] = [];
    for (const change of changes) {
      if (identityRow(change.table, change.key)) { result.push(change); continue; }
      const durableId = await address(change.table, change.key);
      result.push({ ...change, key: durableId, row: change.row === undefined ? undefined : await encrypt(change.table, change.key, durableId, change.row) });
    }
    return result;
  }
  const inventoryId = (table: TableName, id: string): string => JSON.stringify([table, id]);
  const digest = async (row: object): Promise<string> => encodeBase64url(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(JSON.stringify(row)))));
  async function persistAuthenticated(changes: readonly Change[]): Promise<void> {
    const next = new Map(inventory);
    for (const change of changes) {
      if (change.table === 'meta' && change.key === HEADER) continue;
      const id = inventoryId(change.table, change.key);
      if (change.row === undefined) next.delete(id); else next.set(id, await digest(change.row));
    }
    const manifest = await encrypt('meta', INVENTORY, INVENTORY, { entries: [...next].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0) });
    check();
    await connection.persist([...changes, { table: 'meta', key: INVENTORY, row: manifest }]);
    // Preserve the actual durable outcome, but do not restore closed in-memory state.
    if (state !== 'closed') inventory = next;
  }
  const storage: Storage = {
    kind: 'indexeddb',
    invalidation,
    transaction(fn, opts) { check(); if (state !== 'ready') throw new Error('Vault storage locked'); return current!.transaction(fn, opts); },
    read(fn) { check(); return current!.read(fn); },
    ping() { if (invalidation.aborted) return Promise.resolve(false); check(); return state === 'ready' ? current!.ping() : Promise.resolve(false); },
    close() {
      if (closeSettlement) return closeSettlement;
      state = 'closed';
      invalidation.removeEventListener('abort', invalidate);
      discardSecrets();
      const previous = current;
      const opening = candidate;
      current = undefined;
      candidate = undefined;
      // Every caller observes the same drain and connection-release outcome.
      closeSettlement = (async () => {
        let failed = false, failure: unknown;
        for (const owned of [previous, opening]) {
          try { await owned?.close(); }
          catch (error) { if (!failed) { failed = true; failure = error; } }
        }
        try { await connection.close(); }
        catch (error) { if (!failed) { failed = true; failure = error; } }
        if (failed) throw failure;
      })();
      return closeSettlement;
    },
  };
  // Revocation is synchronous; draining the candidate/current stores and native
  // terminal work is asynchronous and shared with all explicit close callers.
  const invalidate = (): void => { void storage.close().catch(() => undefined); };
  invalidation.addEventListener('abort', invalidate, { once: true });
  if (invalidation.aborted) {
    try { await storage.close(); } catch { /* preserve the invalidated open */ }
    throw new Error('Vault closed');
  }
  return {
    storage,
    async unlock(passphrase, required, replacement) {
      check();
      if (state === 'opening') throw new Error('Vault storage opening');
      if (state === 'ready') {
        const verified = await unseal(preparedHeader, passphrase);
        verified.fill(0);
        check();
        return;
      }
      state = 'opening';
      let working: Storage | undefined;
      try {
        const persisted = await connection.snapshot();
        const header = persisted.meta?.find(([id]) => id === HEADER)?.[1];
        if (required && !header) throw new Error('Missing encrypted storage header');
        let material: Uint8Array;
        let wrapped: object;
        if (header) {
          wrapped = header;
          material = await unseal(header, passphrase);
        } else {
          material = crypto.getRandomValues(new Uint8Array(32));
          try { wrapped = await seal(material, passphrase); }
          catch (error) { material.fill(0); throw error; }
        }
        try {
          if (material.length !== 32) throw new Error('Invalid storage key');
          const derivation = await crypto.subtle.importKey('raw', material.slice(), 'HKDF', false, ['deriveKey']);
          const parameters = { name: 'HKDF', hash: 'SHA-256', salt: encoder.encode('classrup.storage/v1') };
          const imported = await crypto.subtle.deriveKey({ ...parameters, info: encoder.encode('row encryption') }, derivation, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
          const addresses = await crypto.subtle.deriveKey({ ...parameters, info: encoder.encode('row addressing') }, derivation, { name: 'HMAC', hash: 'SHA-256', length: 256 }, false, ['sign']);
          check();
          key = imported;
          addressKey = addresses;
          preparedHeader = wrapped;
        } finally { material.fill(0); }
        if (header) {
          const storedManifest = persisted.meta?.find(([id]) => id === INVENTORY)?.[1] as EncryptedRow | undefined;
          if (!storedManifest || storedManifest.format !== FORMAT) throw new Error('Missing encrypted storage inventory');
          const nonce = decodeBase64url(storedManifest.nonce, 12);
          if (nonce.length !== 12) throw new Error('Invalid encrypted storage inventory');
          const plaintext = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: nonce, additionalData: aad(options.name, 'meta', INVENTORY) }, key!, decodeBase64url(storedManifest.ciphertext, MAX_ROW_BYTES + 16)));
          let entries: unknown;
          try { entries = (decodeRow('meta', plaintext).row as { entries?: unknown }).entries; } finally { plaintext.fill(0); }
          check();
          if (!Array.isArray(entries) || entries.some(entry => !Array.isArray(entry) || entry.length !== 2 || typeof entry[0] !== 'string' || typeof entry[1] !== 'string')) throw new Error('Invalid encrypted storage inventory');
          // Keep the candidate private until every authenticated entry has been verified.
          const candidateInventory = new Map(entries as Array<[string, string]>);
          if (candidateInventory.size !== entries.length) throw new Error('Invalid encrypted storage inventory');
          let count = 0;
          for (const table of TABLES) for (const [id, row] of persisted[table] ?? []) {
            if (table === 'meta' && (id === HEADER || id === INVENTORY)) continue;
            count++;
            const actual = await digest(row);
            check();
            if (candidateInventory.get(inventoryId(table, id)) !== actual) throw new Error('Encrypted storage inventory mismatch');
          }
          if (count !== candidateInventory.size) throw new Error('Encrypted storage inventory mismatch');
          check();
          inventory = candidateInventory;
        } else inventory = new Map();
        const snapshot: Snapshot = {};
        for (const table of TABLES) {
          const entries: Array<readonly [string, object]> = [];
          for (const [id, stored] of persisted[table] ?? []) {
            if (table === 'meta' && (id === HEADER || id === INVENTORY)) continue;
            if (identityRow(table, id)) {
              entries.push([id, replacement ? { ...stored, data: JSON.stringify(replacement) } : stored]);
              continue;
            }
            if (!header) {
              if ((stored as { format?: unknown }).format === FORMAT) throw new Error('Missing encrypted storage header');
              entries.push([id, stored]);
              continue;
            }
            const row = stored as EncryptedRow;
            if (!row || Object.keys(row).sort().join(',') !== 'ciphertext,format,nonce' || row.format !== FORMAT) throw new Error('Invalid encrypted storage row');
            const nonce = decodeBase64url(row.nonce, 12);
            const ciphertext = decodeBase64url(row.ciphertext, MAX_ROW_BYTES + 16);
            if (nonce.length !== 12 || ciphertext.length < 16) throw new Error('Invalid encrypted storage row');
            const plaintext = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: nonce, additionalData: aad(options.name, table, id) }, key!, ciphertext));
            try {
              const decoded = decodeRow(table, plaintext);
              if (await address(table, decoded.key) !== id) throw new Error('Invalid encrypted storage address');
              entries.push([decoded.key, decoded.row]);
            } finally { plaintext.fill(0); }
          }
          snapshot[table] = entries;
        }
        check();
        let pendingMigration: Change[] = [];
        if (!header) {
          const migration: Change[] = TABLES.flatMap(table => (snapshot[table] ?? []).map(([id, row]) => ({ table, key: id, row })));
          const removals: Change[] = TABLES.flatMap(table => (persisted[table] ?? []).filter(([id]) => !identityRow(table, id)).map(([id]) => ({ table, key: id, row: undefined })));
          pendingMigration = [...removals, ...await encryptedChanges(migration)];
          pendingMigration.push({ table: 'meta', key: HEADER, row: wrapped });
          check();
          if ((snapshot.records ?? []).some(([id]) => id === IDENTITY)) {
            await persistAuthenticated(pendingMigration);
            pendingMigration = [];
          } else if (migration.length !== 0) throw new Error('Uninitialized vault contains orphaned data');
        }
        check();
        working = createStorage(createMemoryDriver({ kind: 'indexeddb', snapshot, persist: async changes => {
          const encrypted = await encryptedChanges(changes);
          check();
          await persistAuthenticated([...pendingMigration, ...encrypted]);
          pendingMigration = [];
        } }), { invalidation });
        candidate = working;
        // Initialization has no public read/write admission to the decrypted store.
        // Maintenance must settle before the root-only snapshot is replaced.
        const swept = await runRetentionSweep(working, options.clock ?? createSystemClock(), options.retention);
        if (!swept.ok) throw new AppErrorException(swept.error);
        check();
        await current!.close();
        check();
        current = working;
        candidate = undefined;
        state = 'ready';
      } catch (error) {
        discardSecrets();
        try {
          await working?.close();
          if (candidate === working) candidate = undefined;
          check();
          await current?.close();
          check();
          // Migration can already be durable when later maintenance fails. Read
          // the actual sealed root instead of restoring a stale plaintext-era view.
          const persisted = await connection.snapshot();
          check();
          current = rootOnly(persisted);
          state = 'root-only';
        } catch {
          // A failed drain/refresh cannot justify retry on this handle. Preserve
          // the initialization failure even when terminal cleanup also rejects.
          try { await storage.close(); } catch { /* preserve initialization error */ }
        }
        throw error;
      }
    },
  };
}
