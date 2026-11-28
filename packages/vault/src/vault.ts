import { ok, blobRefOf, isBlobRef, MAX_BLOB_BYTES, MAX_VERIFIED_BLOB_BATCH_BYTES, MAX_VERIFIED_BLOB_BATCH_ITEMS, verifyStoredBlob, sha256Hex, type MediaBlob, type Storage, type StoredRecord, type RepoDef, type Tx, type Result, type TxMode } from '@classrup/kernel';
import { type IndexedDbOptions } from '@classrup/kernel/browser';
import { openEncryptedStorage } from './encrypted-storage.ts';
import { createIdentity, unlockIdentity, seal, unseal, IdentityCryptoError, type ProtectedIdentity, type UnlockedIdentity, type Sealed } from '@classrup/identity';
import { signEnvelope, verifyEnvelope, strictCanonicalJson } from '@classrup/federation';
import { createUnlockBackoff, type UnlockBackoff } from './session-policy.ts';
import { copyAttachmentBatchMember, verifySealedAttachmentManifest, verifySealedAttachmentBlobBatch, type VerifiedAttachmentManifestMetadata } from './attachment-manifest.ts';

import { ZERO_REF_TRANSITION_TYPE, verifySealedAttachmentZeroRefTransition, type AttachmentZeroRefTransition } from './attachment-transition.ts';

const KEY_TENANT = 'local-vault';
const KEY_TYPE = 'vault.identity';
const KEY_ID = 'root';
const MAX_RECORDS = 10000;
const MAX_RECORD_TYPES = 256;
const MAX_REFERENCE_HOLDERS = 10000;
const MAX_BACKUP_BYTES = 16 * 1024 * 1024;
const encoder = new TextEncoder();
const STORAGE_IDENTITY_FORMAT = 'classrup.vault-identity/v2';
const decoder = new TextDecoder('utf-8', { fatal: true });
const unlockBackoffs = new WeakMap<object, Map<string, UnlockBackoff>>();
const excludedStores = Object.freeze(['blobs', 'blob_refs', 'outbox', 'inbox', 'idempotency', 'leases', 'dead_letter', 'sync_outbox', 'schema_migrations', 'meta']);

/** Inventory of record coverage only; schema/signature/size checks still run during export. */
export interface BackupCoverage {
  readonly recordTypes: readonly { readonly type: string; readonly count: number }[];
  readonly registeredRecordTypes: readonly string[];
  readonly unsupportedRecordTypes: readonly string[];
  /** A lower bound when typeLimitExceeded is true. */
  readonly recordCount: number;
  readonly typeLimitExceeded: boolean;
  readonly recordLimitExceeded: boolean;
  readonly excludedStores: readonly string[];
}

/** Principal-scoped holder-row diagnostic, not authenticated attachment or portable backup admission. */
export interface AttachmentCoverage {
  readonly referencedBlobs: number | null;
  readonly missingBlobs: number | null;
  readonly excludedStoredReferences: number | null;
  readonly holderRows: number | null;
  readonly limitExceeded: boolean;
  readonly holderAuthorityVerified: false;
  readonly includedInV1Backup: false;
}

/** Explicit domain schema and indexes; unknown record types never pass restore. */
export interface BackupCodec {
  readonly type: string;
  parse(input: unknown): unknown;
  validate?(input: unknown): Promise<void>;
  /** Rebuild derived state on detached export preflight data and during restore. */
  restoreData?(input: unknown, principal: string): Promise<unknown>;
  /** Optional canonical storage key for data with a compound uniqueness invariant. */
  recordId?(input: unknown): string;
  /** Explicit codec-authorized refs from canonical parent-record data, never blob holder labels. */
  attachmentRefs?(input: unknown): readonly string[];
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
  /** Inspect current-principal record coverage without exporting payloads or keys. */
  backupCoverage(): Promise<BackupCoverage>;
  /** Inspect this unlocked principal's blob-holder references; never returns refs or bytes. */
  attachmentCoverage(): Promise<AttachmentCoverage>;
  /** Optional same-transaction record and attachment preview; diagnostics only, not a v1 archive. */
  backupInspection?(): Promise<{ readonly records: BackupCoverage; readonly attachments: AttachmentCoverage | null }>;
  /** Alpha record backup, not the complete IOX export/recovery/rotation protocol. */
  exportBackup(passphrase: string): Promise<Sealed>;
  /** Separate encrypted, signed, metadata-only attachment manifest; no blob transfer or recovery. */
  exportAttachmentManifest(passphrase: string): Promise<Sealed>;
  /** Read-only: bind a signed manifest to this unlocked principal's canonical recovered records. */
  verifyAttachmentManifestOwners(sealed: unknown, passphrase: string): Promise<VerifiedAttachmentManifestMetadata>;
  /**
   * Sign a read-only zero-reference snapshot assertion from authenticated prior
   * evidence and the current canonical record. Not incarnation continuity,
   * proof consumption, or permission to retire a holder.
   */
  exportAttachmentZeroRefTransition(priorManifest: unknown, passphrase: string,
    owner: { readonly type: string; readonly id: string; readonly ref: string }): Promise<Sealed>;
  /** Read-only prior/current evidence check. Not deletion authority or replay protection. */
  verifyAttachmentZeroRefTransition(priorManifest: unknown, sealedTransition: unknown,
    passphrase: string): Promise<AttachmentZeroRefTransition>;
  /**
   * P0 plaintext-only import. Optionally retire one stale managed holder only
   * when the current signed manifest proves its parent no longer references
   * that blob and another canonical parent still does. Never a final purge.
   */
  importPublicAttachmentBatch(sealed: unknown, passphrase: string, byteSet: readonly Uint8Array[],
    retireOwner?: { readonly type: string; readonly id: string; readonly ref: string }): Promise<VerifiedAttachmentManifestMetadata>;
}
export interface Vault {
  isInitialized(): Promise<boolean>;
  create(passphrase: string): Promise<UnlockedVault>;
  unlock(passphrase: string): Promise<UnlockedVault>;
  restoreBackup(input: unknown, passphrase: string): Promise<UnlockedVault>;
  close(): Promise<void>;
}

/** Validate and bind codec capabilities before opening any IndexedDB writer fence. */
function snapshotBackupCodecs(codecs: readonly BackupCodec[]): readonly BackupCodec[] {
  // Reject malformed runtime registries consistently before opening IndexedDB.
  // This also contains exceptions from codec property getters, so diagnostic
  // errors cannot reveal their arbitrary messages to the caller.
  try {
    if (!Array.isArray(codecs)) throw new Error('Invalid backup codecs');
    // Capture callable references with their receiver: codecs may use prototype
    // methods or private class state. Their trusted closure behavior is not frozen.
    // Traverse numeric own entries instead of Array#map: @@species can replace
    // the destination array or suppress element writes even with intrinsic map.
    const count = codecs.length;
    if (!Number.isSafeInteger(count) || count < 0 || count > MAX_RECORD_TYPES) {
      throw new Error('Invalid backup codecs');
    }
    const registeredCodecs: BackupCodec[] = [];
    for (let index = 0; index < count; index++) {
      if (!Object.prototype.hasOwnProperty.call(codecs, index)) throw new Error('Invalid backup codecs');
      const codec = codecs[index];
      if (codec == null) throw new Error('Invalid backup codecs');
      const { type, parse, indexes, validate, restoreData, recordId, attachmentRefs } = codec;
      if (typeof type !== 'string' || type.length === 0 ||
          typeof parse !== 'function' || typeof indexes !== 'function' ||
          (validate !== undefined && typeof validate !== 'function') ||
          (restoreData !== undefined && typeof restoreData !== 'function') ||
          (recordId !== undefined && typeof recordId !== 'function') ||
          (attachmentRefs !== undefined && typeof attachmentRefs !== 'function')) {
        throw new Error('Invalid backup codecs');
      }
      registeredCodecs.push(Object.freeze({ type, parse: parse.bind(codec), indexes: indexes.bind(codec),
        ...(validate === undefined ? {} : { validate: validate.bind(codec) }),
        ...(restoreData === undefined ? {} : { restoreData: restoreData.bind(codec) }),
        ...(recordId === undefined ? {} : { recordId: recordId.bind(codec) }),
        ...(attachmentRefs === undefined ? {} : { attachmentRefs: attachmentRefs.bind(codec) }),
      }));
    }
    Object.freeze(registeredCodecs);
    const byType = new Map(registeredCodecs.map(codec => [codec.type, codec]));
    if (byType.size !== registeredCodecs.length || byType.has(KEY_TYPE) || byType.size > MAX_RECORD_TYPES) {
      throw new Error('Invalid backup codecs');
    }
    return registeredCodecs;
  } catch {
    throw new Error('Invalid backup codecs');
  }
}

export async function openVault(options: VaultOptions): Promise<Vault> {
  if (!/^[A-Za-z0-9 _-]{1,80}$/.test(options.name)) throw new Error('Use a vault name of 1–80 letters, digits, spaces, _ or -');
  // Invalid codec registries must not claim or supersede a live IndexedDB writer.
  // vaultFromStorage independently snapshots this already-bound immutable registry.
  const preparedCodecs = snapshotBackupCodecs(options.codecs ?? []);
  const protectedStorage = await openEncryptedStorage({ ...options, name: `classrup-vault:${options.name}` });
  const factory = options.indexedDB ?? globalThis.indexedDB;
  let byName = unlockBackoffs.get(factory);
  if (!byName) { byName = new Map(); unlockBackoffs.set(factory, byName); }
  let backoff = byName.get(options.name);
  if (!backoff) { backoff = createUnlockBackoff(); byName.set(options.name, backoff); }
  // Codec registration can reject a malformed registry after opening IndexedDB.
  // Dispose the newly acquired connection and writer lease before propagating it.
  try {
    return vaultFromStorage(protectedStorage.storage, preparedCodecs, protectedStorage.unlock, backoff);
  } catch (error) {
    try { await protectedStorage.storage.close(); } catch { /* Preserve the original registration failure. */ }
    throw error;
  }
}

/** Composition seam for contract tests; production callers use openVault's IndexedDB adapter. */
export function vaultFromStorage(raw: Storage, codecs: readonly BackupCodec[] = [], unlockStorage?: (passphrase: string, required: boolean, replacement?: object) => Promise<void>, backoff = createUnlockBackoff()): Vault {
  const registeredCodecs = snapshotBackupCodecs(codecs);
  const byType = new Map(registeredCodecs.map(codec => [codec.type, codec]));
  const registeredRecordTypes = Object.freeze([...byType.keys()].sort());
  const coverage = (tx: Tx, principal: string): BackupCoverage => {
    const found = tx.records.listTypes(principal, MAX_RECORD_TYPES + 1);
    const recordTypes = Object.freeze(found.slice(0, MAX_RECORD_TYPES).map(row => Object.freeze({ ...row })));
    const recordCount = recordTypes.reduce((total, row) => total + row.count, 0);
    return Object.freeze({
      recordTypes, registeredRecordTypes,
      unsupportedRecordTypes: Object.freeze(recordTypes.filter(row => !byType.has(row.type)).map(row => row.type)),
      recordCount, typeLimitExceeded: found.length > MAX_RECORD_TYPES,
      recordLimitExceeded: recordCount > MAX_RECORDS, excludedStores,
    });
  };
  /** One principal-scoped read can use both coverage functions without a cross-read race. */
  const referenceCoverage = (tx: Tx, principal: string): AttachmentCoverage => {
    const counts = tx.blobs.referenceCoverage(principal, MAX_REFERENCE_HOLDERS);
    return Object.freeze({
      referencedBlobs: counts.referenceCount,
      missingBlobs: counts.missingCount,
      excludedStoredReferences: counts.referenceCount === null || counts.missingCount === null ? null : counts.referenceCount - counts.missingCount,
      holderRows: counts.holderCount,
      limitExceeded: counts.limitExceeded,
      holderAuthorityVerified: false as const,
      includedInV1Backup: false as const,
    });
  };
  let session: UnlockedVault | undefined;
  let closed = false;
  let closeSettlement: Promise<void> | undefined;
  let opening = false;
  const check = (): void => { if (closed || raw.invalidation?.aborted) throw new Error('Vault closed'); };
  const key = (): Promise<StoredRecord<unknown> | undefined> => { check(); return raw.read(tx => tx.records.get(KEY_TENANT, KEY_TYPE, KEY_ID)); };
  const wrapIdentity = async (identity: ProtectedIdentity, passphrase: string): Promise<object> => {
    if (!unlockStorage) return identity;
    const bytes = encoder.encode(JSON.stringify({ storageFormat: 'classrup.storage-row/v1', identity }));
    try { return { format: STORAGE_IDENTITY_FORMAT, sealed: await seal(bytes, passphrase) }; }
    finally { bytes.fill(0); }
  };
  const close = (): Promise<void> => {
    if (closeSettlement) return closeSettlement;
    closed = true;
    session?.identity.lock();
    session = undefined;
    raw.invalidation?.removeEventListener('abort', invalidate);
    closeSettlement = (async () => { await raw.close(); })();
    return closeSettlement;
  };
  // Native invalidation must revoke the exposed signer synchronously, not just
  // the cached storage. Drain separately so an active callback cannot deadlock.
  const invalidate = (): void => { void close().catch(() => undefined); };
  raw.invalidation?.addEventListener('abort', invalidate, { once: true });
  if (raw.invalidation?.aborted) invalidate();
  const exclusive = async <T>(fn: () => Promise<T>): Promise<T> => {
    check();
    if (opening || session) throw new Error('Vault session already open');
    opening = true;
    try { return await fn(); } finally { opening = false; }
  };
  /** Shared recovery admission. Normalizers and validators receive detached payloads. */
  async function preflightRecords(inputs: readonly unknown[], principal: string, recordTypes: readonly string[], guard: () => void = check, validateOriginal = false) {
    guard();
    if (inputs.length > MAX_RECORDS) throw new Error('Backup record limit exceeded');
    const ids = new Set<string>();
    const records = inputs.map((input: unknown) => {
      if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid backup record');
      const row = input as Record<string, unknown>;
      if (Object.keys(row).sort().join(',') !== 'createdAt,data,id,revision,tenantId,type,updatedAt' || row.tenantId !== principal || typeof row.type !== 'string' || typeof row.id !== 'string' || row.id.length < 1 || row.id.length > 256 || /[\u0000-\u001f\u007f]/u.test(row.id) || !Number.isSafeInteger(row.revision) || (row.revision as number) < 1 || typeof row.createdAt !== 'string' || typeof row.updatedAt !== 'string' || !Number.isFinite(Date.parse(row.createdAt)) || !Number.isFinite(Date.parse(row.updatedAt)) || new Date(row.createdAt).toISOString() !== row.createdAt || new Date(row.updatedAt).toISOString() !== row.updatedAt || row.updatedAt < row.createdAt) throw new Error('Invalid backup record');
      const codec = byType.get(row.type);
      if (!codec || !recordTypes.includes(row.type)) throw new Error('Unsupported backup record type');
      const id = `${row.type}\u0000${row.id}`;
      if (ids.has(id)) throw new Error('Duplicate backup record');
      ids.add(id);
      const parsedData = codec.parse(structuredClone(row.data));
      if (codec.recordId && codec.recordId(parsedData) !== row.id) throw new Error('Backup record key mismatch');
      return { record: { ...row, data: parsedData } as unknown as StoredRecord, idx: codec.indexes(parsedData) };
    });
    for (const entry of records) {
      guard();
      const codec = byType.get(entry.record.type)!;
      if (codec.restoreData) {
        // Keep export's original evidence validation before checking normalized recovery data.
        if (validateOriginal) { await codec.validate?.(structuredClone(entry.record.data)); guard(); }
        const normalized = codec.parse(await codec.restoreData(entry.record.data, principal));
        guard();
        entry.record = { ...entry.record, data: normalized };
        entry.idx = codec.indexes(normalized);
        if (codec.recordId && codec.recordId(normalized) !== entry.record.id) throw new Error('Backup record key mismatch');
      }
      await codec.validate?.(structuredClone(entry.record.data));
      guard();
    }
    return records;
  }
  function activate(identity: UnlockedIdentity, protectedIdentity: ProtectedIdentity): UnlockedVault {
    if (closed || raw.invalidation?.aborted) { identity.lock(); throw new Error('Vault closed'); }
    let active = true;
    const guard = (): void => { check(); if (!active) throw new Error('Vault locked'); };
    const storage: Storage = {
      kind: raw.kind,
      ...(raw.invalidation ? { invalidation: raw.invalidation } : {}),
      transaction<T, E>(fn: (tx: Tx) => Result<T, E> | Promise<Result<T, E>>, opts?: { readonly mode?: TxMode }) {
        guard();
        return raw.transaction(async tx => { guard(); const result = await fn(tx); guard(); return result; }, opts);
      },
      async read<T>(fn: (tx: Tx) => T | Promise<T>) {
        guard();
        const result = await raw.read(async tx => { guard(); const value = await fn(tx); guard(); return value; });
        guard();
        return result;
      },
      async ping() {
        try { guard(); const live = await raw.ping(); return !raw.invalidation?.aborted && live; }
        catch (error) { if (raw.invalidation?.aborted) return false; throw error; }
      },
      close,
    };
    // Shared snapshot admission for issuance and verification. No write lock is
    // held across asynchronous codec validation or hashing; callers receive
    // evidence of the captured row, not a capability for later mutation.
    const zeroRefCurrentDataCid = async (type: string, id: string, revision: number): Promise<string> => {
      guard();
      const codec = byType.get(type);
      if (!codec?.recordId || !codec.attachmentRefs) throw new Error('Attachment transition requires an authorized codec');
      const row = await storage.read(tx => tx.records.get(identity.principal, type, id));
      guard();
      if (!row || row.revision !== revision) throw new Error('Attachment transition current record mismatch');
      const data = codec.parse(structuredClone(row.data));
      if (codec.recordId(data) !== row.id) throw new Error('Attachment parent key mismatch');
      const refs = codec.attachmentRefs(structuredClone(data));
      if (!Array.isArray(refs) || refs.length !== 0) throw new Error('Attachment transition requires zero current references');
      await preflightRecords([{ ...row, data }], identity.principal, registeredRecordTypes, guard, true);
      const dataCid = `sha256-${await sha256Hex(strictCanonicalJson(data))}`;
      guard();
      return dataCid;
    };
    const unlocked: UnlockedVault = {
      principal: identity.principal, identity, storage,
      async lock() { active = false; identity.lock(); await close(); },
      async backupCoverage() {
        guard();
        const result = await storage.read(tx => coverage(tx, identity.principal));
        guard();
        return result;
      },
      async attachmentCoverage() {
        guard();
        const result = await storage.read(tx => referenceCoverage(tx, identity.principal));
        guard();
        return result;
      },
      async backupInspection() {
        guard();
        const result = await storage.read(tx => {
          const records = coverage(tx, identity.principal);
          // Attachment diagnostics are optional; never discard an otherwise
          // valid required record report because the holder scan is unavailable.
          let attachments: AttachmentCoverage | null = null;
          try { attachments = referenceCoverage(tx, identity.principal); }
          catch { /* Optional diagnostic failure is represented by null. */ }
          return Object.freeze({ records, attachments });
        });
        guard();
        return result;
      },
      async verifyAttachmentManifestOwners(sealed, passphrase) {
        guard();
        // Authenticate before reading destination records. A trusted unlocked
        // principal, not a caller-supplied manifest field, sets the authority.
        const manifest = await verifySealedAttachmentManifest(sealed, passphrase, identity.principal);
        guard();
        // Capture actual destination parents and codec-derived refs in a single
        // principal-scoped read. v1 restore intentionally contains no blob bytes.
        const actual = await storage.read(tx => {
          const scope = coverage(tx, identity.principal);
          if (scope.typeLimitExceeded || scope.recordLimitExceeded || scope.unsupportedRecordTypes.length) {
            throw new Error('Attachment owner reconciliation requires complete supported record coverage');
          }
          const parents: Array<{ readonly row: StoredRecord; readonly refs: readonly string[] }> = [];
          let links = 0;
          for (const codec of registeredCodecs) {
            if (!codec.attachmentRefs) continue;
            if (!codec.recordId) throw new Error('Attachment codec requires a canonical record key');
            const rows = tx.records.query({ tenant: identity.principal, type: codec.type,
              filters: [], orderSlot: 0, dir: 'asc', limit: MAX_RECORDS + 1 });
            for (const row of rows) {
              const data = codec.parse(structuredClone(row.data));
              if (codec.recordId(data) !== row.id) throw new Error('Attachment parent key mismatch');
              const declared = codec.attachmentRefs(structuredClone(data));
              if (!Array.isArray(declared)) throw new Error('Invalid attachment references');
              const count = declared.length;
              if (!Number.isSafeInteger(count) || count < 0
                || count > MAX_VERIFIED_BLOB_BATCH_ITEMS - links) {
                throw new Error('Attachment owner link limit exceeded');
              }
              const refs: string[] = [];
              const distinct = new Set<string>();
              for (let i = 0; i < count; i += 1) {
                const ref = declared[i];
                if (!isBlobRef(ref) || distinct.has(ref)) throw new Error('Invalid attachment references');
                distinct.add(ref);
                refs.push(ref);
              }
              links += count;
              if (refs.length) {
                parents.push({ row: { ...row, data }, refs });
                if (parents.length > MAX_VERIFIED_BLOB_BATCH_ITEMS) {
                  throw new Error('Attachment owner parent limit exceeded');
                }
              }
            }
          }
          if (links !== manifest.links || parents.length !== manifest.parents.length) {
            throw new Error('Attachment owner manifest scope mismatch');
          }
          parents.sort((a, b) => a.row.type === b.row.type
            ? (a.row.id < b.row.id ? -1 : a.row.id > b.row.id ? 1 : 0)
            : (a.row.type < b.row.type ? -1 : 1));
          return parents;
        });
        guard();
        // Retain original signed-evidence and canonical-key admission for the
        // current recovered records, without opening a write transaction.
        await preflightRecords(actual.map(parent => parent.row),
          identity.principal, registeredRecordTypes, guard, true);
        for (let i = 0; i < actual.length; i += 1) {
          const parent = actual[i]!;
          const expected = manifest.parents[i]!;
          const dataCid = `sha256-${await sha256Hex(strictCanonicalJson(parent.row.data))}`;
          guard();
          if (expected.type !== parent.row.type || expected.id !== parent.row.id
            || expected.revision !== parent.row.revision || expected.dataCid !== dataCid
            || expected.refs.length !== parent.refs.length
            || expected.refs.some((ref, index) => ref !== parent.refs[index])) {
            throw new Error('Attachment owner manifest record mismatch');
          }
        }
        return manifest;
      },
      async exportAttachmentZeroRefTransition(priorManifest, passphrase, owner) {
        guard();
        // Capture the requested owner before any authentication awaits. The
        // signed prior manifest, not caller-provided revisions/digests, binds
        // the earlier record and attachment reference.
        const { type, id, ref } = owner;
        if (typeof type !== 'string' || typeof id !== 'string' || !isBlobRef(ref)) {
          throw new Error('Invalid attachment transition owner');
        }
        const checked = await unlockIdentity(protectedIdentity, passphrase);
        checked.lock();
        guard();
        const prior = await verifySealedAttachmentManifest(priorManifest, passphrase, identity.principal);
        guard();
        const parent = prior.parents.find(candidate => candidate.type === type && candidate.id === id);
        if (!parent || !parent.refs.includes(ref) || !Number.isSafeInteger(parent.revision + 1)) {
          throw new Error('Attachment transition prior evidence mismatch');
        }
        const currentRevision = parent.revision + 1;
        const currentDataCid = await zeroRefCurrentDataCid(type, id, currentRevision);
        guard();
        if (currentDataCid === parent.dataCid) throw new Error('Invalid attachment transition fields');
        const payload: AttachmentZeroRefTransition = {
          principal: identity.principal, type, id, ref, priorRevision: parent.revision,
          priorDataCid: parent.dataCid, currentRevision, currentDataCid,
        };
        const envelope = await signEnvelope(identity, {
          type: ZERO_REF_TRANSITION_TYPE, createdAt: new Date().toISOString(), seq: 1, prev: null, payload,
        });
        guard();
        const plaintext = encoder.encode(JSON.stringify(envelope));
        try { const result = await seal(plaintext, passphrase); guard(); return result; }
        finally { plaintext.fill(0); }
      },
      async verifyAttachmentZeroRefTransition(priorManifest, sealedTransition, passphrase) {
        guard();
        const evidence = await verifySealedAttachmentZeroRefTransition(
          priorManifest, sealedTransition, passphrase, identity.principal);
        guard();
        const dataCid = await zeroRefCurrentDataCid(evidence.type, evidence.id, evidence.currentRevision);
        guard();
        if (dataCid !== evidence.currentDataCid) throw new Error('Attachment transition current record mismatch');
        return evidence;
      },
      async importPublicAttachmentBatch(sealed, passphrase, byteSet, retireOwner) {
        guard();
        // Capture the explicit retirement request before the first await.
        // A holder label alone is not authority to remove a reference.
        const retirement = retireOwner === undefined ? undefined : {
          type: retireOwner.type, id: retireOwner.id, ref: retireOwner.ref,
        };
        if (retirement && (
          typeof retirement.type !== 'string' || !retirement.type || retirement.type.length > 256
          || typeof retirement.id !== 'string' || !retirement.id || retirement.id.length > 256
          || /[\u0000-\u001f\u007f]/u.test(retirement.type) || /[\u0000-\u001f\u007f]/u.test(retirement.id)
          || !isBlobRef(retirement.ref))) {
          throw new Error('Invalid attachment owner retirement');
        }
        // Authentication and bounded byte admission precede the write. Rehash
        // detached bytes inside the transaction to defeat admission/write races.
        const manifest = await verifySealedAttachmentBlobBatch(sealed, passphrase, identity.principal, byteSet);
        guard();
        // Private bytes and already-encrypted source blobs need a separate
        // destination-key/transport contract; never relabel plaintext ciphertext.
        if (manifest.blobs.some(blob => blob.privacy !== 'P0' || blob.encrypted)) {
          throw new Error('Attachment import supports only public unencrypted source blobs');
        }
        const copies: Uint8Array[] = [];
        try {
          if (!Array.isArray(byteSet) || byteSet.length !== manifest.blobs.length) {
            throw new Error('Attachment import batch changed after admission');
          }
          for (let i = 0; i < manifest.blobs.length; i += 1) {
            copies.push(copyAttachmentBatchMember(byteSet[i], manifest.blobs[i]!.size,
              'Attachment import batch changed after admission'));
          }
          const written = await storage.transaction(async tx => {
            // This is a fresh destination write snapshot, not a prior successful
            // read-only verifyAttachmentManifestOwners() result.
            const scope = coverage(tx, identity.principal);
            if (scope.typeLimitExceeded || scope.recordLimitExceeded || scope.unsupportedRecordTypes.length) {
              throw new Error('Attachment import requires complete supported record coverage');
            }
            const actual: Array<{ readonly row: StoredRecord; readonly refs: readonly string[] }> = [];
            let links = 0;
            for (const codec of registeredCodecs) {
              if (!codec.attachmentRefs) continue;
              if (!codec.recordId) throw new Error('Attachment codec requires a canonical record key');
              const rows = tx.records.query({ tenant: identity.principal, type: codec.type,
                filters: [], orderSlot: 0, dir: 'asc', limit: MAX_RECORDS + 1 });
              for (const row of rows) {
                const data = codec.parse(structuredClone(row.data));
                if (codec.recordId(data) !== row.id) throw new Error('Attachment parent key mismatch');
                const declared = codec.attachmentRefs(structuredClone(data));
                if (!Array.isArray(declared)) throw new Error('Invalid attachment references');
                const count = declared.length;
                if (!Number.isSafeInteger(count) || count < 0
                  || count > MAX_VERIFIED_BLOB_BATCH_ITEMS - links) {
                  throw new Error('Attachment owner link limit exceeded');
                }
                const refs: string[] = [];
                const distinct = new Set<string>();
                for (let i = 0; i < count; i += 1) {
                  const ref = declared[i];
                  if (!isBlobRef(ref) || distinct.has(ref)) throw new Error('Invalid attachment references');
                  distinct.add(ref);
                  refs.push(ref);
                }
                links += count;
                if (refs.length) actual.push({ row: { ...row, data }, refs });
              }
            }
            if (links !== manifest.links || actual.length !== manifest.parents.length) {
              throw new Error('Attachment import owner scope mismatch');
            }
            actual.sort((a, b) => a.row.type === b.row.type
              ? (a.row.id < b.row.id ? -1 : a.row.id > b.row.id ? 1 : 0)
              : (a.row.type < b.row.type ? -1 : 1));
            await preflightRecords(actual.map(parent => parent.row),
              identity.principal, registeredRecordTypes, guard, true);
            for (let i = 0; i < actual.length; i += 1) {
              const parent = actual[i]!;
              const expected = manifest.parents[i]!;
              const dataCid = `sha256-${await sha256Hex(strictCanonicalJson(parent.row.data))}`;
              guard();
              if (expected.type !== parent.row.type || expected.id !== parent.row.id
                || expected.revision !== parent.row.revision || expected.dataCid !== dataCid
                || expected.refs.length !== parent.refs.length
                || expected.refs.some((ref, index) => ref !== parent.refs[index])) {
                throw new Error('Attachment import owner record mismatch');
              }
            }
            // The signed current parent must still exist in the authenticated
            // scope, no longer name this ref, and another current parent must
            // name it. No authority for absent parents or final-holder purge.
            if (retirement) {
              const retiring = actual.find(parent =>
                parent.row.type === retirement.type && parent.row.id === retirement.id);
              if (!retiring || retiring.refs.includes(retirement.ref)
                || !actual.some(parent => parent !== retiring && parent.refs.includes(retirement.ref))) {
                throw new Error('Attachment owner retirement not authorized by current records');
              }
            }
            // No durable write occurs until every canonical parent and every
            // detached content address has been rechecked under the write gate.
            for (let i = 0; i < copies.length; i += 1) {
              if (await blobRefOf(copies[i]!) !== manifest.blobs[i]!.ref) {
                throw new Error('Attachment import content-address mismatch');
              }
              guard();
            }
            for (let i = 0; i < copies.length; i += 1) {
              const expected = manifest.blobs[i]!;
              // The kernel's normal deduplication can LOWER an existing privacy
              // classification. Refuse a collision before calling put: a P0
              // recovery must never reclassify an existing private object.
              const current = tx.blobs.info(identity.principal, expected.ref);
              if (current && (current.privacy !== 'P0' || current.encrypted
                || current.contentType !== expected.contentType
                || current.size !== expected.size
                || current.createdAt !== expected.createdAt)) {
                throw new Error('Attachment import blob metadata conflict');
              }
              // Kernel deduplication returns an existing row by content-address
              // key without rehashing its stored bytes. A damaged P0 row with
              // matching metadata must not be accepted as recovered content.
              if (current) {
                const stored = tx.blobs.get(identity.principal, expected.ref);
                if (!stored) {
                  throw new Error('Attachment import existing blob content conflict');
                }
                const existingCopy = copyAttachmentBatchMember(stored.bytes, expected.size,
                  'Attachment import existing blob content conflict');
                try {
                  if (await blobRefOf(existingCopy) !== expected.ref) {
                    throw new Error('Attachment import existing blob content conflict');
                  }
                  guard();
                } finally {
                  // Clear our own copy, not any adapter-owned stored buffer.
                  existingCopy.fill(0);
                }
              }
              const put = await tx.blobs.put({ tenant: identity.principal, bytes: copies[i]!,
                contentType: expected.contentType, privacy: 'P0', encrypted: false,
                now: Date.parse(expected.createdAt) });
              guard();
              if (!put.ok || put.value.ref !== expected.ref || put.value.size !== expected.size
                || put.value.contentType !== expected.contentType
                || put.value.privacy !== 'P0' || put.value.encrypted
                || put.value.createdAt !== expected.createdAt) {
                throw new Error('Attachment import blob metadata conflict');
              }
            }
            for (const parent of actual) {
              // Labels derive only from verified canonical parent records.
              // Attach ALL currently authorized owners before any retirement.
              const holder = 'classrup.attachment_owner/v1:' + JSON.stringify([parent.row.type, parent.row.id]);
              for (const ref of parent.refs) {
                const attached = tx.blobs.attach(identity.principal, ref, holder);
                if (!attached.ok || !attached.value.present) {
                  throw new Error('Attachment import holder attachment failure');
                }
              }
            }
            if (retirement) {
              const holder = 'classrup.attachment_owner/v1:' + JSON.stringify([retirement.type, retirement.id]);
              const detached = tx.blobs.detach(identity.principal, retirement.ref, holder);
              // At least one current canonical holder was just attached. A
              // deletion or key-shred indication violates the transaction invariant.
              if (detached.deleted || detached.shred || !tx.blobs.info(identity.principal, retirement.ref)) {
                throw new Error('Attachment owner retirement would remove retained bytes');
              }
            }
            guard();
            return ok(manifest);
          });
          if (!written.ok) throw new Error('Attachment import transaction failed');
          return written.value;
        } finally {
          for (const bytes of copies) bytes.fill(0);
        }
      },
      async exportAttachmentManifest(passphrase) {
        guard();
        // Do not advertise an empty manifest when no domain explicitly attests
        // to canonical record ownership of attachments.
        if (!registeredCodecs.some(codec => codec.attachmentRefs)) {
          throw new Error('No authorized attachment codec');
        }
        const checked = await unlockIdentity(protectedIdentity, passphrase);
        checked.lock();
        guard();
        // Parent records, codec-derived references and detached stored bytes
        // MUST originate in the same principal-scoped transaction snapshot.
        const blobs = new Map<string, MediaBlob>();
        try {
          const parents = await storage.read(tx => {
            const scope = coverage(tx, identity.principal);
            if (scope.typeLimitExceeded || scope.recordLimitExceeded || scope.unsupportedRecordTypes.length) {
              throw new Error('Attachment manifest requires complete supported record coverage');
            }
            const rowsWithRefs: Array<{ readonly row: StoredRecord; readonly refs: readonly string[] }> = [];
            let links = 0;
            let totalBytes = 0;
            for (const codec of registeredCodecs) {
              if (!codec.attachmentRefs) continue;
              if (!codec.recordId) throw new Error('Attachment codec requires a canonical record key');
              const rows = tx.records.query({ tenant: identity.principal, type: codec.type, filters: [], orderSlot: 0, dir: 'asc', limit: MAX_RECORDS + 1 });
              for (const row of rows) {
                const data = codec.parse(structuredClone(row.data));
                if (codec.recordId(data) !== row.id) throw new Error('Attachment parent key mismatch');
                const declared = codec.attachmentRefs(structuredClone(data));
                if (!Array.isArray(declared)) throw new Error('Invalid attachment references');
                const count = declared.length;
                if (!Number.isSafeInteger(count) || count < 0 || count > MAX_VERIFIED_BLOB_BATCH_ITEMS
                  || count > MAX_VERIFIED_BLOB_BATCH_ITEMS - links) throw new Error('Attachment manifest item limit exceeded');
                const refs: string[] = [];
                const distinct = new Set<string>();
                for (let i = 0; i < count; i += 1) {
                  const ref = declared[i];
                  if (!isBlobRef(ref) || distinct.has(ref)) throw new Error('Invalid attachment references');
                  distinct.add(ref);
                  refs.push(ref);
                  if (!blobs.has(ref)) {
                    const found = tx.blobs.get(identity.principal, ref);
                    if (!found) throw new Error('Attachment manifest references missing bytes');
                    const { ref: storedRef, size, contentType, privacy, encrypted, createdAt, holders, bytes: sourceBytes } = found;
                    if (storedRef !== ref
                      || !Number.isSafeInteger(size) || size < 0 || size > MAX_BLOB_BYTES
                      || size > MAX_VERIFIED_BLOB_BATCH_BYTES - totalBytes
                      || (storage.kind === 'sqlite' && privacy !== 'P0' && encrypted !== true)) {
                      throw new Error('Attachment manifest byte limit or integrity failure');
                    }
                    // Use the same intrinsic-length and fixed-allocation admission
                    // as import; the signed size and actual view must agree before
                    // allocating the detached snapshot.
                    const bytes = copyAttachmentBatchMember(sourceBytes, size,
                      'Attachment manifest byte limit or integrity failure');
                    totalBytes += size;
                    blobs.set(ref, { ref: storedRef, size, contentType, privacy, encrypted, createdAt, holders,
                      bytes });
                  }
                }
                links += count;
                if (refs.length) rowsWithRefs.push({ row: { ...row, data }, refs });
              }
            }
            return rowsWithRefs;
          });
          guard();
          if (!parents.length) throw new Error('No authenticated attachment parents');
          // Reuse the signed-record compatibility and canonical-key preflight.
          // Validation runs after closing the storage snapshot and cannot commit.
          await preflightRecords(parents.map(parent => parent.row),
            identity.principal, registeredRecordTypes, guard, true);
          const blobEntries: Array<{ ref: string; size: number; contentType: string; privacy: string; encrypted: boolean; createdAt: string }> = [];
          for (const blob of blobs.values()) {
            const verified = await verifyStoredBlob(blob);
            try {
              guard();
              blobEntries.push({ ref: verified.ref, size: verified.size, contentType: verified.contentType,
                privacy: verified.privacy, encrypted: verified.encrypted, createdAt: verified.createdAt });
            } finally {
              // A concurrent vault lock or metadata append error must not strand
              // this second copy after its content address was successfully hashed.
              verified.bytes.fill(0);
            }
          }
          blobEntries.sort((a, b) => a.ref < b.ref ? -1 : a.ref > b.ref ? 1 : 0);
          const parentEntries: Array<{ type: string; id: string; revision: number; dataCid: string; refs: readonly string[] }> = [];
          for (const parent of parents) {
            const dataCid = `sha256-${await sha256Hex(strictCanonicalJson(parent.row.data))}`;
            guard();
            parentEntries.push({ type: parent.row.type, id: parent.row.id, revision: parent.row.revision,
              dataCid, refs: [...parent.refs] });
          }
          parentEntries.sort((a, b) => a.type === b.type
            ? (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
            : (a.type < b.type ? -1 : 1));
          const manifest = await signEnvelope(identity, {
            type: 'classrup.vault.attachment_manifest/v1',
            createdAt: new Date().toISOString(), seq: 1, prev: null,
            payload: { principal: identity.principal, parents: parentEntries, blobs: blobEntries },
          });
          guard();
          const plaintext = encoder.encode(JSON.stringify(manifest));
          try { const result = await seal(plaintext, passphrase); guard(); return result; }
          finally { plaintext.fill(0); }
        } finally {
          // The adapter can reject after its callback has already made copies.
          for (const blob of blobs.values()) blob.bytes.fill(0);
        }
      },
      async exportBackup(passphrase) {
        guard();
        // Confirm the entered passphrase really decrypts this identity. Never emit an unusable kit.
        const checked = await unlockIdentity(protectedIdentity, passphrase);
        checked.lock();
        guard();
        const records = await storage.read(tx => {
          // Recheck against the same snapshot as the export, not an earlier UI inventory.
          const scope = coverage(tx, identity.principal);
          if (scope.typeLimitExceeded) throw new Error('Backup record type limit exceeded');
          if (scope.unsupportedRecordTypes.length) throw new Error('Backup contains unsupported record types. Open a compatible application version before exporting.');
          if (scope.recordLimitExceeded) throw new Error('Backup record limit exceeded');
          const out: StoredRecord[] = [];
          for (const codec of registeredCodecs) {
            const rows = tx.records.query({ tenant: identity.principal, type: codec.type, filters: [], orderSlot: 0, dir: 'asc', limit: MAX_RECORDS + 1 });
            for (const row of rows) {
              const data = codec.parse(row.data);
              if (codec.recordId && codec.recordId(data) !== row.id) throw new Error('Backup record key mismatch');
              out.push({ ...row, data });
            }
            if (out.length > MAX_RECORDS) throw new Error('Backup record limit exceeded');
          }
          return out;
        });
        await preflightRecords(records, identity.principal, registeredRecordTypes, guard, true);
        const exportedAt = new Date().toISOString();
        const manifest = await signEnvelope(identity, { type: 'classrup.vault.alpha_backup/v1', createdAt: exportedAt, seq: 1, prev: null, payload: { principal: identity.principal, protectedIdentity, recordTypes: registeredRecordTypes, records } });
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
        const persistedIdentity = await wrapIdentity(created.protectedIdentity, passphrase);
        await unlockStorage?.(passphrase, false);
        check();
        const saved = await raw.transaction(tx => tx.records.put({ tenant: KEY_TENANT, type: KEY_TYPE, id: KEY_ID, data: persistedIdentity, idx: [null, null, null, null], expectedRevision: 0, now: Date.now() }));
        if (!saved.ok) throw new Error('Vault initialization conflict');
        return activate(created.identity, created.protectedIdentity);
      } catch (error) { created.identity.lock(); throw error; }
    }),
    unlock: passphrase => exclusive(async () => {
      backoff.check();
      const stored = await key();
      if (!stored) throw new Error('Vault does not exist');
      let protectedIdentity = stored.data;
      let requiresEncryption = false;
      let identity: UnlockedIdentity;
      try {
        if (protectedIdentity && typeof protectedIdentity === 'object' && (protectedIdentity as { format?: unknown }).format === STORAGE_IDENTITY_FORMAT) {
          const wrapper = protectedIdentity as Record<string, unknown>;
          if (Object.keys(wrapper).sort().join(',') !== 'format,sealed') throw new Error('Invalid vault identity');
          const bytes = await unseal(wrapper.sealed, passphrase);
          try {
            const payload = JSON.parse(decoder.decode(bytes)) as Record<string, unknown>;
            if (!payload || Object.keys(payload).sort().join(',') !== 'identity,storageFormat' || payload.storageFormat !== 'classrup.storage-row/v1') throw new Error('Invalid vault identity');
            protectedIdentity = payload.identity;
            requiresEncryption = true;
          } finally { bytes.fill(0); }
        }
        identity = await unlockIdentity(protectedIdentity, passphrase);
        backoff.succeeded();
      } catch (error) {
        // An unavailable browser primitive is not a wrong passphrase attempt.
        if (!(error instanceof IdentityCryptoError)) backoff.failed();
        throw error;
      }
      try {
        const replacement = !requiresEncryption && unlockStorage ? await wrapIdentity(protectedIdentity as ProtectedIdentity, passphrase) : undefined;
        await unlockStorage?.(passphrase, requiresEncryption, replacement);
        return activate(identity, protectedIdentity as ProtectedIdentity);
      } catch (error) { identity.lock(); throw error; }
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
      if (!data || typeof data !== 'object' || Array.isArray(data) || Object.keys(data).sort().join(',') !== 'principal,protectedIdentity,recordTypes,records' || data.principal !== envelope.author || !Array.isArray(data.records) || data.records.length > MAX_RECORDS || !Array.isArray(data.recordTypes) || data.recordTypes.some(type => typeof type !== 'string' || !byType.has(type)) || new Set(data.recordTypes).size !== data.recordTypes.length || JSON.stringify(data.recordTypes) !== JSON.stringify([...data.recordTypes].sort())) throw new Error('Invalid or unsupported backup scope');
      const identity = await unlockIdentity(data.protectedIdentity, passphrase);
      try {
        if (identity.principal !== envelope.author) throw new Error('Backup identity mismatch');
        const records = await preflightRecords(data.records, identity.principal, data.recordTypes as string[]);
        check();
        const persistedIdentity = await wrapIdentity(data.protectedIdentity as ProtectedIdentity, passphrase);
        await unlockStorage?.(passphrase, false);
        check();
        const saved = await raw.transaction(tx => {
          const identityWrite = tx.records.put({ tenant: KEY_TENANT, type: KEY_TYPE, id: KEY_ID, data: persistedIdentity, idx: [null, null, null, null], expectedRevision: 0, now: Date.now() });
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
