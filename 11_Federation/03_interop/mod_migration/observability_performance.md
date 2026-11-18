# PS-090-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/03_interop/mod_migration. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001 (R10), CTR-PRV-001 (R09).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-090-08.R01 | Progress metric: aggregates migrated, quarantined and remaining per run. | MVP |
| PS-090-08.R02 | Throughput ≥ 1000 aggregates/min on fixture (ASSUMPTION). | MVP |
| PS-090-08.R03 | Verification pass rate after completion must be 100% for signed evidence. | MVP |
| PS-090-08.R04 | Labels exclude run IDs and aggregate IDs. | MVP |

## Data / schema
Labels: `kind`, `outcome`, `code`.

## Commands / queries / events
Consumes `migration.*` events.

## States & transitions
Not applicable.

## Validation & errors
Telemetry failure never stops a batch.

## Authorization
Platform Lead and on-call; run progress visible to approvers.

## Failure, idempotency, concurrency, offline
Metric loss tolerated; checkpoints are the source of truth.

## Privacy, retention, abuse
Logs retained 30 days (ASSUMPTION).

## Observability & budgets
| Metric | Target |
|---|---|
| migrate_throughput_per_min | ≥ 1000 |
| migrate_verification_pass_ratio | 1.0 for signed |
| migrate_quarantined_total | reviewed each run |

## Tests
- TEST-PS-090-08-01 (throughput): fixture meets target.
- TEST-PS-090-08-02 (verification): post-run verify pass 100%.
- TEST-PS-090-08-03 (redaction): labels contain no IDs.

## Acceptance criteria
1. Metrics exported.
2. Verification gate enforced.

## Assumptions & open decisions
- ASSUMPTION: throughput target.
