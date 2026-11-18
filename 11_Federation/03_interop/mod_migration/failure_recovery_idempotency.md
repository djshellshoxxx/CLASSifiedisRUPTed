# PS-090-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/03_interop/mod_migration. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001 (R07, R08), CTR-EVT-001 (R02, R03), CTR-FED-001 (R09).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-090-06.R01 | Writes are batched by aggregate with a checkpoint after each batch of ≤ 500 aggregates (ASSUMPTION). | MVP |
| PS-090-06.R02 | Resume after crash starts at the last checkpoint; no aggregate is migrated twice. | MVP |
| PS-090-06.R03 | A failing aggregate is quarantined with original bytes kept; the run continues only if the failure rate is below 0.1% (ASSUMPTION), otherwise it moves to `failed`. | MVP |
| PS-090-06.R04 | Key migration does not invalidate verification of historic events signed under prior keys (CTR-FED-001 R09). | MVP |

## Data / schema
Checkpoint: `run_id`, `batch_index`, `last_aggregate_id`, `digest`.

## Commands / queries / events
Retry rules per [commands_queries_events.md](commands_queries_events.md).

## States & transitions
Per [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
| Code | Retryable | When |
|---|---|---|
| SCH.MIGRATION_FAILED | false | migration hook threw or produced invalid output; record quarantined |
| MIGRATE.CHECKPOINT_CONFLICT | false | checkpoint digest mismatch |
| SYS.UNAVAILABLE | true | store down |

## Authorization
Each batch re-checks run status is `running`.

## Failure, idempotency, concurrency, offline
Concurrent runs over overlapping scope are refused. Migrations are online only.

## Privacy, retention, abuse
Quarantine records hold IDs and codes only.

## Observability & budgets
Metric `migrate_quarantined_total`; throughput ≥ 1000 aggregates/min on fixture (ASSUMPTION).

## Tests
- TEST-PS-090-06-01 (resume): kill at batch 3 of 5; resume leaves no duplicates.
- TEST-PS-090-06-02 (quarantine): one bad aggregate quarantined, others migrate.
- TEST-PS-090-06-03 (threshold): failure rate over threshold moves run to failed.
- TEST-PS-090-06-04 (key): historic event verifies after key migration.

## Acceptance criteria
1. Resume correct in all kill points.
2. Threshold enforced.
3. Historic signatures verify.

## Assumptions & open decisions
- ASSUMPTION: batch size 500; 0.1% threshold.
- PROVISIONAL (D10 default, unapproved): user-controlled keys with documented rotation.
