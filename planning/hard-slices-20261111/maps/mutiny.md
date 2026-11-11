# Mutiny subsystem map (`packages/mutiny`)

Paths are relative to `/home/user/CLASSifiedisRUPTed`. `packages/mutiny/src/cycle_matching/matching.ts` does **not** exist; the engine lives in `cycle_matching/index.ts`.

## 1. Layout and exports

`packages/mutiny/src/index.ts:2-5` re-exports `./cycle_matching/index.ts`, `./trade_proposals/index.ts`, `./cycle_matching/admission.ts`, `./trade_proposals/repository.ts`. Comment (line 1): persistent command handlers are composed by the vault application. Deps (`packages/mutiny/package.json`): `@classrup/kernel`, `@classrup/federation`, `@classrup/discovery`, `@classrup/identity`, zod `4.6.7`, node `>=22.18.0`.

## 2. Matching engine — `packages/mutiny/src/cycle_matching/index.ts`

Pure; "does not verify signatures" (line 3).

### Types
- `MatchEdge` (4-15): `giverId, receiverId, inventoryItemId, listingCid, wantCid: string; receiverOfferingListingCid?: string; valueMinor: string; currency: string; distanceBucket: number; wantCreatedAt: number`.
- `MatchOptions` (16-25): `now; localPrincipal?; lmax?; expansionBudget?; timeBudgetMs?; maxSuggestions?; monotonicNow?: () => number`.
- `CycleScore` (26-31): `participants, imbalancePermille, maxDistanceBucket, oldestWantAgeDays`.
- `CycleSuggestion` (32-36): `cycleKey, legs, score`. `MatchResult` (37-48): `suggestions, inputHash, stats {nodes, edges, expansions, durationMs, cyclesFound, truncated: 'none'|'expansions'|'time'|'results'}`.

### Validation (`validateEdge`, 54-59)
Ids: non-empty strings ≤512 chars; `giverId !== receiverId` else `TypeError('Invalid edge identity')`. Money: `valueMinor` must match `/^(0|[1-9][0-9]{0,29})$/` (≤30 digits, no sign/decimal) and `currency` `/^[A-Z]{3}$/`, else `TypeError('Invalid edge money')`. `distanceBucket` integer 0..4; `wantCreatedAt` integer 0..`now`.

### `export function canonicalRing(legs: readonly MatchEdge[]): readonly MatchEdge[]` (63-77)
Length 2..8. Enforces `leg.receiverId === next.giverId`, unique `giverId`, unique `inventoryItemId` (else `'Invalid elementary directed ring'`), and if `receiverOfferingListingCid` present it must equal next leg's `listingCid` (`'Want offer does not match next leg'`). Rotates so the lexicographically smallest `giverId` is first; returns shallow copies.

### `export function cycleKey(legs): Promise<string>` (83-85)
base64url(SHA-256(`canonicalJson(canonicalRing(legs))`)) via `digest` (78-81). Rotation-invariant, direction-sensitive, value-sensitive (tests confirm `valueMinor` change alters key).

### Money arithmetic / `score` (86-97)
BigInt. For node i: `outgoing = legs[i].valueMinor`, `incoming = legs[i-1 mod n].valueMinor`; `gap = ceil(|out-in|*1000/max)` (0 if max is 0); `imbalancePermille = max gap`. `maxDistanceBucket = max(distanceBucket)`; `oldestWantAgeDays = floor((now - min wantCreatedAt)/86400000)`.

### `export async function discoverCycles(input, options): Promise<MatchResult>` (99-179)
Defaults/bounds (102-107): `lmax` 5 [2..8], `expansionBudget` 100000 [1..100000], `timeBudgetMs` 250 [1..250], `maxSuggestions` 500 [1..500]; out of range → `TypeError('Invalid …')`. `input.length > 20000` or `nodes.length > 2000` → `RangeError('MUTINY_GRAPH_TOO_LARGE')`. Edges copied, validated against `now`, sorted by `(giverId, receiverId)`; adjacent equal pair → `TypeError('Duplicate directed edge')` (one edge per ordered pair). `inputHash` (122) = digest of `canonicalJson({edges, now, localPrincipal ?? null, lmax, expansionBudget, timeBudgetMs, maxSuggestions})`.

Search (136-164): DFS from each node in sorted order; only follows edges whose `receiverId >= start` (145) so each elementary cycle is enumerated once with its minimum node as start; skips reused `inventoryItemId`; every edge must share `path[0].currency` (146); depth bounded by `lmax`. `expansions++` per considered edge, after `stopped()` (130-135) which sets `truncated` to `'time'` (clock - start ≥ budget) or `'expansions'`. On closing a ring: `cyclesFound++` **before** two filters: `receiverOfferingListingCid` consistency with next leg (151) and `localPrincipal` membership (152). Candidates capped at 500 → `truncated = 'results'` and search halts (155; `stopped()` returns true once truncated).

Ranking (167-168): hash candidates after enumeration; sort by `participants` desc, `ceil(imbalancePermille/10)` asc, `maxDistanceBucket` asc, `oldestWantAgeDays` desc, `cycleKey` asc. Greedy disjoint selection by `giverId` and `inventoryItemId` (169-177), stop at `maxSuggestions`.

## 3. Signed want admission — `packages/mutiny/src/cycle_matching/admission.ts`

- `export const WANT_TYPE = 'classrup.alpha.want/v1'` (8). `Want` (9-13): `offeringListingCid, requestedListingCid, expiresAt`.
- `export function parseWant(input: unknown): Want` (30-37): key set must be **exactly** `expiresAt,offeringListingCid,requestedListingCid` (33); cids 1..200 chars and distinct; `expiresAt` must round-trip `new Date(x).toISOString() === x`.
- `AdmissionOptions` (14-23): `now, localPrincipal, optedIn, blockedOwners?, includeUnknownIdentities?, knownOwners?, maxDistanceBucket?`. `AdmittedGraph` (24-29): `edges, rejected, oldestProjectionAt, trust: 'explicitly-including-unknown'|'known-owners-only'`.

### `export async function admitSignedGraph(listingStatements, wantStatements, options): Promise<AdmittedGraph>` (43-117)
1. Guard (44): invalid `now`, empty `localPrincipal`, or `optedIn !== true` → `TypeError('MUTINY_MATCHING_NOT_ENABLED')`. `>4000` listings or `>20000` wants → `RangeError('MUTINY_GRAPH_TOO_LARGE')`.
2. Listings (56-71): every statement passes `verifyEnvelope(input, { now })`. `classrup.alpha.tombstone/v1` collected; anything other than `classrup.bazaar.listing/v1` throws `'Unsupported listing statement'`. Payload parsed with `publicListingSchema`; `ownerId !== author` throws `'Unauthorized listing author'`. Key `[ownerId, listingId]`; same key+revision with a different cid → key permanently in `forkedListings`; head = max revision, `conflicted` if same revision/different cid at head.
3. Tombstones (72-79): `tombstoneSchema`; `ownerId === author`, and if target retained its author/listingId must match (else `'Unauthorized tombstone'`); `removed[key] = max(revision)`.
4. `usable(record)` (80-88): not forked, head not conflicted, record cid is head, `revision > removed`, envelope age 0..30 days, `expiresAt > now`, `barterOptIn`, `availability === 'available'`, `kind !== 'wanted'`, `value !== undefined`, owner not blocked, owner in `known` (= `localPrincipal` + `knownOwners`) unless `includeUnknownIdentities === true`.
5. Wants (92-115): `verifyEnvelope(input, { expectedType: WANT_TYPE, now })`; dedupe by cid; `parseWant`. Offered/requested must be in the listing map **and** offered author must be want author, else **throws** `'Want references missing or unauthorized offered listing'`. Silent `rejected++` when: either listing unusable, requested is own listing, want age `< 15 min` or `> 30 days`, want expired, `regionCell.slice(0,4)` differs, currencies differ, `distanceBucket > maxDistance`.
6. Edge (106-108): `giver = requested.projection` owner (gives the requested item), `receiver = want author`. `inventoryItemId = giver.listingId`, `listingCid = requested cid`, `wantCid`, `receiverOfferingListingCid = offered cid`, `valueMinor = giver.value.amount`, `currency = giver.value.currency`, `distanceBucket = (both 5 chars && equal) ? 0 : 4`, `wantCreatedAt = Date.parse(envelope.createdAt)`.
7. One edge per `(giverId, receiverId)`: keep lexicographically smallest `JSON.stringify([listingCid, wantCid])` (112). `oldestProjectionAt` = min of want/offered/requested `createdAt`.

### `export async function recheckProposal(proposal, listingStatements, wantStatements, options): Promise<Feasibility>` (120-124)
Re-admits and returns `feasible = every proposal leg's canonicalJson is in the admitted edge set`. Exact-equality on the full leg object.

## 4. Proposals and coordination — `packages/mutiny/src/trade_proposals/index.ts`

Statement types (5-8): `PROPOSAL_TYPE='classrup.alpha.proposal_revision/v1'`, `CONSENT_TYPE='classrup.alpha.consent/v1'`, `RESERVATION_TYPE='classrup.alpha.reservation/v1'`, `WITHDRAWAL_TYPE='classrup.alpha.withdrawal/v1'`.

Types: `ProposalSnapshot` (9-18) `{subjectId, coordinatorId, revisionNo, previousHash, legs, createdAt, consentDeadline, executionWindowMs}`; `Proposal` (19-22) `{snapshot, revisionHash}`; `Evidence` `{envelope: VerifiedEnvelope, receivedAtLocal}`; `CoordinationState` (27-37) `{proposal, status: 'proposed'|'committed'|'cancelled'|'declined'|'frozen', reason, evidence, consentCids: Record<principal,cid>, reservationCids, lastObservedAt, committedLocallyAt, commitFeasibility}`; `Feasibility` (38-42) `{revisionHash, checkedAt, feasible}`.

`edge(input)` (59-67): strips `receiverOfferingListingCid` then requires **exactly** the nine remaining keys via `exact()`; money regexes identical to the engine.

### `export async function prepareProposal(input: unknown, now: number): Promise<Proposal>` (69-86)
Exact snapshot keys (72). 2..8 legs → `canonicalRing(legs.map(edge))` (so stored legs are rotated to min giver). `createdAt ≤ now`; `consentDeadline ∈ [createdAt+1h, createdAt+7d]`; `executionWindowMs ∈ [1d, 30d]`; `consentDeadline + executionWindowMs - createdAt ≤ 30d` and `consentDeadline > now` (`'Invalid proposal deadline'`). Coordinator must be a giver; all legs same currency; `wantCreatedAt ≤ createdAt`. `revisionNo` 1..20; `revisionNo === 1` iff `previousHash === null`. `revisionHash = sha256Hex(canonicalJson(snapshot))` (85) — the snapshot/digest.

### State machine
- `tick(state, now)` (90-104): `observed = max(now, lastObservedAt)` (monotone). `proposed` and `observed ≥ consentDeadline` → `cancelled`/`consent_timeout`. `committed` with any participant lacking a reservation evidence entry or with `expiresAt ≤ observed` → `frozen`/`reservation_expired`. Committed states are **not** cancelled by the consent deadline.
- `export function evaluateCoordination(state, feasibility, now): CoordinationState` (105-119): ticks; `checkedAt` must be a safe integer (NaN throws); only acts on `proposed`; requires `feasible`, `revisionHash` match, `checkedAt ≤ lastObservedAt` and `lastObservedAt - checkedAt ≤ 600000` (10 min). Commits iff every giver has both a consent cid and a reservation cid in evidence with unexpired `expiresAt`; sets `committedLocallyAt`, `commitFeasibility`.
- `export async function openCoordination(input, localPrincipal, now)` (121-126): verifies `PROPOSAL_TYPE`; author must be coordinator, `localPrincipal` must be a giver, `revisionNo === 1`, else `'FORBIDDEN_PROPOSAL'`.
- `export async function reviseCoordination(state, input, now)` (128-140): non-`proposed` → `'MUTINY_CYCLE_FROZEN'`; `expectedAuthor` = coordinator; subject/coordinator must match; same hash → no-op; lower `revisionNo` → `'MUTINY_REVISION_STALE'`; `previousHash !== current.revisionHash` or `revisionNo !== current+1` → **frozen** `fork_detected` (not thrown); participant set change → `'Participant changes require a new proposal'`; success clears `consentCids`/`reservationCids`.
- `export async function ingestCoordination(state, input, now)` (142-170): terminal → returns unchanged; author must be a giver (`'FORBIDDEN_PARTICIPANT'`); duplicate cid → unchanged; payload `subjectId`/`revisionHash` must match and (except reservations) `revisionNo` (`'MUTINY_CONSENT_STALE_REVISION'`); non-withdrawal `createdAt ≥ consentDeadline` → `'MUTINY_CONSENT_LATE'`. Consent payload exact `['subjectId','revisionHash','revisionNo']`. Reservation exact `['subjectId','revisionHash','giverId','itemId','expiresAt','holdId']`; `giverId === author`, `itemId === own leg's inventoryItemId` (one leg per giver), ISO round-trip, `expiresAt ≥ consentDeadline + executionWindowMs` and `> now` (`'MUTINY_LOCK_STATEMENT_INVALID'`). Withdrawal exact `['subjectId','revisionHash','revisionNo','reason']`, `reason ∈ decline|dropout|cancel`; `cancel` only by coordinator (`'FORBIDDEN_COORDINATOR'`); `decline` → `declined`, else `cancelled`.
- `export function conflictingSubjects(states, now): readonly string[]` (172-188): across non-terminal states, keys `canonicalJson([giver, itemId])` of unexpired reservations; returns sorted subjectIds held by >1 subject. `export function freezeConflict(state)` (189-191): non-terminal → `frozen`/`conflicting_promise`.

## 5. Kernel-backed repository — `packages/mutiny/src/trade_proposals/repository.ts`

Schemas: `edge` zod `strictObject` (8) mirrors `MatchEdge`; `envelopeSchema` (9) strict; `export const coordinationSchema` (10-15) strict, `legs` 2..8, `evidence` 1..200, `reason` ≤100. Repos: `coordinationRepo` type `'mutiny.coordination'` record `{ownerId, state}` index `owner` (17); `wantRepo` type `'mutiny.want'` `{ownerId, envelope, receivedAtLocal}` index `author` (18). Events: `'mutiny.coordination.changed'` `{subjectId, status}`, `'mutiny.want.retained'` `{cid}` (19-20).

`export interface MutinyOptions` (21-28) — the three callbacks:
- `hasLocalReservation(ctx: CommandContext, proposal: Proposal, principal: string): boolean` — real inventory check in the same tx.
- `checkFeasibility(ctx, proposal): Promise<Feasibility>` — fresh signed re-admission.
- `releaseLocalReservations(ctx, subjectId: string): void` — release own holds on termination.

`reconstructCoordination(input, trustLocalVerdict)` (30-60): re-verifies every evidence envelope (`now = max(lastObservedAt, receivedAtLocal)`); rebuilds from the first `PROPOSAL_TYPE` evidence via `openCoordination(..., parsed.proposal.snapshot.coordinatorId, ...)` then replays revisions/ingests; `replayCommit` re-applies cached `commitFeasibility` at `committedLocallyAt` only when trusted; errors `'Missing proposal evidence'`, `'Unsupported cached commitment'`, `'Cached proposal mismatch'`; cached `frozen` is retained; untrusted + cached committed → `frozen`/`restore_requires_review` with nulls; final `evaluateCoordination` with `feasible:false` (tick only).

`export function mutinyDefinitions(options)` (61-167) returns `{retainWant, ingest, refresh, list, listWants, all}`:
- `mutiny.want.retain` (62-82, capability `mutiny.want.retain`, input `{envelope}`): non-user → `FORBIDDEN`; expired want or ≥500 retained → `PRECONDITION_FAILED`; dedupe by cid returns existing; stored keyed by cid. Any throw → `VALIDATION_FAILED`.
- `mutiny.coordination.ingest` (83-129, input `{envelope, expectedRevision}`): payload must carry `subjectId`; `expectedRevision` mismatch → `CONFLICT_REVISION`; other owner's record → `NOT_FOUND`; >100 records or ≥5 `proposed|committed` on open → `PRECONDITION_FAILED`; own `CONSENT_TYPE` without `hasLocalReservation` → `PRECONDITION_FAILED`; evidence >200 → `PRECONDITION_FAILED`. Then `checkFeasibility`, `ownsHold`; committed without hold → frozen `local_reservation_lost`; `evaluateCoordination` with `feasible && ownsHold`; reconstructs all other records, `conflictingSubjects`, freezes and persists conflicting others (calling `releaseLocalReservations`), saves with `expectedRevision`, releases on terminal, emits `changed`. All throws → `VALIDATION_FAILED`.
- `mutiny.coordination.refresh` (130-159, `{}`): same pipeline for all ≤100 records (uses `expectedRevision: record.revision`).
- Queries `mutiny.coordination.list` (cap `mutiny.coordination.read`, limit 100), `mutiny.want.list` (cap `mutiny.want.read`, limit 500).

Backup codecs: `normalizeCoordinationRecord` (170-174) returns the normalized value (must be persisted); `validateWantRecord` (175-179); `validateCoordinationRecord` (182-184) = untrusted reconstruct.

## 6. Listings: value / currency / availability (single-item)

`packages/bazaar/src/listings/index.ts`: private `listingSchema` (13-16) has `value: money({sign:'nonNegative'}).optional()` (10), `barterOptIn` default false, `regionCell` optional, `onHand: z.int().min(0).max(1)` (14) — **single item hard-coded**. `publicProjection` (43-48) emits `revision: record.revision + 1`, `availability: available ? 'available' : 'unavailable'` where `available = onHand === 1 && !held(ctx, id)` (96), and `value` only if set; `onHand` and `privateNotes` are omitted. `bazaar.inventory.reserve` (143-160) requires `status 'published'`, `barterOptIn`, `onHand === 1`, expiry ≤ 30 days and ≤ listing `expiresAt`, no active hold (`held`, 37-42, fails closed on `nextCursor`); signs `classrup.alpha.reservation/v1` `{subjectId, revisionHash, giverId, itemId, expiresAt, holdId}` (`subjectId`, `holdId`, `itemId` are `uuidv7()`; `revisionHash` 16..200 chars, per `validatePublicationRecord` 195). `ownReservationExists(ctx, subjectId, revisionHash, itemId, requiredExpiry)` (177-183) matches hold by listing/subject/hash and `expiresAt ≥ requiredExpiry`. `releaseSubjectReservations` (201-217) releases all active holds for a subject. `packages/bazaar/src/index.ts` re-exports listings. `ALPHA_SCOPE.md:17` lists "quantity/variant inventory", "signed reservation release statements", "hold consumption" as not implemented.

`packages/discovery/src/search/index.ts`: `publicListingSchema` (4-12) strict; `value` optional but refinement requires it when `kind === 'sell'`; `availability: z.enum(['available','unavailable'])`; `regionCell` geohash 4-5 chars. Kernel `money()` (`packages/kernel/src/validation/schemas.ts:61`) accepts up to 78-digit amounts and currency `/^[A-Z][A-Z0-9]{2,9}$/`. `discovery.listing.search` (82-99) filters out conflicted/blocked/expired/unavailable; admission deliberately uses the full retained set (`r.data.envelopes`, including both conflict envelopes), not search hits.

## 7. Tests

Runner: vitest (`vitest.config.ts`: node env, threads, 20s timeout; include `packages/*/src/**/*.test.ts`, `tests/{unit,property,integration,chaos,compat}/**/*.test.ts`; `npm test` = `vitest run`).
- `admission.test.ts`: real Ed25519 via `crypto.subtle.generateKey('Ed25519')`, `didFromPublicKey` (`@classrup/identity`), `signEnvelope(identity, {type, createdAt, seq, prev, payload})` (`@classrup/federation`). Fixture listing payload: `listingId` `0192f3a4-0000-7000-8000-…`, `regionCell 'c2b2q'`, `value {amount:'100', currency:'CAD'}`, `kind 'sell'`, `condition 'good'`; wants `createdAt` = now−1h (min age 15 min). Options `{now, localPrincipal, optedIn:true, includeUnknownIdentities:true}`. Covers unknown-identity exclusion, block list, signature substitution, tombstone, same-revision fork, fresh-want rejection.
- `matching.test.ts`: `edge(giver, receiver)` helper with `inventoryItemId 'item-<giver>'`, `wantCreatedAt 0`; `ring(...)`; `monotonicNow: () => 0` for determinism. Covers lengths 2/3/4/6, rotation/reversal keys, greedy longest-first, input-order stability (`toReversed`), expansion/time truncation, bound errors, mixed currency, item reuse, `localPrincipal`, 500-candidate cap.
- `tests/integration/mutiny-oracle.test.ts`: independent permutation oracle (12-41) computing keys as sha256 base64url of `JSON.stringify` with an **explicit alphabetical key list** (28) — must equal `cycleKey`; exhaustive 3-vertex and 200 seeded 4-vertex graphs; signed coordination attack tests (124-165) with `consent`/`reservation` helpers (`itemId 'item:<principal>'`, expiry = consentDeadline+1d); historical fork order-independence (168-189).
- `tests/integration/mutiny-persistence.test.ts`: full stack with `fake-indexeddb`, `openIndexedDbStorage`, `createFakeClock`, `createDeterministicIds`, `createRegistry().add(...)`, `createBus`, `bus.dispatch(context, name, input, {idempotencyKey})`; context `{actor:{kind:'user', id, roles:['member']}, tenantId: principal}`. `scenario(size)` (44-147) wires the three callbacks (57-84) using `ownReservationExists`, `admitSignedGraph` over `publicationRepo` + `retainedListingRepo` + `wantRepo`, and manual `inventoryHoldRepo` release; `peer.record()` reads via `storage.read(tx => tx.records.get(...))`; `restart()` reopens storage. Covers commit across 2/3/4 peers with reordered delivery and restart, unreserved/stale/outsider consent, double reserve (`CONFLICT_STATE`), timeout release, revision invalidation + dropout, double-promise freeze, release-then-consent, forged restore, lost hold, reservation expiry, late dropout, rollback on release failure, tombstone exclusion.
- `packages/mutiny/benchmark.ts`: 1000 nodes / 5000 edges, LCG seed 42, 100 runs, `lmax 5`; prints p95 and truncation counts. No npm script references it.

## 8. Threading a quantity/compensation extension

Facts constraining any such change (no design is present in the files):
1. **Want payload is closed**: `parseWant` (admission.ts:33) requires exactly three keys; `validateWantRecord` and `mutiny.want.retain` reuse it. A new field cannot ride on `classrup.alpha.want/v1` without changing that check.
2. **Edge shape is closed in three places**: `exact()` in `trade_proposals/index.ts:62`, zod `strictObject` `edge` (repository.ts:8, used by `coordinationSchema`), and the oracle's explicit key list (oracle test:28). `validateEdge` ignores unknown keys, but `canonicalJson(legs)` feeds `cycleKey`, `inputHash`, `revisionHash`, and the exact-equality feasibility checks (`recheckProposal` 122-123; persistence test 70). Any added leg field must be produced byte-identically by admission and the proposal.
3. **Snapshot keys are closed** (`prepareProposal` 72) and `coordinationSchema.proposal.snapshot` is strict; `revisionHash` covers the whole snapshot, so new snapshot fields change hashes consumed by consent/reservation/withdrawal payloads (all `exact()`-checked, 153/157/164) and by `bazaar.inventory.reserve`.
4. **Value model is per-leg single item**: `valueMinor` is the giver's listing `value.amount`; `score` balances out vs in per node with no compensation term; one leg per giver (`canonicalRing`), reservation `itemId === leg.inventoryItemId` (160), `hasLocalReservation` test impl finds the single leg by `giverId`; `conflictingSubjects` keys on `[giver, itemId]`.
5. **Inventory is 0/1**: `onHand ≤ 1`, one active hold per listing (`held`), `availability` is binary and omits counts; `ALPHA_SCOPE.md:17` declares quantity out of scope.
6. **Currency**: single currency per ring enforced in admission (105), engine (146) and `prepareProposal` (80); only `/^[A-Z]{3}$/` is accepted by edges although kernel money allows 3-10 chars.

## 9. Pitfalls
- Admission builds edges **without** `validateEdge`; a listing with a 4+ char currency or >30-digit amount passes `publicListingSchema` but makes `discoverCycles` throw `'Invalid edge money'`.
- All handler throws collapse to `VALIDATION_FAILED`; the named `TypeError` strings (`MUTINY_*`, `FORBIDDEN_*`) surface only from the pure functions.
- `cyclesFound` counts rings before the offer-consistency and `localPrincipal` filters; oracle tests depend on this.
- `'results'` truncation stops the whole search, not just the current start node; timing truncation is machine-dependent (benchmark comment).
- Feasibility is only honoured if `checkedAt ≤ lastObservedAt` and ≤10 min old; `tick` makes `lastObservedAt` monotone, so a backwards clock cannot undo expiry.
- `reconstructCoordination` passes the coordinator (not the record owner) as `localPrincipal` to `openCoordination`.
- Store what `normalizeCoordinationRecord` returns; restore always freezes cached `committed` states (`restore_requires_review`) until a refresh re-commits.
