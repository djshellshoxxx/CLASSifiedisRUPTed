# PS-027-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/04_value_balancing/mod_valuation. **Parent:** [mod_valuation SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-COM-001, CTR-ERR-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-027-02.R01 | `declared_minor` matches `^(0|[1-9][0-9]{0,14})$`. Zero is allowed only with `zero_value_reason` ∈ {`gift`, `service_exchange`}. Otherwise `VALUE.DECLARED_VALUE_INVALID`. | MVP |
| PS-027-02.R02 | Currency not in the F09 registry → `VALUE.CURRENCY_UNSUPPORTED`. | MVP |
| PS-027-02.R03 | Quote must match the line's currency pair and be unexpired at computation time; otherwise `VALUE.QUOTE_STALE` (retryable after re-quote). | MVP |
| PS-027-02.R04 | Items per revision ≤ 16. Excess → `VALUE.ITEM_LIMIT_EXCEEDED`. | MVP |
| PS-027-02.R05 | Any intermediate or summed value > 999999999999999 minor units → `VALUE.OVERFLOW`. Arithmetic is integer-only; no float path. | MVP |
| PS-027-02.R06 | A `listing_reference` line must reference a `lst_` owned by the item's party. Otherwise `VALUE.LISTING_NOT_OWNED`. | MVP |
| PS-027-02.R07 | A snapshot built from a revision that has since changed → `VALUE.SNAPSHOT_STALE` on consent attempt. | MVP |

## Data / schema
Validation runs against the revision and the quote set resolved for it. Rounding is applied only after validation passes.

## Commands / queries / events
Enforced by `valuation.compute` (PS-027-04) before persistence.

## States & transitions
Not applicable. Validation failure leaves prior snapshot unchanged.

## Validation & errors
| Code | Retryable | Category / HTTP | Diagnostic |
|---|---|---|---|
| VALUE.DECLARED_VALUE_INVALID | false | validation / 400 | field path |
| VALUE.CURRENCY_UNSUPPORTED | false | validation / 400 | currency class only |
| VALUE.QUOTE_STALE | true | precondition_failed / 412 | quote_id class |
| VALUE.ITEM_LIMIT_EXCEEDED | false | validation / 400 | count |
| VALUE.OVERFLOW | false | validation / 400 | field path |
| VALUE.LISTING_NOT_OWNED | false | forbidden / 403 | none (CTR-CAP R04 rule) |
| VALUE.SNAPSHOT_STALE | true | conflict / 409 | revision numbers |

Messages use `err.value.<code>` keys (CTR-ERR-001 R05). No values echoed.

## Authorization
Validation runs after PS-027-05 authorization. Listing ownership check uses `lst.read` as the owning party.

## Failure, idempotency, concurrency, offline
Deterministic for the same revision and quote set. Offline clients show a non-binding estimate labelled "estimate, not binding" and never submit a snapshot.

## Privacy, retention, abuse
Rule-failure counts per actor feed abuse signals only (PS-027-07).

## Observability & budgets
Validation ≤ 5 ms p95 for 16 items. Metric `value_validation_rejections_total{code}`.

## Tests
- TEST-PS-027-02-01 (unit): one minimal failing input per code.
- TEST-PS-027-02-02 (property): integer overflow boundary at 999999999999999 accepted, +1 rejected.
- TEST-PS-027-02-03 (negative): decimal point in `declared_minor` rejected.
- TEST-PS-027-02-04 (negative): `lst_` owned by another party rejected.

## Acceptance criteria
1. All seven VALUE codes registered in CTR-ERR-001 lint.
2. No float type appears in value-handling code (static check).
3. Error bodies contain no amounts or item descriptions.

## Assumptions & open decisions
- ASSUMPTION: 15-digit maximum for minor-unit values.
- PROVISIONAL: rounding is HALF_EVEN per CTR-COM-001 R04 (D03 default, unapproved). See [DECISIONS.md](../../../DECISIONS.md).
