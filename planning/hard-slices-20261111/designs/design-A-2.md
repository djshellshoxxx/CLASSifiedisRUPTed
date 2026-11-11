# Design A-2 — FED-3/FED-4 per-author admission layer (adversarial lens)

Repository `/home/user/CLASSifiedisRUPTed`, branch `claude/difficult-project-parts-dcqlup`; paths are repo-relative, `file:line` cites the source read.

## 1. Summary and scope

A persistent admission layer in `packages/federation` turns a verified CTR-FED-001 envelope (`planning/contracts/CTR-FED-001.md:13-14`) into one outcome per author stream (`accepted`, `duplicate`, `buffered`, `quarantined`, `rejected`), with heads, gap buffer, fork evidence and tombstones persisted as kernel records in the caller's tenant and replayed after close/reopen. `verifyEnvelope` (`packages/federation/src/envelope.ts:108-122`) stays the only signature authority; the layer adds chain placement, bounds, tombstone policy and freezing.

Attacker model: a peer replaying, reordering and flooding valid envelopes; an author or stolen key equivocating; a third party forging or pre-registering tombstones; a local process editing plaintext IndexedDB rows between sessions; a jumping device clock. Two conclusions shape the design:

1. **Policy rejection must not break the hash chain.** Refusing a validly signed, correctly linked statement for content reasons (too old, oversized, tombstoned record key) would strand the author here forever: their next statement has `prev` = the refused cid and looks like a fork. Chain placement is therefore separated from content admission: such statements occupy `(author, seq)` as a content-less stub (`status: rejected|tombstoned`, `envelope: null`) and advance the head (PS-084 allows a "cid stub", `11_Federation/01_protocol/mod_records/module.spec.yaml:176`).
2. **Alpha statements must never enter author streams by default.** `classrup.alpha.*` wants, consents and reservations are signed `seq: 1, prev: null` per subject (`packages/bazaar/src/listings/index.ts:152`) and listing publications are per-subject chains (`listings/index.ts:50-56,97`); routed naively, every second alpha statement is a fork. The seam is an explicit `StreamPolicy` whose default refuses alpha types.

MVP: per-author chains; gap buffer (24 h, ≤100 ahead, ≤50/author, ≤5000/tenant, byte caps); fork freeze with retained evidence; duplicates; stale replays; tombstones from the target's author (cid or record-key target), purge within 24 h, 180-day retention; open-time replay plus lazy hash-chain verification; alpha seam; the PR #15 fixtures (`planning/FEDERATION_RECOVERY_COVERAGE_20261110.md:35`, branch `chatgpt/zero-codex/federation-recovery-trace-20261110`).

Deferred: **origin-relay tombstones** (no relay identity or peer records exist; `issuerKind` is pinned to `author`, anything else → `FEDERATION_TOMBSTONE_UNAUTHORIZED`); **conflict resolution** (needs UX and operator policy; the only exit from frozen is the destructive `purgeAuthor`); **origin fetch at expiry** (no transport; the sweep report lists seqs to fetch); **bus commands and events** (a future `federation.record.receive` wrapper maps each outcome to one event in the same transaction, 04.R02); **replaying existing `bazaar.publication` rows** (needs owner approval, PR #15 §Next 2).

## 2. Data model

Kernel records (`packages/kernel/src/storage/tx.ts:126-144`) declared with `defineRepo` (`packages/kernel/src/storage/repo.ts:26-38`; type `/^[a-z0-9]+\.[a-z0-9_]+$/`, ≤4 indexes). Index values compare byte-wise (`packages/kernel/src/storage/memory-driver.ts:161-169`), so `seq` is encoded as 16-digit zero-padded decimal (`seq16`); `\u0001` separates composite keys (invalid in cids and dids).

**`federation.statement`**, id = cid. Indexes: 1 `author`; 2 `chain` = `${author}\u0001${seq16}` when status ∈ {accepted, rejected, tombstoned}; 3 `buffer` = same key when buffered; 4 `expiry` = `bufferedUntil` when buffered (null otherwise, excluding other rows from ordered scans).
```json
{ "format": "classrup.federation.record/v1", "cid": "sha256-…", "author": "did:key:z6Mk…", "seq": 7,
  "prev": "sha256-…", "type": "classrup.bazaar.listing/v1", "recordKey": "0192…", "bytes": 1832,
  "envelope": { "…full verified envelope, or null for stubs and purged rows" },
  "status": "accepted", "statusReason": null, "code": null,
  "receivedAt": "2026-11-04T10:00:00.000Z", "verifiedAt": "2026-11-04T10:00:00.000Z",
  "claimedAt": "2026-11-04T09:58:00.000Z", "bufferedUntil": null, "purgedAt": null,
  "provenance": { "originRelay": "local", "via": [] } }
```
`status ∈ buffered|accepted|quarantined|rejected|dropped|tombstoned`; `statusReason ∈ gap_timeout|fork|tombstoned|time_invalid|too_large|policy`; `bytes` = UTF-8 length of `strictCanonicalJson(envelope)` (`envelope.ts:37-77`) ≤ 262 144; `via.length ≤ 1`; `dropped` rows are deleted.

**`federation.head`**, id = stream id (author under the default policy). Index 1 `state`.
`{ "format": "classrup.federation.head/v1", "author", "seq": 7, "cid": "sha256-…|null", "state": "open|frozen", "frozenReason": "fork|integrity|null", "frozenSeq", "conflictId", "buffered": { "count", "bytes" }, "pendingTombstones", "updatedAt" }`; `seq 0, cid null` before the first acceptance.

**`federation.conflict`**, id = `${author}\u0001${seq16}` (one open conflict per (author, seq), PS-086 `mod_conflicts/module.spec.yaml:74`). Indexes 1 `author`, 2 `status`.
`{ "format": "classrup.federation.conflict/v1", "kind": "fork_seq|prev_mismatch", "author", "seq", "status": "open", "detectedAt", "candidates": [ { "cid", "claimedAt", "receivedAt", "originRelay" } ×2..5 ] }` (`mod_conflicts:64`); candidate envelopes are `quarantined` statement rows.

**`federation.tombstone`**, id = tombstone cid. Indexes 1 `target` (`targetCid` or `${author}\u0001${recordKey}`), 2 `status`, 3 `expiry` (`expiresAt`), 4 `author`.
`{ "format": "classrup.federation.tombstone/v1", "cid", "author", "issuerKind": "author", "target": { "cid" } | { "recordKey" }, "reason", "status": "pending_target|applied|rejected", "receivedAt", "appliedAt", "purgeDueAt", "purgeCursor", "expiresAt" }`; expired rows are deleted; the signed envelope is the statement row with the same cid (tombstones are chain members, §3).

**`federation.meta`** singletons: `buffer {count, bytes}` (tenant totals), `clock {highWater}` (watermark), `tombstones {pending}`.

**Tombstone statement**: `type: "classrup.federation.tombstone/v1"`, payload strict `{ "target": "sha256-<64 hex>" | "<record key, 1..200 code points, no \p{Cc}>", "reason": "owner_withdrawn|account_deleted|listing_expired|moderation_removed|legal" }`. A `target` matching the cid pattern is a cid (reserved namespace); a record key cannot impersonate one.

Bounds, exported as `FEDERATION_LIMITS`: `bufferTtlMs 86 400 000`, `maxGap 100`, `bufferPerAuthor 50`, `bufferTotal 5000` (PS-087 `mod_dedup/module.spec.yaml:38-39`); added here: `bufferBytesPerAuthor 4 MiB`, `bufferBytesTotal 64 MiB` (5000 × 256 KiB would pin 1.25 GiB), `maxEnvelopeBytes 262 144` (PS-084 V03), `conflictCandidates 5`, `pendingTombstonesPerAuthor 50`, `pendingTombstonesTotal 5000`, `pendingTombstoneTtlMs 86 400 000`, `recordMaxAgeMs 180 d`, `maxFutureSkewMs 300 000`, `purgeDeadlineMs 86 400 000`, `tombstoneRetentionMs 180 d`, `sweepPage 500`.

## 3. Algorithms and state machines

**Machines** (`defineMachine`, `packages/kernel/src/machine/machine.ts:45-63`; undeclared moves → `CONFLICT_STATE {state, event}`, `machine.ts:56-59`). Statement: `received` (initial, transient) → `accepted|buffered|quarantined|rejected|tombstoned`; `buffered` → `accepted|dropped|quarantined|tombstoned`; `accepted` → `quarantined|tombstoned`; terminal `rejected, dropped, tombstoned`; `quarantined` has no MVP outgoing edge. Tombstone: `received` → `applied|pending_target|rejected`; `pending_target` → `applied|rejected`; `applied` → `expired`. Stream: `open` → `frozen` on `fork|integrity`, terminal in MVP.

**decide** (pure, PS-087; precedence duplicate → reject → fork → next → buffer, 03.R02):
1. `known(cid)` = `tombstoned` → `reject FEDERATION_TOMBSTONED`; other known status → `duplicate`.
2. head frozen: `seq === frozenSeq` with <5 candidates → `fork` (append); else `reject CONFLICT_STATE {state:'frozen'}`.
3. `seq ≤ head.seq` (cid unknown) → `fork fork_seq`.
4. `seq === head.seq + 1`: `prev === head.cid` (seq 1 ⇔ `head.seq 0`) → `next`; else `fork prev_mismatch`.
5. `seq > head.seq + 1`: gap > 100 → `FEDERATION_GAP_TOO_LARGE`; oversize → `FEDERATION_BATCH_TOO_LARGE`; outside the time window → `FEDERATION_RECORD_TIME_INVALID`; any of the four buffer caps exceeded by `load`+`bytes` → `FEDERATION_BUFFER_FULL` (retryable); a buffered row at the same `(author, seq)` with another cid → `fork fork_seq`; else `buffer {missing: head.seq+1…seq−1, until: now+24 h}`.
6. For `next`, content policy fixes the stored status: oversize → stub `rejected/too_large`; createdAt older than 180 d or >5 min future → stub `rejected/time_invalid`; an applied tombstone on this cid or `(author, recordKey)` → stub `tombstoned`; else `accepted`. Re-run at release for buffered rows.

O(1) plus O(gap ≤ 100) for `missing`; deterministic in its inputs; authors never interact (03.R03).

**place** (one kernel transaction per envelope, 06.R02; `err`/throw rolls everything back, `storage.ts:41-56`): read head, `ensureVerified(author)`, `decide`, then:
- `next`: upsert statement and head, apply the tombstone if the type is one, then **drain**: for `s = head.seq+1` while a buffered row exists at `s` (index `buffer` eq): `verifyEnvelope(row.envelope, { now: claimedAtMs })` again (row edits since buffering; ≤50 verifies), `prev !== head.cid` → fork at `s`, else release under the same content policy and decrement counters; released cids are returned in seq order.
- `buffer`: write the row with `bufferedUntil = effectiveNow + 24 h`; increment head and meta counters.
- `fork`: write the newcomer `quarantined/fork`; re-label the incumbent at that seq (accepted or buffered) by CAS `put` at its current revision (`tx.ts:113-118`, bytes untouched); open or append the conflict; head `state: frozen, frozenSeq, conflictId`. Other seqs keep `accepted`; readers consult `head.state`, so the stream is hidden without rewriting anything.
- `reject`: write nothing.

**Tombstone apply** (when a tombstone statement is accepted or released; issuer = envelope author by signature). cid target absent → `pending_target` (bounded by `pendingTombstones*`, else `FEDERATION_BUFFER_FULL {buffer:'tombstone'}`); present with another author → tombstone `rejected`, outcome `FEDERATION_TOMBSTONE_UNAUTHORIZED`, target untouched, the tombstone statement remains a `rejected/policy` stub in the issuer's chain; same author → target `tombstoned`, `envelope: null`, `purgedAt = now` in the same transaction (no race window), tombstone `applied`, `expiresAt = appliedAt + 180 d`. Record-key target → `applied`, `purgeDueAt = now + 24 h`; purge walks the author's `chain` range filtered by `recordKey`, ≤500 rows now, continued from `purgeCursor` by sweeps; while it lives, later statements with that record key become `tombstoned` stubs (V09, `mod_records:156`). A statement whose cid has a `pending_target` tombstone: same author → `tombstoned` stub, tombstone `applied`; other author → tombstone `rejected`, statement proceeds.

**sweep(now)** (≤500 rows, idempotent, any cadence): expired buffered rows → delete, decrement counters, report `{cid, author, seq, fetch}`; `pending_target` older than 24 h → `applied`; continue record-key purges, counting rows past `purgeDueAt` as overdue; `expiresAt ≤ now` → delete the tombstone row only: the target's `tombstoned` stub stays as a chain member, so a resend after 180 d is still `FEDERATION_TOMBSTONED` (beyond V08).

**effectiveNow** = `max(now, meta.clock.highWater)`, watermark updated on every write: a backwards jump never extends a buffer (PS-087 T07); a forward jump only expires early (fail closed; resend recovers).

**replay(now)** runs once after `openIndexedDbStorage` (`packages/kernel/src/storage/indexeddb.ts:160-188`): recount buffered rows (≤5000) against head and meta counters, repair meta from rows, mark disagreeing heads `frozen/integrity`, then `sweep`. **ensureVerified(author)** runs lazily on first touch per session: walk the `chain` range in seq order, check contiguity 1..n, recompute `sha256-${sha256Hex(strictCanonicalJson(content))}` (`packages/kernel/src/hash/canonical.ts:42-47`) for every row with content, check `row.prev === previous.cid`, and `verifyEnvelope` the latest row with content. Because `prev` sits inside each signed body, n hashes plus one signature authenticate the whole chain; stubs are authenticated through their successor's `prev`. Failure → `frozen/integrity`. O(n) per author per session, cached in a `Set`.

## 4. Public API

Catalog paths (`planning/modules.yaml:98,101,102`) are honoured; cross-module imports target `index.ts` (`tools/deps/deps.mjs:43`); no `node:` imports.

`packages/federation/src/relay_sync/dedup/index.ts` (PS-087, pure):
```ts
export const FEDERATION_LIMITS: Readonly<Record<LimitName, number>>; // LimitName: the sixteen names in §2
export interface ChainHead { seq: number; cid: string | null; state: 'open'|'frozen'; frozenSeq?: number }
export interface BufferLoad { authorCount: number; authorBytes: number; totalCount: number; totalBytes: number }
export type KnownStatus = 'accepted' | 'buffered' | 'quarantined' | 'rejected' | 'tombstoned';
export type ContentPolicy = { admit: 'accepted' } | { admit: 'stub'; status: 'rejected'|'tombstoned'; code: string };
export type Decision = { kind: 'duplicate'; status: KnownStatus } | { kind: 'next'; policy: ContentPolicy } | { kind: 'buffer'; missing: readonly number[]; until: string } | { kind: 'fork'; reason: 'fork_seq' | 'prev_mismatch'; at: number } | { kind: 'reject'; error: AppError };
export function decide(env: VerifiedEnvelope, head: ChainHead, known: (cid: string) => KnownStatus | undefined, load: BufferLoad, bytes: number, tombstoned: (cid: string, recordKey?: string) => boolean, now: number): Decision;
export function drainOrder(buffered: readonly { seq: number; cid: string; prev: string | null }[], head: ChainHead): readonly string[];
export function expired(rows: readonly { cid: string; bufferedUntil: string }[], now: number): readonly string[];
export function verifyChain(rows: readonly { cid: string; seq: number; prev: string | null; envelope: Envelope | null }[]): Promise<Result<ChainHead, AppError>>;
```
`decide` requires `VerifiedEnvelope` (`envelope.ts:20`; 05.R03); `verifyChain` is async only for WebCrypto hashing.

`packages/federation/src/protocol/records/index.ts` (PS-084/086):
```ts
export const federationErrors: ErrorRegistry<FederationCode>; // defineErrors (packages/kernel/src/errors/app-error.ts:59-70) over the eight module codes in §5
export const federationStatementRepo, federationHeadRepo, federationConflictRepo, federationTombstoneRepo, federationMetaRepo; // RepoDef<…>
export const federationRecordMachine, federationTombstoneMachine, federationStreamMachine;
export interface StreamRef { id: string; author: string }
export type StreamPolicy = (env: VerifiedEnvelope) => Result<StreamRef, AppError>;
export const authorStreamPolicy: StreamPolicy; // refuses /^classrup\.alpha\./ → VALIDATION_FAILED fields [{ path: 'type', code: 'STREAM_POLICY_EXCLUDED' }]
export interface AdmissionOptions { streamPolicy?: StreamPolicy; recordKeyOf?: (type: string, payload: unknown) => string | undefined; originRelay?: string; localPrincipal?: string }
export interface AdmissionScope { tenantId: string; now: number; repo<T, K extends string>(def: RepoDef<T, K>): Repo<T, K> }
export interface Outcome { cid: string; outcome: 'accepted'|'duplicate'|'buffered'|'quarantined'|'rejected'; code?: string; released: readonly string[]; conflictId?: string; tombstone?: { status: 'applied'|'pending_target'|'rejected'; expiresAt?: string } }
export interface SweepReport { dropped: readonly { cid: string; author: string; seq: number; fetch: readonly number[] }[]; counts: Record<'tombstonesApplied'|'purged'|'purgeOverdue'|'tombstonesExpired', number>; more: boolean }
export interface Admission {
  place(scope: AdmissionScope, env: VerifiedEnvelope): Promise<Outcome>;
  admit(scope: AdmissionScope, input: unknown): Promise<Outcome>;   // raw createdAt window first, then verifyEnvelope(input, { now }); any throw → FED_SIGNATURE_INVALID
  issue(scope: AdmissionScope, signer: StatementSigner, input: { type: string; payload: unknown; ext?: Readonly<Record<string, unknown>> }): Promise<Outcome>; // seq = head.seq+1, prev = head.cid via signEnvelope (envelope.ts:124-130); signer ≠ localPrincipal → FEDERATION_AUTHOR_NOT_OWNED; frozen → CONFLICT_STATE
  issueTombstone(scope: AdmissionScope, signer: StatementSigner, target: { cid: string } | { recordKey: string }, reason: TombstoneReason): Promise<Outcome>;
  sweep(scope: AdmissionScope): SweepReport;
  replay(scope: AdmissionScope): Promise<{ authors: number; repaired: number; frozen: readonly string[] }>;
  head(scope: Pick<AdmissionScope, 'repo'>, author: string): ChainHead;
  get(scope: Pick<AdmissionScope, 'repo'>, cid: string): StatementView | undefined;  // open streams' accepted rows only
  listByAuthor(scope: Pick<AdmissionScope, 'repo'>, author: string, q?: { cursor?: string; limit?: number }): Result<Page<StatementView>, AppError>;
  purgeAuthor(scope: AdmissionScope, author: string): Result<number, AppError>;      // explicit destructive user action, ≤500 rows per call
}
export function createAdmission(options?: AdmissionOptions): Admission;
export function recordScope(tx: Tx, tenantId: string, now: number): AdmissionScope; // Repo glue over tx.records
export function admitAll(storage: Storage, tenantId: string, now: number, inputs: readonly unknown[], admission: Admission): Promise<readonly Outcome[]>;
```
`AdmissionScope.repo` matches `WriteScope.repo` (`packages/kernel/src/storage/scope.ts:50-55`): bus handlers pass `ctx.tx.repo` and `ctx.clock.now()`; non-bus callers use `recordScope`, ~40 lines implementing `Repo` (`repo.ts:67-78`) over `tx.records` (`tx.ts:120-169`) because `writeRepo` is not exported (`packages/kernel/src/index.ts:109-110`). `admitAll` verifies outside, then runs one `storage.transaction` per envelope, never nested (`packages/kernel/src/storage/storage.ts:10-22`). `TombstoneReason`, `StatementView` (statement minus `envelope`), `FederationCode`, `LimitName` and `BackupCodecLike` are exported aliases.

`packages/federation/src/protocol/records/alpha-seam.ts`:
```ts
export const ALPHA_SUBJECT_TYPES: Readonly<Record<string, (payload: unknown) => string | undefined>>; // alpha.tombstone, bazaar.listing → listingId; alpha.reservation → holdId; alpha.want → own cid; alpha.proposal_revision|consent|withdrawal → subjectId
export const alphaStreamPolicy: StreamPolicy;   // StreamRef { id: `${author}\u0001${subject}`, author } for ALPHA_SUBJECT_TYPES; author stream otherwise
export function alphaBackupCodecs(admission: Admission): readonly BackupCodecLike[]; // { type, parse, validate?, indexes } per packages/vault/src/vault.ts:15-22
```
Under `alphaStreamPolicy` the head id is the stream id, so one alpha per-subject chain is one stream; `bazaar.publication` (`listings/index.ts:19`), `discovery.retained_listing` (`packages/discovery/src/search/index.ts:22,63-68`) and `mutiny.want` (`packages/mutiny/src/trade_proposals/repository.ts:18`) are never read, written or reinterpreted. No existing package imports the new modules and `packages/federation/src/index.ts` only appends exports (`apps/pwa/src/main.ts:5` keeps compiling). `alphaBackupCodecs` lets a later slice register the four record types with `openVault({ codecs })` (`vault.ts:35`), re-verifying stored envelopes and chain links like `validatePublicationRecord` (`listings/index.ts:185-198`). No `Migration` (`packages/kernel/src/storage/migrations.ts:8-13`) is needed (new types only); one is reserved for the deferred publication replay.

## 5. Threat model and failure handling

Threat | Handling | Result
---|---|---
Replay of an accepted cid | `known` → duplicate, nothing written | `duplicate`
Replay of a tombstoned cid, even after tombstone expiry | stub persists | `FEDERATION_TOMBSTONED`
Statement >180 d old or >5 min future | window on raw `createdAt` before crypto; a `next` becomes a stub | `FEDERATION_RECORD_TIME_INVALID`
Fork injection by a non-author | `verifyEnvelope` binds author to signature (`envelope.ts:119-120`) | `FED_SIGNATURE_INVALID`
Equivocation by author or stolen key (same seq/new cid, prev splice, stale seq/new content) | fork: both envelopes kept verbatim, incumbent re-labelled by CAS, stream frozen, ≤5 candidates stored, later floods stored nowhere | `quarantined`; later statements `CONFLICT_STATE {state:'frozen'}`
Buffer exhaustion (forged future seqs, many authors, huge envelopes) | gap ≤100, 50/author, 5000/tenant, 4 MiB/author, 64 MiB/tenant, 256 KiB/envelope; counters recounted at replay | `FEDERATION_BUFFER_FULL`, `FEDERATION_GAP_TOO_LARGE`, `FEDERATION_BATCH_TOO_LARGE`
Unverifiable garbage with distinct cids | nothing stored; one code for all parse/sig/cid failures (no oracle) | `FED_SIGNATURE_INVALID`
Third-party tombstones pre-registered for predicted cids | `pending_target` bounded 50/author, 5000/tenant, 24 h; author mismatch rejects the tombstone, not the target | `FEDERATION_TOMBSTONE_UNAUTHORIZED`
Tombstone for another author's record | author compared by signature, never payload | rejected, record stays `accepted`
Record-key tombstones | `recordKeyOf` injected by the composition root; touches only the issuer's rows | self-harm only
Device clock games | injected `now`, watermark, stored `bufferedUntil`; `claimedAt` never orders | forward jump expires early, backward never extends
Plaintext row edits between sessions | lazy hash-chain + head signature; buffered rows re-verified at release; counters recounted | `frozen/integrity`; deletions undetectable (§8)
Cross-author confusion (B's `prev` = A's cid, B reusing A's seq) | streams keyed by the signed `author`, heads independent | B forks only its own stream
Alpha statements routed by mistake | default policy refuses `classrup.alpha.*` | `VALIDATION_FAILED type/STREAM_POLICY_EXCLUDED`
Policy rejection as chain-breaking DoS | stub placement advances the head | chain continues
Concurrent tabs | writer fence and Web Lock (`indexeddb.ts`), CAS on head revision | `CONFLICT_REVISION`, `vault_superseded`

Freezes (stream hidden): forks, integrity failures. Rejects storing nothing: unverifiable input, buffer limits, frozen streams, alpha types. Rejects with a stub: time, size, tombstone policy on linked statements.

Codes reused, none added: `FED_SIGNATURE_INVALID`, `FEDERATION_RECORD_TIME_INVALID`, `FEDERATION_TOMBSTONED`, `FEDERATION_TOMBSTONE_UNAUTHORIZED`, `FEDERATION_AUTHOR_NOT_OWNED`, `FEDERATION_BATCH_TOO_LARGE` (`mod_records:267-281`), `FEDERATION_GAP_TOO_LARGE`, `FEDERATION_BUFFER_FULL` (`mod_dedup:71-72`), common `VALIDATION_FAILED`, `CONFLICT_STATE`, `CONFLICT_REVISION`, `NOT_FOUND` (`packages/kernel/src/errors/codes.ts:7-25`). No spec error row is added; `spec:check` ownership (`tools/specgen/validate.mjs:88-90,213`) and warnings are unchanged.

## 6. Test plan

Fixtures: real Ed25519 keys as in `tests/integration/mutiny-persistence.test.ts:22-30`; `createFakeClock('2026-11-04T10:00:00.000Z')`; authors X and Y, 120-statement chains; `fast-check` 4.10.2; one `IDBFactory` per test.

Test | Level, file | Scenario → expected
---|---|---
1 TEST-PS-087-09.T01 | unit, `relay_sync/dedup/dedup.test.ts` | spec example → `next`, `duplicate`, `buffer{missing:[7]}`, `fork prev_mismatch`, `reject GAP_TOO_LARGE`
2 TEST-PS-087-09.T03 | unit | gap 100/101; 50th/51st per author; 5000th/5001st; byte caps at limit and +1
3 TEST-PS-087-09.T05 | unit | X and Y arrivals permuted → identical per-author decisions
4 TEST-PS-087-09.T06 | unit | plain `Envelope` rejected at type level (`@ts-expect-error`); no storage import
5 TEST-PS-087-09.T07 | unit | rows at 23 h 59 m and 24 h; clock set back 2 d → only the 24 h row expires; watermark holds
6 TEST-PS-087-09.T08 | unit | `decide` 1000× identical; `drainOrder` twice → second empty
7 TEST-PS-087-09.T02 | property | permutations with duplicates of a 50-chain → final order = seq order; one `next` per seq
8 TEST-PS-087-09.T04 | property | random `prev` splices, duplicate seq with new cid → never `next`
9 TEST-PS-087-09.T09 | abuse | 10 000 forged future seqs → ≤50 buffered; payload is a throwing Proxy never touched
10 TEST-PS-084-09.T02 | unit, `protocol/records/records.test.ts` | V05/V07/V08/V09/V12 and oversize each violated → documented code; at most a stub stored
11 TEST-PS-084-09.T04 | property | random accept/gap/fork/tombstone/sweep sequences → only declared edges, terminal rows unchanged, `get` serves only open streams' accepted rows
12 TEST-PS-086-09.T01 | unit | E7a, E7b → one conflict, 2 candidates, `claimedAt` and `receivedAt` separate
13 TEST-PS-086-09.T11 | unit | E7b resent → same `conflictId`; 6th candidate → `CONFLICT_STATE`, 5 kept
14 TEST-PS-086-09.T02 | unit | tampered signature cannot open a conflict → `FED_SIGNATURE_INVALID`, nothing written
15 TEST-PS-084-09.T05 | integration, `tests/integration/federation-admission.test.ts` | seq 7 then 6 → `buffered`, then `accepted` with `released:[cid7]`, head 7
16 TEST-PS-084-09.T28 | integration | same author, subjects A/B interleaved seq 1..4, 3 last → one chain, both readable only after 3; alpha `bazaar.listing.publish` still writes `bazaar.publication` untouched
17 TEST-PS-084-09.T13 | integration | two seq-7 → both `quarantined`, author hidden, seq 8 → `CONFLICT_STATE`; rows 1..6 byte-identical before and after
18 TEST-PS-084-09.T06 | integration | buffered 7; +23 h 59 m kept; +24 h dropped `gap_timeout`, `fetch:[6]`; resend → buffered again
19 TEST-PS-084-09.T18 | integration | `issue` with own key accepted; another principal's signer → `FEDERATION_AUTHOR_NOT_OWNED`; same cid twice → `duplicate`, `released:[]`
20 TEST-PS-084-09.T27 | integration | accepted 1..3, buffered 5, Y forked, tombstone applied; close, reopen, `replay` → heads intact, seq 4 releases 5, Y frozen, resend `FEDERATION_TOMBSTONED`; row edited via `tx.records` → `frozen/integrity`
21 TEST-PS-084-09.T07 | integration, `tests/integration/federation-tombstone.test.ts` | owner tombstone → purged in the same transaction, `expiresAt = appliedAt + 180 d`
22 TEST-PS-084-09.T08 | abuse | resend tombstoned envelope → `FEDERATION_TOMBSTONED`; 181-day-old at head+1 → `FEDERATION_RECORD_TIME_INVALID` stub, head advanced, no content
23 TEST-PS-084-09.T09 | integration | tombstone before target → `pending_target`; +24 h → `applied`; target arrives → `tombstoned` stub
24 TEST-PS-084-09.T10 | abuse | Y tombstones X's cid → `FEDERATION_TOMBSTONE_UNAUTHORIZED`, X stays `accepted`, Y's head advanced by a stub
25 TEST-PS-084-09.T29 | integration | +180 d sweep deletes the tombstone row; stub remains; resend still `FEDERATION_TOMBSTONED`
26 TEST-PS-087-09.T03 | abuse (second `it`) | 5001 pending tombstones → `FEDERATION_BUFFER_FULL {buffer:'tombstone'}`
27 TEST-PS-084-09.T02 | negative (second `it`) | alpha want under default policy → `STREAM_POLICY_EXCLUDED`; under `alphaStreamPolicy` two `seq 1` wants by one author → two streams, no fork

Appended to `mod_records/module.spec.yaml` (append-only, valid `covers`, no new warning; scenario/expectation as rows 20, 16, 25): `T27 | integration | 06.R03,10.R02,03.R01 | …`, `T28 | integration | 03.R02,01.R01 | …`, `T29 | integration | 07.R03,03.R03 | …`.

## 7. Open questions resolved

1. *Do tombstones chain?* Yes: a tombstone is a signed statement at the author's next seq, so replay, ordering and freezing follow one rule set; a buffered tombstone purges nothing until released (≤24 h).
2. *Purge now or schedule?* cid targets purge in the apply transaction; record-key targets page through `purgeCursor` under a 24 h deadline because their row count is unbounded.
3. *Policy rejections of linked statements?* Stub and advance (§1): spec-compatible, removes a chain-breaking DoS.
4. *Hide the whole stream or only the candidates?* Candidates `quarantined`; the rest hidden through `head.state`, nothing is rewritten, no forked history is acted on.
5. *Hash every chain at open?* Lazy per-author verification: same guarantee before any use, bounded by that chain, no open-time pass.
6. *Seq ≤ head with unknown cid?* Fork (PS-087 responsibility 1): equivocation evidence.
7. *Code for a frozen stream?* `CONFLICT_STATE {state:'frozen', reason}`, the spec's code for undeclared transitions.
8. *Alpha stream id?* `${author}\u0001${subject}` via `alphaStreamPolicy`; default policy refuses alpha types.
9. *Oversize code?* `FEDERATION_BATCH_TOO_LARGE {limitBytes: 262144}`: PS-084 V03 assigns it to a single oversized envelope.
10. *Repo access without `writeRepo`?* Local `recordScope` glue implementing kernel `Repo`; bus handlers pass `ctx.tx.repo` unchanged; a kernel export is recommended later.

## 8. Honest limits

The layer establishes that stored statements form one signed, contiguous history per key and that content policy was applied; not that the author is honest, that anything was delivered, or that a peer deleted copied content (tombstones propagate deletion, they do not recall). One chain per did:key: a second device of the same person forks the stream until ADR-0013 sub-chains exist. Freezes are permanent in MVP; the only exit is `purgeAuthor`. Integrity checks detect edited rows, not deleted rows or tombstone rows; that needs slice B's authenticated encryption at rest. Origin-relay tombstones, origin fetch, bus events and relay provenance (`originRelay` is always `'local'`) are not established. No performance figure beyond the stated complexities; no "audited" or "secure" claim.
