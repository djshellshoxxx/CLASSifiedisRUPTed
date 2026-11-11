# Design E-2 — Value balancing, compensation legs, pinned FX quotes, quantity-aware wants and holds

Lens: adversarial economics and security. Paths are relative to `/home/user/CLASSifiedisRUPTed`. No existing `classrup.alpha.*` payload changes meaning; every new term lives in an explicitly versioned optional section whose absence reproduces today's bytes.

## 1. Summary and scope

**MVP:**
- New `packages/mutiny/src/value_balancing/`: pure bigint money (MNY-1..6), currency registry subset, pinned FX quotes, MNY-5 tolerance, deterministic compensation planner, versioned proposal `terms`, `evaluateValueFeasibility`.
- Additive edits: `cycle_matching/index.ts` (optional leg `quantity`, optional `normalization` option), `cycle_matching/admission.ts` (signed want-quantity extension, registry gate, value verdict in `recheckProposal`), `trade_proposals/index.ts` (optional `terms`, leg `quantity`, capacity-aware `conflictingSubjects`), `trade_proposals/repository.ts` (schema widening, optional `ownCapacity`).
- `packages/bazaar/src/listings/index.ts`: listing `quantity` (default 1), hold `quantity`, `available = quantity − Σ active hold quantities`, `bazaar.inventory.set_quantity`, quantity-aware `reserve`/`ownReservationExists`.

**Deferred, each justified:**
- Settlement of compensation legs (claim/acknowledge/dispute): `packages/commerce/src` does not exist; legs are obligations evidenced only by the consent signature on the revision hash (COM-1). Leg status is derived, never stored.
- Negotiated (non-planner) legs: strict recomputation closes the "hidden leg" attack; no UI renders legs yet.
- Quote retrieval from a rate source: quotes are proposer-asserted, labelled by `source`, pinned by `id` with content embedded; peers consent to the exact rate.
- Peer-side capacity awareness: peers never learn stock (PS-023-07.R01); the alpha freeze rule stays for peers, only the giver's own vault counts units.
- Plausibility flags (F02.S04.M03): no reference prices exist in alpha listings.
- `apps/pwa` wiring (open PR): §8.

## 2. Data model and statement formats

Envelope types can only end in `/v1` (`packages/federation/src/envelope.ts:91`), so versions are key names.

**Want quantity extension.** `ext` is inside CID and signature (`envelope.ts:102-104,116-120`); the `classrup.alpha.want/v1` payload stays exactly as `admission.ts:33` requires.
```json
"ext": { "classrup.alpha.want_quantity/v1": { "quantity": 3 } }
```
`quantity` integer 2..100000; `ext` may hold only this key (any other key ⇒ want counted in `rejected`); quantity 1 is expressed by absence. Old wants (`ext: {}`) admit unchanged.

**Leg** (`MatchEdge`, `cycle_matching/index.ts:4-15`) gains `readonly quantity?: number`, present iff ≥ 2. `valueMinor` stays the giver's *unit* value from the signed projection (`admission.ts:108`) so recheck equality holds; leg value = `valueMinor × quantity`. Key absence keeps `canonicalJson(leg)`, hence `cycleKey`, `inputHash`, `revisionHash` and the oracle key list (`tests/integration/mutiny-oracle.test.ts:28`), byte-identical for every existing edge.

**Proposal snapshot** (`trade_proposals/index.ts:9-18`) gains `readonly terms?: ProposalTerms`. Absent ⇒ today's eight keys ⇒ identical `revisionHash` (`index.ts:85`; `canonicalJson` drops `undefined`, `packages/kernel/src/hash/canonical.ts:11-14,29-30`). Golden hash for the §6 T1 fixture: `0c6fbc18bd9a47cc8a6cf652d892cc7863db9606653da008ce66f4ff6413d09d`.
```json
"terms": {
  "v": "classrup.alpha.proposal_terms/v1",
  "settlementCurrency": "CAD",
  "tolerance": { "bps": 500, "absoluteMinMinor": "500",
                 "overrides": { "did:key:z6MkB…": { "bps": 300, "absoluteMinMinor": "100" } } },
  "quotes": [ { "id": "q-2026-11-09-eur-cad-1", "base": "EUR", "quote": "CAD",
                "rate": { "num": "150", "den": "100" }, "source": "manual:did:key:z6MkA…",
                "asOf": "2026-11-09T11:00:00.000Z", "expiresAt": "2026-11-10T10:00:00.000Z" } ],
  "compensation": [ { "payer": "did:key:z6MkB…", "payee": "did:key:z6MkA…",
                      "money": { "amount": "4000", "currency": "CAD" }, "quoteId": "q-2026-11-09-eur-cad-1" } ],
  "acceptedImbalances": [ "did:key:z6MkC…" ]
}
```
Canonical form (violations reject, so one content has one hash): `overrides`, `quotes`, `compensation`, `acceptedImbalances` omitted when empty; `quoteId` present iff the payer's leg currency ≠ settlement; `money.currency === settlementCurrency`; quotes sorted by `id`, DIDs sorted, compensation in planner order. Bounds: `settlementCurrency` registered and among leg currencies; `bps` 0..10000; `absoluteMinMinor` 1..38 digits; quote `id` 1..200 chars unique, `source` 1..64, `num`/`den` positive ≤ 40 digits, `asOf ≤ createdAt`, `createdAt + 30 min ≤ expiresAt ≤ asOf + 24 h` (N16, PS-025 V03); exactly one quote per non-settlement leg currency, none unused; ≤ 7 compensation legs (N−1), amounts 1..10^12 (PS-026 V02), payer ≠ payee, both givers; `canonicalJson(terms).length ≤ 8192`. Legs: `quantity` 2..100000; currency `/^[A-Z][A-Z0-9]{2,9}$/` and registered.

**Currency registry** (`value_balancing/money.ts`): ISO 4217 minor units for `AUD BRL CAD CHF CLP(0) CNY CZK DKK EUR GBP HKD HUF INR ISK(0) JPY(0) KRW(0) KWD(3) BHD(3) JOD(3) OMR(3) TND(3) MXN NOK NZD PLN SEK SGD USD VND(0) ZAR` (2 unless noted) plus `BTC` 8, `ETH` 18, `USDC` 6. Unknown ⇒ `COMMERCE_CURRENCY_UNKNOWN`.

**Bazaar records** (`packages/bazaar/src/listings/index.ts`): `listingSchema` (13-16) adds `quantity: z.int().min(0).max(100000).default(1)`; `onHand` (0/1) stays as the legacy in-stock flag with invariant `onHand === (quantity > 0 ? 1 : 0)` kept by every writer. `holdSchema` (20) adds `quantity: z.int().min(1).max(100000).default(1)`. Disk records are untouched: `writeRepo.put` parses (`packages/kernel/src/storage/repo.ts:166-168`), `get` returns raw data (`repo.ts:141`), so readers use `?? 1`. No migration.

**Coordination record** (`repository.ts:8-15`): `edge` adds `quantity: z.int().min(2).max(100000).optional()`, currency regex widened; snapshot adds `terms: termsSchema.optional()`. Consent, reservation and withdrawal payloads are unchanged; quantity and legs are bound through `revisionHash`.

## 3. Algorithms and state machines

**Money.** `parseMinor` accepts `/^-?(0|[1-9][0-9]{0,37})$/`, rejects `-0`. `roundHalfEvenDiv(n, d)`: integer quotient on `|n|`, compare `2|r|` with `d`, ties to even, sign restored (`round(−x) = −round(x)`). `convertMinor(amount, quote)`: `roundHalfEvenDiv(amount × num × 10^dq, den × 10^db)` — one division, one rounding; > 38 digits ⇒ `COMMERCE_MONEY_OVERFLOW`; pair mismatch ⇒ `TypeError` (MNY-6). A leg is converted once over `valueMinor × quantity`, never per unit.

**Positions.** For participant `i` with giving leg `g` (one per giver, `index.ts:71`) and incoming leg `h` (`h.receiverId === i`): `given_i = value(g)`, `received_i = value(h)`, `residual_i = received_i − given_i`; Σ residual = 0. `tol_i = max(floor(max(given_i, received_i) × bps / 10000), absoluteMinMinor)`, `overrides[i]` replacing both parameters.

**Planner** (`planCompensation`, O(n²), n ≤ 8, deterministic):
1. `forced = { i : residual_i < −tol_i ∧ i ∉ acceptedImbalances }`.
2. While `forced` non-empty: `p` = most negative residual (ties DID ascending); `q` = largest positive residual (ties DID ascending; exists since Σ = 0); `amount = min(−residual_p, residual_q)`; emit `{payer: q, payee: p, amount}`; update; drop `p` when `residual_p ≥ −tol_p`.
3. Each leg zeroes `p` or `q` ⇒ ≤ N−1 legs. Fixture 20000/14000/16000 ⇒ `p2→p1 4000, p2→p3 2000`, residuals 0.
Advantaged residuals need no acceptance (MNY-5 names the disadvantaged party); accepted participants are never forced or paid but may pay.

**`verifyTerms(snapshot)`** (from `prepareProposal`): canonical parse → registry/quote/deadline rules → recompute values and plan → `compensation` must equal the plan (`MUTINY_NORMALIZATION_MISMATCH`) → every non-accepted participant ends with `residual ≥ −tol` (`MUTINY_VALUE_OUT_OF_TOLERANCE`). Cross-currency rings are legal only with `terms.quotes` covering every non-settlement currency; terms-less snapshots keep the single-currency rule (`index.ts:80`).

**`evaluateValueFeasibility(proposal, {now, participant?, localTolerance?})`** (pure; consent and commit via `recheckProposal`): terms-less ⇒ default tolerance, no legs, no acceptance (closes "omit terms to skip tolerance" without touching hashes or ingest); a quote with `expiresAt ≤ now` ⇒ `MUTINY_QUOTE_STALE`; `< 30 min` left ⇒ warning `QUOTE_EXPIRING`; `localTolerance` applies to `participant` only and can only be stricter. Since `prepareProposal` enforces `consentDeadline ≤ earliestQuoteExpiry` and `tick` cancels `proposed` at the deadline (`index.ts:93`), an expired quote is only observable on a cancelled subject or a committed one whose numbers are fixed (PS-025-03.R02).

**Quantity inventory.** `availableUnits = quantity − Σ quantity(active, unexpired holds)`; the hold page is bounded (limit 500) and fails closed (`nextCursor` ⇒ 0) like `held` (`listings/index.ts:37-42`). `reserve` checks `available ≥ input.quantity` and writes the hold in the same transaction; transactions are serialised (`packages/kernel/src/storage/storage.ts:1,14`) with one writer per vault (`indexeddb.ts:3-5`), so concurrent dispatches cannot over-commit; replays return the stored response.

**State machines.**
- InventoryHold: `active → released` (release, subject release), `active → expired` (clock, lazy). Terminal: released, expired. Quantity immutable.
- Listing quantity: `set_quantity(q)` guard `q ≥ reserved` else `BAZAAR_INVENTORY_BELOW_RESERVED`; updates `onHand`.
- Coordination: states unchanged (`index.ts:29`); new rejections never mutate; freezes are the existing ones plus capacity-aware `conflicting_promise`.
- Compensation leg (derived): `proposed` (coordination `proposed`) → `due` (`committed`); `withdrawn` (`cancelled`/`declined`); `held` (`frozen`, kept for recovery, PS-026-03.R02).

**Capacity-aware conflicts.** `conflictingSubjects(states, now, {capacity?})` groups unexpired reservations by `[giver, itemId]` (`index.ts:182`); `demand = Σ (leg.quantity ?? 1)` over distinct non-terminal subjects; `cap = capacity?.(giver, itemId) ?? 1`; conflict iff `subjects > 1 ∧ demand > cap` — today's rule when the callback is absent. The repository passes `ownCapacity` only for `giver === ctx.actor.id`.

**Matching engine.** Unchanged by default; with `options.normalization` the currency gate (`index.ts:146`) admits convertible currencies and `score` (86-97) uses converted leg totals. `inputHash` (122) includes `normalization` only when supplied. Bounds unchanged (2000/20000/L≤8/100k/250 ms/500).

## 4. Public API

`packages/mutiny/src/value_balancing/money.ts`
```ts
export interface Money { readonly amount: string; readonly currency: string }
export interface FxQuote { readonly id: string; readonly base: string; readonly quote: string; readonly rate: { readonly num: string; readonly den: string }; readonly source: string; readonly asOf: string; readonly expiresAt: string }
export const CURRENCY_DECIMALS: Readonly<Record<string, number>>;
export const moneyErrors = defineErrors({ COMMERCE_CURRENCY_UNKNOWN: { status: 422, retryable: false }, COMMERCE_MONEY_INVALID: { status: 422, retryable: false }, COMMERCE_MONEY_OVERFLOW: { status: 422, retryable: false } });
export function decimalsOf(code: string): Result<number, AppError>;
export function parseMinor(amount: string): Result<bigint, AppError>;
export function formatMinor(value: bigint): string;
export function roundHalfEvenDiv(numerator: bigint, denominator: bigint): bigint;
export function parseQuote(input: unknown): Result<FxQuote, AppError>;
export function convertMinor(amount: bigint, from: string, quote: FxQuote): Result<bigint, AppError>; // throws TypeError on pair mismatch
```
`value_balancing/tolerance.ts`
```ts
export interface ToleranceParams { readonly bps: number; readonly absoluteMinMinor: string }
export const DEFAULT_TOLERANCE: ToleranceParams; // { bps: 500, absoluteMinMinor: '500' }
export function toleranceFor(given: bigint, received: bigint, params: ToleranceParams): bigint;
```
`value_balancing/planner.ts`
```ts
export interface NetPosition { readonly participant: string; readonly given: bigint; readonly received: bigint; readonly tolerance: bigint; readonly accepted: boolean }
export interface PlannedLeg { readonly payer: string; readonly payee: string; readonly amount: bigint }
export function planCompensation(positions: readonly NetPosition[]): { readonly legs: readonly PlannedLeg[]; readonly residuals: Readonly<Record<string, bigint>> };
```
`value_balancing/terms.ts`
```ts
export const PROPOSAL_TERMS_V = 'classrup.alpha.proposal_terms/v1';
export interface CompensationLeg { readonly payer: string; readonly payee: string; readonly money: Money; readonly quoteId?: string }
export interface ProposalTerms { readonly v: typeof PROPOSAL_TERMS_V; readonly settlementCurrency: string; readonly tolerance: ToleranceParams & { readonly overrides?: Readonly<Record<string, ToleranceParams>> }; readonly quotes?: readonly FxQuote[]; readonly compensation?: readonly CompensationLeg[]; readonly acceptedImbalances?: readonly string[] }
export interface TermsInput { readonly settlementCurrency: string; readonly tolerance?: ToleranceParams; readonly overrides?: Readonly<Record<string, ToleranceParams>>; readonly quotes?: readonly FxQuote[]; readonly acceptedImbalances?: readonly string[] }
export const valueErrors = defineErrors({ MUTINY_VALUE_OUT_OF_TOLERANCE: {422}, MUTINY_QUOTE_STALE: {410}, MUTINY_QUOTE_TOO_SHORT: {422}, MUTINY_QUOTE_SOURCE_UNLABELLED: {422}, MUTINY_NORMALIZATION_MISMATCH: {409}, MUTINY_NORMALIZATION_LIMIT: {422}, MUTINY_COMPENSATION_LIMIT: {409}, MUTINY_COMPENSATION_PARTY_INVALID: {422} }); // all retryable: false
export function parseTerms(input: unknown): ProposalTerms;                                    // throws TypeError('<CODE>')
export function buildTerms(legs: readonly MatchEdge[], input: TermsInput, createdAt: number): ProposalTerms; // canonical, planned
export function verifyTerms(snapshot: ProposalSnapshot): void;                                // throws TypeError('<CODE>')
export interface ValueVerdict { readonly ok: boolean; readonly code?: string; readonly warnings: readonly ('QUOTE_EXPIRING')[]; readonly participants: Readonly<Record<string, { given: string; received: string; tolerance: string; residualAfter: string; status: 'within' | 'compensated' | 'accepted' | 'out_of_tolerance' }>> }
export function evaluateValueFeasibility(proposal: Proposal, options: { readonly now: number; readonly participant?: string; readonly localTolerance?: ToleranceParams }): ValueVerdict;
export function compensationLegs(state: CoordinationState): readonly (CompensationLeg & { readonly status: 'proposed' | 'due' | 'withdrawn' | 'held' })[];
```
Pure functions throw `TypeError(code)` like `trade_proposals/index.ts:130`; handlers collapse to `VALIDATION_FAILED` (`repository.ts:127`). `value_balancing/index.ts` re-exports; `packages/mutiny/src/index.ts` adds `export * from './value_balancing/index.ts'`.

Additive signatures:
```ts
// cycle_matching/index.ts
export interface MatchEdge { /* unchanged */ readonly quantity?: number }
export interface MatchOptions { /* unchanged */ readonly normalization?: { readonly settlementCurrency: string; readonly quotes: readonly FxQuote[] } }
// cycle_matching/admission.ts
export const WANT_QUANTITY_EXT = 'classrup.alpha.want_quantity/v1';
export function parseWantExtensions(ext: unknown): { readonly quantity: number };   // 1 when absent
export interface AdmissionOptions { /* unchanged */ readonly normalization?: MatchOptions['normalization'] }
// trade_proposals/index.ts
export interface ProposalSnapshot { /* unchanged */ readonly terms?: ProposalTerms }
export function conflictingSubjects(states: readonly CoordinationState[], now: number, options?: { readonly capacity?: (giver: string, itemId: string) => number | undefined }): readonly string[];
// trade_proposals/repository.ts
export interface MutinyOptions { /* unchanged */ readonly ownCapacity?: (ctx: CommandContext, itemId: string) => number | undefined }
// packages/bazaar/src/listings/index.ts
export function availableUnits(ctx: CommandContext | QueryContext, listingId: string): number;   // fails closed to 0
export function ownReservationExists(ctx, subjectId, revisionHash, itemId, requiredExpiry, quantity = 1): boolean;
export const bazaarInventoryErrors = defineErrors({ BAZAAR_INVENTORY_INSUFFICIENT: {409}, BAZAAR_INVENTORY_BELOW_RESERVED: {409}, BAZAAR_INVENTORY_HOLD_LIMIT: {409} });
// new command bazaar.inventory.set_quantity (module F01.S03.M01, capability bazaar.inventory.reserve, idempotent)
//   input z.strictObject({ listingId: uuidv7(), expectedRevision: z.int().min(1), quantity: z.int().min(0).max(100000) })
// bazaar.inventory.reserve input gains quantity: z.int().min(1).max(100000).default(1)
```
`reserve` keeps returning `CONFLICT_STATE` when units are missing (asserted at `tests/integration/mutiny-persistence.test.ts:190` and `listings.test.ts:63`) with `params: { reason: 'BAZAAR_INVENTORY_INSUFFICIENT' }`; `publish` availability becomes `availableUnits ≥ 1` (today `onHand === 1 && !held`, line 96).

**Composition.** `prepareProposal` (`index.ts:69-86`) parses `terms` via `parseTerms`, calls `verifyTerms`, relaxes the single-currency rule only when `terms.quotes` exists; `exact()` at `index.ts:72` gains `terms` as optional. `recheckProposal` (`admission.ts:120-124`) returns `feasible = graph ∧ evaluateValueFeasibility(...).ok`. `coordinationSchema.parse` (`repository.ts:117,122,151`) accepts the widened shapes; `reconstructCoordination` (30-60) re-runs `prepareProposal`, so restores recompute the plan from signed evidence. `hasLocalReservation` reads the leg quantity from `proposal.snapshot.legs` and passes it to `ownReservationExists`. Reservation statements and the `reserve` payload (`listings/index.ts:151`) are unchanged.

**Compatibility.** Old snapshots: same keys, hash and acceptance. Old coordination, listing, hold and want records parse unchanged. New snapshots shown to old software are rejected by `exact()`/`strictObject` — fail closed, never a silent downgrade.

## 5. Threat model and failure handling

| Threat | Control | Outcome |
|---|---|---|
| Valuation lie (inflated `valueMinor`) | values come only from the giver's signed projection (`admission.ts:108`) and recheck equality; counterparties consent to exact legs | consent-bound (limit) |
| Hidden/altered leg, extra payee, leg to non-participant | recomputation (`MUTINY_NORMALIZATION_MISMATCH`), `MUTINY_COMPENSATION_PARTY_INVALID`, `MUTINY_COMPENSATION_LIMIT` | reject, no mutation |
| Stale quote, lifetime > 24 h, deadline after expiry, quote replayed from another subject | `MUTINY_QUOTE_STALE`, `MUTINY_QUOTE_TOO_SHORT`; content embedded and hashed; expiry ⇒ deadline passed ⇒ `consent_timeout` | reject at prepare; cancel by clock; re-quote is a revision clearing consents (`index.ts:139`) |
| Rate manipulation by proposer | mandatory `source` (`MUTINY_QUOTE_SOURCE_UNLABELLED`), every vault recomputes, consent on the exact rate | consent-bound (limit) |
| Rounding attack (per-unit rounding × quantity, half-way drift) | one HALF_EVEN rounding over the leg total; symmetry; floor tolerance | boundary tests |
| Tolerance gaming (looser local policy, omitted terms, spoofed override) | local policy stricter-only; terms-less ⇒ default; overrides pinned and recomputed | out_of_tolerance ⇒ no consent |
| Over-commitment across concurrent proposals | availability and hold in one serialised transaction; idempotent replay; `set_quantity` refuses below reserved | `CONFLICT_STATE` / `BAZAAR_INVENTORY_BELOW_RESERVED` |
| Replayed hold or reservation for another revision | hold keyed by `holdId` (`expectedRevision: 0`); reservation bound to `revisionHash` and `itemId` (`index.ts:160`) | duplicate ignored (`index.ts:147`); `MUTINY_CONSENT_STALE_REVISION` |
| Same units promised to several cycles | own vault capacity-aware; peers single-unit rule | freeze both, release own holds (`repository.ts:119,124`) |
| Forked terms | `fork_detected` (`index.ts:137`) | freeze |
| Clock games (rewind to revive a quote; future-dated statements) | monotone `lastObservedAt` (`index.ts:92`); +5 min skew cap (`envelope.ts:115`); quote rules relative to `createdAt`, verdicts to `now` | cannot revive; `MUTINY_CONSENT_LATE` |
| Resource exhaustion | 30-digit `valueMinor`, 40-digit rates, 38-digit results, ≤ 7 quotes/legs, 8 KiB terms, 1 MiB envelope (`envelope.ts:4`) | reject before arithmetic |
| Unknown ext key / unregistered currency crashing the engine (map §9) | admission rejects (counted) instead of throwing; `validateEdge` rejects unregistered | excluded from graph |
| Restored forged commitment | `restore_requires_review` (`repository.ts:57`) plus recomputation | frozen |

Freeze is reserved for conflicting *signed* evidence (forks, double promises, lost local hold); every malformed or economically invalid statement is rejected without mutation; expiry is a terminal cancel via the deadline. Codes are typed with `defineErrors` (`packages/kernel/src/errors/app-error.ts:59-70`).

## 6. Test plan

Unit tests sit beside the module (`packages/mutiny/src/value_balancing/*.test.ts`, `packages/bazaar/src/listings/listings.test.ts`); integration tests in `tests/integration/mutiny-value-balancing.test.ts` and `mutiny-value-quantity.test.ts`. fast-check 4.10.2 with recorded seeds; `monotonicNow: () => 0` and `createFakeClock`. IDs use the `ps` field of `planning/modules.yaml` (F02.S04.M01 → PS-026, F02.S04.M02 → PS-025, F02.S02.M05 → PS-016, F02.S03.M02 → PS-023, F01.S03.M01 → PS-008, F09.S03.M01 → PS-073, F09.S03.M02 → PS-075, F09.S03.M03 → PS-074; F02.S04.M03 receives no test because valuation flags are deferred). Rows marked *new* are appended after the last row of the owning `module.spec.yaml` (`covers` only existing requirement IDs, no placeholder words).

1. **TEST-PS-026-09.T17** (*new*: `T17 | unit | 01.R02 | existing proposal_revision/v1 snapshot without terms or quantities | revisionHash equals the recorded golden value and the snapshot opens`) — 3-leg CAD ring, `createdAt = 2026-11-09T12:00Z`, deadline +1 h, window 1 d, DIDs `did:key:z6MkA/B/C`; expect `0c6fbc18…d09d`, `openCoordination` succeeds, `node:crypto` recomputation matches.
2. **TEST-PS-074-09.T01** — `parseMinor` accepts `0`, `-1`, 38 digits; rejects `+1`, `01`, `1.0`, `1e3`, `-0`, 39 digits.
3. **TEST-PS-074-09.T03** (property, 10 000 runs) — random amount ≤ 30 digits, `num`/`den` ≤ 20 digits, exponents 0..18: `convertMinor` equals an in-test exact-fraction oracle.
4. **TEST-PS-074-09.T06** (property) — sign symmetry; exact halves to even.
5. **TEST-PS-074-09.T02** — mismatched pair throws; `den = 0` ⇒ `COMMERCE_MONEY_INVALID`.
6. **TEST-PS-074-09.T16** (*new*: `T16 | property | 03.R02,07.R03 | leg totals with random quantities and oversized inputs | one rounding over the total, bounds rejected before bigint growth`).
7. **TEST-PS-073-09.T02** — `decimalsOf('XXX9')`, `'cad'` ⇒ `COMMERCE_CURRENCY_UNKNOWN` with code in params.
8. **TEST-PS-073-09.T14** (*new*: `T14 | unit | 01.R03,02.R02 | registry subset decimals | CAD 2, JPY 0, BHD 3, BTC 8, ETH 18, USDC 6; unknown rejected`).
9. **TEST-PS-025-09.T01** — 12000 EUR, 10000 GBP × 117/100, 10990 CHF × 1043/1000 ⇒ `12000, 11700, 11463`; terms hash stable across builds.
10. **TEST-PS-025-09.T04** and **TEST-PS-016-09.T18** — `500 EUR × 163/1 ⇒ 815 JPY`; `1/60000 ⇒ 8333 sat`.
11. **TEST-PS-025-09.T16** (*new*: `T16 | unit | 02.R03,03.R03 | cross-currency terms with deadline after the earliest expiry, a quote over 24 h, under 30 min left at creation, settlement outside leg currencies | MUTINY_QUOTE_TOO_SHORT, MUTINY_QUOTE_STALE, rejection; a fresh quote needs a new revision that clears consents`).
12. **TEST-PS-025-09.T17** (*new*: `T17 | abuse | 02.R02,05.R02 | duplicate quote ids, unused quote, rate num 0, non-canonical empty arrays, unlabelled source, terms over 8 KiB | each rejected; one economic content has one hash`).
13. **TEST-PS-026-09.T01** — fixture 20000/14000/16000 ⇒ `p2→p1 4000, p2→p3 2000`, residuals 0.
14. **TEST-PS-026-09.T02** (property) — 2..8 participants, values ≤ 10^12, random tolerances: Σ paid = Σ received, ≤ N−1 legs, every non-accepted residual ≥ −tol, identical output on repeated and reordered input.
15. **TEST-PS-026-09.T04** — accepted disadvantaged participant omitted, fewer legs; advantaged residual needs no acceptance.
16. **TEST-PS-026-09.T18** (*new*: `T18 | abuse | 02.R01,01.R02 | pinned leg off by one minor unit, extra leg, payee outside the ring, payer equals payee, eight legs | MUTINY_NORMALIZATION_MISMATCH, MUTINY_COMPENSATION_PARTY_INVALID or MUTINY_COMPENSATION_LIMIT and nothing stored`) — via `prepareProposal` and via `mutiny.coordination.ingest` (`VALIDATION_FAILED`, record unchanged).
17. **TEST-PS-026-09.T19** (*new*: `T19 | unit | 03.R01,03.R02 | derived leg status | proposed, due on commit, withdrawn on cancel or decline, held on freeze`).
18. **TEST-PS-016-09.T02** — gap at tolerance passes, one unit above fails, absolute minimum 500 wins when 5 % is smaller.
19. **TEST-PS-016-09.T22** — unsigned local acceptance fails; signed `acceptedImbalances` entry passes.
20. **TEST-PS-016-09.T23** (*new*: `T23 | unit | 02.R02,02.R03 | terms-less imbalanced proposal under default tolerance, then the same ring with pinned terms | infeasible for the disadvantaged participant, feasible once compensated; equal-value terms-less proposals stay feasible`).
21. **TEST-PS-016-09.T24** (*new*: `T24 | unit | 02.R02 | stricter local tolerance and pinned override | local verdict out_of_tolerance until the override is pinned and the plan recomputed`).
22. **TEST-PS-075-09.T04** — clock at `expiresAt − 1 s` ⇒ feasible with `QUOTE_EXPIRING`; at `expiresAt` ⇒ `MUTINY_QUOTE_STALE`; committed subject ignores expiry.
23. **TEST-PS-075-09.T14** (*new*: `T14 | unit | 01.R01,04.R03 | pinned quote parse and id binding | identical embedded content required; a changed rate changes revisionHash`).
24. **TEST-PS-008-09.T01** — quantity 3: reserve 2, 1, 1 ⇒ ok, ok, `CONFLICT_STATE` (`reason BAZAAR_INVENTORY_INSUFFICIENT`); `availableUnits` 1 then 0.
25. **TEST-PS-008-09.T18** (*new*: `T18 | unit | 01.R01,02.R02 | set_quantity below reserved, to zero, legacy record without quantity | BAZAAR_INVENTORY_BELOW_RESERVED, onHand follows quantity, legacy record reads as quantity 1`).
26. **TEST-PS-008-09.T05** — `Promise.all` of 6 reserves of 1 on quantity 4 ⇒ exactly 4 succeed.
27. **TEST-PS-008-09.T10** — replayed reserve with the same key returns the same hold; units taken once.
28. **TEST-PS-023-09.T23** (*new*: `T23 | property | 06.R02,03.R01 | fast-check model of reserve, release, set_quantity and clock across concurrent subjects | active hold quantities never exceed the listing quantity; replay never takes units twice`) — `fc.commands`, ≥ 500 runs, seed printed.
29. **TEST-PS-023-09.T04** — two subjects over one single-unit item: one succeeds, the other `CONFLICT_STATE` without naming the first.
30. **TEST-PS-023-09.T24** (*new*: `T24 | unit | 02.R03,06.R04 | capacity-aware own conflicts | within capacity both stay proposed, beyond capacity both freeze; peer reservations keep the single-unit rule`).
31. **TEST-PS-023-09.T10** — peer double promise for a quantity-2 leg freezes both subjects.
32. **Integration** (`mutiny-value-balancing.test.ts`; PS-026 T18 and PS-025 T16 at the kernel path): three real principals (scenario of `mutiny-persistence.test.ts:44-147`) with 20000/14000/16000 CAD build terms, sign, reserve, consent, commit; `compensationLegs` reports two `due` legs; a tampered amount is rejected by every vault; a CAD/EUR ring with a 2 h quote commits before expiry and cancels after it.
33. **Negative** (`mutiny-value-quantity.test.ts`): ext `quantity: 1`, `0`, non-integer, foreign key ⇒ rejected; explicit leg `quantity: 1` ⇒ `prepareProposal` throws; a 1-unit hold for a 2-unit leg ⇒ consent `PRECONDITION_FAILED`.

Existing suites run unchanged; `pnpm spec:check` stays at 0 errors with no new warnings because appended rows add no error codes, events or capabilities.

## 7. Open questions resolved

- **Where do new terms live?** Optional `terms` with its own `v`, not a new type: `/v2` is forbidden (`envelope.ts:91`) and consent/reservation already bind `revisionHash`.
- **Where does want quantity live?** Signed `ext` keyed by version: payload keys are closed (`admission.ts:33`); an unaware peer builds a quantity-1 edge that can never commit against a quantity leg.
- **Unit or total `valueMinor`?** Unit, as declared in the signed listing; totals derived, recheck equality kept.
- **Quantity canonical form?** Present iff ≥ 2; explicit `1` rejected.
- **Absolute-minimum default?** `500` minor units of the settlement currency, pinned in terms; the EUR-reference conversion of PS-016 needs a quote single-currency cycles lack (map §7 gap).
- **Settle to zero or to the edge?** Zero (PS-026 T01); same leg count, simpler verification.
- **Who must accept imbalance?** Only the disadvantaged (MNY-5); advantaged residuals never fail.
- **Negotiated legs?** Rejected: a UI-less custom leg is an unreviewable obligation.
- **Peer conflicts with quantities?** Single-unit rule for peers, capacity for own items; liveness loss is accepted over silent over-commitment.
- **Terms-less proposals?** Default tolerance at feasibility only, never at ingest, so fixtures and hashes stay untouched.
- **Error style?** `defineErrors` registries; pure functions throw `TypeError(code)` as today; `reserve` keeps `CONFLICT_STATE`.
- **Quote clock?** Creation rules relative to `createdAt` (deterministic restore); staleness relative to injected `now` (PS-016-03.R02); the deadline invariant reconciles both.

## 8. Honest limits

- Compensation legs are signed obligations, not payments; nothing evidences settlement, and an alpha cycle can finish with legs unpaid.
- Quotes are proposer-asserted; established is consent to an exact rate, not fairness or provenance. `source` is a label, not a signature.
- Declared values are unverified claims; tolerance guards arithmetic drift, not collusion or lying givers.
- Quantity availability is proven only in the giver's vault (PS-008-06.R03); peers freeze conservatively, so multi-unit listings serve overlapping cycles only sequentially.
- The planner is deterministic and ≤ N−1 legs but not globally leg-minimal.
- Projections still expose only `available`/`unavailable`; a k-unit want against a thinner giver fails at that giver's reservation, not earlier.
- `onHand` and `quantity` coexist under a writer-kept invariant, not a schema constraint.
- Runtime wiring is a follow-up outside this slice: `apps/pwa/src/barter-runtime.ts:36-63` must pass leg quantity to `ownReservationExists`, AND `evaluateValueFeasibility` into the verdict, supply `ownCapacity`, and read `quantity` instead of `onHand === 1` (`barter-runtime.ts:44`, `barter.ts:140`); `barter.ts` must call `buildTerms`, render legs, quotes and acceptances before consent, and expose `set_quantity`.
- No latency budget is claimed; matcher timing truncation stays machine-dependent.
