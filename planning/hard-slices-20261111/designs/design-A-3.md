# Design A-3 — FED-3/FED-4 author streams: minimal faithful implementation on the existing kernel

Lens: the engineer who writes this next week. Four small repos, one pure decision module, one command, one sweep, no new kernel code, no new error codes. All paths are repo-relative to `/home/user/CLASSifiedisRUPTed`.

## 1. Summary and scope

An author stream is the per-`did:key` chain `seq 1..n` linked by `prev`. The layer sits strictly *after* `verifyEnvelope` (`packages/federation/src/envelope.ts:108-122`, the only signature authority) and *before* any domain module acts. It persists through kernel repos in the caller's tenant and runs inside the caller's transaction.

**MVP (this slice)**
- Contiguous admission → author head; duplicates by cid idempotent; gaps buffered ≤ 24 h (50/author, 5000/tenant, gap ≤ 100) and drained in seq order; expiry with typed reason `gap_timeout`; fork (`fork_seq` or `prev_mismatch`) freezes the author with ≤ 5 candidates retained, no overwrite; stale replays rejected (tombstoned cid, >180 d old, known cid, frozen stream).
- FED-4 tombstones `classrup.federation.tombstone/v1 {target, reason}` as ordinary chain statements, applied only when `tombstone.author === target.author`; immediate purge (well inside 24 h); `pending_target` for unseen targets; retention 180 d.
- Everything survives close/reopen because the only state is kernel records; `rebuildAuthor` recomputes a head from persisted rows.
- Bus surface `federationDefinitions()` plus storage-free pure functions; alpha `classrup.alpha.*` chains untouched behind an explicit type gate.

**Deferred, with reason**
- Origin-relay tombstones: no relay trust store exists (F11.S03.M01); `issuerKind: origin_relay` without pinned relay keys would be unverifiable authority. Explicit limit: `issuerKind` is always `author`.
- Fetch-from-origin before drop: no transport (F11.S02.M01). Expiry drops and names the missing seqs for a future fetcher.
- Fork resolution/unfreeze: needs review UI and origin-wins policy (PS-086); a fork freezes only the equivocating author's own stream, so nobody else is blocked.
- Signer-role registry V14 (`roleFor`): F11.S01.M01 does not exist; domain binding (`payload.ownerId === author`) stays in discovery/bazaar.
- Relay transport, metrics/log wiring, backup codecs for the new repos (merge step: `backupCodec(repo)` in `packages/vault/src/vault.ts:23-34` works unchanged on these defs).

## 2. Data model and formats

Kernel repos via `defineRepo` (`packages/kernel/src/storage/repo.ts:26-38`; type regex `<slug>.<entity>`, ≤ 4 append-only index slots). Rows are `StoredRecord` (`packages/kernel/src/storage/tx.ts:11-19`); revision lives on the row. Timestamps are `toIso(now)` strings (`packages/kernel/src/clock/clock.ts:14`), compared lexically like kernel leases (`tx.ts:183`). `seq16` = seq zero-padded to 16 digits so UTF-8 byte order (`packages/kernel/src/hash/canonical.ts:60`) equals numeric order. `\u0001` is the composite-key separator, as in the memory driver (`packages/kernel/src/storage/memory-driver.ts:39-40`).

### 2.1 `federation.record` — id = envelope cid
```json
{ "format": "classrup.federation.record/v1",
  "cid": "sha256-…", "author": "did:key:z6Mk…", "seq": 7, "prev": "sha256-…", "type": "classrup.bazaar.listing/v1",
  "status": "accepted",                      // buffered | accepted | quarantined | tombstoned
  "statusReason": null,                      // fork | gap_timeout | tombstoned | author_frozen
  "envelope": { "...verified envelope..." }, // null once purged
  "recordKey": "0195…",                      // optional, from recordKeyOf(envelope)
  "provenance": { "originRelay": "direct", "via": [], "receivedAt": "…Z", "verifiedAt": "…Z", "claimedAt": "<envelope.createdAt>" },
  "bufferedUntil": "…Z",                     // only while buffered; = receivedAt + 86400000 exactly
  "purgedAt": null }
```
Indexes (slot order fixed forever): `chain` = `author\u0001seq16` when status ∈ {accepted, tombstoned} else null; `pending` = same key when buffered else null; `expiry` = `bufferedUntil` when buffered else null; `key` = `author\u0001recordKey` when accepted and keyed else null. Bound per row: envelope ≤ 262 144 bytes JSON (`MAX_STATEMENT_BYTES`, PS-084 V03) plus ≤ 1 KiB metadata; `verifyEnvelope` already caps at 1 MiB/depth 32/50k nodes (`envelope.ts:4,47,75`).

### 2.2 `federation.author` — id = author did
```json
{ "format": "classrup.federation.author/v1", "author": "did:key:…", "seq": 7, "cid": "sha256-…",
  "status": "open",                          // open | frozen (frozen is terminal in MVP)
  "buffered": 2, "pendingTombstones": 0,
  "fork": { "seq": 5, "reason": "fork_seq", "candidates": ["sha256-a","sha256-b"], "detectedAt": "…Z" } }
```
`seq 0, cid null` before the first accepted statement. `candidates` ≤ 5 distinct cids (PS-086 01.R01); index `status`. ≤ 1 KiB.

### 2.3 `federation.tombstone` — id = tombstone envelope cid
```json
{ "format": "classrup.federation.tombstone/v1", "cid": "sha256-…", "issuer": "did:key:…", "issuerKind": "author",
  "target": "sha256-…", "targetKind": "cid",  // cid | key
  "reason": "owner_withdrawn", "envelope": { "…" },
  "status": "applied",                       // pending_target | applied | rejected (expired = row deleted)
  "appliedAt": "…Z", "expiresAt": "…Z",      // expiresAt = appliedAt + 180 d exactly
  "pendingUntil": null,                      // receivedAt + 24 h while pending_target
  "purged": 1, "partial": false }
```
Indexes: `target` = `issuer\u0001target` (authorization is part of the key: cid hashes `author`, so a third-party tombstone can never match a row); `due` = `pendingUntil` while pending, `expiresAt` while applied; `status`; `work` = `'partial'` when a key purge hit the 500-row page cap, else null.

Statement payload (zod, strict): `{ target: string (CID regex `^sha256-[a-f0-9]{64}$` → kind cid; else 1..200 chars, no `\p{Cc}` → kind key), reason: enum owner_withdrawn | account_deleted | listing_expired | moderation_removed | legal }`.

### 2.4 `federation.gauge` — singleton id `buffer`
`{ "format": "classrup.federation.gauge/v1", "buffered": 0, "pendingTombstones": 0, "highWaterNow": 0, "lastSweepAt": null }`. Written in every admitting transaction (CAS); `highWaterNow` is the monotonic clock guard (§3.5).

### 2.5 Limits (exported `FEDERATION_LIMITS`, PS-087 01.R03)
`BUFFER_WINDOW_MS 86_400_000`, `MAX_GAP 100`, `MAX_BUFFER_PER_AUTHOR 50`, `MAX_BUFFER_TOTAL 5000`, `MAX_FORK_CANDIDATES 5`, `MAX_RECORD_AGE_MS 180 d`, `TOMBSTONE_RETENTION_MS 180 d`, `PENDING_TOMBSTONE_MS 86_400_000`, `MAX_PENDING_TOMBSTONES_PER_AUTHOR 50`, `MAX_PENDING_TOMBSTONES_TOTAL 5000`, `MAX_BATCH 100`, `MAX_STATEMENT_BYTES 262_144`, `PURGE_PAGE 500`, `SWEEP_PAGE 500` (sweep command) / `100` (sweep-on-write).

## 3. Algorithms and state machines

### 3.1 Pure decision (PS-087, `packages/federation/src/relay_sync/dedup/index.ts`)
`decide(env, head, known, counts, now)` with fixed precedence duplicate → reject → fork → next → buffer (PS-087 03.R02):
1. `known(env.cid)` defined → `{kind:'duplicate', status}`.
2. `seq > head.seq + 1`: gap `seq - head.seq - 1 > 100` → reject `FEDERATION_GAP_TOO_LARGE`; `counts.author ≥ 50 || counts.total ≥ 5000` → reject `FEDERATION_BUFFER_FULL` (429, retryable).
3. `seq ≤ head.seq` (cid unknown) → `{kind:'fork', reason:'fork_seq'}`; `seq === head.seq + 1 && prev !== head.cid` → `{kind:'fork', reason:'prev_mismatch'}` (seq 1 has `prev null` and `head.cid null`, enforced by `envelope.ts:96`).
4. `seq === head.seq + 1 && prev === head.cid` → `{kind:'next'}`.
5. else `{kind:'buffer', missing:[head.seq+1 .. seq-1], until: toIso(now + 86_400_000)}`.
Deterministic in its arguments only (02.R01); O(1) plus O(gap) for `missing` (≤ 100). `drainStep(head, candidates)` returns `accept(cid) | fork(reason) | stop`; `expired(rows, now)` partitions by `bufferedUntil <= toIso(now)`; `verifyChain(envelopes[])` checks `seq` contiguity from 1 and `prev` linkage, O(n) — used by rebuild/import (10.R02).

### 3.2 Record admission (one transaction, `streams.ts`)
Cheapest first; nothing is stored before step 7:
1. JSON size > 262 144 → `FEDERATION_BATCH_TOO_LARGE`.
2. `verifyEnvelope(input, { now })` throws → `FED_SIGNATURE_INVALID` (params `{stage:'verify'}`; the primitive's message is not parsed).
3. `isStreamType(type)` false → `VALIDATION_FAILED` field `type/UNSUPPORTED_STREAM_TYPE` (the alpha gate, §4.4); tombstone payload parse failure → `VALIDATION_FAILED`.
4. `now - Date.parse(createdAt) > 180 d` → `FEDERATION_RECORD_TIME_INVALID` (future skew is `verifyEnvelope`'s +5 min, `envelope.ts:115`).
5. Author `status === 'frozen'` and cid unknown → `CONFLICT_STATE` params `{state:'frozen', author, forkSeq}`.
6. V09: `tombstone.query({where:{target: author\u0001cid}})` (or `author\u0001recordKey`) with status pending/applied → `FEDERATION_TOMBSTONED`; a matched pending tombstone becomes `applied`.
7. `decide(...)` with `known = record.get(cid)?.status`, head and counts from the author row and gauge:
   - `duplicate` → no write, no event. `reject` → outcome `rejected` with the code, no write. `fork` → §3.4.
   - `next` → put record `accepted` (`expectedRevision 0`), author head ← (seq, cid), tombstone effect if applicable (§3.3), then drain: for `s = head.seq + 1, …`: `candidates = record.query({where:{pending: author\u0001seq16(s)}, limit: 51})`; none → stop; exactly one with `prev === head.cid` → release (status `accepted`, or `tombstoned` stub when purged while buffered or a pending tombstone now matches), counters−−, emit, tombstone effect, continue; otherwise freeze (§3.4) and stop. Each release is one CAS `put`.
   - `buffer` → put record `buffered` with `bufferedUntil`; author.buffered++, gauge.buffered++.
All writes go through `repo.put(id, data, {expectedRevision})` (`repo.ts:73`, CAS `tx.ts:113-118`); a create follows a `get(cid)` miss in the same serialized transaction (`packages/kernel/src/storage/storage.ts:197-229`), so content is never overwritten.

### 3.3 Tombstone effect (once the tombstone statement is accepted)
Target `cid`, `row = record.get(target)`: absent → `pending_target`, `pendingUntil = now + 24 h`, author/gauge `pendingTombstones++` (`FEDERATION_BUFFER_FULL` params `{kind:'pending_tombstone'}` above 50/5000); `row.author !== issuer` → the statement is **rejected** `FEDERATION_TOMBSTONE_UNAUTHORIZED` before any write (chain not advanced); accepted → `tombstoned`, `envelope null`, `purgedAt`, `key` index cleared; buffered → content nulled, row stays buffered and drains as a stub; quarantined → not purged (fork evidence), tombstone `applied` with `purged 0`; tombstoned → idempotent. Target `key`: `applied` at once; purge `record.query({where:{key: issuer\u0001key}, limit: 500})`, `nextCursor` → `partial true`, finished by the sweep. `expiresAt = appliedAt + 180 d`; emits `federation.tombstone.applied`.

### 3.4 Freeze
`author.status ← 'frozen'`, `fork = {seq, reason, candidates: [acceptedCidAtSeq?, ...newCids].slice(0, 5)}`; the accepted row at that seq → `quarantined/fork` (envelope kept); new candidates stored `quarantined/fork` while candidates < 5 (a 6th is not stored: `retained:false`); involved buffered rows leave the buffer. Head `(seq, cid)` and later accepted rows are unchanged; readers consult `author.status` (commitment modules freeze; public projections may keep earlier seqs). Re-delivery of a candidate is `duplicate` (PS-086 06.R01).

### 3.5 Sweep (`sweep(now, page)`)
`effectiveNow = max(now, gauge.highWaterNow)` so a backwards clock never extends a window (PS-087 T07); the high-water mark is rewritten. Bounded by `page`: (a) `record.query({where:{expiry:{lte: iso}}, orderBy:'expiry'})` → `repo.remove` (`repo.ts:75`), counters−−, report `{cid, author, seq, reason:'gap_timeout', missing}`; (b) `tombstone.query({where:{due:{lte: iso}}})`: pending → `applied`, applied → delete row and its stub; (c) `work eq 'partial'` → continue key purges; (d) when `more === false`, recompute `gauge.buffered` from the `expiry` index (self-healing). Returns `{dropped[], applied, expired, more}`. Complexity: a memory-driver query filters and sorts the tenant's rows of one type, O(N log N) (`memory-driver.ts:161-169`); admission issues ≤ 4 queries plus ≤ 51 drain queries; a sweep page ≤ 3 queries plus ≤ 500 puts.

### 3.6 State machines
FederatedRecord: `received(virtual) → accepted | buffered | quarantined | rejected(not stored)`; `buffered → accepted | tombstoned(stub) | dropped(row removed) | quarantined`; `accepted → quarantined | tombstoned`; `tombstoned → (deleted when its tombstone expires)`. Terminal: `tombstoned`, `dropped`, `rejected`, and in MVP `quarantined`. Guards are the decide kinds, tombstone authority and limits. Author: `open → frozen` (terminal). Tombstone: `received → applied | pending_target | rejected`; `pending_target → applied` (target seen by issuer, or 24 h); `applied → expired(deleted)`. Any other transition is a programmer error (`CONFLICT_STATE` returned, never thrown).

## 4. Public API

Files (catalog paths from `planning/modules.yaml:98,101`; cross-module imports target `index.ts` per `tools/deps/deps.mjs:42`):
- `packages/federation/src/relay_sync/dedup/index.ts` — pure PS-087 library.
- `packages/federation/src/protocol/records/{errors,repos,streams,tombstones,definitions,index}.ts` — PS-084/PS-086 persistence and bus surface.
- `packages/federation/src/testing/fixtures.ts` — WebCrypto `StatementSigner` (`packages/security/src/cryptography/index.ts:41-45`) and chain builder, modelled on `tests/integration/mutiny-persistence.test.ts:23-31`; imports only `@classrup/security` and `../envelope.ts`.
- `packages/federation/src/index.ts` — add exports below (append only).

```ts
// relay_sync/dedup/index.ts (pure)
export const FEDERATION_LIMITS: Readonly<{ BUFFER_WINDOW_MS: 86_400_000; MAX_GAP: 100; MAX_BUFFER_PER_AUTHOR: 50; MAX_BUFFER_TOTAL: 5000; /* …§2.5 */ }>;
export interface ChainHead { readonly seq: number; readonly cid: string | null }
export type KnownStatus = 'buffered' | 'accepted' | 'quarantined' | 'tombstoned';
export type Decision = { kind: 'duplicate'; status: KnownStatus } | { kind: 'reject'; code: 'FEDERATION_GAP_TOO_LARGE' | 'FEDERATION_BUFFER_FULL' }
  | { kind: 'fork'; reason: 'fork_seq' | 'prev_mismatch' } | { kind: 'next' } | { kind: 'buffer'; missing: readonly number[]; until: string };
export function decide(env: VerifiedEnvelope, head: ChainHead, known: (cid: string) => KnownStatus | undefined, counts: { author: number; total: number }, now: number): Decision;
export function drainStep(head: ChainHead, candidates: readonly Pick<Envelope, 'cid' | 'seq' | 'prev'>[]): { kind: 'accept'; cid: string } | { kind: 'fork'; reason: 'fork_seq' | 'prev_mismatch' } | { kind: 'stop' };
export function expired<T extends { bufferedUntil: string }>(rows: readonly T[], now: number): { drop: T[]; keep: T[] };
export function verifyChain(envelopes: readonly Pick<Envelope, 'cid' | 'seq' | 'prev' | 'author'>[]): Result<ChainHead, AppError>; // VALIDATION_FAILED seq/CHAIN_BROKEN

// protocol/records/errors.ts — codes already defined in PS-084/PS-087; defineErrors: packages/kernel/src/errors/app-error.ts:59-70
export const federationErrors = defineErrors({ FED_SIGNATURE_INVALID: { status: 400, retryable: false }, FEDERATION_BATCH_TOO_LARGE: { status: 413, retryable: false },
  FEDERATION_RECORD_TIME_INVALID: { status: 422, retryable: false }, FEDERATION_TOMBSTONED: { status: 410, retryable: false }, FEDERATION_TOMBSTONE_UNAUTHORIZED: { status: 403, retryable: false },
  FEDERATION_GAP_TOO_LARGE: { status: 422, retryable: false }, FEDERATION_BUFFER_FULL: { status: 429, retryable: true } });
// protocol/records/repos.ts
export const federationRecordRepo: RepoDef<FederationRecord, 'chain' | 'pending' | 'expiry' | 'key'>;
export const federationAuthorRepo: RepoDef<FederationAuthor, 'status'>;
export const federationTombstoneRepo: RepoDef<FederationTombstone, 'target' | 'due' | 'status' | 'work'>;
export const federationGaugeRepo: RepoDef<FederationGauge, never>;
export const TOMBSTONE_TYPE = 'classrup.federation.tombstone/v1'; export const tombstonePayloadSchema: z.ZodType<{ target: string; reason: TombstoneReason }>;
// protocol/records/streams.ts — scope is exactly a handler's ctx.tx (WriteScope, packages/kernel/src/storage/scope.ts:100-105)
export interface StreamScope { readonly repo: WriteScope['repo'] }
export interface StreamOptions { readonly isStreamType: (type: string) => boolean; readonly recordKeyOf?: (env: VerifiedEnvelope) => string | undefined }
export type AdmitOutcome = { outcome: 'accepted'; cid: string; seq: number; released: readonly { cid: string; seq: number; status: 'accepted' | 'tombstoned' }[]; tombstone?: TombstoneEffect }
  | { outcome: 'duplicate'; cid: string; status: KnownStatus } | { outcome: 'buffered'; cid: string; seq: number; missing: readonly number[]; bufferedUntil: string }
  | { outcome: 'fork'; cid: string; seq: number; reason: 'fork_seq' | 'prev_mismatch'; candidates: readonly string[]; retained: boolean }
  | { outcome: 'rejected'; cidPrefix: string; code: string; error: AppError };
export function createAuthorStreams(scope: StreamScope, opts: StreamOptions): {
  admit(env: VerifiedEnvelope, provenance: { originRelay: string; via: readonly string[] }, now: number): AdmitOutcome; // sync; verify beforehand
  sweep(now: number, page?: number): SweepReport;
  head(author: string): { seq: number; cid: string | null; status: 'open' | 'frozen'; buffered: number; fork?: ForkEvidence };
  get(cid: string): StoredRecord<FederationRecord> | undefined;                                   // any status; callers filter
  listAccepted(author: string, q?: { cursor?: string; limit?: number }): Result<Page<FederationRecord>, AppError>; // chain range, seq asc
  rebuildAuthor(author: string, now: number): Result<FederationAuthor, AppError>;                 // head = last chain row; buffered = pending count
  nextPosition(author: string): { seq: number; prev: string | null };                             // signing seam: head.seq + 1 / head.cid
};
export async function admitInput(streams, input: unknown, provenance, now, verify = verifyEnvelope): Promise<AdmitOutcome>; // steps 1-2, then admit()
// protocol/records/definitions.ts — same shape as discoveryDefinitions (packages/discovery/src/search/index.ts:37)
export interface FederationOptions { readonly verifyEnvelope?: typeof verifyEnvelope; readonly isStreamType?: (type: string) => boolean; readonly recordKeyOf?: StreamOptions['recordKeyOf'] }
export function federationDefinitions(options?: FederationOptions): { receive; sweep; head; get; listByAuthor; all: readonly AnyDefinition[] };
```
Commands (module `F11.S01.M02`; names and capabilities from PS-084 lines 210-246; capability reuse as in `packages/bazaar/src/listings/index.ts:114,161`):
- `federation.record.receive` cap `federation.record.receive`, `idempotent: true` (bus replays the same key/body for 24 h, `packages/kernel/src/bus/bus.ts:35,171-190`), input `z.strictObject({ envelopes: z.array(z.unknown()).min(1).max(100), source: z.string().min(1).max(120).default('direct') })`, output `{ results: AdmitOutcome[] in request order, swept }`. Per-envelope failures are values, so accepted neighbours commit. Runs `sweep(now, 100)` first. Emits `federation.record.accepted` P0 `{recordId, cid, type, author, seq, originRelay, local: source === 'local'}`, `federation.record.rejected` P0 `{cidPrefix(12), peerId, code, reason, suppressedCount?}` (≤ 20 per batch) and `federation.tombstone.applied` P0 `{tombstoneId, tombstoneCid, targetCid?, targetRecordKey?, author, reason, expiresAt}` via `defineEvent` (`packages/kernel/src/events/envelope.ts:46`) and `ctx.emit`.
- `federation.record.sweep` cap `federation.record.receive`, `idempotent: false`, input `{}` → `SweepReport` (page 500); roots call it on a timer, mirroring `runRetentionSweep` (`packages/kernel/src/storage/maintenance.ts:38`).
- Queries: `federation.record.head {author}` cap `federation.record.read_head` (`author === ctx.actor.id` else `FEDERATION_AUTHOR_NOT_OWNED`); `federation.record.get {cid}` cap `federation.record.read_public` → accepted only, else `NOT_FOUND`; `federation.record.list_by_author {author, cursor?, limit ≤ 50}` cap `federation.record.read_public` → `{ head, items }`.

### 4.4 Alpha compatibility seam
`isStreamType` defaults to `type.startsWith('classrup.federation.')`; `classrup.alpha.*`, `classrup.bazaar.listing/v1` (per-subject `nextSeq`, `packages/bazaar/src/listings/index.ts:50-56,97,122`) and mutiny statements are refused by `receive` (`VALIDATION_FAILED type/UNSUPPORTED_STREAM_TYPE`), so `discovery.listing.retain` (`packages/discovery/src/search/index.ts:38-81`) and mutiny ingest keep their paths and on-disk types. Later routing is two root changes, no package edits: `signProjection` takes `{seq, prev}` from `nextPosition(author)` instead of `nextSeq`, and the root calls `federation.record.receive` before `discovery.listing.retain`, treating non-`accepted` outcomes as not yet visible. No migration is needed: the four types are new and alpha rows are never read or rewritten; `runMigrations` (`packages/kernel/src/storage/migrations.ts:35-50`) remains available for a later rebuild step (`rebuildAuthor` is idempotent).

## 5. Threat model and failure handling

| Case | Handling | Result |
|---|---|---|
| Forged signature / cid / malformed envelope | `verifyEnvelope` only | `FED_SIGNATURE_INVALID`, nothing stored |
| Replay of a delivered envelope (any relay, any order) | cid lookup first | `duplicate`, no write, no event |
| Resurrection of tombstoned content; envelope > 180 d old | V09 index `(issuer, target)`; V08 | `FEDERATION_TOMBSTONED` / `FEDERATION_RECORD_TIME_INVALID` |
| Equivocation (two cids at one seq) or splice (`prev` ≠ stored cid) | `fork_seq` / `prev_mismatch` | author frozen, ≤ 5 candidates kept, nothing overwritten, later statements `CONFLICT_STATE`; only the equivocator's stream is affected |
| Forged future seqs to pin storage | gap ≤ 100, 50/author, 5000/tenant, 262 144 B each | `FEDERATION_GAP_TOO_LARGE` / `FEDERATION_BUFFER_FULL` (429, retryable); worst case 5000 × 256 KiB |
| Withholding relay (predecessor never arrives) | 24 h window on stored `bufferedUntil` | dropped `gap_timeout` with `missing[]`; resubmission allowed |
| Third-party tombstone | authority = `tombstone.author === row.author`; index key `issuer\u0001target` | `FEDERATION_TOMBSTONE_UNAUTHORIZED`; a pending third-party tombstone can never match (cid binds author) |
| Clock claims / device clock jumps | `claimedAt` is a claim; `receivedAt` local; `highWaterNow` guard | backwards jump never extends windows; forward jump only expires early |
| Oversized or deep JSON | 262 144 B admission cap; 1 MiB/depth 32/50k nodes in verify | `FEDERATION_BATCH_TOO_LARGE` |
| Batch replay | bus idempotency key (`bus.ts:102-108`) | stored results, no re-emission |
| Concurrent tabs / lost update | serialized storage, CAS, IndexedDB writer fence (`packages/kernel/src/storage/indexeddb.ts:78-104`) | superseded tab fails closed |
| Author signs a tombstone for someone else's cid | statement rejected, chain not advanced | author's later seqs buffer then drop (self-inflicted) |

Forks **freeze** (state and evidence kept); everything else **rejects without storage**. Programmer errors (schema mismatch in `put`, bad revision) throw, roll back the whole transaction (`storage.ts:214-222`) and surface as `INTERNAL`.

## 6. Test plan

Spec rows reused as-is (`TEST-PS-NNN-09.Tnn` in titles). Two rows appended to `11_Federation/01_protocol/mod_records/module.spec.yaml` after T24 (append only, valid refs, no new warnings — warnings come only from `tools/specgen/validate.mjs:67,213,216,225`):
- `T27 | integration | 06.R03,01.R01,03.R02 | close and reopen IndexedDB storage holding accepted, buffered, frozen and pending-tombstone state, then deliver the missing predecessor | heads, buffers, freeze and pending tombstones are identical after reopen; the buffered record is released in seq order`
- `T28 | integration | 06.R01,03.R02,01.R01 | receive seq 1..5 in order, then re-send seq 3 and the whole batch | accepted once with head 5; re-sends return duplicate, emit no event and change no revision`

Fixtures: WebCrypto Ed25519 signer (no scrypt), authors X and Y, fixed clock `2026-11-04T10:00:00.000Z` via `createTestKernel` (`packages/kernel/src/testing/harness.ts:80-126`), `kernel.cmd('federation.record.receive', …)`, state read with `kernel.storage.read`.

**Unit — `packages/federation/src/relay_sync/dedup/dedup.test.ts`** (fixtures cast `as VerifiedEnvelope`)
1. `TEST-PS-087-09.T01` decide: next, duplicate, buffer `{missing:[7], until: +24 h}`, fork prev_mismatch, fork_seq, reject gap — as the spec example.
2. `TEST-PS-087-09.T03` boundaries: gap 100 buffer / 101 `FEDERATION_GAP_TOO_LARGE`; author 49 / 50 and total 4999 / 5000 → `FEDERATION_BUFFER_FULL`.
3. `TEST-PS-087-09.T05` interleaving author Y leaves X's decisions byte-identical.
4. `TEST-PS-087-09.T07` `expired`: 23 h 59 min kept, 24 h 00 dropped; clock set back 5 h drops nothing new.
5. `TEST-PS-087-09.T08` 1000 repeated `decide` calls identical; second `drainStep` yields `stop`; inputs stay frozen.
6. `TEST-PS-087-09.T06` exports are pure functions returning values/`Result`.

**Property (fast-check 4.10.2, `import fc from 'fast-check'` as in `packages/kernel/src/machine/machine.test.ts:1`)**
7. `TEST-PS-087-09.T02` 50 signed envelopes; `fc.shuffledSubarray(indices, {minLength: 50, maxLength: 50})` with `fc.array(fc.integer({min:0,max:49}))` duplicates interleaved, through `receive`: `listAccepted` order equals seq order, head 50, exactly one `accepted` event per seq, `author.buffered === 0`, counters equal index counts.
8. `TEST-PS-087-09.T04` random splices (`prev` swapped for another or random cid) and re-signed seqs: never `next`; always `fork` or `reject`; afterwards `author.status === 'frozen'`, candidates ≤ 5.
9. `TEST-PS-084-09.T04` random programs (chain, forks, tombstones, duplicates, clock advances, sweeps): per-cid status histories follow only §3.6 edges; terminal states never change; `get` serves only `accepted`.

**Integration — `tests/integration/federation-author-streams.test.ts`**
10. `TEST-PS-084-09.T28` as the row.
11. `TEST-PS-084-09.T05` one author, subjects A/B/C by `recordKey`: seq 3 (A) before seq 2 (B) → `buffered`, `missing [2]`; seq 2 → accepted with `released [{seq:3}]`; events in seq order.
12. `TEST-PS-084-09.T13` + `TEST-PS-086-09.T01` second cid at accepted seq 2 (subject C) → `fork`; both rows `quarantined`; head unchanged; `get` → `NOT_FOUND` for both; two candidates.
13. `TEST-PS-086-09.T11` re-delivering a candidate → `duplicate`; a third → appended; a sixth → `retained:false`.
14. Frozen stream: seq 4 by the forked author → `CONFLICT_STATE {state:'frozen'}`; author Y unaffected.
15. Tampered envelope → `FED_SIGNATURE_INVALID`; `classrup.alpha.want/v1` → `VALIDATION_FAILED type/UNSUPPORTED_STREAM_TYPE` while `discovery.listing.retain` still retains an alpha listing in the same kernel (seam proof).
16. `TEST-PS-084-09.T15` batch of 100 with 3 invalid → 97 accepted, 3 rejected with codes, request order, 97 + 3 events; idempotent replay returns the same results and no events.

**`tests/integration/federation-gap-expiry.test.ts`**
17. `TEST-PS-084-09.T06` seq 7 buffered; `clock.advance(24 h − 1 ms)` + sweep → buffered; `+1 ms` → `dropped gap_timeout`, counters 0, row gone; resubmitting seq 7 buffers again.
18. `TEST-PS-087-09.T09` 10 000 forged seqs through pure `decide` and 200 through `receive`: 50 buffered rows, then `FEDERATION_BUFFER_FULL` (429, retryable); `recordKeyOf` spy never sees a refused payload.
19. `TEST-PS-087-09.T07` bus-level: clock set back 5 h after buffering, sweep drops nothing; forward 25 h → dropped.

**`tests/integration/federation-tombstones.test.ts`**
20. `TEST-PS-084-09.T07` author tombstone (seq 2 targeting seq 1): record `tombstoned`, `envelope null`, `purgedAt = now`; tombstone `applied`, `expiresAt = appliedAt + 180 d` exactly; event payload as spec.
21. `TEST-PS-084-09.T08` re-sending the purged envelope → `FEDERATION_TOMBSTONED`; 181 d old → `FEDERATION_RECORD_TIME_INVALID`; 180 d − 1 s accepted.
22. `TEST-PS-084-09.T09` tombstone before target → `pending_target`; target within 24 h → `FEDERATION_TOMBSTONED`, tombstone `applied`; variant: sweep applies at 24 h, later target rejected.
23. `TEST-PS-084-09.T10` Y tombstones X's cid → `FEDERATION_TOMBSTONE_UNAUTHORIZED`, X's record stays `accepted`; Y's pending tombstone for an unseen X cid never matches.
24. Key tombstone purges X's 3 of 5 accepted rows with that key; a later X statement with the key → `FEDERATION_TOMBSTONED`; Y's rows untouched.
25. Retention: sweep at `appliedAt + 180 d` deletes tombstone and stub; at `−1 ms` keeps both.

**`tests/integration/federation-reopen.test.ts`** (fake-indexeddb `IDBFactory`, `openIndexedDbStorage` with `fakeLocks` from `packages/kernel/src/storage/indexeddb.test.ts:24-37`, bus built like `apps/pwa/src/main.ts`)
26. `TEST-PS-084-09.T27` as the row, plus: `rebuildAuthor` after removing the author row with `tx.records.remove` reproduces head and counters; `verifyChain(listAccepted)` → ok.

## 7. Open questions resolved

1. Tombstone as chain statement, not a side channel: it carries `seq/prev` by format, so admission, buffering and forks apply unchanged.
2. Unauthorized tombstone → reject the statement (no chain advance) rather than accept-and-ignore: simpler, harms only its author.
3. A fork quarantines the accepted row at that seq, keeps the head and later seqs: evidence and chain positions survive; commitment modules freeze on `author.status`.
4. Counters in author/gauge rows (transactional, O(1)) instead of counting queries; the sweep reconciles the gauge and a property test checks the invariant.
5. Sweep on write plus a command, no scheduler in the package: the PWA already drives timeouts through commands (`mutiny.coordination.refresh`).
6. One transaction per `receive` batch: the bus gives one; rejections are values so neighbours are independent; roots may send one envelope per call.
7. Admission cap 262 144 B while `verifyEnvelope` allows 1 MiB: bounds buffered storage without touching the primitive.
8. `highWaterNow` guard instead of a monotonic clock port: none exists; the guard is persisted and testable.
9. Dropped rows are deleted, not stubbed: a drop is not a verdict on content; resubmission after the predecessor arrives must work.

## 8. Honest limits

Not established: relay transport, origin-relay tombstones, fetch-before-drop, fork resolution or unfreezing, signer-role binding (a valid signature by `author` is still not domain authority; ownership checks stay in discovery/bazaar/mutiny), multi-device authors (one chain per `did:key`), purge of quarantined evidence, literal per-envelope transactions, metrics/log wiring, backup codecs for the new repos (root wiring), the 5-minute sweep cadence (callers schedule). Query cost is O(N log N) per call on the memory/IndexedDB drivers. Freezing proves equivocation by a key, not dishonesty of a person; tombstones propagate deletion and cannot recall copies already fetched (PRV-6).
