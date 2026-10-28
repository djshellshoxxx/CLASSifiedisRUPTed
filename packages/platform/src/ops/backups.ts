/**
 * F15.S03.M02 backup snapshot format v1.
 *
 *   { manifest: { version, createdAt, tenant?, collections: { name: { count, sha256 } },
 *                 eventsCount, eventsLastPosition, eventsSha256, sha256 },
 *     signature: SignedEnvelope<manifest>   // Ed25519, context 'backup-manifest', operator key
 *     data: { collections: { name: records[] }, events: StoredEvent[] } }
 *
 * `manifest.sha256` covers the whole `data` block, the per-collection hashes cover each record list, and
 * the signature covers the manifest, so verification detects any tamper with data or manifest. Idempotency
 * records are not part of a backup: they expire and replaying them after a restore is unnecessary.
 */
import type { DataStore, StoredEvent, Versioned } from '@classrup/kernel';
import { decodeJson, DomainError, encodeJson, fingerprint, validationError, z } from '@classrup/kernel';
import type { SignedEnvelope, SigningKeyPair } from '@classrup/security';
import { keyIdOf, sha256Hex, signEnvelope, verifyEnvelope } from '@classrup/security';

export const BACKUP_CONTEXT = 'backup-manifest';

export interface SnapshotSource {
  exportSnapshot(): { collections: Record<string, Versioned[]>; events: StoredEvent[] };
}

export interface BackupData {
  readonly collections: Readonly<Record<string, readonly Versioned[]>>;
  readonly events: readonly StoredEvent[];
}

export interface CollectionManifest {
  readonly count: number;
  readonly sha256: string;
}

export interface BackupManifest {
  readonly version: 1;
  readonly createdAt: number;
  /** Present for tenant-scoped (portability) backups: only records and events tagged with this tenant. */
  readonly tenant?: string;
  readonly collections: Readonly<Record<string, CollectionManifest>>;
  readonly eventsCount: number;
  readonly eventsLastPosition: number;
  readonly eventsSha256: string;
  readonly sha256: string;
}

export interface BackupSnapshot {
  readonly manifest: BackupManifest;
  readonly signature: SignedEnvelope<BackupManifest>;
  readonly data: BackupData;
}

export interface BackupVerification {
  readonly ok: boolean;
  readonly problems: readonly string[];
}

export interface RestoreSummary {
  readonly collections: number;
  readonly records: number;
  readonly events: number;
}

export const isSnapshotSource = (value: unknown): value is SnapshotSource =>
  typeof value === 'object' && value !== null && typeof (value as SnapshotSource).exportSnapshot === 'function';

const hashOf = (value: unknown): string => sha256Hex(fingerprint(value));

const byId = (a: Versioned, b: Versioned): number => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

const tenantOf = (record: object): unknown => (record as { tenantId?: unknown }).tenantId;

function selectData(source: SnapshotSource, tenant: string | undefined): BackupData {
  const exported = source.exportSnapshot();
  const collections: Record<string, Versioned[]> = {};
  for (const name of Object.keys(exported.collections).sort()) {
    const records = (exported.collections[name] as Versioned[]).filter((r) => tenant === undefined || tenantOf(r) === tenant);
    collections[name] = [...records].sort(byId);
  }
  const events = exported.events.filter((e) => tenant === undefined || e.event.tenantId === tenant);
  return { collections, events };
}

function buildManifest(data: BackupData, createdAt: number, tenant: string | undefined): BackupManifest {
  const collections: Record<string, CollectionManifest> = {};
  for (const [name, records] of Object.entries(data.collections)) collections[name] = { count: records.length, sha256: hashOf(records) };
  return {
    version: 1,
    createdAt,
    ...(tenant !== undefined ? { tenant } : {}),
    collections,
    eventsCount: data.events.length,
    eventsLastPosition: data.events[data.events.length - 1]?.position ?? 0,
    eventsSha256: hashOf(data.events),
    sha256: hashOf(data),
  };
}

export function createBackup(source: SnapshotSource, key: SigningKeyPair, createdAt: number, tenant?: string): BackupSnapshot {
  const data = selectData(source, tenant);
  const manifest = buildManifest(data, createdAt, tenant);
  return { manifest, signature: signEnvelope(key, BACKUP_CONTEXT, manifest), data };
}

/** Collects every integrity problem instead of stopping at the first, so operators see the full damage. */
export function verifyBackup(snapshot: BackupSnapshot, trustedSigner: string): BackupVerification {
  const problems: string[] = [];
  const { manifest, data } = snapshot;
  if (manifest.version !== 1) problems.push(`unsupported version ${String(manifest.version)}`);
  if (snapshot.signature.signer !== trustedSigner) problems.push('signed by an untrusted key');
  if (!verifyEnvelope(snapshot.signature, BACKUP_CONTEXT, trustedSigner)) problems.push('manifest signature invalid');
  if (fingerprint(snapshot.signature.payload) !== fingerprint(manifest)) problems.push('manifest differs from signed manifest');
  problems.push(...collectionProblems(manifest, data));
  problems.push(...eventProblems(manifest, data));
  if (hashOf(data) !== manifest.sha256) problems.push('data hash mismatch');
  return { ok: problems.length === 0, problems };
}

function collectionProblems(manifest: BackupManifest, data: BackupData): string[] {
  const problems: string[] = [];
  const names = new Set([...Object.keys(manifest.collections), ...Object.keys(data.collections)]);
  for (const name of [...names].sort()) {
    const expected = manifest.collections[name];
    const records = data.collections[name];
    if (!expected || !records) {
      problems.push(`collection ${name} missing from ${expected ? 'data' : 'manifest'}`);
      continue;
    }
    if (records.length !== expected.count) problems.push(`collection ${name} count mismatch`);
    if (hashOf(records) !== expected.sha256) problems.push(`collection ${name} hash mismatch`);
    if (new Set(records.map((r) => r.id)).size !== records.length) problems.push(`collection ${name} has duplicate ids`);
    if (records.some((r) => !Number.isInteger(r.version) || r.version < 1)) problems.push(`collection ${name} has invalid record versions`);
  }
  return problems;
}

function eventProblems(manifest: BackupManifest, data: BackupData): string[] {
  const problems: string[] = [];
  const { events } = data;
  if (events.length !== manifest.eventsCount) problems.push('event count mismatch');
  if (hashOf(events) !== manifest.eventsSha256) problems.push('event hash mismatch');
  if ((events[events.length - 1]?.position ?? 0) !== manifest.eventsLastPosition) problems.push('last event position mismatch');
  const ordered = events.every((e, i) => i === 0 || e.position > (events[i - 1] as StoredEvent).position);
  if (!ordered) problems.push('event positions not increasing');
  // A full backup must replay into a store with identical positions, so it must be dense from 1.
  if (manifest.tenant === undefined && !events.every((e, i) => e.position === i + 1)) problems.push('event positions not dense');
  return problems;
}

export function assertBackupValid(snapshot: BackupSnapshot, trustedSigner: string): void {
  const result = verifyBackup(snapshot, trustedSigner);
  if (!result.ok) throw new DomainError('validation', 'BACKUP.INVALID', 'backup failed verification', { problems: result.problems.slice(0, 20) });
}

/** Insert with the stored version: the store only exposes expectedVersion+1, so replay the version steps. */
function restoreRecord(target: DataStore, name: string, record: Versioned): void {
  const collection = target.collection<Versioned>(name);
  for (let v = 0; v < record.version; v++) collection.put(record, v);
}

function assertEmptyTarget(target: DataStore, names: readonly string[]): void {
  const nonEmpty =
    target.events.lastPosition() > 0 ||
    names.some((n) => target.collection<Versioned>(n).count() > 0) ||
    (isSnapshotSource(target) && Object.values(target.exportSnapshot().collections).some((records) => records.length > 0));
  if (nonEmpty) throw new DomainError('precondition', 'BACKUP.TARGET_NOT_EMPTY', 'restore requires an empty data store');
}

/** Verifies, then restores into an empty store atomically. Record versions and event order are preserved. */
export function restoreBackup(target: DataStore, snapshot: BackupSnapshot, trustedSigner: string): RestoreSummary {
  assertBackupValid(snapshot, trustedSigner);
  return target.transaction(() => {
    const names = Object.keys(snapshot.data.collections);
    assertEmptyTarget(target, names);
    let records = 0;
    for (const name of names) {
      for (const record of snapshot.data.collections[name] as readonly Versioned[]) {
        restoreRecord(target, name, record);
        records++;
      }
    }
    target.events.append(snapshot.data.events.map((e) => e.event));
    return { collections: names.length, records, events: snapshot.data.events.length };
  });
}

export const serializeBackup = (snapshot: BackupSnapshot): string => encodeJson(snapshot);

const envelopeSchema = z.looseObject({ v: z.literal(1), ctx: z.string(), signer: z.string(), sig: z.string(), payload: z.looseObject({}) });
const snapshotSchema = z.looseObject({
  manifest: z.looseObject({ version: z.number(), createdAt: z.number(), collections: z.record(z.string(), z.looseObject({})) }),
  signature: envelopeSchema,
  data: z.looseObject({
    collections: z.record(z.string(), z.array(z.looseObject({ id: z.string(), version: z.number() }))),
    events: z.array(z.looseObject({ position: z.number(), event: z.looseObject({}) })),
  }),
});

/** Structural parse only; trust comes from `verifyBackup`. */
export function parseBackup(text: string): BackupSnapshot {
  let raw: unknown;
  try {
    raw = decodeJson(text);
  } catch {
    throw validationError('BACKUP.MALFORMED', 'backup is not valid JSON');
  }
  const result = snapshotSchema.safeParse(raw);
  if (!result.success) throw validationError('BACKUP.MALFORMED', 'backup structure invalid');
  return raw as BackupSnapshot;
}

export const backupSignerId = (key: SigningKeyPair): string => keyIdOf(key.publicKey);

export interface RetentionPolicy {
  readonly daily: number;
  readonly weekly: number;
  readonly monthly: number;
}

export const DEFAULT_RETENTION: RetentionPolicy = { daily: 7, weekly: 4, monthly: 12 };

export interface BackupStamp {
  readonly id: string;
  readonly createdAt: number;
}

const DAY_MS = 86_400_000;
const dayBucket = (ms: number): number => Math.floor(ms / DAY_MS);
/** Monday-based week; 1970-01-01 was a Thursday. */
const weekBucket = (ms: number): number => Math.floor((dayBucket(ms) + 3) / 7);
const monthBucket = (ms: number): number => {
  const d = new Date(ms);
  return d.getUTCFullYear() * 12 + d.getUTCMonth();
};

/** Latest snapshot in each of the `n` newest non-empty buckets. */
function newestPerBucket(sortedNewestFirst: readonly BackupStamp[], n: number, bucket: (ms: number) => number): string[] {
  const kept = new Map<number, string>();
  for (const item of sortedNewestFirst) {
    const key = bucket(item.createdAt);
    if (kept.has(key)) continue;
    if (kept.size >= n) break;
    kept.set(key, item.id);
  }
  return [...kept.values()];
}

/**
 * Grandfather-father-son retention: keep the latest backup of each of the newest N days, weeks and
 * months. Buckets are counted among existing backups, so an outage in backups never prunes old history.
 */
export function selectBackupsToKeep(backups: readonly BackupStamp[], policy: RetentionPolicy = DEFAULT_RETENTION): Set<string> {
  const sorted = [...backups].sort((a, b) => b.createdAt - a.createdAt || (a.id < b.id ? 1 : -1));
  return new Set([
    ...newestPerBucket(sorted, policy.daily, dayBucket),
    ...newestPerBucket(sorted, policy.weekly, weekBucket),
    ...newestPerBucket(sorted, policy.monthly, monthBucket),
  ]);
}

export function selectBackupsToPrune(backups: readonly BackupStamp[], policy: RetentionPolicy = DEFAULT_RETENTION): string[] {
  const keep = selectBackupsToKeep(backups, policy);
  return backups.filter((b) => !keep.has(b.id)).map((b) => b.id);
}
