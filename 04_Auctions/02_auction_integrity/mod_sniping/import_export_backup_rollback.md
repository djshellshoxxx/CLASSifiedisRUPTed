# PS-038-10 — import export backup rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/02_auction_integrity/mod_sniping. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-SCH-001, CTR-FED-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-038-10.R01 | Subject export includes the requester's own timing rows (class, acceptance, server_received_at) and excludes other bidders' rows. | MVP |
| PS-038-10.R02 | No import path in MVP. Inbound federated timing records are rejected per CTR-FED-001. | MVP |
| PS-038-10.R03 | Backups include BidTimingEvent and aggregates; restore replays deletions before serving. | MVP |
| PS-038-10.R04 | Classifier rollback: prior threshold set reactivated; recorded classes are not recomputed unless an explicit migration runs. | MVP |
| PS-038-10.R05 | Restore drill quarterly with RPO <= 24 h, RTO <= 4 h (ASSUMPTION). | MVP |

## Data / schema
Export JSON schema_version 1, PSEUDONYMOUS class.

## Commands / queries / events
Export emits `sniping.export_generated` with counts only.

## States & transitions
Threshold set states: ACTIVE, PRIOR, RETIRED.

## Validation & errors
`SNIPE.EXPORT_SCOPE` when a request spans other bidders.

## Authorization
Export by account holder; restore by operator with dual control (CTR-CAP-001 R07).

## Failure, idempotency, concurrency, offline
Export idempotent per request ID. Restore blocked during reclassification jobs.

## Privacy, retention, abuse
Backups follow PS-038-07 retention. Export omits clock-health internals.

## Observability & budgets
Export p95 <= 30 s for 10 MB.

## Tests
- TEST-PS-038-10-01 (export): only requester rows present.
- TEST-PS-038-10-02 (restore): deletion replayed before serving.
- TEST-PS-038-10-03 (rollback): threshold rollback leaves recorded classes unchanged.

## Acceptance criteria
1. Export excludes other bidders.
2. Restore drill meets RPO and RTO.
3. Rollback does not silently reclassify.

## Assumptions & open decisions
- ASSUMPTION: RPO 24 h and RTO 4 h.
- PROVISIONAL (D01 default, unapproved): no federated timing import.
- PROVISIONAL (D07 default, unapproved): backup retention per class.
