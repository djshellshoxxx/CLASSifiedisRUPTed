# Design D-2 — IOX-2 preflight and idempotent import into an existing vault (adversarial lens)

Repo paths are relative to `/home/user/CLASSifiedisRUPTed`. `vault.ts` = `packages/vault/src/vault.ts`, `tx.ts` = `packages/kernel/src/storage/tx.ts`, `envelope.ts` = `packages/federation/src/envelope.ts`, `identity.ts` = `packages/identity/src/identity.ts`.

## 1. Summary and scope

`packages/vault/src/import.ts` adds two functions over the existing `classrup.vault.alpha_backup/v1` bundle (`vault.ts:113`): `preflightBackup` (strictly read-only report) and `importBackup` (same classification re-run inside one write transaction, then writes). The existing `restoreBackup` empty-vault path (`vault.ts:140-190`) is untouched; `exportBackup` (`vault.ts:96-117`) is the only producer.

Trust boundary, in the order bytes are examined: (1) `validateSealed`/`unseal` (`identity.ts:19-27, 53-59`) authenticate the ciphertext under the passphrase; (2) `verifyEnvelope` (`envelope.ts:108-122`) authenticates the manifest under the author's Ed25519 key; (3) author must equal `unlocked.principal` before any record is iterated; (4) each record passes codec `parse → restoreData → parse → indexes → validate` exactly as `vault.ts:165-175`; (5) classification inside the transaction; (6) writes only via `tx.records.restore` (`tx.ts:161-167`). A valid signature is never authority; steps 3–5 are the domain validation.

MVP: both functions, the report, `onConflict: 'reject' | 'skip'`, staleness gate, format registry with the one current format, tests, index wiring, one `UnlockedVault` method (§4.4). Deferred, each justified:
- **Import receipts/ledger**: adds a write on every import and still cannot tell deletion from loss without record tombstones, which the kernel lacks (`tx.ts:145-153` deletes rows). Replaced by the read-only staleness heuristic (§3.3); belongs with deletion (F10.S01.M04).
- **Blob holder re-attachment**: blobs are excluded from the bundle (README), codecs expose no `blobs()`, and `writeRepo.restore` is not exported from kernel core. Disclosed in the report.
- **`classrup-export/v1` JSON Lines (IOX-1)**: no producer exists; the registry hook (§4.3) is its entry point.
- **Validator cancellation**: `BackupCodec.validate` takes no signal (`vault.ts:18`); the time budget applies between records only.

## 2. Data model and formats

**Input** (unchanged): `Sealed{format:'classrup.sealed/v1',kdf:'scrypt-131072-8-1',cipher:'xchacha20poly1305',salt,nonce,ciphertext}` (`identity.ts:10-17`), ciphertext ≤ 16 MiB+16 (`identity.ts:25`). Plaintext: a CTR-FED-001 envelope `{v:1,type:'classrup.vault.alpha_backup/v1',cid,author,createdAt,seq:1,prev:null,payload,ext,sig}` whose payload is exactly `{principal, protectedIdentity, recordTypes, records}` (`vault.ts:113,151`); each record is `{tenantId,type,id,revision,data,createdAt,updatedAt}` (`tx.ts:11-19`, shape rules `vault.ts:159`).

**Bounds** (re-declared in import.ts with the same values; vault.ts does not export them, `vault.ts:9-10`): plaintext ≤ `MAX_BACKUP_BYTES` 16 MiB; records ≤ `MAX_RECORDS` 10 000; id 1–256 chars, no C0/DEL; canonical envelope ≤ 1 MiB, ≤ 50 000 nodes, depth ≤ 32, arrays ≤ 50 000 (`envelope.ts:4,47,56,75`) — note the node cap makes ~5 000 small records the practical ceiling; `recordTypes` ≤ 256 entries; validator failure `detail` ≤ 200 code points; report lists are bounded by `MAX_RECORDS`; migration chain length ≤ 8; `updatedAt ≤ exportedAt + 300 000 ms` (same skew as `envelope.ts:115`).

**Report** (exact TypeScript, all `readonly`):

```ts
export interface PreflightReport {
  format: { type: string; major: 1; current: boolean; migratedFrom: string | null };
  author: { did: string; matchesPrincipal: boolean; exportedAt: string };
  checkedAt: string;                       // options.clock.iso()
  records: RecordClassification | null;    // null ⇒ never analysed (foreign author)
  excluded: ExcludedScopes;
  blocking: readonly BlockingIssue[];      // empty ⇔ verdict !== 'rejected'
  warnings: readonly ImportWarning[];
  verdict: 'importable' | 'no_op' | 'rejected';
}
export interface RecordClassification {
  total: number; localWatermarkUnknown: readonly string[];
  byType: readonly { type; bundle; new; identical; conflicting; invalid; supported: boolean; hasValidator: boolean; hasRestoreData: boolean }[];
  new: readonly { type; id; bundleRevision; bundleUpdatedAt; staleAgainstLocal: boolean }[];
  identical: readonly { type; id; revision }[];
  conflicting: readonly { type; id; localRevision; bundleRevision; reason: 'REVISION' | 'DATA' }[];
  unsupportedTypes: readonly string[]; undeclaredTypes: readonly string[];
  duplicates: readonly { type; id }[];
  failures: readonly { type; id; stage: 'shape' | 'parse' | 'restoreData' | 'validate'; code: string; detail: string }[];
}
export interface ExcludedScopes { blobs: true; blobHolders: true; outbox: true; inbox: true; deadLetters: true; idempotency: true; leases: true; sync: true; identityRecord: true; disclosure: string }
export type BlockingCode = 'FOREIGN_PRINCIPAL' | 'IDENTITY_MISMATCH' | 'UNSUPPORTED_RECORD_TYPE' | 'UNDECLARED_RECORD_TYPE' | 'DUPLICATE_RECORD' | 'INVALID_RECORD' | 'VALIDATOR_REJECTED' | 'CONFLICTS' | 'STALE_NEW_RECORDS';
export interface BlockingIssue { code: BlockingCode; count: number }
export type ImportWarning = { code: 'SAME_REVISION_DIVERGENCE' | 'CONFLICTS_SKIPPED' | 'STALE_NEW_RECORDS_ALLOWED' | 'DECLARED_TYPE_WITHOUT_CODEC' | 'LOCAL_WATERMARK_UNKNOWN'; count: number };
export interface ImportReport extends PreflightReport { applied: { dryRun: boolean; written: number; skippedIdentical: number; skippedConflicting: number }; idempotent: boolean }
```

`disclosure` is a fixed sentence: "This bundle carries only domain records of the registered codecs. Media blobs and their holder counts, outbox/inbox events, dead letters, idempotency keys, leases, delivery (sync) state and the encrypted signing identity are not imported." The report is in-memory only; it contains ids, types, revisions and short codes, never record data, and must not be logged (ERR-2, OBS).

## 3. Algorithms and state machine

### 3.1 Stages (one pass, fail-closed; terminal states in bold)

| State | Work | Guard / failure → typed error, nothing retained from later stages |
|---|---|---|
| sealed→decoded | `unseal` (`identity.ts:53`); `length ≤ 16 MiB`; fatal UTF-8 decode; `JSON.parse`; `plaintext.fill(0)` in `finally` (as `vault.ts:143-148`) | `VALIDATION_FAILED bundle/INVALID_SEALED|UNSEAL_FAILED|INVALID_UTF8|INVALID_JSON`; `PAYLOAD_TOO_LARGE` |
| decoded→typed | read `type`; `formats.resolve(type)` | `UNSUPPORTED_SCHEMA_VERSION {params:{type}}`, before any signature work |
| typed→verified | `verifyEnvelope(parsed, {expectedType: type, now: clock.now()})` (`envelope.ts:110,112`); result deep-frozen (`envelope.ts:121`) | `VALIDATION_FAILED manifest/ENVELOPE_REJECTED` (detail ≤200 chars) |
| verified→authorized | `envelope.author === unlocked.principal` | **report** `records:null`, `blocking:[FOREIGN_PRINCIPAL]`, `verdict:'rejected'`; parsed object dropped; import → `FORBIDDEN {params:{author}}` |
| authorized→migrated | migration chain on `payload` → canonical `{principal, protectedIdentity, recordTypes, records}` | `VALIDATION_FAILED manifest/INVALID_PAYLOAD` |
| migrated→shaped | `payload.principal === author`; `protectedIdentity` keys `format,principal,secret`, `principal === author`, `validateSealed(secret)` (`identity.ts:19`), never unlocked or written; `recordTypes` ≤256 sorted unique strings; record shape per `vault.ts:159` plus `tenantId === principal`, `type ∈ recordTypes`, `updatedAt ≤ exportedAt+5 min`; duplicates by `type\u0000id` | per-record `stage:'shape'` failures → `INVALID_RECORD`/`DUPLICATE_RECORD`/`UNDECLARED_RECORD_TYPE`/`UNSUPPORTED_RECORD_TYPE`; manifest-level → `VALIDATION_FAILED` |
| shaped→normalized | per supported record in bundle order: `raw = codec.parse(data)`; `norm = codec.restoreData ? codec.parse(await codec.restoreData(raw, principal)) : raw`; `idx = codec.indexes(norm)`; `await codec.validate?.(norm)` (mirrors `vault.ts:165-175`); between records `clock.now()-startedAt > budgetMs` stops | `stage: parse|restoreData|validate` → `VALIDATOR_REJECTED`; budget → `bundle/VALIDATION_BUDGET_EXCEEDED` |
| normalized→classified | in `storage.read` (preflight) or the single `storage.transaction` (import): per-type watermark scan, per-record `tx.records.get` (`tx.ts:122`), classify (§3.2) | pure |
| classified→**verdict** | `blocking` non-empty → `rejected`; no `new` → `no_op`; else `importable` | — |
| verdict→**applied** (import only) | `rejected` → `err` (rollback, zero writes); else `tx.records.restore(norm, idx)` per `new`; any result ≠ `'restored'` → `err(INTERNAL)` → rollback | storage exceptions (`AppErrorException DEPENDENCY_UNAVAILABLE`, quota) propagate; the memory driver undoes its journal |

Everything before "classified" is pure and async; the transaction function is **synchronous** (no `await` inside the tx), so no other transaction can interleave between classification and writes (`storage.ts:24-56` serializes; `vault.ts:85-88` guards). Timeouts: only `budgetMs` (default 60 000, injected clock). Preflight's read transaction cannot write by construction (`memory-driver.ts:145` throws on a write in a read tx; `storage.ts:50-53` always rolls back).

### 3.2 Classification (pure; `classifyImportRecords(local, entry)`)

Given `local = tx.records.get(principal, type, id)`:
- absent → **new**; `staleAgainstLocal = watermark(type) !== null && entry.updatedAt < watermark(type)`, where `watermark(type)` = max `updatedAt` over local records of that type from `tx.records.query({tenant, type, filters:[], orderSlot:0, dir:'asc', limit: MAX_RECORDS+1})` (`tx.ts:154`; `memory-driver.ts:161-169`); more than `MAX_RECORDS` rows → watermark unknown, treated as stale (fail closed) and listed in `localWatermarkUnknown`.
- present, `local.revision === entry.revision` and (`canonicalJson(local.data) === canonicalJson(entry.raw)` or `=== canonicalJson(entry.norm)`) → **identical** (`canonicalJson` `packages/kernel/src/hash/canonical.ts:36`). The raw-equality arm is what keeps re-import of an own backup idempotent for coordination records whose `restoreData` freezes `committed` to `frozen/restore_requires_review` (`packages/mutiny/src/trade_proposals/repository.ts:57,170-174`, codec `apps/pwa/src/barter-runtime.ts:97-100`): a record the vault already holds keeps the vault's own verdict; freezing applies only to records that are new to this vault.
- present otherwise → **conflicting**, `reason: 'REVISION'` if revisions differ else `'DATA'` (same revision, different data: also raises `SAME_REVISION_DIVERGENCE`).

Canonical comparison is stricter-than-kernel on purpose: `tx.records.restore` compares JSON text byte-wise (`tx.ts:164`), which would call a key-reordered copy a conflict; we never write in the identical case, so the semantic test is safe and cannot overwrite.

### 3.3 Verdict rules

`blocking` gets `CONFLICTS` when conflicts exist and `onConflict === 'reject'` (default); under `'skip'` conflicts are listed, never written, and warned `CONFLICTS_SKIPPED`. `STALE_NEW_RECORDS` blocks when any new record is stale and `onStale !== 'allow'` (default `'reject'`); with `'allow'` it becomes a warning. Unsupported, undeclared, duplicate, invalid and validator-rejected records always block (no partial import of a bundle whose integrity is in doubt). Complexity: O(B·c) for normalization (c = validator cost; coordination validators re-verify ≤200 envelopes each), O(B) classification with O(1) map lookups, O(L_t) per imported type for the watermark scan (each row `JSON.parse`d by `toStored`, `tx.ts:99-101`), memory O(B + report).

## 4. Public API

### 4.1 `packages/vault/src/import.ts`

```ts
import { appError, canonicalJson, createSystemClock, err, ok, type AppError, type Clock, type Result, type StoredRecord, type Tx } from '@classrup/kernel';       // kernel index.ts:2,17,18,21,106-107
import { unseal, validateSealed } from '@classrup/identity';                                   // identity/src/index.ts:1
import { verifyEnvelope, type VerifiedEnvelope } from '@classrup/federation';                   // federation/src/index.ts:1
import type { BackupCodec, UnlockedVault } from './vault.ts';                                   // type-only: no runtime cycle

export const CURRENT_BUNDLE_FORMAT = 'classrup.vault.alpha_backup/v1';
export interface BundleMigration { readonly from: string; readonly to: string; up(payload: unknown): unknown }   // sync, pure, total
export interface BundleFormatRegistry { readonly current: string; readonly supported: readonly string[]; resolve(type: string): readonly BundleMigration[] | undefined }
export function createBundleFormats(migrations?: readonly BundleMigration[]): BundleFormatRegistry;             // throws on duplicate `from`, cycles, chains > 8 or not ending at current
export interface PreflightOptions { readonly codecs: readonly BackupCodec[]; readonly clock?: Clock; readonly formats?: BundleFormatRegistry; readonly budgetMs?: number }
export interface ImportOptions extends PreflightOptions { readonly onConflict?: 'reject' | 'skip'; readonly onStale?: 'reject' | 'allow'; readonly dryRun?: boolean }
export type VaultSession = Pick<UnlockedVault, 'principal' | 'storage'>;
export function preflightBackup(unlocked: VaultSession, input: unknown, passphrase: string, options: PreflightOptions): Promise<Result<PreflightReport, AppError>>;
export function importBackup(unlocked: VaultSession, input: unknown, passphrase: string, options: ImportOptions): Promise<Result<ImportReport, AppError>>;
/** Pure seams (exported for tests, not re-exported from index.ts). */
export function classifyImportRecords(local: StoredRecord | undefined, entry: PreparedRecord, watermark: string | null | 'unknown'): Classified;
export function planImport(classified: readonly Classified[], options: Pick<ImportOptions, 'onConflict' | 'onStale'>): { verdict; blocking; warnings; toWrite: readonly PreparedRecord[] };
```

`identity` is deliberately not used: import neither signs nor unlocks anything. `Err` is returned only for inputs that could not be authenticated or shaped (§3.1); authenticated-but-unimportable bundles return `ok(report)` with `verdict:'rejected'` from `preflightBackup`, and `err` from `importBackup` with the code of the first blocking issue: `FOREIGN_PRINCIPAL`/`IDENTITY_MISMATCH` → `FORBIDDEN {params:{author}}`; `UNSUPPORTED_RECORD_TYPE` → `UNSUPPORTED_SCHEMA_VERSION {params:{types}}`; `CONFLICTS` → `CONFLICT_REVISION {params:{conflicts:[{type,id,localRevision,bundleRevision}]}}`; `STALE_NEW_RECORDS` → `PRECONDITION_FAILED {params:{reason:'stale_new_records',count}}`; the rest → `VALIDATION_FAILED {fields:[{path:'records[i]',code}]}`. Codes are CTR-ERR-001 common codes via `appError` (`packages/kernel/src/errors/app-error.ts:38`); `PRIVACY_EXPORT_SIGNATURE_INVALID` (PS-078) is owned by `packages/privacy` and must be defined there once (SPEC_FORMAT), so signature failures use `VALIDATION_FAILED manifest/ENVELOPE_REJECTED` and the README says so.

### 4.2 `packages/vault/src/index.ts` wiring (append to line 1's export list)

`export { preflightBackup, importBackup, createBundleFormats, CURRENT_BUNDLE_FORMAT, type PreflightReport, type ImportReport, type ImportOptions, type PreflightOptions, type BundleMigration, type BundleFormatRegistry } from './import.ts';`

### 4.3 Migration registry and compatibility

`createBundleFormats()` with no argument supports exactly `classrup.vault.alpha_backup/v1` (identity chain). A previous major is registered as `{from:'classrup.vault.<old>/v1', to: CURRENT_BUNDLE_FORMAT, up}` where `up` maps the old payload to the canonical `{principal, protectedIdentity, recordTypes, records}` shape; the report shows `format.migratedFrom`. Two facts constrain future formats: the envelope type regex only admits `/v1` suffixes (`envelope.ts:91`), so a new bundle major must be a new type name (e.g. `classrup.vault.backup_v2/v1`) unless federation changes; and bundles are authenticated before migration, so `up` runs on signed-but-untrusted data and must be total (never throw on shape it does not understand; return something the shape stage rejects). Previous-major readability (PS-078-10.R03) is the registry's contract; `restoreBackup` keeps its strict single-format check (`vault.ts:149-151`), unchanged.

### 4.4 Exact `UnlockedVault` diff for the merge step (one method)

```ts
// vault.ts line 1: add `type AppError` to the '@classrup/kernel' import.
// vault.ts after line 4:
import { importBackup as importIntoVault, type ImportOptions, type ImportReport } from './import.ts';
// vault.ts interface UnlockedVault (lines 36-44), after exportBackup:
  /** IOX-2 dry-run (options.dryRun) or idempotent import into this unlocked vault; never touches the identity record. */
  importBackup(input: unknown, passphrase: string, options?: Omit<ImportOptions, 'codecs'>): Promise<Result<ImportReport, AppError>>;
// vault.ts object literal (lines 93-118), after exportBackup:
      importBackup: (input, passphrase, options) => importIntoVault(unlocked, input, passphrase, { ...options, codecs }),
```

`codecs` is the `vaultFromStorage` argument (`vault.ts:59`), so the app's registered list is reused without duplication; `dryRun: true` returns the preflight report as an `ImportReport` with `applied.dryRun = true, written = 0`. The guarded `storage` (`vault.ts:83-92`) throws after `lock()`, which import propagates unchanged. Slice B's at-rest encryption is invisible here: only `Storage.read/transaction` and `Tx.records.get/query/restore` are used.

## 5. Threat model and failure handling

| Threat | Handling | Guarantee / residual |
|---|---|---|
| Forged author (signed by Mallory, or `author` swapped) | Signature over JCS(envelope−sig) with the author's key (`envelope.ts:116-120`); `author ≠ principal` → report with `records:null`, import `FORBIDDEN` | Without Alice's key no bundle passes; a foreign authentic bundle is never analysed. Residual: plaintext must exist in memory to read `author`; it is zeroed and dropped. |
| Mixed-principal rows (`tenantId` ≠ author; foreign `ownerId` in data) | Shape stage rejects foreign tenant; `vault.identity` cannot have a codec (`vault.ts:61`) → unsupported; owner checks are the codecs' `restoreData` (`barter-runtime.ts:88-100`), run before any tx | Import never writes to tenant `local-vault` or another tenant. Codecs without `restoreData` (public projections) are allowed by design, shown as `hasRestoreData:false`. |
| Oversized / complexity bombs | ciphertext ≤16 MiB+16 (`identity.ts:25,56`), plaintext ≤16 MiB, canonical ≤1 MiB, ≤50k nodes, depth 32 (`envelope.ts:44-56,75`), ≤10 000 records, ids ≤256, `recordTypes` ≤256, watermark scan ≤10 001 rows/type, validator budget | Everything bounded before expensive work except scrypt, inherent to the sealed format (`identity.ts:36-40`). |
| Duplicate ids with different payloads | Both rejected (`DUPLICATE_RECORD`), as `vault.ts:162-164` | No "last duplicate wins" path. |
| Validator bypass (no validator; validate on pre-normalized data; validator mutating input) | Same pipeline as restore: `validate` sees the re-parsed `restoreData` output (`vault.ts:171-175`); envelope frozen (`envelope.ts:79-85`); all records normalized before the tx; `hasValidator` disclosed | A validator-less codec is an app registration decision, visible in the report; import adds no trust a codec did not establish. |
| Crafted conflicts for partial writes (conflict or validator failure placed last; unexpected `restore` result) | Classification and verdict finish before the first `restore`; tx function synchronous; non-`'restored'` → `INTERNAL` → rollback; quota/superseded commit failures undo the journal (`alpha-security.test.ts:379-400,417-430`) | All `new` records written or none; identical/conflicting rows never touched in any mode. |
| Replay of an old authentic bundle to resurrect deleted records | Absent ≡ never-existed (no tombstones). Mitigation: per-type watermark; stale `new` rows block by default (`PRECONDITION_FAILED`) with `bundleUpdatedAt`, need `onStale:'allow'`; `exportedAt` surfaced; coordination returns `frozen/restore_requires_review`; wants/listings re-validated by codecs | Heuristic: a deleted record of a type with no newer local write is not flagged. Stated in README. |
| Same-revision divergence (cloned identity, raw edits) | `reason:'DATA'` + `SAME_REVISION_DIVERGENCE`; never overwritten, skippable only explicitly | Detection, not resolution. |
| Coordination fork via bundle (cached `committed`, forged evidence) | `restoreData` rebuilds from signed evidence with `trustLocalVerdict=false` (`repository.ts:30-60,182-184`); new records freeze; identical arm keeps the vault's own verdict | Import cannot upgrade a coordination to `committed`. |
| Clock manipulation | Only `options.clock` read; envelope skew +5 min (`envelope.ts:115`); records bounded by `exportedAt`; staleness compares ISO strings lexically (`toIso` producer) | No new clock trust beyond existing envelope rules. |
| Wrong passphrase / damaged ciphertext | AEAD failure → `VALIDATION_FAILED bundle/UNSEAL_FAILED`, indistinguishable by design (`identity.ts:57`) | No oracle beyond "did not decrypt". |
| Secret leakage | Passphrase reaches only `unseal`; `protectedIdentity.secret` never unsealed; report/errors carry ids and codes only | No new exposure path. |

What freezes vs rejects: foreign/unsupported/undeclared/duplicate/invalid/validator-rejected → reject whole bundle; conflicts → reject (default) or skip (never overwrite); stale new → reject (default) or allow; new coordination records → written frozen for review (codec semantics); identical → skipped silently and counted.

## 6. Test plan

File: `packages/vault/src/import.test.ts` (vitest; `vaultFromStorage(createMemoryStorage(), codecs)` and `openVault({name, indexedDB: new IDBFactory(), codecs})` exactly as `vault.test.ts:12-13,29`; `createFakeClock` from kernel; `fast-check` 4.10.2). One identity/vault pair is created in `beforeAll` (30 s timeout, scrypt cost) and bundles are produced with `exportBackup`; hand-crafted bundles follow `alpha-security.test.ts:236-241` (`signEnvelope` + `seal`). Property tests run against the pure seams and the memory storage, never through scrypt.

Spec rows to append (append-only) to `10_Privacy/01_data_controls/mod_export/module.spec.yaml` after T17 (line 246; levels from `tools/specgen/model.mjs:39`, covers validated by `validate.mjs:12,176-184` against existing refs): T18 integration `09.R02,10.R02`; T19 integration `10.R02`; T20 integration `10.R02,02.R02`; T21 abuse `07.R02,10.R02`; T22 property `10.R02,09.R02`; T23 unit `10.R03`; T24 abuse `02.R02,07.R02`. Kernel restore semantics stay covered by existing `TEST-PS-119-09.T13` (`packages/kernel/src/storage/sqlite.test.ts:84`, PS-119-10.R01). No new error codes, so `spec:check` stays at 0 errors.

1. **TEST-PS-078-09.T18** preflight of an own bundle against a vault holding one identical, one locally-modified and none of a third record → `verdict:'importable'`, `format.current:true`, `author.matchesPrincipal:true`, `byType` counts (1 identical, 1 conflicting `REVISION`, 1 new), `excluded` all true with disclosure, `checkedAt` = fake clock; full record dump before/after is deep-equal (read-only). Via `importBackup({dryRun:true})`: `blocking:[{CONFLICTS,1}]` by default, a `CONFLICTS_SKIPPED` warning with `onConflict:'skip'`. Covers 09.R02, 10.R02.
2. **TEST-PS-078-09.T19** import 3 new records into a vault with unrelated rows → `written:3`, revisions/timestamps equal the bundle, unrelated rows untouched; re-import → `verdict:'no_op'`, `written:0`, `idempotent:true`, dump unchanged. IndexedDB variant: close/reopen, rows present, re-import still `no_op`. Lifecycle: `lock()` during normalization rejects (`vault.ts:82`) with nothing written; a superseded writer surfaces as `err DEPENDENCY_UNAVAILABLE`. Covers 10.R02.
3. **TEST-PS-078-09.T20** record 3 of 3 conflicts → `err CONFLICT_REVISION` with `params.conflicts`, records 1–2 absent afterwards; `onConflict:'skip'` → written 2, conflicting row keeps local data/revision. Last record failing `validate` (async rejection), `restoreData` or `parse` → `VALIDATION_FAILED fields:[{path:'records[2]',code:'VALIDATOR_REJECTED'}]` with the matching `stage`, zero writes. Type without codec → `unsupportedTypes`, import `UNSUPPORTED_SCHEMA_VERSION`; type absent from `recordTypes` → `UNDECLARED_RECORD_TYPE`. Coordination round trip: vault holds a `committed` coordination; its own bundle → `identical` (raw arm), `no_op`; same record into a vault lacking it → written `frozen/restore_requires_review`; re-import there → `identical` (normalized arm). Covers 10.R02, 02.R02.
4. **TEST-PS-078-09.T21** bundle signed by Bob, sealed with Alice's passphrase → preflight `ok(report)` with `matchesPrincipal:false`, `records:null`, `verdict:'rejected'`; import `FORBIDDEN`; no id from Bob's bundle exists afterwards; `vault.identity/root` unchanged. Alice-signed bundle with Bob as payload `principal` or `protectedIdentity.principal` → `VALIDATION_FAILED manifest/*`; row with Bob's `tenantId` → `FOREIGN_TENANT`; row of type `vault.identity` → unsupported; want with foreign `ownerId` through `barterCodecs` (`barter-runtime.ts:87`) → `stage:'restoreData'`. Tampered `sig`/`cid`/payload → `manifest/ENVELOPE_REJECTED`, author never reported. Covers 07.R02, 10.R02.
5. **TEST-PS-078-09.T22** property (fast-check): random local and bundle record sets over 2 types with random id overlap, revisions and data → `classifyImportRecords` is a partition (each bundle record in exactly one class); identical ⇔ same revision ∧ canonical-equal (key order shuffled); `planImport` reject mode: `toWrite` empty when any conflict; skip mode: `toWrite` = new. Storage-level: seed memory storage with `tx.records.put`, drive the internal apply seam with an unsealed manifest; after skip-mode import each id holds local-before if it existed else bundle-normalized; a second run writes nothing; reject mode with ≥1 conflict leaves the dump byte-identical. Covers 10.R02, 09.R02.
6. **TEST-PS-078-09.T23** `createBundleFormats([{from:'classrup.vault.test_legacy/v1', to: CURRENT_BUNDLE_FORMAT, up}])`: a legacy-typed signed+sealed bundle imports, `format.migratedFrom` names it, `format.current:false`; unregistered → `UNSUPPORTED_SCHEMA_VERSION` before any signature work (throwing `up` proves ordering); cycles, duplicates and chains > 8 throw at construction; `restoreBackup` still rejects the legacy type (`vault.ts:149`, parity guard). Covers 10.R03.
7. **TEST-PS-078-09.T24** abuse: plaintext > 16 MiB and 10 001 records → `PAYLOAD_TOO_LARGE`; duplicate `(type,id)` with different data → `DUPLICATE_RECORD`; id with `\u0000` or 257 chars, `updatedAt` > `exportedAt`+5 min → `INVALID_RECORD`; non-JSON plaintext, wrong passphrase → `VALIDATION_FAILED bundle/*`; dump unchanged in every case. Replay: update X at `t+1h` then delete it; the bundle exported at `t` lists X as `new` with `staleAgainstLocal:true`, import `PRECONDITION_FAILED`, `onStale:'allow'` writes it with a warning; a type with no local rows is never stale. Budget: `validate` advances the fake clock 61 s on record 1 of 2 → `VALIDATION_BUDGET_EXCEEDED`, second validator never called. Covers 02.R02, 07.R02.

## 7. Open questions resolved

1. **Foreign author: report or error?** Report with `records:null`; import maps to `FORBIDDEN`. The user must see whose bundle it is; nothing else is disclosed.
2. **`recordTypes`: strict equality (as restore) or subset?** Subset: every record's type must be declared and have a codec; locally registered types absent from the bundle are fine. An app that adds a codec must still read yesterday's bundle; a type we cannot validate must never be partially imported.
3. **Meaning of "identical"** — same revision and canonical-JSON equality of raw or normalized data (§3.2); byte equality would break idempotence after codec normalization, and both arms only ever lead to "no write".
4. **Unlock the bundle's `protectedIdentity`?** No: the passphrase already authenticated the ciphertext; a second scrypt and a second live key buy nothing. Shape and principal are checked.
5. **Default for stale new records** — reject; `onStale:'allow'` after the dry-run. It is the only replay mitigation available without tombstones, and the dry-run exists for exactly this decision.
6. **Receipt write on import** — deferred (§1); a no-op import must be zero writes.
7. **Time source** — `options.clock` (`packages/kernel/src/clock/clock.ts:2-7`), default `createSystemClock()`; no `Date.now()` in import.ts. PWA codec validators call `Date.now()` themselves (`barter-runtime.ts:94`), out of scope.
8. **Lease around import** — none: transactions are serialized and classification plus writes share one synchronous tx.
9. **Signature-failure code** — `VALIDATION_FAILED manifest/ENVELOPE_REJECTED`, since `PRIVACY_EXPORT_SIGNATURE_INVALID` must be defined once by `packages/privacy` (§4.1).
10. **README** — the merge step appends one paragraph to `packages/vault/README.md` (outside the slice's file list): import into an existing vault, excluded scopes, conflicts never overwritten, staleness heuristic, no tombstones, no blob holders.

## 8. Honest limits

- Resurrection of deleted records by an authentic old bundle is detected heuristically (per-type watermark), not prevented; only record tombstones would make it a guarantee.
- Validators are trusted application code; a codec without `validate`/`restoreData` admits whatever its schema admits. The report discloses coverage, it cannot create it.
- A running validator cannot be interrupted; scrypt cost is fixed and inherent to the sealed format.
- Restored records referencing blobs get no holder rows; blobs, events, leases, sync and idempotency state are not carried. Restored data is written exactly as today's records are (slice B may change what lies below the Storage API).
- "Identical" and "conflicting" describe this vault's rows, not which copy is true; `SAME_REVISION_DIVERGENCE` is a signal, not a resolution.
- The preflight is read-only but not a snapshot of the future: the vault may change between dry-run and import, so import re-classifies and may reach a different verdict than the report the user approved.
- Nothing here is audited; the signature proves origin and integrity of the bundle, never truth of its contents (PS-078-07 data note).
