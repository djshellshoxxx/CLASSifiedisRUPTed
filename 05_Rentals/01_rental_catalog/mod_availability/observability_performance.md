# PS-039-08 — observability performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 05_Rentals/01_rental_catalog/mod_availability. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-ERR-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-039-08.R01 | Counters: `avail_holds_created_total`, `avail_holds_expired_total`, `avail_conflicts_total`, `avail_blocks_total{block_type}`. | MVP |
| PS-039-08.R02 | `availability.read` p95 <= 150 ms for 366-day window; hold/block p95 <= 200 ms. | MVP |
| PS-039-08.R03 | Gauge: TENTATIVE blocks; alert when > 2x trailing median. | MVP |
| PS-039-08.R04 | Logs carry `block_id` prefix only; no renter IDs, no dates tied to a person. | MVP |
| PS-039-08.R05 | Conversion metric: holds confirmed / holds created, per day. | MVP |

## Data / schema
Labels: `block_type`, `error_code`. No item-level labels in metrics above cardinality 10k.

## Commands / queries / events
Internal alert event `avail.hold_backlog`.

## States & transitions
Not applicable.

## Validation & errors
Redaction test rejects `rnt_` and `acc_` in log lines.

## Authorization
Ops dashboard requires aggregate capability only.

## Failure, idempotency, concurrency, offline
Metrics best-effort; never block writes.

## Privacy, retention, abuse
Telemetry retention 30 days (ASSUMPTION). Hold-squatting detection uses counts, not identities.

## Observability & budgets
Budgets: 500 availability reads/s platform-wide (ASSUMPTION); 50 holds/s.

## Tests
- TEST-PS-039-08-01 (redaction): log fixture with rental_id is redacted.
- TEST-PS-039-08-02 (load): 500 reads/s meets R02.
- TEST-PS-039-08-03 (alert): TENTATIVE spike fixture fires alert.

## Acceptance criteria
1. Counters present in staging.
2. No renter identifier in logs.
3. Read and write budgets met in load fixture.

## Assumptions & open decisions
- ASSUMPTION: 500 reads/s and 50 holds/s planning budgets.
- PROVISIONAL (D07 default, unapproved): 30-day telemetry retention.
