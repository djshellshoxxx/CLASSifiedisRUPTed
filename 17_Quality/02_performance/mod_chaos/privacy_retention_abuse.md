# PS-138-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/02_performance/mod_chaos. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-CAP-001, CTR-FED-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-138-07.R01 | Chaos runs use synthetic data in staging; no production data copies are reachable from staging faults. | MVP |
| PS-138-07.R02 | Faults never disable access controls, logging of authorization decisions, or incident alerting. | MVP |
| PS-138-07.R03 | Fault types never corrupt, delete or mutate stored personal records. | MVP |
| PS-138-07.R04 | Experiment records retained 365 days (ASSUMPTION), then summarized. | MVP |

## Data / schema
See [domain_schema.md](domain_schema.md).

## Commands / queries / events
N/A.

## States & transitions
N/A.

## Validation & errors
Experiments violating R02 or R03 rejected at propose (`CHAOS.FAULT_TYPE_INVALID`).

## Authorization
Per PS-138-05.

## Failure, idempotency, concurrency, offline
N/A.

## Privacy, retention, abuse
- Abuse: chaos tooling used to degrade a real user's service is prevented by the production target block.
- Federation faults (duplicate delivery) use test-only peers (CTR-FED-001).

## Observability & budgets
Logs record fault type and target ID only.

## Tests
- TEST-PS-138-07-01: privacy, fault that disables audit log is rejected at propose.
- TEST-PS-138-07-02: production hostname rejected (cross-check with PS-138-02).

## Acceptance criteria
1. Zero experiments accepted with blocked fault types.
2. Audit logging unaffected during all drills.

## Assumptions & open decisions
- ASSUMPTION: 365-day retention.
- D07 (retention): PROVISIONAL (D07 default, unapproved).
