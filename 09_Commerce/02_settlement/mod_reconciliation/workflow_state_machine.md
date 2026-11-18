# PS-072-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/02_settlement/mod_reconciliation (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (R05, R12, R13), CTR-EVT-001 (R02). **Decisions:** D04 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-072-03.R01 | Run states: `queued`, `running`, `complete`, `partial`, `failed`. | MVP |
| PS-072-03.R02 | Finding states: `open`, `resolved`, `dismissed`. | MVP |
| PS-072-03.R03 | A run with unreachable chains ends `partial`, never `complete`. | MVP |
| PS-072-03.R04 | `FINAL_WITHOUT_ADAPTER` findings are resolved only by a case decision or by an adapter record being added through the owning path. | MVP |

## Data / schema
Transition rows: `run_id` or `finding_id`, `from`, `to`, `revision`, `actor_ref`.

## Commands / queries / events
`recon_run.completed`, `recon_finding.opened`, `recon_finding.resolved`.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| — | `recon.run` | scope valid; no same-key run | `queued` | — |
| `queued` | start | scheduler slot | `running` | — |
| `running` | finish | coverage 100% | `complete` | `recon_run.completed` |
| `running` | finish | some chains unreachable | `partial` | `recon_run.completed` with list |
| `running` | fatal error | — | `failed` | alert |
| — (finding) | rule raised | not already open | `open` | `recon_finding.opened` |
| `open` | resolve | case_id present | `resolved` | `recon_finding.resolved` |
| `open` | dismiss | case_id present, dual control for FINAL types | `dismissed` | `recon_finding.resolved` |

## Validation & errors
`RECON.CASE_REQUIRED` for resolution without case; `SYS.CONFLICT` for concurrent resolution.

## Authorization
Runs by `sys_` (scheduled) or `ope_` (on demand); resolution by `ope_` with `case` scope.

## Failure, idempotency, concurrency, offline
Run restart resumes from last checkpoint (claim ID cursor). Concurrent resolution: first committed wins.

## Privacy, retention, abuse
State log holds IDs and enums only.

## Observability & budgets
Histogram: run duration per 10k claims.

## Tests
- TEST-PS-072-03-01 (unit): table rows; undefined pairs refused.
- TEST-PS-072-03-02 (integration): unreachable chain produces `partial`.
- TEST-PS-072-03-03 (integration): dismiss of FINAL finding without dual control refused.
- TEST-PS-072-03-04 (property): no run is `complete` with coverage < 100%.

## Acceptance criteria
1. Partial runs never display as clean.
2. Resolution requires case reference.
3. Table matches implementation.

## Assumptions & open decisions
- ASSUMPTION: checkpoint every 1000 claims.
- D04 (PROVISIONAL default, unapproved).
