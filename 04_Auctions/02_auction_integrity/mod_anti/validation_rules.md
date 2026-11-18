# PS-036-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/02_auction_integrity/mod_anti. **Parent:** [mod_anti SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-ERR-001, CTR-SCH-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-036-02.R01 | A bid qualifies for extension only if server accepted time `t` satisfies `effective_end − window_seconds ≤ t < effective_end`. | MVP |
| PS-036-02.R02 | Extension applies only when `extension_count` < `max_extensions`. At the cap, no extension occurs and state becomes `EXTENSION_CAP_REACHED`. | MVP |
| PS-036-02.R03 | New `effective_end` = max(current `effective_end`, `t` + `extension_seconds`). It never decreases. | MVP |
| PS-036-02.R04 | Client-supplied times are ignored. Only server-accepted timestamps are used. | MVP |
| PS-036-02.R05 | Policy must exist and be published; unknown `policy_id` → `ANTISNIP.POLICY_UNKNOWN` and the auction is not opened. | MVP |
| PS-036-02.R06 | A policy change never applies to an auction already open (policy pinned at creation). Attempt → `ANTISNIP.POLICY_PINNED`. | MVP |
| PS-036-02.R07 | Bids with `sequence` ≤ `last_evaluated_sequence` are duplicates and are ignored (idempotent). | MVP |

## Data / schema
Evaluation reads the bid event (sequence, accepted time) and the schedule row under the auction lock.

## Commands / queries / events
Enforced by `anti.evaluate_bid` (system) and `anti.publish_policy` (operator, dual control).

## States & transitions
Not applicable. Rejections leave the schedule unchanged.

## Validation & errors
| Code | Retryable | Category / HTTP | Diagnostic |
|---|---|---|---|
| ANTISNIP.POLICY_UNKNOWN | false | validation / 400 | policy ID class |
| ANTISNIP.POLICY_PINNED | false | conflict / 409 | auction state enum |
| ANTISNIP.CLOCK_SKEW | true | precondition_failed / 412 | skew bucket |

Messages `err.antisnip.<code>`. Extension is an outcome, not an error.

## Authorization
Evaluation runs as `sys`. Policy publication requires `ope` dual control.

## Failure, idempotency, concurrency, offline
Deterministic for a given (bid sequence, policy version). Out-of-order events are evaluated by sequence (PS-036-06).

## Privacy, retention, abuse
Error bodies contain no bid amounts and no bidder identifiers.

## Observability & budgets
Validation ≤ 2 ms p95. Metric `antisnip_validation_rejections_total{code}`.

## Tests
- TEST-PS-036-02-01 (unit): one input per code.
- TEST-PS-036-02-02 (boundary): bid at exactly `effective_end − 120 s` extends; one millisecond earlier does not.
- TEST-PS-036-02-03 (property): `effective_end` is non-decreasing across 10,000 random bid sequences.
- TEST-PS-036-02-04 (negative): client-supplied timestamp ignored (server time used).

## Acceptance criteria
1. All ANTISNIP codes registered in CTR-ERR-001 lint.
2. Boundary and monotonicity tests pass.
3. Policy pinning verified in integration test.

## Assumptions & open decisions
- ASSUMPTION: boundaries inclusive at window start; server clock skew tolerance 1 s.
- See [DECISIONS.md](../../../DECISIONS.md) for D08 (offline writes not used by this module).
