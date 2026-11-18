# PS-016-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/02_cycle_matching/mod_feasibility. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-PRV-001, CTR-COM-001 (R04), CTR-SCH-001. Module code `FEASIBLE` (PENDING CTR-ERR-001).

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-016-02.R01 | Each edge's offer and want endpoints must reference an active listing and an active variant (if any) at snapshot time. | MVP |
| PS-016-02.R02 | Each offered item must have available quantity ≥ 1 per mod_availability at snapshot time. | MVP |
| PS-016-02.R03 | A candidate's participants are pairwise distinct; a participant appears in at most one slot. | MVP |
| PS-016-02.R04 | Length must be within the configured bounds (default 2..8). | MVP |
| PS-016-02.R05 | Value gap across slots, when quotes exist, must be ≤ tolerance (integer minor units, default 0 for barter-only). Gaps above tolerance are INFEASIBLE (VALUE_GAP); compensation is handled by F02.S04.M01. | MVP |
| PS-016-02.R06 | A quote used in a verdict must have `valid_until` later than the evaluation time; otherwise QUOTE_EXPIRED. | MVP |

## Data / schema
Parameters: `max_edges=5000`, `length_min=2`, `length_max=8`, `budget_steps=200000` (ASSUMPTION; D02 default).

## Validation & errors
| Code | Category (HTTP) | Retryable | Trigger | details[].rule |
|---|---|---|---|---|
| FEASIBLE.SNAPSHOT_TOO_LARGE | payload_too_large (413) | false | > 5,000 edges | max_edges |
| FEASIBLE.ENDPOINT_INACTIVE | unprocessable_state (422) | true | endpoint inactive at snapshot | endpoint_status |
| FEASIBLE.NOT_AVAILABLE | unprocessable_state (422) | true | quantity 0 | availability |
| FEASIBLE.PARTICIPANT_REPEATED | validation (400) | false | duplicate participant | distinct_participants |
| FEASIBLE.LENGTH_OUT_OF_RANGE | validation (400) | false | length outside bounds | length_bounds |
| FEASIBLE.REGION_UNKNOWN | validation (400) | false | cell not in registry | region_cell |
| FEASIBLE.QUOTE_EXPIRED | precondition_failed (412) | true | quote past valid_until | quote_validity |
| FEASIBLE.BUDGET_EXHAUSTED | unprocessable_state (422) | true | step budget exceeded | budget_steps |
| FEASIBLE.UPSTREAM_UNAVAILABLE | unavailable (503) | true | availability or valuation down | upstream |

Messages use `err.feasible.<code>` keys. No values are echoed.

## Authorization
Validation runs after PS-016-05 checks; unreadable objects yield SYS.NOT_FOUND.

## Failure, idempotency, concurrency, offline
Rules evaluated against the snapshot, not live state, so results do not change during evaluation.

## Privacy, retention, abuse
Region validation uses cell IDs only; no location lookup.

## Observability & budgets
Rejection counts per code (PS-016-08).

## Tests
- TEST-PS-016-02-01 (unit): one fixture per code.
- TEST-PS-016-02-02 (property): VALUE_GAP flips exactly at tolerance + 1.
- TEST-PS-016-02-03 (negative): 5,001-edge snapshot rejected before any evaluation.

## Acceptance criteria
1. Each code is produced only by its trigger.
2. Boundary values (length 2 and 8; 5,000 edges; tolerance) pass or fail as specified.
3. No response contains participant IDs from other slots.

## Assumptions & open decisions
- PROVISIONAL (D03 default, unapproved): pinned quotes, integer minor units, expiry enforced.
- PROVISIONAL (D02 default, unapproved): explicit budget and bounds.
