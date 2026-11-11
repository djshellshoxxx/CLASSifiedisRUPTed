# Design A-1 — FED-3/FED-4 author-stream admission (protocol-correctness lens)

Repo `/home/user/CLASSifiedisRUPTed`, branch `claude/difficult-project-parts-dcqlup`. All paths below are repo-relative; `file:line` cites the code this design depends on.

## 1. Summary and scope

One persistent, kernel-backed admission layer in `packages/federation` turns a verified CTR-FED-001 envelope into exactly one of `accepted | duplicate | buffered | quarantined | rejected` for a **stream** (default: the author `did:key`). Every decision is a pure function of persisted rows plus an injected `now`; nothing lives in memory across calls, so close/reopen cannot change behaviour.

**MVP**
- Pure decision library (`decide/drainOrder/expired/verifyChain`, PS-087) with the fixed constants 24 h / 100 ahead / 50 per stream / 5000 per tenant.
- Persistence over kernel repos (`defineRepo` `packages/kernel/src/storage/repo.ts:26-38`) through the `WriteScope.repo` port (`packages/kernel/src/storage/scope.ts:50-55`), so the same code runs inside a bus command (`ctx.tx`) or standalone.
- Contiguous `seq/prev` chains, bounded gap buffer with typed expiry, fork detection that **freezes** the stream and retains both envelopes, cid-idempotent duplicates, stale-replay rejection, `classrup.federation.tombstone/v1` accepted only from the target's author, purge in the same transaction (24 h deadline met at 0 ms), 180-day retention, sweeps.
- Integration seam: `streamKeyOf` / `recordKeyOf` resolvers; nothing routes `classrup.alpha.*` or alpha `classrup.bazaar.listing/v1` publication chains through the layer.

**Deferred (with reason)**
- Origin-relay tombstone issuers: no relay key registry exists (PS-091); `issuerKind` is always `author`, any other issuer is `FEDERATION_TOMBSTONE_UNAUTHORIZED`.
- Origin fetch at gap expiry (PS-088): no transport; the sweep reports missing seqs instead.
- Fork *resolution* (PS-086 origin-wins/review): needs a review UI and relay binding; a frozen stream stays frozen with both candidates retained.
- `federation.record.publish` and payload allowlists (PS-083): author ownership against an identity document (F07.S02) does not exist yet.
- Rejection log rows and metrics: the PWA sends no telemetry; outcomes are returned, not persisted.

## 2. Data model and formats

Rows are plain JSON in the caller's tenant (`StoredRecord` `packages/kernel/src/storage/tx.ts:11-19`); revision/CAS come from `tx.records.put` (`tx.ts:126-144`, `casCheck` `:113-118`). Index values are strings compared byte-wise (`compareUtf8` `packages/kernel/src/hash/canonical.ts:60-70`, used by `memory-driver.ts:94-122`), so `seq` is indexed as a 16-digit zero-padded decimal (`seq16`; seq is a safe integer, `packages/federation/src/envelope.ts:95`). Repo types follow `repo.ts:20`.

```jsonc
// federation.record — id = cid; envelope ≤ 262144 canonical bytes (PS-084 V03).
{ "v": 1, "stream": "did:key:z6Mk…", "author": "did:key:z6Mk…", "seq": 7, "prev": "sha256-…"|null,
  "type": "classrup.bazaar.listing/v1", "recordKey": "0192…"|null,
  "envelope": { /* VerifiedEnvelope */ } | null,               // null once purged
  "status": "accepted"|"buffered"|"quarantined"|"tombstoned",  // rejected/dropped rows never stored
  "statusReason": "fork"|"tombstoned"|null, "forkSeq": 7|null,
  "receivedAt": "2026-…Z", "verifiedAt": "2026-…Z", "claimedAt": "<envelope.createdAt>",
  "bufferedUntil": "2026-…Z"|null, "purgedAt": "2026-…Z"|null,
  "source": "direct"|"<relayId ≤ 128 chars>", "via": [] }
// indexes (slot order, append-only): stream | status | bufferedUntil | streamSeq = `${stream}\u0000${seq16}`

// federation.chain — id = `${stream}\u0000${seq16}`, create-only (expectedRevision 0): the uniqueness fence
{ "v": 1, "cid": "sha256-…", "stream": "…", "seq": 7 }

// federation.stream — id = stream key
{ "v": 1, "author": "did:key:…", "headSeq": 7, "headCid": "sha256-…"|null,
  "status": "open"|"forked", "forkSeq": 7|null, "buffered": 3 }

// federation.fork — id = `${stream}\u0000${seq16}` (PS-086 ConflictRecord, ≤ 5 candidates)
{ "v": 1, "kind": "fork_seq"|"prev_mismatch", "stream": "…", "author": "…", "seq": 7,
  "candidates": [ { "cid": "sha256-…", "receivedAt": "…", "source": "direct", "envelopeStored": true } ],
  "detectedAt": "…", "status": "open" }

// federation.tombstone — id = tombstone envelope cid
{ "v": 1, "author": "did:key:…", "issuerKind": "author", "reason": "owner_withdrawn",
  "target": { "kind": "cid", "value": "sha256-…" } | { "kind": "recordKey", "value": "<≤256 chars>" },
  "status": "pending_target"|"applied"|"rejected", "code": "FEDERATION_TOMBSTONE_UNAUTHORIZED"|null,
  "appliedAt": "…"|null, "expiresAt": "<appliedAt + 180 d>"|null, "pendingUntil": "<receivedAt + 24 h>"|null,
  "purged": true|false }
// indexes: status | target = `cid:<cid>` or `key:${author}\u0000${recordKey}` | expiresAt | pendingUntil

// federation.meta — id "tenant": { "v": 1, "bufferedTotal": 0, "streams": 0, "clockHighWater": "2026-…Z" }
```

Tombstone statement (payload is strict; unknown keys reject):

```json
{ "v": 1, "type": "classrup.federation.tombstone/v1", "author": "did:key:…", "seq": 9, "prev": "sha256-…",
  "payload": { "target": "sha256-<64 hex>" | "<recordKey ≤ 256 chars, no control chars>", "reason": "owner_withdrawn|account_deleted|listing_expired|moderation_removed|legal" },
  "ext": {}, "cid": "sha256-…", "sig": "…" }
```

Bounds (exported constants in `relay_sync/dedup/index.ts`): `GAP_WINDOW_MS = 86_400_000`, `MAX_GAP_AHEAD = 100`, `MAX_BUFFERED_PER_STREAM = 50`, `MAX_BUFFERED_PER_TENANT = 5000`, `MAX_FORK_CANDIDATES = 5`, `MAX_RECORD_ENVELOPE_BYTES = 262_144`, `MAX_BATCH = 100`, `MAX_STREAMS_PER_TENANT = 10_000`, `MAX_RECORD_AGE_MS = 180 d`, `TOMBSTONE_RETENTION_MS = 180 d`, `TOMBSTONE_PENDING_MS = 24 h`, `SWEEP_PAGE = 500`. Worst case: 5 × 256 KiB evidence per frozen stream; 5000 × 256 KiB buffered per tenant.

Migration `federation:0001_streams_v1` (`Migration` `packages/kernel/src/storage/migrations.ts:8-13`, `runMigrations` `:35-50`) only records the schema marker; every row carries `v: 1` and an unknown `v` fails closed (`VALIDATION_FAILED`).

## 3. Algorithms and state machines

### 3.1 Stream state machine (`federation.stream`)

| State | Event | Guard | Next | Effect |
|---|---|---|---|---|
| open | `next` | `seq = headSeq+1 ∧ (seq=1 ? prev=null : prev=headCid)` | open | chain row create (CAS 0), record accepted, head advanced, drain |
| open | `fork` | second distinct cid at an accepted/buffered seq, or `prev ≠ cidAt(seq-1)` | **forked** (terminal in MVP) | fork row (≤5), candidates quarantined, buffered rows deleted with reason `fork`, `buffered := 0` |
| open | `buffer` | `headSeq+1 < seq ≤ headSeq+1+100 ∧ counts < limits` | open | record buffered, `bufferedUntil = effNow + 24 h`, counters +1 |
| forked | `fork` | `seq = forkSeq ∧ cid unknown ∧ candidates < 5` | forked | candidate appended (quarantined row) |
| forked | anything else | — | forked | `CONFLICT_STATE {state:'forked', forkSeq}`; nothing stored |

Record machine (subset of PS-084 `mod_records/module.spec.yaml:168-182`): `received→accepted | buffered | quarantined | rejected`, `buffered→accepted | dropped (row deleted)`, `accepted→quarantined (fork)`, `accepted→tombstoned (purge)`; terminal `tombstoned`, `quarantined` (resolution deferred). Tombstone machine (`:183-191`): `received→applied | pending_target | rejected`, `pending_target→applied | rejected`, `applied→expired (row deleted)`. Both are declared with `defineMachine` (`packages/kernel/src/machine/machine.ts:45-63`) and every transition goes through `machine.next`, so an undeclared edge is `CONFLICT_STATE`, never silent.

### 3.2 Admission pipeline (one envelope, one transaction) — precedence is total

1. Shape: plain object whose `createdAt` parses and lies in `[now−180 d, now+5 min]`, else `FEDERATION_RECORD_TIME_INVALID` (cheap, before crypto; +5 min is `verifyEnvelope`'s own bound, `envelope.ts:115`, so PS-084 V08's 10 min is tightened, never loosened).
2. `verifyEnvelope(input, { now, maxAgeMs: 180 d })` (`envelope.ts:108-122`); any throw → `FED_SIGNATURE_INVALID` (sole signature authority; messages are not parsed).
3. Canonical size > 262144 → `FEDERATION_BATCH_TOO_LARGE` (PS-084 V03).
4. `streamKey = streamKeyOf(env) ?? env.author`; `recordKey = recordKeyOf?.(env)`.
5. Tombstone check (V09): an `applied` tombstone with `target cid:<env.cid>` **and** `tombstone.author = env.author`, or `key:<author\u0000recordKey>` → `FEDERATION_TOMBSTONED`.
6. Dedup: `federation.record[cid]` exists → `duplicate` with its stored status; no write.
7. Stream frozen → last row of the table above.
8. `decide(env, head, view, counts, effNow)` → `next | fork | buffer | reject` (PS-087 precedence, `mod_dedup/module.spec.yaml:55`).
9. Apply; `next` runs **drain**; an accepted tombstone runs **effect**.

`effNow = max(now, meta.clockHighWater)`, written on every write transaction, so a backwards clock never extends a window (PS-087 T07).

**Interleavings for one stream, head `(h, cidH)`, arrival `(s, prev, cid)`** (duplicates and tombstone hits already removed):
- `s ≤ h`, `cidAt(s) ≠ cid` → `fork_seq` at `s`: record `s` `accepted→quarantined`, arrival stored quarantined, stream frozen. Descendants `s+1..h` stay `accepted` (bounded work; the stream reports `forked`).
- `s = h+1`, `prev = cidH` (or `s=1 ∧ prev=null`) → accept, then drain.
- `s = h+1`, `prev ≠ cidH` → `prev_mismatch` at `h`: record `h` and the arrival quarantined, candidates `[cidH, prev]` (second `envelopeStored:false`), frozen.
- `h+1 < s ≤ h+101`: a buffered candidate at `s` with another cid → `fork_seq` at `s` (both quarantined, frozen); else buffer, or `FEDERATION_GAP_TOO_LARGE` / `FEDERATION_BUFFER_FULL`.
- `s > h+101` → `FEDERATION_GAP_TOO_LARGE`, nothing stored.

**Drain** after accepting `n`: `k = n+1`; take the buffered row at `(stream,k)` (`where {stream, status:'buffered'} orderBy streamSeq limit 1`); none → stop; `prev = headCid` → accept and continue; else `prev_mismatch` at `k−1` (freeze, stop). Released cids are returned in seq order. Complexity O(b·log r), b ≤ 50, per accepted statement; `decide` is O(1) lookups.

**Tombstone effect** (accepted `classrup.federation.tombstone/v1`): target by cid → record exists ∧ `record.author = tombstone.author` ∧ `status=accepted` → `applied`: `envelope:=null`, `status:=tombstoned`, `purgedAt:=now`, `expiresAt:=now+180 d`; record by another author → the statement is **rejected before chain insertion** (`FEDERATION_TOMBSTONE_UNAUTHORIZED`, nothing written); target quarantined → `applied` with `purged:false` (fork evidence retained, cid never re-admissible); target unknown → `pending_target` (`pendingUntil = now+24 h`). Target by recordKey → every accepted record of the same author with that key (500-row page; more → the sweep finishes). Purge lag is 0 ms by construction.

**Sweep** `sweepFederationIn(scope, now)`, paged at 500 per category: (a) buffered rows with `bufferedUntil ≤ effNow` → deleted, counters decremented, reported `{cid, stream, seq, reason:'gap_timeout', missing}`; (b) `pending_target` past `pendingUntil` → `applied` (a later target by the same author is `FEDERATION_TOMBSTONED`; by another author the tombstone becomes `rejected` and the record is admitted); (c) `applied` with `expiresAt ≤ now` → deleted (the target stub stays `tombstoned` forever). Returns `{dropped, applied, expired, more}`.

**No-silent-overwrite proof sketch.** (i) Record rows are keyed by cid, so two envelopes never share a row. (ii) The only path to `accepted` creates `federation.chain[stream,seq16]` with `expectedRevision: 0`; an existing key yields `CONFLICT_REVISION` (`tx.ts:113-118`) and rollback (`storage.ts:50-53`), so at most one accepted cid per (stream, seq) holds even if a bug bypasses `decide`. (iii) `accepted` leaves only via `quarantined` (fork) or `tombstoned` (author's own tombstone), both keeping the cid and recording a reason. (iv) `prev` is inside the signed bytes (`envelope.ts:118-120`), so linkage cannot change without a new signature. Convergence: in any permutation of a valid chain each seq is accepted exactly once (as `next` or by drain), because acceptance requires `prev = cidAt(seq−1)` and chain rows are immutable.

## 4. Public API

`packages/federation/src/relay_sync/dedup/index.ts` (pure, PS-087; file path from `planning/modules.yaml:101`):

```ts
export interface ChainHead { readonly seq: number; readonly cid: string | null }
export interface ChainView { cidAt(seq: number): string | undefined; bufferedAt(seq: number): string | undefined; isKnown(cid: string): boolean }
export interface BufferCounts { readonly stream: number; readonly tenant: number }
export type Decision = { kind: 'duplicate' } | { kind: 'next' } | { kind: 'buffer'; missing: readonly number[]; until: string }
  | { kind: 'fork'; reason: 'fork_seq' | 'prev_mismatch'; seq: number } | { kind: 'reject'; code: 'FEDERATION_GAP_TOO_LARGE' | 'FEDERATION_BUFFER_FULL' };
export function decide(env: VerifiedEnvelope, head: ChainHead, view: ChainView, counts: BufferCounts, now: number): Result<Decision, AppError>;
export function drainOrder(buffered: readonly { seq: number; cid: string; prev: string | null }[], head: ChainHead): readonly string[];
export function expired(rows: readonly { cid: string; bufferedUntil: string }[], now: number): { drop: readonly string[] };
export function verifyChain(envelopes: readonly VerifiedEnvelope[]): Result<ChainHead, AppError>;
export const FEDERATION_LIMITS: Readonly<{ GAP_WINDOW_MS: 86_400_000; MAX_GAP_AHEAD: 100; MAX_BUFFERED_PER_STREAM: 50; MAX_BUFFERED_PER_TENANT: 5000; /* … */ }>;
```

`packages/federation/src/protocol/records/{schema,store,admit,sweep,read,migration,definitions}.ts` (`modules.yaml:98`), `relay_sync/conflicts/index.ts` (`:102`), `errors.ts`:

```ts
export type FederationScope = Pick<WriteScope, 'repo'>;                       // scope.ts:50-55; ctx.tx satisfies it
export function federationScope(tx: Tx, tenantId: string, now: () => number): FederationScope; // standalone adapter: schema.parse + idx from def.slots (same rule as repo.ts:111-115) + tx.records.put/get/query
export interface AdmitOptions { readonly now: number; readonly source?: string; readonly streamKeyOf?: (env: VerifiedEnvelope) => string | undefined; readonly recordKeyOf?: (env: VerifiedEnvelope) => string | undefined }
export type AdmissionOutcome =
  | { outcome: 'accepted'; cid: string; stream: string; seq: number; released: readonly string[]; tombstone?: TombstoneEffect }
  | { outcome: 'duplicate'; cid: string; status: RecordStatus }
  | { outcome: 'buffered'; cid: string; missing: readonly number[]; bufferedUntil: string }
  | { outcome: 'quarantined'; cid: string; fork: { kind: 'fork_seq' | 'prev_mismatch'; seq: number; candidates: readonly string[] } }
  | { outcome: 'rejected'; code: string; cid?: string };
export type TombstoneEffect = { status: 'applied' | 'pending_target'; purged: readonly string[]; expiresAt?: string };
export function admitStatementIn(scope: FederationScope, input: unknown, opts: AdmitOptions): Promise<Result<AdmissionOutcome, AppError>>;
export function admitStatements(storage: Storage, inputs: readonly unknown[], opts: AdmitOptions): Promise<readonly AdmissionOutcome[]>; // ≤100, one storage.transaction each (storage.ts:16; PS-084 06.R02)
export function admitTombstoneIn(scope: FederationScope, input: unknown, opts: AdmitOptions): Promise<Result<AdmissionOutcome, AppError>>; // expectedType pinned
export function sweepFederationIn(scope: FederationScope, now: number): Result<SweepReport, AppError>;
export function sweepFederation(storage: Storage, tenantId: string, now: number): Promise<Result<SweepReport, AppError>>;
export function streamHead(scope: Pick<ReadScope, 'repo'>, stream: string): { seq: number; cid: string | null; status: 'open' | 'forked'; forkSeq?: number };
export function getRecord(scope: Pick<ReadScope, 'repo'>, cid: string): StoredRecord<FederationRecord> | undefined;      // callers check status === 'accepted'
export function listAccepted(scope: Pick<ReadScope, 'repo'>, stream: string, q?: { cursor?: string; limit?: number }): Result<Page<FederationRecord>, AppError>;
export function rebuildStreamHead(scope: Pick<ReadScope, 'repo'>, stream: string): Result<ChainHead, AppError>;            // re-checks prev links (PS-087 10.R02)
export const federationMigrations: readonly Migration[];
export const federationErrors: ErrorRegistry<'FED_SIGNATURE_INVALID' | 'FEDERATION_RECORD_TIME_INVALID' | 'FEDERATION_TOMBSTONED' | 'FEDERATION_TOMBSTONE_UNAUTHORIZED' | 'FEDERATION_GAP_TOO_LARGE' | 'FEDERATION_BUFFER_FULL' | 'FEDERATION_BATCH_TOO_LARGE'>; // defineErrors app-error.ts:59-70; statuses from the specs
export function federationDefinitions(o: { verifyEnvelope?: typeof verifyEnvelope; signer?: StatementSigner; streamKeyOf?; recordKeyOf? }): { receive: CommandDef; tombstoneIssue: CommandDef; head: QueryDef; all: readonly AnyDefinition[] };
```

`federationDefinitions` is a thin bus adapter (`defineCommand` `packages/kernel/src/bus/define.ts:108`): `federation.record.receive` (`F11.S01.M02`, idempotent, input `{ envelopes: unknown[] (1..100), source }`) calls `admitStatementIn(ctx.tx, …, { now: ctx.clock.now() })` per envelope and emits `federation.record.accepted/rejected/tombstone.applied` (`defineEvent` `packages/kernel/src/events/envelope.ts:46`); `federation.tombstone.issue` signs with the injected `StatementSigner` (`packages/security/src/cryptography/index.ts:41-45`) at `seq = head.seq + 1`, `prev = head.cid`, then admits. Record and event share the handler transaction (PS-084 06.R03).

`index.ts` appends these exports; existing exports (`packages/federation/src/index.ts:1`) are unchanged. No `node:` imports; no new dependencies (`packages/federation/package.json` already lists `@classrup/kernel`, `@classrup/security`, `zod`).

**Alpha compatibility.** Alpha chains are per subject: `bazaar.listing.publish/unpublish` derive `seq` from the previous publication of that listing (`packages/bazaar/src/listings/index.ts:50-56, 97, 122`), reservations sign `seq: 1, prev: null` (`:152`), and `discovery.listing.retain` keys rows by `${ownerId}/${listingId}` (`packages/discovery/src/search/index.ts:63`). These envelopes and their records are untouched. Later routing is one call inside the existing handler: `admitStatementIn(ctx.tx, snapshot, { now, streamKeyOf: e => \`${e.author}\u0000${listingId(e)}\`, recordKeyOf: listingId })`, which maps a per-subject chain onto one stream without changing its seq semantics; `classrup.alpha.tombstone/v1` keeps its own verifier and is not a FED-4 tombstone.

## 5. Threat model and failure handling

| Case | Handling | Code / outcome |
|---|---|---|
| Forged or mutated envelope, bad DID, wrong `prev` syntax | `verifyEnvelope` throws | `FED_SIGNATURE_INVALID`, nothing stored |
| Replay of a known cid | idempotent | `duplicate` (returns stored status; no write, no event) |
| Replay to resurrect purged content | stub keeps `tombstoned`; applied tombstone index | `FEDERATION_TOMBSTONED` (also after 180 d, via the stub) |
| Statement older than 180 d / > 5 min future | cheap pre-check | `FEDERATION_RECORD_TIME_INVALID` |
| Equivocation: same seq, two cids (same stream) | both quarantined, stream frozen, ≤5 candidates, nothing overwritten | `quarantined` (fork_seq) |
| Hash-chain splice (`prev` to unknown cid) | proof of inconsistent signed history | `quarantined` (prev_mismatch), frozen |
| Statement after freeze (other seq) | refused, not stored | `CONFLICT_STATE {state:'forked'}` |
| Forged far-future seq flood | gap ≤100; 50/stream; 5000/tenant; payload never read by `decide` | `FEDERATION_GAP_TOO_LARGE`, `FEDERATION_BUFFER_FULL` |
| Many fresh author keys | streams counter | `PRECONDITION_FAILED {reason:'stream_limit'}` at 10 000 |
| Third-party tombstone | `tombstone.author ≠ target.author` | `FEDERATION_TOMBSTONE_UNAUTHORIZED`; target stays accepted |
| Tombstone for unseen target then target from another author | pending → re-checked at arrival | tombstone `rejected`, record admitted |
| Oversize envelope / batch; non-finite `now` | 262144 B, 100 per batch; fail closed | `FEDERATION_BATCH_TOO_LARGE`; `VALIDATION_FAILED` |
| Backwards clock | `effNow = max(now, highWater)` | windows never extend |
| Crash mid-admission | one `storage.transaction` per envelope | row and head both present or both absent |
| Concurrent tabs | writer fence / Web Lock (`indexeddb.ts:160-188`) | `DEPENDENCY_UNAVAILABLE`, retry |
| Bug reaching `accepted` twice | chain row CAS 0 | `CONFLICT_REVISION`, rollback |

A fork **freezes** (state and evidence kept, typed outcome); every other failure **rejects** (no state). Nothing is deleted except expired buffer rows (reported) and expired tombstone rows (stubs remain).

## 6. Test plan

Unit/property files live under `packages/federation/src/**`, integration under `tests/integration/federation-*.test.ts` (`vitest.config.ts`); fixed clock `2026-11-04T10:00:00.000Z` (`createFakeClock` `packages/kernel/src/clock/clock.ts:33`), fresh `IDBFactory` per test, real Ed25519 keys via `createIdentity` (`packages/identity/src/identity.ts:79`). Titles carry the ID (regex `tools/trace/trace.mjs:61`).

**Unit — `relay_sync/dedup/dedup.test.ts`**
1. `TEST-PS-087-09.T01` decide: next / duplicate / buffer `{missing:[7], until}` / fork `prev_mismatch` / reject from the spec example → kinds as documented.
2. `TEST-PS-087-09.T03` gap 100 → buffer, 101 → `FEDERATION_GAP_TOO_LARGE`; 50th → buffer, 51st and tenant 5001st → `FEDERATION_BUFFER_FULL`.
3. `TEST-PS-087-09.T05` two authors' decisions identical under any interleaving.
4. `TEST-PS-087-09.T07` `expired` at 23 h 59 min → none; 24 h → one; clock set back 1 h → still expired.
5. `TEST-PS-087-09.T08` `decide` 1000× identical; `drainOrder` twice → second call empty against advanced head.
6. `TEST-PS-087-09.T06` `expectTypeOf(decide).parameter(0)` is `VerifiedEnvelope`; results are `Result`; module exports only functions and constants.

**Property — `relay_sync/dedup/dedup.property.test.ts` (fast-check 4.10.2)**
7. `TEST-PS-087-09.T02` pre-signed 50-chain; `fc.shuffledSubarray` plus duplicates fed through `admitStatements` on memory storage → accepted order = seq order, each seq accepted exactly once, final head `(50, cid50)`, `bufferedTotal = 0`.
8. `TEST-PS-087-09.T04` random `prev` splices and re-signed duplicate seqs → never `accepted`; always `quarantined` or `rejected`; stream `forked` after first fork.
9. `TEST-PS-084-09.T04` model-based: random commands (arrivals, gaps, tombstones, sweeps with time jumps) vs a reference model → only `defineMachine` edges occur; `tombstoned`/`quarantined` never change; `listAccepted` ⊆ status accepted.
10. `TEST-PS-086-09.T03` random re-detections → candidates only appended (≤5, distinct), never altered.

**Integration — `tests/integration/federation-chain.test.ts`**
11. `TEST-PS-084-09.T01` seq 1,2,3 sequential → `accepted`, head advances, rows carry `source`, `verifiedAt`, `claimedAt`; `TEST-PS-087-09.T08` resend seq 2 → `duplicate`, every row revision unchanged.
12. `TEST-PS-084-09.T05` two subjects, seq 7 before 6 → `buffered {missing:[6]}`; seq 6 → `accepted` with `released:[cid7]`.
13. `TEST-PS-084-09.T28` (new row, below) interleaved subjects, second seq 2 with another cid → both quarantined, absent from `listAccepted`, stream `forked`; `discovery.listing.retain` and `bazaar.listing.publish` behave as before on the same storage.
14. `TEST-PS-084-09.T13` + `TEST-PS-086-09.T01` E7a/E7b → one fork row, 2 candidates, both envelopes retained byte-identical; `TEST-PS-086-09.T11` replay E7b → same row, still 2.
15. `TEST-PS-084-09.T06` + `TEST-PS-087-09.T07` buffered seq 7; sweep at +23 h 59 min → kept; +24 h → dropped `gap_timeout`, row deleted, counters 0; resubmission is a new submission.
16. `TEST-PS-087-09.T09` 10 000 forged future seqs → ≤50 buffered, rest `FEDERATION_GAP_TOO_LARGE`/`FEDERATION_BUFFER_FULL`; a payload getter spy is never invoked by `decide`.
17. `TEST-PS-084-09.T02` V05 (seq 0), V07 (flipped sig byte), V08 (181 d / +6 min), V09, V12 → documented codes; record count unchanged.
18. `TEST-PS-084-09.T15` batch of 100 with 3 invalid → 97 accepted, 3 rejected, results in order, each in its own transaction.

**Integration — `tests/integration/federation-tombstone.test.ts`**
19. `TEST-PS-084-09.T07` author tombstone (seq 4, target cid of seq 2) → `applied`, record 2 `tombstoned`, `envelope:null`, `purgedAt = now`, `expiresAt = appliedAt + 180 d`, stub still verifies seq 3's `prev`.
20. `TEST-PS-084-09.T10` other principal's tombstone → `FEDERATION_TOMBSTONE_UNAUTHORIZED`, target still `accepted`.
21. `TEST-PS-084-09.T08` resend tombstoned cid → `FEDERATION_TOMBSTONED`; 181-day-old envelope → `FEDERATION_RECORD_TIME_INVALID`.
22. `TEST-PS-084-09.T09` recordKey tombstone before any such record → `pending_target`; sweep at +24 h → `applied`; later record with that key by the same author → `FEDERATION_TOMBSTONED`; by another author → admitted and tombstone `rejected`.
23. `TEST-PS-084-09.T27` (new) sweep at `appliedAt + 180 d` deletes the tombstone row; the stub still blocks resurrection.

**Integration — `tests/integration/federation-reopen.test.ts`**
24. `TEST-PS-084-09.T27` admit 1..3, buffer 6, fork for author B, tombstone for C; `storage.close()`; `openIndexedDbStorage` on the same `IDBFactory` → heads, buffered, fork and tombstone rows identical; seq 4,5 accepted and drain releases 6; `rebuildStreamHead` equals `streamHead` for every stream.

Appended rows (append-only, `mod_records/module.spec.yaml` after T24; validated by `tools/specgen/validate.mjs:169-184`; no new error codes, so warnings stay at 33 per `:213`):

```
- "T27 | integration | 06.R03,01.R01,03.R02,07.R03 | admit, buffer, fork and tombstone in a vault, close and reopen the IndexedDB storage, then continue admission and sweeps | heads, buffers, forks and tombstones continue from persisted rows only; buffered rows expire 24 h after receipt and tombstone rows 180 days after appliedAt while purged stubs stay"
- "T28 | integration | 03.R02,01.R01,06.R01 | one author interleaves statements about two subjects: seq 3 before seq 2, a second seq 2 with a different cid, and duplicates of each | seq 3 buffered then released after seq 2; the second seq 2 opens a fork that quarantines both candidates and freezes the stream; duplicates change nothing; alpha per-subject commands unchanged"
```

If spec edits are vetoed by the integrator, tests 14, 25 and 26 fall back to `TEST-PS-084-09.T24` (10.R02 re-verification on restore) and `TEST-PS-084-09.T05`.

## 7. Open questions, resolved

1. **Are tombstones chain statements?** Yes: every CTR-FED-001 envelope carries `seq/prev`, so routing them through the same pipeline gives dedup, ordering and fork detection with one state machine; the effect applies when the statement reaches `accepted`.
2. **Unauthorized tombstone: reject or accept-with-no-effect?** Reject before chain insertion. The resulting hole stalls only that author's stream, which only a dishonest or buggy author can cause (PS-084 03.R03: reconsideration needs a new submission).
3. **Purge now or schedule?** Now, in the same transaction: the vault has no worker and deferral only widens the window in which purged content could be served; lag is `purgedAt − appliedAt = 0`.
4. **Does `prev_mismatch` quarantine the accepted predecessor?** Yes: the signed `prev` proves the author signed an incompatible history, evidence as strong as two cids at one seq.
5. **Dropped rows: keep or delete?** Delete and report; a kept stub would let an attacker accumulate unbounded rows.
6. **Stream key.** Author by default (FED-3); the resolver seam maps alpha subject chains later without changing their seq semantics.
7. **Backwards clock.** High-water mark in `federation.meta`; forward anomalies can only expire buffers earlier (fail-closed direction).
8. **Future skew 5 vs 10 min.** 5 min: `verifyEnvelope` stays the authority and the layer is never weaker than it.
9. **Rows from the bus vs standalone.** Bus path uses `ctx.tx.repo(def)`; the adapter reproduces `repo.ts:111-115` index derivation and is tested for row equality against the bus path.

## 8. Honest limits

- A frozen stream cannot be resolved (no origin-wins, review or `ext.supersedes`), and descendants of a fork point remain `accepted` while the stream reports `forked`.
- Tombstones are honoured only from the target's author; relay-issued tombstones, relay provenance beyond a caller-supplied `source` string, and origin fetch do not exist.
- Deletion propagation is not recall: copies fetched before the tombstone are outside this design (PRV-6).
- A receiver that first sees a chain whose seq 1 is older than 180 days can never admit it (PS-084 V08).
- The 5000-row tenant buffer can reach ~1.25 GB worst case; IndexedDB quota exhaustion surfaces as the kernel's `DOMException` and is not handled here.
- Nothing here establishes that a statement is true, delivered, or signed by an uncompromised key; a valid chain shows only that one key signed a consistent sequence ("local committed" at most, CONSISTENCY_STATES).
- No events are emitted outside `federationDefinitions`; domain modules do not yet react to freezes. Rows are plaintext at rest until slice B lands.
