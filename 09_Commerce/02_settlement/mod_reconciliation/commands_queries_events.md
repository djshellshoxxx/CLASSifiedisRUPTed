# PS-072-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/02_settlement/mod_reconciliation (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02, R03, R10), CTR-SCH-001, CTR-ERR-001, CTR-CAP-001. **Decisions:** D04 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-072-04.R01 | `recon.run` carries `idempotency_key` and scope; returns `run_id`. | MVP |
| PS-072-04.R02 | `recon.finding.resolve` carries `expected_revision` and `case_id`. | MVP |
| PS-072-04.R03 | Events: `recon_run.completed`, `recon_finding.opened`, `recon_finding.resolved`. | MVP |
| PS-072-04.R04 | No command in this module writes `clm_` state. | MVP |

## Data / schema
Schema `recon_run` 1.0.0; `recon_finding` 1.0.0. `max_data_class` FINANCIAL_EVIDENCE for findings, PUBLIC for run summaries.

## Commands / queries / events
| Command | Event | Expected revision | Actor |
|---|---|---|---|
| `recon.run` | `recon_run.completed` (async) | n/a | sys_, ope_ |
| `recon.finding.resolve` | `recon_finding.resolved` | required | ope_ |
| `recon.finding.list` (query) | none | n/a | ope_ |
| `recon.run.get` (query) | none | n/a | ope_ |

## States & transitions
Maps to PS-072-03.

## Validation & errors
Per PS-072-02.

## Authorization
Per PS-072-05.

## Failure, idempotency, concurrency, offline
Run key de-duplicates scheduled and on-demand runs with the same window.

## Privacy, retention, abuse
Events carry IDs and enums only.

## Observability & budgets
Latency for `recon.finding.list` p95 ≤ 500 ms for 1000 findings (ASSUMPTION).

## Tests
- TEST-PS-072-04-01 (contract): command and event schemas validate.
- TEST-PS-072-04-02 (contract): module exposes no claim-state write (surface diff).
- TEST-PS-072-04-03 (unit): duplicate run key returns original run.
- TEST-PS-072-04-04 (unit): resolve with stale revision returns `SYS.CONFLICT`.

## Acceptance criteria
1. Command surface matches table.
2. No state-changing claim command present.
3. Idempotency tests pass.

## Assumptions & open decisions
- ASSUMPTION: schemas start at 1.0.0.
- D04 (PROVISIONAL, unapproved).
