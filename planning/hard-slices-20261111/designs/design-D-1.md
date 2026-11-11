# Design D-1 — IOX-2 read-only preflight and idempotent import into an existing vault

Lens: data-integrity engineering. Paths are relative to `/home/user/CLASSifiedisRUPTed`.

## 1. Summary and scope

`packages/vault/src/import.ts` adds two functions over the existing alpha backup format. `preflightBackup` unseals, verifies and classifies a `classrup.vault.alpha_backup/v1` bundle against the unlocked vault inside a kernel **read** transaction and returns a `PreflightReport`; it cannot write, because the memory driver refuses writes in read mode (`packages/kernel/src/storage/memory-driver.ts:145`) and `storage.read` always rolls back (`packages/kernel/src/storage/storage.ts:50-53,70-74`). `importBackup` runs the same preparation, then classifies and applies every record inside **one** write transaction (`storage.ts:41-56`): absent records are written with `tx.records.restore` (`packages/kernel/src/storage/tx.ts:161-167`), identical ones are skipped without a driver call, conflicting ones reject the whole transaction (default) or are skipped (`onConflict: 'skip'`). Nothing is ever overwritten.

The preparation mirrors `restoreBackup` (`packages/vault/src/vault.ts:140-190`) step by step — unseal, size bound, `verifyEnvelope`, manifest shape, per-record shape, `codec.parse` → `restoreData` → `codec.parse` → `indexes` → `validate` — with two deliberate differences: the bundle author must equal the **unlocked principal** (no identity is unlocked or written), and `recordTypes` may be a subset of the registered codecs (older bundles import; unknown types reject). `restoreBackup` is untouched.

MVP: both functions, pure `classifyRecord`, the bundle format registry with `ALPHA_BACKUP_V1`, typed errors, the report schema, tests, a README paragraph. Deferred, with reasons:
- `onConflict: 'replace'`: revisions are per-vault counters without causal history; "newer" cannot be proven, so replace would be last-writer-wins on possibly forked data (forbidden by ADR-0016).
- Skipping unsupported record types: the signature covers the whole manifest; importing a verified subset silently drops data the user believes restored. The report names the types; the fix is upgrading the app.
- An import receipt record: would make repeat imports non-zero-write and create a record type no codec exports.
- A deletion ledger in the vault: a kernel change outside slice D (§8).
- Checking the bundle passphrase against the vault identity: the two may legitimately differ (slice B may add passphrase change); the embedded identity is never used.

## 2. Data model and formats

Input: an unchanged `Sealed` (`packages/identity/src/identity.ts:10-27`) containing the signed envelope `{v:1,type:'classrup.vault.alpha_backup/v1',cid,author,createdAt,seq:1,prev:null,payload,ext,sig}` with `payload = {principal, protectedIdentity, recordTypes, records[]}` exactly as `exportBackup` emits (`vault.ts:113`) and `restoreBackup` checks (`vault.ts:151,159`). A record row is `{tenantId,type,id,revision,data,createdAt,updatedAt}` under the `vault.ts:159` predicate (sorted key set, safe-integer `revision ≥ 1`, `id` 1..256 chars without control characters, RFC 3339 round-trip timestamps, `updatedAt ≥ createdAt`).

Bounds (same as `vault.ts:9-10` plus envelope limits): ciphertext ≤ 16 MiB + 16 (`validateSealed`, `identity.ts:25`); plaintext ≤ `MAX_IMPORT_PLAINTEXT_BYTES` = 16 MiB before `JSON.parse`; canonical envelope ≤ 1 MiB, 50 000 nodes, depth 32 (`packages/federation/src/envelope.ts:44-47,75`); `MAX_IMPORT_RECORDS` = 10 000; `MAX_REPORTED_FAILURES` = 100; `MAX_CONFLICTS_IN_ERROR` = 50. Since every valid bundle is ≤ 1 MiB canonical, per-record work is bounded by that size, not by record count.

Report (versioned, JSON-serialisable; never contains record `data`, passphrases or key material):

```ts
export interface PreflightReport {
  readonly format: 'classrup.vault.import_report/v1';
  readonly mode: 'preflight' | 'import';
  readonly checkedAt: string;                                   // options.clock.iso()
  readonly principal: string;
  readonly bundle: { type: string | null; formatMajor: number | null; cid: string | null; author: string | null;
    exportedAt: string | null; authorMatchesPrincipal: boolean | null; plaintextBytes: number | null;
    recordTypes: readonly string[] /* [] until the author check passed */ };
  readonly counts: Readonly<Record<string, TypeCounts>>;        // per type plus '*' total
  readonly records: { new: readonly RecordRef[]; identical: readonly (RecordRef & { localRevision: number })[]; conflicting: readonly ConflictEntry[] };
  readonly unsupportedTypes: readonly { type: string; count: number }[];
  readonly validatorFailures: readonly { type: string; id: string; stage: 'parse' | 'restoreData' | 'validate'; reason: string }[]; // ≤100; reason ≤200 chars, control chars stripped
  readonly failuresTruncated: boolean;
  readonly excluded: typeof EXCLUDED_SCOPES;
  readonly warnings: readonly { code: 'BUNDLE_OLDER_THAN_VAULT' | 'FORMAT_RETIRING'; params: Readonly<Record<string, string>> }[];
  readonly errors: readonly AppError[];                          // ≤100
  readonly verdict: 'importable' | 'identical' | 'conflicting' | 'rejected';
  readonly importableWith: readonly ConflictPolicy[];           // [] when rejected, ['skip'] when conflicting, both otherwise
}
type TypeCounts = { total: number; new: number; identical: number; conflicting: number; invalid: number };
type RecordRef = { type: string; id: string; bundleRevision: number; bundleUpdatedAt: string };
type ConflictEntry = RecordRef & { localRevision: number; localUpdatedAt: string; reason: 'revision' | 'data'; localNewer: boolean };
export interface ImportReport extends PreflightReport { readonly mode: 'import';
  readonly applied: { restored: number; skippedIdentical: number; skippedConflicting: number; writes: number; idempotentNoop: boolean; onConflict: ConflictPolicy } }
export interface ImportFailure { readonly error: AppError; readonly report: PreflightReport }
```

`EXCLUDED_SCOPES` is a frozen list of `{scope, disclosure}` for `media_blobs`, `outbox_inbox`, `dead_letters`, `leases`, `delivery_state`, `idempotency`, `migrations`, `identity_record` (e.g. "Leases are not imported; a lease held at export time is not revived"). It appears in every report, rejected ones included, so a UI always discloses what a backup never contained.

Bundle format registry (the previous-major hook). The envelope grammar admits only `/v1` types (`envelope.ts:91`), so a bundle major lives in the type slug, never in the envelope version:

```ts
export interface CanonicalManifest { readonly principal: string; readonly protectedIdentity: unknown; readonly recordTypes: readonly string[]; readonly records: readonly unknown[] }
export interface BundleFormat {
  readonly type: string;             // exact envelope type, checked against /^classrup\.[a-z][a-z0-9_.]{0,100}\/v1$/
  readonly major: number;            // ≥1, reported as bundle.formatMajor
  readonly supportedUntil?: string;  // RFC 3339; absent = no retirement date (the PS-078-10.R03 window starts when a new major ships)
  lift(envelope: VerifiedEnvelope): Result<CanonicalManifest, AppError>;
}
export const ALPHA_BACKUP_V1: BundleFormat;                    // 'classrup.vault.alpha_backup/v1', major 1
export const DEFAULT_BUNDLE_FORMATS: readonly BundleFormat[];  // Object.freeze([ALPHA_BACKUP_V1])
export function bundleFormatRegistry(formats: readonly BundleFormat[]): ReadonlyMap<string, BundleFormat>; // TypeError on duplicate or invalid entries
```

`ALPHA_BACKUP_V1.lift` enforces `seq === 1 && prev === null`, the four-key payload, `payload.principal === envelope.author`, `records.length ≤ 10 000`, unique string `recordTypes`, and `protectedIdentity` shape (`format === 'classrup.identity-key/v1'`, `principal === author`, `validateSealed(secret)`, `identity.ts:19`). It never unlocks the identity. This registry is unrelated to kernel `runMigrations` (`packages/kernel/src/storage/migrations.ts:35`); a lift records nothing.

## 3. Algorithms and state machine

One linear pipeline; every failure is terminal; no timeouts because nothing is leased.

| # | State | Guard / action | Failure → code |
|---|---|---|---|
| S0 | received | `options` validated (TypeError = programmer error) | — |
| S1 | sealed_checked | `validateSealed(bundle)` before any KDF work | VALIDATION_FAILED `bundle/INVALID_SEALED`; UNSUPPORTED_SCHEMA_VERSION for unknown format/kdf/cipher |
| S2 | unsealed | `unseal` (one scrypt N=2^17) | PLATFORM_BACKUP_DECRYPT_FAILED |
| S3 | decoded | `≤ 16 MiB`, fatal UTF-8 decode, `JSON.parse`; buffer zeroed in `finally` (`vault.ts:146-148`) | PAYLOAD_TOO_LARGE `{limitBytes}`; VALIDATION_FAILED `bundle/INVALID_JSON` |
| S4 | verified | `verifyEnvelope(parsed, { now: clock.now() })` | 'Statement outside validity window' (`envelope.ts:115`) → ID_TIMESTAMP_SKEW; 'Envelope too large' / 'JSON complexity exceeded' (`:44,47,75`) → PAYLOAD_TOO_LARGE; else → PRIVACY_EXPORT_SIGNATURE_INVALID `{reason}` |
| S5 | format_resolved | registry lookup by `envelope.type`; `supportedUntil` passed → reject; within 30 days → warning | UNSUPPORTED_SCHEMA_VERSION `{type}` |
| S6 | author_checked | `envelope.author === unlocked.principal` | FORBIDDEN `{reason:'foreign_principal'}`; report keeps only `bundle.type/cid/author/exportedAt` |
| S7 | lifted | `format.lift(envelope)` | the lift's VALIDATION_FAILED `manifest.<field>` / PAYLOAD_TOO_LARGE |
| S8 | scoped | `recordTypes ⊆ codec types`, else `unsupportedTypes` | UNSUPPORTED_SCHEMA_VERSION `{types}` |
| S9 | rows_checked | per row: `vault.ts:159` predicate, `tenantId === principal`, type ∈ `recordTypes`, unique `(type,id)`, `codec.parse` | VALIDATION_FAILED `records[i]/INVALID_RECORD`, `FOREIGN_TENANT`, `TYPE_NOT_DECLARED`, `DUPLICATE_ID`, `SCHEMA_MISMATCH` (collected ≤100) |
| S10 | normalized | `data = codec.parse(await codec.restoreData(raw, principal))` if present, `idx = codec.indexes(data)`; `raw` kept | VALIDATION_FAILED `RESTORE_DATA_REJECTED` (collected) |
| S11 | validated | `await codec.validate?.(data)` | VALIDATION_FAILED `VALIDATOR_REJECTED` (collected) |
| S12 | classified | read tx (preflight) or inside the write tx (import): `classifyRecord(tx.records.get(principal,type,id), p)` per record | — |
| T | preflight_done / committed / noop / rejected | below | CONFLICT_REVISION (reject policy); INTERNAL `{reason:'classification_drift'}` |

S9–S11 continue past failures in the dry run (bounded) so every invalid record is listed; the import never opens its transaction when `errors` or `unsupportedTypes` is non-empty.

Classification (`classifyRecord`, pure, `J = JSON.stringify`):

```
local undefined                                         → new
local.revision !== r.revision                           → conflicting('revision', localNewer = local.revision > r.revision)
J(local.data) === J(r.data) || J(local.data) === J(r.raw) → identical
otherwise                                               → conflicting('data')
```

This is exactly the kernel predicate: `restore` returns `'identical'` iff `current.revision === rec.revision && current.data === JSON.stringify(rec.data)` (`tx.ts:164`), where `current.data` is stored JSON text and `get` returns `JSON.parse` of it (`tx.ts:100`). Lemma: for text `t` produced by `JSON.stringify`, `JSON.stringify(JSON.parse(t)) === t`, so `J(local.data)` is the stored text. The `raw` branch covers a case the kernel cannot see: byte-identical data at the same revision whose normalization is not idempotent on its own output. This is real today: a coordination record frozen with reason `restore_requires_review` re-normalizes to reason `conflicting_promise`, because `reconstructCoordination` replays evidence to `proposed` and then applies `freezeConflict` (`packages/mutiny/src/trade_proposals/repository.ts:55-57`, `trade_proposals/index.ts:189-191`). Treating raw-identical as identical is safe: the vault already holds those bytes and nothing is written.

Apply step (import only), inside `unlocked.storage.transaction`:

```
for each prepared record p in bundle order:
  c = classifyRecord(tx.records.get(principal, p.type, p.id), p)
  new         → r = tx.records.restore({tenantId: principal, ...p, data: p.data}, p.idx); r must be ok('restored') else return err(INTERNAL classification_drift)
  identical   → skip (no driver call)
  conflicting → 'skip': count and skip; 'reject': collect
if 'reject' and conflicts > 0 → return err(CONFLICT_REVISION {conflictCount, conflicts: first 50})   // rollback
return ok(report)
```

Terminal `noop`: zero `restore` calls ⇒ empty journal ⇒ `commit` returns before `persist` (`memory-driver.ts:324`); `applied.writes = 0`, `idempotentNoop = true`.

Idempotency. Let `norm = parse ∘ restoreData ∘ parse` be deterministic in `(data, principal)` (true for the alpha codecs: `normalizeCoordinationRecord` uses only `lastObservedAt`/`receivedAtLocal` from the record; `wantRepo` has no `restoreData`; this becomes the documented codec contract). After `importBackup(B)` succeeds, each record of `B` was (a) written as `(revision, J(norm(data)))`, (b) identical and untouched, or (c) a skipped conflict, untouched. On a second run (a) is identical by the lemma and determinism, (b) unchanged, (c) still conflicting and still skipped. No `restore` call, zero writes, both policies. Under `reject`, a conflicting first run wrote nothing, so the second run is the first.

Atomicity. The only writes are `restore` upserts in one transaction; `err` or an exception rolls back (`storage.ts:46-53`); on IndexedDB a failing `persist` (quota, superseded writer) undoes the journal and rethrows (`memory-driver.ts:325-331`, writer fence `packages/kernel/src/storage/indexeddb.ts:78-104`), leaving the working set at the last durable state. All parsing, normalization and validators finish before the transaction opens, so a corrupted later record is found while nothing is written. No TOCTOU between preflight and import: the import classifies against the state it modifies under the storage lock (`storage.ts:24-39`); the preflight is advisory, the `ImportReport` authoritative.

Complexity: one scrypt (≈1 s, 128 MiB), one Ed25519 verify, O(|bundle|) parsing, O(N) map lookups (N ≤ 10 000), validator work bounded by the 1 MiB canonical envelope; memory ≈ 3–4× bundle size plus the report.

## 4. Public API

`packages/vault/src/import.ts` (isomorphic; imports `@classrup/kernel`, `@classrup/identity`, `@classrup/federation` and `import type { BackupCodec, UnlockedVault } from './vault.ts'`, which keeps `tools/deps/deps.mjs` green).

```ts
export type ConflictPolicy = 'reject' | 'skip';
export interface ImportOptions {
  readonly codecs: readonly BackupCodec[];     // the list the caller gave openVault
  readonly onConflict?: ConflictPolicy;         // default 'reject'
  readonly formats?: readonly BundleFormat[];   // default DEFAULT_BUNDLE_FORMATS
  readonly clock?: Clock;                       // default createSystemClock(); verifyEnvelope now, checkedAt, retirement warnings
}
export type ImportTarget = Pick<UnlockedVault, 'principal' | 'storage'>;
export function preflightBackup(unlocked: ImportTarget, bundle: unknown, passphrase: string, options: ImportOptions): Promise<PreflightReport>;
export function importBackup(unlocked: ImportTarget, bundle: unknown, passphrase: string, options: ImportOptions): Promise<Result<ImportReport, ImportFailure>>;
export interface PreparedRecord { readonly type: string; readonly id: string; readonly revision: number; readonly createdAt: string; readonly updatedAt: string; readonly raw: unknown; readonly data: unknown; readonly idx: ReturnType<BackupCodec['indexes']> }
export type RecordClassification = { kind: 'new' } | { kind: 'identical'; localRevision: number } | { kind: 'conflicting'; localRevision: number; localUpdatedAt: string; reason: 'revision' | 'data'; localNewer: boolean };
export function classifyRecord(local: StoredRecord | undefined, record: PreparedRecord): RecordClassification;
export const importErrors: ErrorRegistry<'PRIVACY_EXPORT_SIGNATURE_INVALID' | 'PLATFORM_BACKUP_DECRYPT_FAILED'>; // defineErrors; statuses 500 / 422 as in PS-078 and PS-120
export const MAX_IMPORT_RECORDS = 10000, MAX_IMPORT_PLAINTEXT_BYTES = 16 * 1024 * 1024, MAX_REPORTED_FAILURES = 100, MAX_CONFLICTS_IN_ERROR = 50;
export const EXCLUDED_SCOPES: readonly { readonly scope: string; readonly disclosure: string }[];
```

Both functions throw only for lifecycle and programmer errors: locked or closed vault (`guard()`, `vault.ts:82,87`), closed storage, invalid options. Every bundle problem is a value: preflight returns `verdict: 'rejected'` with `errors`; import returns `err({error, report})`. Neither touches `unlocked.identity`.

Composition: the PWA calls `preflightBackup(unlocked, file, passphrase, { codecs })` with the `codecs` constant it already passes to `openVault` (`apps/pwa/src/main.ts:9-29`), shows the report, then `importBackup(...)`. Wiring in `packages/vault/src/index.ts` (one appended line):

```ts
export { preflightBackup, importBackup, classifyRecord, bundleFormatRegistry, ALPHA_BACKUP_V1, DEFAULT_BUNDLE_FORMATS, EXCLUDED_SCOPES, importErrors, type ImportOptions, type ImportTarget, type ConflictPolicy, type PreflightReport, type ImportReport, type ImportFailure, type RecordClassification, type PreparedRecord, type BundleFormat, type CanonicalManifest } from './import.ts';
```

Optional `UnlockedVault` method — recommendation: **do not add it in this merge** (`vault.ts` is slice B's file; the free functions need only `codecs`, which the caller holds). If wanted, the exact diff is: after `exportBackup` in the interface (`vault.ts:43`) add

```ts
  /** IOX-2: dry run when options.dryRun, otherwise idempotent import; see import.ts. */
  importBackup(input: unknown, passphrase: string, options: Omit<ImportOptions, 'codecs'> & { readonly dryRun: true }): Promise<PreflightReport>;
  importBackup(input: unknown, passphrase: string, options?: Omit<ImportOptions, 'codecs'> & { readonly dryRun?: false }): Promise<Result<ImportReport, ImportFailure>>;
```

and after the `exportBackup` method in `activate()` (`vault.ts:117`) add `importBackup(input, passphrase, options = {}) { guard(); const { dryRun, ...rest } = options; return dryRun ? preflightBackup(unlocked, input, passphrase, { ...rest, codecs }) : importBackup(unlocked, input, passphrase, { ...rest, codecs }); }`, importing the two functions from `./import.ts` (which imports only types from `vault.ts`, so no runtime cycle).

Compatibility: `restoreBackup`/`exportBackup` unchanged; alpha bundles import through `ALPHA_BACKUP_V1`; a bundle from a build with fewer codecs imports (subset rule), one with more rejects with the type list. A future `classrup.vault.backup2/v1` registers a second `BundleFormat` whose `lift` yields `CanonicalManifest`; record-schema majors remain the codecs' job. Slice B keeps `UnlockedVault.storage` a guarded kernel `Storage`; this design uses only `storage.read`, `storage.transaction`, `tx.records.get`, `tx.records.query` (staleness warning, `limit: MAX_IMPORT_RECORDS + 1` per type as `vault.ts:105`) and `tx.records.restore`.

## 5. Threat model and failure handling

| Case | Outcome |
|---|---|
| Bundle signed by (or claiming) another principal | S6 FORBIDDEN before lift; report carries the author DID (a public pseudonym) and nothing about contents |
| Valid signature, one row with `tenantId ≠ principal` | VALIDATION_FAILED `FOREIGN_TENANT`; whole bundle rejected |
| Tampered ciphertext or wrong passphrase; plaintext edited after export | PLATFORM_BACKUP_DECRYPT_FAILED from the AEAD, nothing parsed; PRIVACY_EXPORT_SIGNATURE_INVALID (`envelope.ts:117,120`), never classified |
| Re-signed by the owner's key with a bad or duplicate record | codec rejects (SCHEMA_MISMATCH / RESTORE_DATA_REJECTED / VALIDATOR_REJECTED) or `DUPLICATE_ID`, even if one copy matches the vault; no transaction opened |
| Crafted conflict placed after many new records | classification precedes every write in one transaction; `reject` writes nothing, `skip` writes only new rows |
| Bundle revision lower / higher than local | conflicting (`localNewer` true / false); never downgraded, never overwritten (a higher revision may be a fork) |
| Replay of an old bundle to resurrect deleted records | **not prevented**: deleted records are absent and classify `new`; listed in the report, warning `BUNDLE_OLDER_THAN_VAULT` when `exportedAt` precedes the newest local `updatedAt` among codec types |
| Cached `committed` coordination state | `restoreData` freezes it as `restore_requires_review` (`repository.ts:57`); the frozen state is what is written, as in `restoreBackup` |
| Forged peer evidence inside the owner's backup | `validate` re-verifies envelopes (`apps/pwa/src/barter-runtime.ts:92-96,101-105`); rejected |
| `createdAt` more than 5 min in the future | ID_TIMESTAMP_SKEW; old bundles accepted without age limit |
| Oversize ciphertext, plaintext, envelope, record count, id length; report amplification | PAYLOAD_TOO_LARGE / VALIDATION_FAILED at the earliest cheap check, scrypt paid at most once; failures ≤100, conflicts in `error.params` ≤50, reasons ≤200 chars |
| Second tab supersedes the writer during commit | `persist` aborts, journal undone, `AppErrorException` DEPENDENCY_UNAVAILABLE `vault_superseded` propagates (`indexeddb.ts:24,102`); nothing written |
| `lock()` during the import transaction; two concurrent imports | guard throws and the transaction rolls back (`vault.ts:87`, proven by `vault.test.ts:36-56`); concurrent calls are serialized by the storage lock, the second is a no-op |

Freeze versus reject: the import creates no freeze verdicts of its own; it preserves the codecs' freeze-for-review normalization and the vault's existing verdicts. Everything above either rejects the bundle as a whole or skips a record; nothing is overwritten or deleted.

## 6. Test plan

File `packages/vault/src/import.test.ts`, vitest, fixtures as `vault.test.ts`: `vaultFromStorage(createMemoryStorage(), codecs)`, `openVault({ indexedDB: new IDBFactory() })` for durability, bundles from `session.exportBackup(passphrase)` mutated via `unseal` → edit → `signEnvelope(session.identity, …)` → `seal` as in `tests/integration/alpha-security.test.ts:183-188`, `createFakeClock` as `options.clock`, a `persist` spy on `createMemoryDriver({ persist })` to count writes; 60 s timeouts where several scrypts run.

Rows to append (append-only, after T17) to `10_Privacy/01_data_controls/mod_export/module.spec.yaml`; every `covers` ref exists (02.R02, 06.R01, 07.R02, 09.R02, 10.R02, 10.R03) and levels are in `TEST_LEVELS`, so `pnpm spec:check` stays at 0 errors with no new warning:

```
- "T18 | integration | 10.R02,02.R02,09.R02 | preflight dry run against an unlocked vault holding new, identical and conflicting records | report lists format, author match, per-type counts, new/identical/conflicting ids with revisions, excluded scopes and verdict; nothing written"
- "T19 | integration | 06.R01,10.R02 | import a bundle, import it again, export the vault and import that export | first import restores exactly the new records in one transaction; repeats are zero-write no-ops reported as identical"
- "T20 | integration | 10.R02,02.R02 | later corrupted record; later conflicting record under reject; conflicts under skip | corrupted or rejected bundles write nothing; skip writes only new records and never overwrites"
- "T21 | abuse | 07.R02,10.R02 | foreign author, foreign-tenant record, tampered signature, wrong passphrase, oversized plaintext, duplicate ids | each rejected with its typed code before any record is retained; vault unchanged"
- "T22 | unit | 10.R03 | format registry with the alpha v1 format, a registered test format and an unknown envelope type | registered formats lift to the canonical manifest; unknown or retired type rejected with UNSUPPORTED_SCHEMA_VERSION"
- "T23 | property | 10.R02 | random local and bundle records | classifyRecord agrees with kernel restore; identical never writes; conflicting never overwrites"
```

Tests (title prefix → expected result):

1. `TEST-PS-078-09.T18` preflight against a vault with note `one` identical, `two` locally edited (revision 2 vs 1) and `three` bundle-only → `verdict 'conflicting'`, `new=[three]`, `identical=[one]`, `conflicting=[{two, localRevision 2, bundleRevision 1, reason 'revision', localNewer true}]`, `counts['test.note']={3,1,1,1,0}`, `authorMatchesPrincipal true`, `excluded` equals `EXCLUDED_SCOPES`, `importableWith ['skip']`; `persist` never called; the `bundle` object unchanged.
2. `T18` empty vault → `verdict 'importable'`, `importableWith ['reject','skip']`.
3. `T19` import into an empty vault → `ok`, `applied.restored = writes = N`; rows keep source `revision`, `createdAt`, `updatedAt`.
4. `T19` same bundle again → `ok`, `writes 0`, `idempotentNoop true`, `verdict 'identical'`, `persist` not called.
5. `T19` export the imported vault, import that export into the same vault → `idempotentNoop true`.
6. `T19` production coordination codec (`coordinationRepo`, `normalizeCoordinationRecord` from `@classrup/mutiny`; state built as `alpha-security.test.ts:247-290`): stored `state.status 'frozen'`, reason `'restore_requires_review'`, `commitFeasibility null`; re-import no-op; export→import into the same vault no-op with the reason unchanged (raw-identical path).
7. `T20` + `TEST-PS-119-09.T13` bundle `[new A, corrupted B (title: 42)]` → `err` VALIDATION_FAILED, `validatorFailures=[{B, 'parse'}]`, A absent, `persist` not called.
8. `T20` `[new A, conflicting B]` default → `err` CONFLICT_REVISION, `params.conflictCount 1`, `conflicts[0].id 'B'`, A absent, B unchanged.
9. `T20` same with `onConflict: 'skip'` → `ok`, A present, B unchanged, `skippedConflicting 1`.
10. `T20` IndexedDB: preflight leaves nothing after lock/reopen/unlock; import then lock/reopen/unlock shows the rows.
11. `T21` bundle from a second principal → preflight `verdict 'rejected'`, `errors[0].code 'FORBIDDEN'`, `bundle.author` the other DID, `recordTypes []`, `counts['*'].total 0`; import `err` likewise; vault unchanged.
12. `T21` own bundle with one row's `tenantId` set to the other principal, re-signed → VALIDATION_FAILED `FOREIGN_TENANT`; nothing written.
13. `T21` flipped signature byte → PRIVACY_EXPORT_SIGNATURE_INVALID; wrong passphrase → PLATFORM_BACKUP_DECRYPT_FAILED; `{format:'invalid'}` → `INVALID_SEALED`; 16 MiB + 1 plaintext → PAYLOAD_TOO_LARGE; duplicate `(type,id)` → `DUPLICATE_ID`; clock 10 min before `createdAt` → ID_TIMESTAMP_SKEW; `recordTypes` with `'future.type'` → UNSUPPORTED_SCHEMA_VERSION with `unsupportedTypes` filled.
14. `T22` duplicate registry entry throws; a `classrup.vault.test_backup/v1` format whose `lift` maps `{p, r}` to the canonical manifest imports via `options.formats`; `classrup.vault.other/v1` → UNSUPPORTED_SCHEMA_VERSION `{type}`; `supportedUntil` in the past → rejected, within 30 days → `FORMAT_RETIRING` warning.
15. `T23` fast-check `fc.asyncProperty` (50 runs): random `{text}` data, key-order permutations and revisions 1..5 for local and bundle, identity codec (`raw === data`) → `classifyRecord` ⇔ `tx.records.restore` outcome in a memory storage (`'restored'`⇔new, `'identical'`⇔identical, CONFLICT_REVISION⇔conflicting); after `importBackup` the local row equals its pre-import row whenever the class was not `new`.
16. `TEST-PS-078-09.T13` `JSON.stringify` of every report and `error.params` contains no record text, `secret`, `ciphertext` or passphrase substring.

`vault.test.ts` and `alpha-security.test.ts` must pass unchanged.

## 7. Open questions resolved

1. `recordTypes` equality or subset? Subset. Equality (`vault.ts:151`) suits creating a vault; a live vault must accept older bundles, while unknown types fail closed.
2. Identical by normalized text only? No: normalized **or** raw at the same revision (§3); otherwise the vault's own frozen coordination records report false conflicts.
3. Show a foreign author's DID? Yes, DID only: public identity metadata that explains "wrong vault"; nothing else is reported. Its signature is still verified (one Ed25519 verify after the already-paid scrypt) so the DID is a fact, not a claim.
4. Unlock the embedded identity? No: one scrypt saved, passphrases may differ, nothing is written.
5. Source of codecs? `options.codecs`; no `vault.ts` change needed (optional method in §4).
6. Errors as values or exceptions? Values, per CTR-ERR-001 ERR-3; exceptions only for lifecycle/programmer errors.
7. Codes for decrypt and signature failures? A `defineErrors` registry in `import.ts` declaring `PLATFORM_BACKUP_DECRYPT_FAILED` (PS-120) and `PRIVACY_EXPORT_SIGNATURE_INVALID` (PS-078) with their spec statuses; no package defines them yet and the specs own them, so no spec edit is needed.
8. Stop at the first bad record? Preflight collects up to 100; import refuses on any.
9. Verdict depends on `onConflict`? No; `importableWith` says which policies would succeed.
10. Blob re-attachment? Not applicable: no `BackupCodec` carries `blobs`; `tx.records.restore` as in `vault.ts:182`; disclosed in `EXCLUDED_SCOPES`.
11. Bundle age limit? None; only future-dated bundles are rejected.

## 8. Honest limits

- Deleted records resurrect from older bundles; the vault keeps no deletion ledger (kernel change, outside slice D). The timestamp warning is a heuristic.
- Conflicts are detected, never resolved; "newer" cannot be established from per-vault revisions, so forks need human review outside this flow.
- JavaScript cannot zero parsed strings; only the plaintext buffer is zeroed (as in `restoreBackup`); a foreign bundle's records exist transiently in memory before FORBIDDEN.
- The embedded identity is checked for principal and shape only; whether the bundle passphrase still unlocks it is not established.
- Idempotency relies on `restoreData` being deterministic in `(data, principal)`: true for the alpha codecs, but a contract, not an enforced property. Export→import round trips of frozen coordination records rely on the raw-identical rule, not on idempotent normalization.
- The registry handles bundle majors, not record-schema majors; the 180-day window (PS-078-10.R03) has no concrete date until a second format exists.
- No quota pre-check: a quota failure during commit surfaces as a thrown `DOMException` with the working set rolled back (`alpha-security.test.ts:417-437` shows the kernel behaviour).
- Every call costs one scrypt, which any file can make the user pay, exactly as with restore.
