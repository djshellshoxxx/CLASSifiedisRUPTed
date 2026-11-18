# PS-018-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/02_cycle_matching/mod_n. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02), CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-018-03.R01 | A run is `queued` → `running` → exactly one of `completed`, `budget_exhausted`, `failed`. | MVP |
| PS-018-03.R02 | `budget_exhausted` and `failed` runs publish no candidates. | MVP |
| PS-018-03.R03 | Completed runs are immutable; a rerun creates a new run ID. | MVP |
| PS-018-03.R04 | Each transition emits one `cycle_search.completed` or lifecycle event in the same commit. | MVP |

## Data / schema
State in `status`; immutable after terminal state.

## Commands / queries / events
Transitions via PS-018-04 only.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | cycle.search_n | PS-018-02 passes | queued | emit run created |
| queued | worker starts | snapshot sealed | running | none |
| running | search finishes within budget | — | completed | emit cycle_search.completed with candidates |
| running | steps ≥ budget | — | budget_exhausted | emit completed with no candidates |
| running | internal error | retry limit reached | failed | emit failed; no candidates |

## Validation & errors
Invalid transitions return SYS.UNPROCESSABLE_STATE.

## Authorization
Matcher only (PS-018-05).

## Failure, idempotency, concurrency, offline
Not offline. Worker crash before completion restarts the run from the sealed snapshot.

## Privacy, retention, abuse
Failed runs deleted at snapshot expiry.

## Observability & budgets
Run duration histogram by length (PS-018-08).

## Tests
- TEST-PS-018-03-01 (unit): each table row.
- TEST-PS-018-03-02 (property): budget_exhausted runs never contain candidates.
- TEST-PS-018-03-03 (integration): worker crash restart yields identical candidates.

## Acceptance criteria
1. Every run ends in exactly one terminal state.
2. Completed runs are byte-stable on read.
3. No candidate from a non-completed run reaches proposal.

## Assumptions & open decisions
- PROVISIONAL (D02 default, unapproved).
