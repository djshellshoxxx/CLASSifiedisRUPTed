# PS-072-06 — failure, recovery, idempotency and offline behavior

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/02_settlement/mod_reconciliation (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R03), CTR-COM-001 (Failure section), CTR-ERR-001 (R03). **Decisions:** D04 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-072-06.R01 | Runs checkpoint every 1000 claims; restart resumes from the last checkpoint with no double-counted coverage. | MVP |
| PS-072-06.R02 | Adapter unreachable: run continues for other chains; affected chain listed in `unreachable_chains`; run ends `partial`. | MVP |
| PS-072-06.R03 | Retries of an adapter query: 3 attempts, backoff 5 s base, then mark unreachable. | MVP |
| PS-072-06.R04 | Concurrent runs for overlapping scope: second is queued, not parallel. | MVP |
| PS-072-06.R05 | Module is server-side only; no offline behavior. | MVP |

## Data / schema
Checkpoint: `run_id`, `last_claim_id`, `checked_count`, `updated_at`.

## Commands / queries / events
`recon.run` retries reuse the run key.

## States & transitions
`running` → `partial` on unreachable chain; resume re-enters `running`.

## Validation & errors
`COM.VERIFIER_UNAVAILABLE` recorded per chain (retryable); the run itself is not an HTTP error.

## Authorization
Resume uses the original run's grant; expired grant ends the run as `failed`.

## Failure, idempotency, concurrency, offline
Findings are upserted by (`claim_id`, `finding_type`, `run_id`) to avoid duplicates on resume.

## Privacy, retention, abuse
Checkpoint rows deleted 30 days after run end.

## Observability & budgets
Run duration p95 ≤ 30 min for 1,000,000 claims (ASSUMPTION).

## Tests
- TEST-PS-072-06-01 (integration): kill run at checkpoint; resume completes with correct counts.
- TEST-PS-072-06-02 (integration): one chain down; run `partial`; coverage lists chain.
- TEST-PS-072-06-03 (property): re-running a run never duplicates findings.
- TEST-PS-072-06-04 (integration): concurrent overlapping runs serialize.

## Acceptance criteria
1. Resume correctness verified.
2. Partial status reported with chain list.
3. No duplicate findings.

## Assumptions & open decisions
- ASSUMPTION: checkpoint size 1000 claims.
- D04 (PROVISIONAL default, unapproved).
