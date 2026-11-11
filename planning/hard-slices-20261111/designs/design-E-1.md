# Design E-1 — Value balancing, compensation legs, pinned FX quotes, quantity-aware wants and holds

Lens: algorithm and numerical design. Paths are relative to `/home/user/CLASSifiedisRUPTed`; `file:line` cites the alpha head (429fcfc).

## 1. Summary and scope

One new pure module `packages/mutiny/src/value_balancing/` (`money.ts`, `balance.ts`, `index.ts`) plus strictly additive edits to the closed key sets of `maps/mutiny.md` §8. New terms ride on an **explicitly versioned optional section** of the existing `classrup.alpha.proposal_revision/v1` snapshot (`balance: {v: 1, …}`) and on optional leg/want fields, because federation admits only type names matching `/^classrup\.[a-z][a-z0-9_.]{0,100}\/v1$/` (`packages/federation/src/envelope.ts:91`), so a `/v2` statement is impossible without touching slice A. A snapshot without `balance` and legs without `quantity` serialise byte-for-byte as today, so old digests and meanings are unchanged; old receivers reject the new keys through `exact()` (`packages/mutiny/src/trade_proposals/index.ts:49`), which is fail-closed.

MVP: (1) currency registry (ISO 4217 subset, BTC 8, ETH 18, USDC 6), `parseMinor` (MNY-1, 38 digits), HALF_EVEN/FLOOR `roundDiv`, `convert` exactly as MNY-4 with one rounding, quote parsing/status, decimal-rate parsing; (2) per-participant positions with quantities and quotes, MNY-5 tolerance with per-participant overrides, deterministic integer compensation planner with termination and minimality proofs, section parser/verifier, feasibility re-evaluation, derived leg status; (3) quantity: `requestedQuantity` on wants, `quantity` on edges/legs (canonical: present iff ≥ 2), `onHand` 0..100000, unit-counting holds, `bazaar.inventory.set_quantity`, unit-aware `ownReservationExists`, property test for no over-commitment; (4) optional `settlement` option for admission/engine so mixed-currency rings can be discovered when quotes are supplied (omitted ⇒ byte-identical behaviour and `inputHash`).

Deferred: (a) claim/acknowledge/dispute/expiry of compensation legs (PS-026 claim states) — `packages/commerce` is spec-only (`packages/commerce/package.json`), no Deal/PaymentClaim exists, and the task forbids settlement claims; legs are obligations evidenced by the consent signature over the revision hash. (b) Manual plans (`basis: 'manual'`) — needs a negotiation UI; the field is versioned so the value is additive later. (c) Signed rate sources and deviation checks — no RateSourcePort exists; quotes are proposer-stated, labelled `sourceSigned: false`. (d) Quantity-aware peer conflict detection — peers never see stock (PS-008-01.R03), so a capacity oracle would give giver and peers different verdicts; the item-level freeze stays. (e) USDC as a *leg* currency — leg currency is `/^[A-Z]{3}$/` in three closed places (`cycle_matching/index.ts:56`, `trade_proposals/index.ts:65`, `repository.ts:8`); USDC works as settlement/quote currency only. (f) PWA wiring (§4).

## 2. Data model and formats

### 2.1 Snapshot of `classrup.alpha.proposal_revision/v1` (name unchanged)

```json
{ "subjectId": "…", "coordinatorId": "did:key:z6Mk…", "revisionNo": 1, "previousHash": null,
  "legs": [ { "...the nine existing MatchEdge keys unchanged...": "", "valueMinor": "12000", "currency": "EUR", "quantity": 3 } ],
  "createdAt": 1762689600000, "consentDeadline": 1762693200000, "executionWindowMs": 86400000,
  "balance": { "v": 1, "settlementCurrency": "EUR",
    "tolerance": { "bps": 500, "absoluteMinMinor": "500", "overrides": { "did:key:z6Mk…": { "bps": 1000 } } },
    "quotes": [ { "id": "usd-eur-20261109", "base": "USD", "quote": "EUR", "rate": { "num": "92", "den": "100" }, "source": "manual:coordinator",
                  "sourceSigned": false, "asOf": "2026-11-09T11:00:00.000Z", "expiresAt": "2026-11-10T10:00:00.000Z" } ],
    "basis": "gap_plan",
    "compensation": [ { "payerId": "…", "payeeId": "…", "amount": { "amount": "4000", "currency": "EUR" }, "quoteIds": ["usd-eur-20261109"] } ] } }
```

Rules, enforced in `prepareProposal` (`trade_proposals/index.ts:69-86`), which every open/revise/restore path uses (`:123`, `:132`, `repository.ts:40`):
- `quantity`: integer 2..99, present iff ≥ 2; `quantity: 1` rejected as non-canonical. Absent = one unit = today's meaning.
- `balance` optional. Absent ⇒ legacy semantics (same-currency rule `:80`, no tolerance enforcement). Present ⇒ keys exactly `v, settlementCurrency, tolerance, quotes, basis, compensation`, `v === 1`, `basis === 'gap_plan'`; other values rejected.
- `settlementCurrency` registered; `tolerance.bps` 0..2000; `absoluteMinMinor` decimal integer ≤ 38 digits; `overrides` ≤ 8 keys, each a ring giver, `bps` 0..10000 (10000 = full waiver by the disadvantaged party).
- `quotes`: 0..8, sorted by `id`, unique ids, `quote === S`, `base ≠ quote`, `base` registered and equal to a leg currency, exactly one quote per leg currency ≠ S, no unused quote; `num`/`den` positive integers ≤ 40 digits; `source` 1..64 chars; `sourceSigned` must be `false`; `asOf`, `expiresAt` canonical ISO; `0 < expiresAt − asOf ≤ 24 h`; `asOf ≤ createdAt + 5 min`; `expiresAt ≥ createdAt + 30 min`. Distinct currencies (legs ∪ S) ≤ 5.
- Deadline (N16): if `quotes.length > 0`, `consentDeadline ≤ createdAt + 24 h` and `≤ min(expiresAt)`; otherwise the existing 1 h..7 d window.
- Mixed leg currencies are legal iff `balance` covers them.
- `compensation`: ≤ min(7, N−1) legs; `payerId ≠ payeeId`, both givers; `amount.currency === S`; `amount.amount` positive ≤ 38 digits; `quoteIds` sorted, unique, drawn from `quotes`, present iff non-empty; must equal the recomputed plan (§3.3) exactly, else `MUTINY_NORMALIZATION_MISMATCH`.
- Worst-case size ≈ 7 KiB ≪ 1 MiB envelope.

`revisionHash = sha256Hex(canonicalJson(snapshot))` (`:85`; `packages/kernel/src/hash/canonical.ts:36-47`) now covers quantities, quotes, tolerance and compensation; consent/reservation/withdrawal payloads stay unchanged because they bind `revisionHash`.

### 2.2 Want `classrup.alpha.want/v1`
`{ offeringListingCid, requestedListingCid, expiresAt, requestedQuantity?: 1..99 }`. `parseWant` (`cycle_matching/admission.ts:30-37`) accepts either key set; `Want.requestedQuantity` is present iff ≥ 2.

### 2.3 Reservation `classrup.alpha.reservation/v1` — unchanged
`{subjectId, revisionHash, giverId, itemId, expiresAt, holdId}`. The promised unit count is the giver's leg `quantity` in the revision named by `revisionHash`; legacy revisions have none, so the statement means one unit, as today. `validatePublicationRecord` (`packages/bazaar/src/listings/index.ts:195`) is untouched.

### 2.4 Bazaar and coordination records (additive)
- `listingSchema.onHand`: `z.int().min(0).max(100000)` (was `.max(1)`, `listings/index.ts:14`).
- `holdSchema` (`:20`): `+ quantity: z.int().min(1).max(99).default(1)`; old rows parse to 1 and `repo.put` stores the parsed value (`kernel/src/storage/repo.ts:172-175`).
- Derived, never stored: `reservedUnits = Σ quantity of active holds with expiresAt > now`; `available = onHand − reservedUnits`. Public projection keeps binary `availability` (`:48`): `available ≥ 1`.
- `repository.ts:8,11`: edge `+ quantity: z.int().min(2).max(99).optional()`, snapshot `+ balance: balanceSchema.optional()`. zod 4 leaves absent keys absent (verified), so legacy records and backups round-trip unchanged; no migration.

### 2.5 Error codes
Pure parsers keep the repository convention `throw new TypeError(code)` (`trade_proposals/index.ts:130,135`) with spec-owned codes: `COMMERCE_CURRENCY_UNKNOWN`, `COMMERCE_MONEY_INVALID`, `COMMERCE_MONEY_OVERFLOW`, `COMMERCE_RATE_PAIR_INVALID`, `MUTINY_NORMALIZATION_LIMIT`, `MUTINY_QUOTE_UNAVAILABLE`, `MUTINY_QUOTE_TOO_SHORT`, `MUTINY_QUOTE_STALE`, `MUTINY_QUOTE_SOURCE_UNLABELLED`, `MUTINY_DEADLINE_INVALID`, `MUTINY_NORMALIZATION_MISMATCH`, `MUTINY_VALUE_OUT_OF_TOLERANCE`, `MUTINY_COMPENSATION_PARTY_INVALID`, `MUTINY_COMPENSATION_LIMIT`. Money primitives return `Result` from `moneyErrors = defineErrors(...)` (`kernel/src/errors/app-error.ts:59-70`); a quote whose pair does not match throws `TypeError('COMMERCE_MONEY_CURRENCY_MISMATCH')` (MNY-6). Bazaar adds `defineErrors({ BAZAAR_INVENTORY_INSUFFICIENT: 409, BAZAAR_INVENTORY_BELOW_RESERVED: 409, BAZAAR_INVENTORY_HOLD_LIMIT: 412 })`; pre-existing failure paths keep `CONFLICT_STATE`.

## 3. Algorithms and state machines

### 3.1 Integer money
- `parseMinor(s)`: `/^-?(0|[1-9][0-9]{0,37})$/` and `s !== '-0'` ⇒ `BigInt(s)`; longer runs ⇒ `COMMERCE_MONEY_OVERFLOW`; else `COMMERCE_MONEY_INVALID`. No `Number`/`parseFloat` anywhere.
- `roundDiv(n, d, mode)`, `d > 0` (else `TypeError`): `q = n / d` (bigint truncates toward zero), `r = n − q·d` (sign of `n`), `s = n < 0 ? −1 : 1`. HALF_EVEN: `2|r| < d ⇒ q`; `2|r| > d ⇒ q + s`; `2|r| = d ⇒ q` if `q` even else `q + s`. FLOOR: `q` if `r ≥ 0` else `q − 1`. Symmetry `round(−x) = −round(x)` follows (`−7/2`: `q=−3, r=−1`, tie, `q` odd ⇒ `−4`).
- `convert(amount, quote, db, dq) = roundDiv(amount × num × 10^dq, den × 10^db)` — one rounding (MNY-3/4). Checks: `12345×16312/(100×10^2) = 20137.164 → 20137`; `10990×1043/1000 → 11463`; `500 EUR ×163/1 → 815 JPY`; `500 EUR ×1/60000 → 8333` sat.
- `parseDecimalRate('1.0870')`: `num = 10870, den = 10^4`, divide by `gcd` ⇒ `1087/1000`; ≤ 18 fractional, ≤ 20 integer digits.
- Magnitudes: intermediate products ≤ 30 + 2 + 40 + 18 = 90 digits, exact in bigint; settled values re-bounded to 38 digits (`COMMERCE_MONEY_OVERFLOW`).

### 3.2 Positions
Leg ℓ = (giver g, receiver r, unit value v, currency c, quantity q): `legValue = v × q` (exact, in c); `settled(ℓ) = c = S ? legValue : convert(legValue, quote(c→S))` — one rounding per leg on the whole amount, never per unit. `given_p = Σ_{g=p} settled`, `received_p = Σ_{r=p} settled`, `net_p = received_p − given_p` (positive = debtor), `larger_p = max(given_p, received_p)`, `tol_p = max(floor(larger_p × bps_p / 10000), absMin_p)` with `bps_p = overrides[p].bps ?? bps`, `absMin_p = overrides[p].absoluteMinMinor ?? absoluteMinMinor`. Floor is the conservative placement; `gap = tol` passes, `tol + 1` fails. `Σ_p net_p = 0` exactly, because each `settled(ℓ)` is added once and subtracted once. `quoteIds_p` = sorted ids of quotes applied to legs touching p.

### 3.3 Compensation planner
```
r[p] ← net[p]; legs ← []
while ∃p: |r[p]| > tol[p]:
  payers ← {p: r[p] > 0} sorted by (r[p] > tol[p] desc, r[p] desc, p asc)
  payees ← {p: r[p] < 0} sorted by (−r[p] > tol[p] desc, −r[p] desc, p asc)
  a ← payers[0]; b ← payees[0]; t ← min(r[a], −r[b])
  r[a] −= t; r[b] += t; legs.push({payer a, payee b, amount t, quoteIds: sort(quoteIds_a ∪ quoteIds_b)})
```
- *Well-defined*: inside the loop some `|r[p]| > tol[p] ≥ 0`, so `r[p] ≠ 0`; `Σ r = 0` is preserved by every transfer, hence a positive and a negative residual exist and `t ≥ 1`.
- *Termination, ≤ N−1 legs*: each iteration drives `a` or `b` to exactly 0; a zero residual is never selected or modified again; with one payer and one payee left, `r[a] = −r[b]` and the last leg zeroes both. Iterations ≤ |{p: net_p ≠ 0}| − 1 ≤ N − 1 ≤ 7 (PS-026 V04).
- *Correctness*: exit only when all are within tolerance; residuals move monotonically toward 0, so an in-tolerance participant never leaves tolerance.
- *Conservation*: Σ paid = Σ received = Σ t; no conversion, no rounding (PS-026-01.R03).
- *Determinism*: DIDs are unique, so each sort is a total order; input leg order is irrelevant.
- *Minimality (precise)*: the triples form a fixed sequence `G(net, tol)`, the full-settlement largest-first greedy; the plan is the shortest prefix of `G` after which all residuals are within tolerance, since any shorter prefix violates the loop guard. A global minimum transfer count is not claimed: with `tol = 0` it is the NP-hard zero-sum partition problem.
- Fixture 20000/14000/16000: `net = (−4000, +6000, −2000)`, `tol = (1000, 1000, 800)` ⇒ `p2→p1 4000`, `p2→p3 2000`, residuals 0.
- Complexity: O(N² log N) comparisons on ≤ 38-digit bigints, positions O(L), L ≤ 8 — negligible against the engine's 250 ms budget.

### 3.4 Verification and feasibility
`parseBalanceSection` validates §2.1, recomputes positions and plan, requires `compensation` to equal the plan (`MUTINY_NORMALIZATION_MISMATCH`), then checks residuals (`MUTINY_VALUE_OUT_OF_TOLERANCE`, defensive). `balanceFeasibility(snapshot, now)` re-runs it and requires every quote `expiresAt > now` (`MUTINY_QUOTE_STALE`). Because `consentDeadline ≤ min(expiresAt)`, a quote cannot expire while consent is possible: expiry before commit is subsumed by `consent_timeout` (`:93`); after commit it has no effect (PS-025-03.R02). Re-quoting is a revision (`reviseCoordination`, `:128-140`) with fresh quotes, which already clears consents and reservations.

### 3.5 State machines
- Coordination: states and transitions unchanged. New guards only: `prepareProposal` rejects malformed or mismatched balance (no state change); `recheckProposal` reports `feasible: false` when `balanceFeasibility` fails or `options.requireBalanceSection` is set and the snapshot has no section.
- Compensation leg (derived, nothing stored): `proposed` (coordination `proposed`) → `due` (`committed`, `dueAt = committedLocallyAt + 14 d`); `withdrawn` (`cancelled`/`declined`, terminal); `frozen` (`frozen`). Amounts and parties are immutable with the snapshot (PS-026-01.R02).
- Inventory hold: `active → released` or expired by time; availability counted in units; `set_quantity` guarded by `onHand ≥ reservedUnits`.
- Engine: `validateEdge` accepts `quantity` 2..99; `score` uses `settled(ℓ)`; ring compatibility = same currency or both convertible under `options.settlement`; ranking and greedy selection unchanged, so all existing bounds hold.

## 4. Public API

New files, re-exported by `packages/mutiny/src/index.ts` (`export * from './value_balancing/index.ts'`):

```ts
// packages/mutiny/src/value_balancing/money.ts
export type RoundingMode = 'HALF_EVEN' | 'FLOOR';
export interface CurrencyDef { readonly code: string; readonly decimals: number; readonly kind: 'fiat' | 'crypto'; readonly absoluteMinMinor: string }
export const CURRENCIES: Readonly<Record<string, CurrencyDef>>;                       // frozen table
export function currencyDef(code: string): Result<CurrencyDef, AppError>;               // COMMERCE_CURRENCY_UNKNOWN {code}
export function parseMinor(amount: string): Result<bigint, AppError>;
export function roundDiv(numerator: bigint, denominator: bigint, mode?: RoundingMode): bigint;
export interface FxQuote { readonly id: string; readonly base: string; readonly quote: string; readonly rate: { readonly num: string; readonly den: string };
  readonly source: string; readonly sourceSigned: false; readonly asOf: string; readonly expiresAt: string }
export function parseQuote(input: unknown): Result<FxQuote, AppError>;
export function quoteStatus(quote: FxQuote, now: number): 'valid' | 'expiring' | 'expired';   // expiring = < 30 min left
export function convert(amount: bigint, from: string, to: string, quote: FxQuote, mode?: RoundingMode): Result<bigint, AppError>;
export function parseDecimalRate(token: string): Result<{ num: string; den: string }, AppError>;

// packages/mutiny/src/value_balancing/balance.ts
export interface ToleranceConfig { readonly bps: number; readonly absoluteMinMinor: string; readonly overrides?: Readonly<Record<string, { readonly bps?: number; readonly absoluteMinMinor?: string }>> }
export interface CompensationLeg { readonly payerId: string; readonly payeeId: string; readonly amount: { readonly amount: string; readonly currency: string }; readonly quoteIds?: readonly string[] }
export interface BalanceSection { readonly v: 1; readonly settlementCurrency: string; readonly tolerance: ToleranceConfig; readonly quotes: readonly FxQuote[]; readonly basis: 'gap_plan'; readonly compensation: readonly CompensationLeg[] }
export interface Position { readonly participantId: string; readonly givenMinor: string; readonly receivedMinor: string; readonly netMinor: string; readonly toleranceMinor: string; readonly withinTolerance: boolean; readonly quoteIds: readonly string[] }
export interface BalanceReport { readonly positions: readonly Position[]; readonly compensation: readonly CompensationLeg[]; readonly residuals: readonly { participantId: string; residualMinor: string; withinTolerance: boolean }[]; readonly earliestQuoteExpiry: number | null }
export function defaultTolerance(settlementCurrency: string): ToleranceConfig;           // bps 500, registry absoluteMinMinor
export function planCompensation(positions: readonly Position[], settlementCurrency: string): readonly CompensationLeg[];   // §3.3
export function computeBalance(legs: readonly MatchEdge[], config: Pick<BalanceSection, 'settlementCurrency' | 'tolerance' | 'quotes'>): Result<BalanceReport, AppError>;
export function buildBalanceSection(legs: readonly MatchEdge[], config: Pick<BalanceSection, 'settlementCurrency' | 'tolerance' | 'quotes'>): Result<BalanceSection, AppError>; // coordinator side
export function parseBalanceSection(input: unknown, legs: readonly MatchEdge[], createdAt: number, consentDeadline: number): BalanceSection; // throws TypeError(code)
export function balanceFeasibility(snapshot: ProposalSnapshot, now: number): { readonly feasible: boolean; readonly code?: string; readonly report?: BalanceReport };
export interface CompensationLegView extends CompensationLeg { readonly legId: string; readonly subjectId: string; readonly revisionHash: string; readonly status: 'proposed' | 'due' | 'withdrawn' | 'frozen'; readonly dueAt: number | null }
export function compensationLegs(state: CoordinationState): readonly CompensationLegView[];   // legId = sha256Hex(canonicalJson([subjectId, revisionHash, index]))
```

Additive edits:
- `cycle_matching/index.ts`: `MatchEdge.quantity?: number`; `MatchOptions.settlement?: { currency: string; quotes: readonly FxQuote[] }`; `validateEdge` (`:54-59`) checks `quantity`; `score` (`:86-97`) uses settled values; line 146 uses `compatible(edge.currency, path[0].currency)`; `inputHash` (`:122`) spreads `...(settlement ? { settlement } : {})` so legacy hashes are unchanged.
- `cycle_matching/admission.ts`: `Want.requestedQuantity?`; `parseWant` (`:33`) accepts the optional key; the currency rejection (`:105`) is skipped when `options.settlement` covers both currencies; the edge (`:108`) gains `...(want.requestedQuantity ? { quantity } : {})`; `AdmissionOptions.settlement?`, `AdmissionOptions.requireBalanceSection?: boolean`; `recheckProposal` (`:120-124`) returns `legsAdmitted && balanceFeasibility(snapshot, now).feasible && (!requireBalanceSection || snapshot.balance !== undefined)`.
- `trade_proposals/index.ts`: `ProposalSnapshot.balance?: BalanceSection`; `edge()` (`:59-67`) strips and validates `quantity` like `receiverOfferingListingCid`; `prepareProposal` (`:72`) allows the optional key, replaces the same-currency rule (`:80`) with "same currency unless `balance` covers", calls `parseBalanceSection`, builds the snapshot with `...(balance ? { balance } : {})`.
- `trade_proposals/repository.ts`: zod additions (§2.4). `MutinyOptions` (`:21-28`) unchanged — callbacks receive the `Proposal` and read `leg.quantity`.
- `packages/bazaar/src/listings/index.ts`: `reservedUnits(ctx, listingId)` replaces `held` for availability (fails closed on `nextCursor`, `:40-41`; `held` stays for unpublish/archive); `publicProjection` gets `available = onHand − reservedUnits ≥ 1` (`:96`); `bazaar.inventory.reserve` (`:143-160`) input `+ quantity: z.int().min(1).max(99).default(1)`, guard `available ≥ quantity` else `BAZAAR_INVENTORY_INSUFFICIENT`, `onHand !== 1` becomes `onHand < 1`; new command `bazaar.inventory.set_quantity { listingId: uuidv7, expectedRevision ≥ 1, onHand: 0..100000 }` (module `F01.S03.M01`, capability `bazaar.inventory.reserve`, idempotent, emits `bazaar.listing.changed {action: 'quantity'}`, `BAZAAR_INVENTORY_BELOW_RESERVED` below `reservedUnits`, no re-publication); `ownReservationExists(…, requiredExpiry, quantity = 1)` requires `hold.quantity ≥ quantity` (`:177-183`); `releaseSubjectReservations` (`:201-217`) unchanged.

Compatibility: a coordinator omitting `balance` emits exactly today's snapshot; `revisionHash`, `cycleKey`, `inputHash` for legacy inputs are byte-identical (test 23); the oracle key list (`tests/integration/mutiny-oracle.test.ts:28`) and `tests/integration/alpha-security.test.ts` paths are unaffected; no migration.

PWA follow-ups (out of scope; open PR on `apps/pwa`): `barter-runtime.ts:43-47` must replace `onHand === 1` by unit availability and pass `leg.quantity ?? 1` to `ownReservationExists` (`:54-57`); UI for `requestedQuantity`, `set_quantity`, quote entry, and display of quotes, tolerances and compensation legs before `mutiny.alpha.consent`; a local maximum-tolerance policy.

## 5. Threat model and failure handling

| Case | Handling |
|---|---|
| Coordinator declares a plan favouring itself | Every receiver recomputes from the signed legs; any difference ⇒ `MUTINY_NORMALIZATION_MISMATCH` thrown by `prepareProposal` ⇒ open/revise rejected, nothing stored (`VALIDATION_FAILED` at the bus). |
| Absurd or stale quote | Quotes are deal terms consented via the digest; life ≤ 24 h, ≥ 30 min left, `asOf` not in the future, deadline ≤ earliest expiry; `sourceSigned: true` rejected. Market plausibility is a documented limit. |
| Replay/fork/late consent | Unchanged: `revisionNo`/`previousHash` (`:135-137`), cid dedupe (`:147`), `MUTINY_CONSENT_LATE` (`:150`); a revision differing only in `balance` has a new hash and clears consents. |
| Quantity inflation by a want author | Only the giver's vault can be over-committed, and `reserve` counts units in one storage transaction; more units received means a larger `v × q`, hence a compensation obligation the receiver must consent to. |
| Concurrent proposals over one stock | `storage.transaction` serialises writers; availability check and hold `put` share the transaction (tests 32–33, 40). |
| Stock lowered under live holds | `set_quantity` refuses below `reservedUnits`; a released hold after commit still freezes via `local_reservation_lost` (`repository.ts:109`). |
| Clock anomalies | Every check takes `now`/`createdAt`; `tick` keeps `lastObservedAt` monotone (`:92`); `asOf > createdAt + 5 min` or `expiresAt ≤ asOf` rejected. |
| Resource bounds | ≤ 8 legs, 8 quotes, 7 compensation legs, 8 overrides, 38-digit amounts, 40-digit rates, 99 units per leg, 100000 on hand, 500-row hold pages (fail closed beyond). |
| Division/overflow | `den ≥ 1`, `10^db ≥ 1`, bigint; settled values re-bounded at 38 digits. |

Reject vs freeze: malformed or mismatched terms **reject** with no state change; lost holds, double promises and expired reservations **freeze** (existing rules); quote expiry never changes state by itself.

## 6. Test plan (titles carry the IDs; fast-check 4.10.2 for properties)

`packages/mutiny/src/value_balancing/money.test.ts`
1. `TEST-PS-074-09.T01` valid strings round-trip; `+1`, `01`, `1.0`, `1e3`, `-0` ⇒ `COMMERCE_MONEY_INVALID`; 39 digits ⇒ `COMMERCE_MONEY_OVERFLOW`.
2. `TEST-PS-074-09.T06` property: `roundDiv(−n,d) = −roundDiv(n,d)`; halves to even (`5/2→2`, `7/2→4`, `−7/2→−4`).
3. `TEST-PS-074-09.T03 TEST-PS-025-09.T02` property, 10 000 random `(amount, num, den, db, dq)` within bounds vs an independent oracle (mathematical modulo, explicit `2·rem` vs `d`).
4. `TEST-PS-074-09.T04` property: A→B→A error ≤ `roundDiv(den·10^db, 2·num·10^dq, 'FLOOR') + 1`.
5. `TEST-PS-074-09.T02` `den 0`, non-integer, negative rate ⇒ `COMMERCE_RATE_PAIR_INVALID`; pair mismatch throws (MNY-6).
6. `TEST-PS-074-09.T07` frozen inputs, two calls identical, inputs unchanged.
7. `TEST-PS-073-09.T02` `XXX9`, `ABC` ⇒ `COMMERCE_CURRENCY_UNKNOWN` with `params.code`.
8. `TEST-PS-073-09.T14` (new row) JPY 0, KWD 3, BTC 8, ETH 18, USDC 6; `Object.isFrozen(CURRENCIES)`.
9. `TEST-PS-075-09.T01` `parseDecimalRate('1.0870') ⇒ 1087/1000`; `'1e3'` rejected.
10. `TEST-PS-075-09.T04` at `expiresAt` ⇒ `expired`, 1 s before ⇒ `expiring`, 31 min before ⇒ `valid`; no extend API.

`packages/mutiny/src/value_balancing/balance.test.ts`
11. `TEST-PS-026-09.T01` fixture ⇒ `p2→p1 4000`, `p2→p3 2000`, residuals 0.
12. `TEST-PS-026-09.T02` property, 2..8 participants, random zero-sum nets and tolerances/overrides: Σ paid = Σ received; ≤ N−1 legs; residuals within tolerance; payer ≠ payee; permutation-invariant; empty iff all within tolerance.
13. `TEST-PS-026-09.T04` creditor override `bps 10000` ⇒ receives nothing, fewer legs.
14. `TEST-PS-026-09.T03` payer = payee, outsider, amount `0`, 39 digits, N legs, wrong currency, `basis: 'manual'`, `v: 2` ⇒ documented code.
15. `TEST-PS-016-09.T02` 20000/19000 (tol 1000) ⇒ no legs; 20000/18999 ⇒ one leg 1001; 600/400 ⇒ absolute minimum 500 ⇒ no legs.
16. `TEST-PS-016-09.T18` `500 EUR`: `163/1 ⇒ 815 JPY`, `1/60000 ⇒ 8333` sat; EUR settlement ⇒ 500.
17. `TEST-PS-016-09.T04` 12000/11800/11500 ⇒ all within tolerance, empty plan.
18. `TEST-PS-025-09.T01` 12000 EUR, 10000 GBP (`117/100`), 10990 CHF (`1043/1000`) ⇒ 12000, 11700, 11463; `buildBalanceSection` twice ⇒ identical JSON.
19. `TEST-PS-025-09.T04` JPY settlement with EUR legs: `db 2, dq 0` exact.
20. `TEST-PS-025-09.T03` V01..V08: unregistered currency, 9 quotes, 6 currencies, 20-min quote, deadline after expiry (`MUTINY_QUOTE_TOO_SHORT`), `den 0`, altered amount (`MISMATCH`), `sourceSigned: true`/empty source (`MUTINY_QUOTE_SOURCE_UNLABELLED`).
21. `TEST-PS-016-09.T19` cross-currency deadline `createdAt + 30 h` ⇒ `MUTINY_DEADLINE_INVALID`; single-currency 30 h accepted; quote with 20 min life ⇒ `MUTINY_QUOTE_UNAVAILABLE`.
22. `TEST-PS-016-09.T22` gap beyond tolerance ⇒ leg required; creditor override in the signed section ⇒ accepted without a leg.

`packages/mutiny/src/trade_proposals/balance_compat.test.ts`
23. `TEST-PS-025-09.T16` (new row) frozen legacy snapshots (2 and 3 legs) ⇒ `revisionHash` equals constants recorded from the alpha head; `canonicalJson` contains neither `balance` nor `quantity`; `openCoordination` accepts; adding `balance` changes the hash.
24. `TEST-PS-025-09.T09` valid signed revision with one compensation amount `+1` ⇒ `MUTINY_NORMALIZATION_MISMATCH`; open/revise reject; consent impossible.
25. `TEST-PS-026-09.T06 TEST-PS-026-09.T17` (new row) `compensationLegs`: `proposed` → `due` (`dueAt = committedLocallyAt + 14 d`) → `withdrawn` after cancel/decline; `frozen` after freeze; amounts identical in every state.
26. `TEST-PS-023-09.T23` (new row) leg `quantity 3`, legacy-shaped reservation accepted by `ingestCoordination` (`:156-162`); `ownReservationExists(…, 3)` false for 2 units ⇒ stays `proposed`; true for 3 ⇒ `committed`.

`packages/mutiny/src/cycle_matching/quantity.test.ts`
27. `TEST-PS-016-09.T23` (new row) want `requestedQuantity 3` ⇒ edge `quantity 3`; `1` ⇒ no key; `100` ⇒ throw; `cycleKey` differs from the 1-unit ring; `imbalancePermille` uses `v × q`; `recheckProposal` exact match.
28. `TEST-PS-016-09.T03` property: rings without quantity ⇒ result and `inputHash` identical to pinned legacy values, twice; CAD/USD ring rejected without `settlement`, discovered with it, `inputHash` changes only then.

`packages/bazaar/src/listings/quantity.test.ts`
29. `TEST-PS-008-09.T01` `onHand 3`: reserve 2 ok; reserve 2 ⇒ `BAZAAR_INVENTORY_INSUFFICIENT`; reserve 1 ok; projection `available` until 0 units.
30. `TEST-PS-008-09.T18` (new row) `set_quantity 1` under 2 reserved ⇒ `BAZAAR_INVENTORY_BELOW_RESERVED`, revision unchanged; `10` ⇒ ok; raw hold row without `quantity` reads as 1.
31. `TEST-PS-008-09.T03` quantity `0`/`100`, `onHand 100001`, foreign listing, stale revision ⇒ codes, no events.
32. `TEST-PS-008-09.T04 TEST-PS-023-09.T03` fast-check model of `reserve(k)`/`release`/`advance`/`set_quantity` ⇒ after each step `Σ active unexpired quantity ≤ onHand`, never negative, only declared transitions.
33. `TEST-PS-008-09.T05 TEST-PS-023-09.T04` `Promise.all` of five `reserve(2)` on `onHand 3` ⇒ exactly one success; seeded repetitions.
34. `TEST-PS-008-09.T10` replay with the same idempotency key ⇒ same hold, units taken once.

`tests/integration/mutiny-value-balancing.test.ts` (pattern of `tests/integration/mutiny-persistence.test.ts:44-147`)
35. `TEST-PS-025-09.T06` three peers (EUR/GBP/CHF), settlement EUR, two quotes, two compensation legs ⇒ `committed` on every peer and after restart; legs `due`; clock past quote expiry ⇒ still `committed`.
36. `TEST-PS-025-09.T05` quote expiring before the deadline cannot open (`MUTINY_QUOTE_TOO_SHORT`); `revisionNo 2` with fresh quotes opens, clears consents, commits.
37. `TEST-PS-025-09.T09` tampered balance via `mutiny.coordination.ingest` ⇒ `VALIDATION_FAILED`, no record, no event.
38. `TEST-PS-026-09.T06 TEST-PS-025-09.T16` coordinator cancel ⇒ legs `withdrawn`, holds released; a 2-peer flow without `balance` ⇒ records identical to the pre-change run.

`tests/integration/mutiny-value-quantity.test.ts`
39. `TEST-PS-016-09.T23` listing `onHand 5`, want 3 ⇒ leg `quantity 3` ⇒ `reserve(3)` ⇒ commit; `reserve(2)` ⇒ no commit; a further `reserve(3)` ⇒ `INSUFFICIENT`.
40. `TEST-PS-023-09.T10 TEST-PS-023-09.T03` two subjects over one listing ⇒ both frozen, units released; property across subjects: Σ active quantities ≤ `onHand`, a hold smaller than its leg never commits.

Spec rows to append (append-only; `covers` cells name existing requirement ids, so `pnpm spec:check` stays at 0 errors, no warnings):
- `02_LocalMutiny/04_value_balancing/mod_currency`: `T16 | contract | 01.R03,02.R02 | legacy classrup.alpha.proposal_revision/v1 snapshot without a balance section and a snapshot with one | legacy digest byte-identical to the frozen fixture and still accepted; the balance section changes the digest and is recomputed identically by every receiver`
- `02_LocalMutiny/04_value_balancing/mod_mixed`: `T17 | unit | 03.R01,03.R02,01.R02 | compensation legs embedded in a revision across proposed, committed, cancelled and frozen coordination with an injected clock | status derived proposed, due, withdrawn, frozen; amounts and parties never change after commit`
- `02_LocalMutiny/02_cycle_matching/mod_feasibility`: `T23 | integration | 02.R01,02.R03 | signed want with requestedQuantity 3 admitted into an edge and rechecked against a 2-unit hold | leg carries quantity 3, cycle key and digest differ from quantity 1, recheck infeasible until a 3-unit hold exists`
- `02_LocalMutiny/03_cycle_execution/mod_lock`: `T23 | integration | 02.R02,01.R02 | classrup.alpha.reservation/v1 without a quantity field for a leg of quantity 3 | the revision hash binds the quantity; a 2-unit local hold never satisfies the local reservation check and the cycle does not commit`
- `01_LocalBazaar/03_inventory/mod_availability`: `T18 | unit | 01.R01,02.R01,02.R02 | set_quantity below active reserved units, then above | BAZAAR_INVENTORY_BELOW_RESERVED without change, then onHand updated and availability recomputed from active holds only`
- `09_Commerce/03_valuation/mod_currency`: `T14 | unit | 01.R01,01.R03 | lookup of the static alpha subset including JPY, KWD, BTC, ETH, USDC | decimals 0, 3, 8, 18, 6 returned; unknown code rejected; the table is frozen and immutable`

## 7. Open questions resolved

1. **Carrier for new terms**: optional versioned `balance` section plus optional leg `quantity`; a new statement type is blocked by the `/v1`-only type regex and would make every `PROPOSAL_TYPE` check accept two names.
2. **Reservation quantity**: bound through `revisionHash`, payload unchanged; an optional key would widen a closed `exact()` set and `validatePublicationRecord` for no verification gain.
3. **Transfer amount**: full offset `min(r_a, −r_b)` with out-of-tolerance-first ordering; paying only `net − tol` leaves boundary residuals on both sides and loses the "each leg zeroes a party" termination argument.
4. **Tolerance rounding**: `floor` — integer, conservative, boundary stated.
5. **Absolute minimum**: pinned explicitly in settlement minor units; the library default is a registry constant approximating 5 EUR (`500` for 2-decimal fiat, `800` JPY, `7000` KRW, `8000` sat, `2·10^15` wei, `5000000` USDC); a live "500 EUR converted" default would need an EUR quote inside single-currency CAD cycles.
6. **Quote direction**: exactly one quote per leg currency, `base = leg currency`, `quote = S`; inverse use refused.
7. **Legacy proposals and tolerance**: not enforced (meaning unchanged); `requireBalanceSection` is the opt-in refusal.
8. **Peer conflicts with multi-unit items**: item-level freeze kept (fail closed).
9. **Public quantity**: not published; availability stays binary.
10. **Error style**: pure parsers throw `TypeError(code)` like existing coordination code; money primitives return `Result`; MNY-6 throws.

## 8. Honest limits

- No rate source, signature or plausibility check: a pinned quote is a consented term, not market truth.
- Minimality is proven only as "shortest prefix of the deterministic greedy"; global minimum transfer counts are NP-hard and not computed.
- Peers cannot verify stock; a multi-unit promise is a claim, and two live subjects over one listing freeze even when stock suffices.
- Legs record obligations only; payment, acknowledgement, dispute and COM-3 expiry are the deferred F09 integration.
- Old clients reject new snapshots and wants; there is no capability negotiation.
- Complexity bounds are analytical; nothing is measured on mobile, and `durationMs` still excludes balance computation.
- Overrides are coordinator-authored and validated only syntactically; presenting them before consent is PWA follow-up work.
