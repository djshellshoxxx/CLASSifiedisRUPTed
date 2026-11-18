# PS-072-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/02_settlement/mod_reconciliation (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001 (R05–R08), CTR-PRV-001 (R06, R07). **Decisions:** D06, D07 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-072-10.R01 | No import of findings or run results from third parties. Bank statement import is deferred until a decision is recorded (OPEN). | MVP |
| PS-072-10.R02 | Operator export of run summaries (counts, coverage) as JSON; no claim-level data. | MVP |
| PS-072-10.R03 | Rollback disables scheduled runs; open findings are retained and remain visible to operators. | MVP |
| PS-072-10.R04 | Backups encrypted; restore reapplies purges. | MVP |

## Data / schema
Summary export: `run_id`, `status`, `coverage`, `finding_counts`, `generated_at`.

## Commands / queries / events
`recon_run.exported` event, count only.

## States & transitions
Export: `queued` → `generated` → `expired` (24 h).

## Validation & errors
`SYS.RATE_LIMITED` on export frequency.

## Authorization
Operators with `reconciliation.read` only.

## Failure, idempotency, concurrency, offline
Idempotent export by ID.

## Privacy, retention, abuse
Summary exports contain no claim IDs.

## Observability & budgets
Export p95 ≤ 5 s (ASSUMPTION).

## Tests
- TEST-PS-072-10-01 (contract): export contains no claim ID.
- TEST-PS-072-10-02 (integration): rollback halts scheduled runs; findings still listed.
- TEST-PS-072-10-03 (integration): restore reapplies purge.
- TEST-PS-072-10-04 (unit): import attempt refused.

## Acceptance criteria
1. Export matches R02.
2. Rollback retains findings.
3. Restore respects purge.

## Assumptions & open decisions
- ASSUMPTION: export limit.
- D06, D07 (PROVISIONAL, unapproved).
