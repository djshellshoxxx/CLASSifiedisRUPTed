# PS-034-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/01_auction_lifecycle/mod_close. **Parent:** [mod_close SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-COM-001, CTR-ERR-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-034-02.R01 | Close runs only when server time ≥ effective end (base end plus accepted extensions, F04.S02.M01). Otherwise `CLOSE.BEFORE_END`. | MVP |
| PS-034-02.R02 | Winner = highest bid with status ACCEPTED at `final_revision`. Ties are impossible by sequence rule (PS-033-03 R02). | MVP |
| PS-034-02.R03 | `SOLD` requires `winning_amount_minor` ≥ reserve (or no reserve set). Otherwise `UNSOLD_RESERVE_NOT_MET`. | MVP |
| PS-034-02.R04 | `CANCELLED_BY_SELLER` allowed only while zero ACCEPTED bids exist. Otherwise `CLOSE.CANCEL_WITH_BIDS`. | MVP |
| PS-034-02.R05 | Seller may not be the winner (`CLOSE.SELLER_WINNER`); a detected seller-linked winner is held for fraud review. | MVP |
| PS-034-02.R06 | A second close for the same `auc_` → `CLOSE.ALREADY_CLOSED` (idempotent replay returns the existing record). | MVP |
| PS-034-02.R07 | Winner confirmation must come from the winner `acc_` and match the `close_hash`. Otherwise `CLOSE.CONFIRMATION_INVALID`. | MVP |

## Data / schema
Validation uses the auction at `final_revision` under lock; the closing job records the revision it validated.

## Commands / queries / events
Enforced by `close.run`, `auction.cancel`, `close.confirm_winner`.

## States & transitions
Not applicable. Failed validation leaves the auction OPEN or CLOSING as before.

## Validation & errors
| Code | Retryable | Category / HTTP | Diagnostic |
|---|---|---|---|
| CLOSE.BEFORE_END | true | precondition_failed / 412 | none |
| CLOSE.CANCEL_WITH_BIDS | false | unprocessable_state / 422 | none |
| CLOSE.SELLER_WINNER | false | forbidden / 403 | flag reference only |
| CLOSE.ALREADY_CLOSED | false | conflict / 409 | existing close ID class |
| CLOSE.CONFIRMATION_INVALID | false | validation / 400 | rule enum |

`UNSOLD_RESERVE_NOT_MET` is an outcome, not an error. Reserve value never appears in any error body.

## Authorization
`sys` runs close; seller runs cancel; winner runs confirmation (PS-034-05).

## Failure, idempotency, concurrency, offline
Close job is deterministic at `final_revision`. Confirmation is idempotent per (`auc_`, winner, `close_hash`).

## Privacy, retention, abuse
Seller-linked winner check uses F07 signals; detection results go to F04.S02.M03 with IDs only.

## Observability & budgets
Validation ≤ 10 ms p95. Metric `close_validation_rejections_total{code}`.

## Tests
- TEST-PS-034-02-01 (unit): one input per code.
- TEST-PS-034-02-02 (boundary): close at effective end ms accepted; one ms earlier rejected.
- TEST-PS-034-02-03 (boundary): winning amount equal to reserve → SOLD; one minor unit below → UNSOLD.
- TEST-PS-034-02-04 (negative): cancel after one accepted bid rejected.

## Acceptance criteria
1. All CLOSE codes registered in CTR-ERR-001 lint.
2. Boundary tests pass at millisecond precision.
3. No error body contains reserve or winner identity.

## Assumptions & open decisions
- ASSUMPTION: server clock with ≤ 1 s skew tolerance; close waits for `final_revision` to be stable.
- Reserve rule owned by F04.S01.M01. See [DECISIONS.md](../../../DECISIONS.md) D04.
