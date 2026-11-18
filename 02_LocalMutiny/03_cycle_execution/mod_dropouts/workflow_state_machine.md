# PS-022-03 — Workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/03_cycle_execution/mod_dropouts. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-CAP-001, CTR-COM-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-022-03.R01 | Dropout case states: `OPEN`, `RESOLVING`, `RESOLVED_RESOLVE_AGAIN`, `RESOLVED_CANCELLED`, `RESOLVED_PARTIAL`, `ESCALATED`. | MVP |
| PS-022-03.R02 | Any dropout moves the whole cycle version out of LOCKED/ATTESTING; no other party can attest after a case opens for that version. | MVP |
| PS-022-03.R03 | `ESCALATED` hands the case to mod_recovery (F02.S03.M04). Dropouts never settle money directly. | MVP |
| PS-022-03.R04 | Every transition emits one event with `revision` increment. | MVP |

## Data / schema
State stored in `dropout_case.resolution` and `dropout_case.revision`; cycle state projection owned by F02.S02/S03 aggregate.

## Commands / queries / events
See [commands_queries_events.md](commands_queries_events.md).

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| — | `cycle.dropout_detected` | PS-022-02 R01–R04 | OPEN | cycle → DROPPED_OUT; lock release requested |
| OPEN | `cycle.dropout_resolving` | locks released or marked for recovery | RESOLVING | choose path |
| RESOLVING | `cycle.resolved_again` | successor version exists (R05) | RESOLVED_RESOLVE_AGAIN | new CONSENTING for successor |
| RESOLVING | `cycle.cancelled` | R06 satisfied | RESOLVED_CANCELLED | notify parties |
| RESOLVING | `cycle.partially_resolved` | per-party outcome recorded | RESOLVED_PARTIAL | open recovery claims (CTR-COM-001) |
| OPEN, RESOLVING | `cycle.escalated` | any party or timer after 7 days | ESCALATED | mod_recovery case created |
| RESOLVED_*, ESCALATED | any dropout command | — | unchanged | `CYC_DROPOUT.NOT_ELIGIBLE` |

## Validation & errors
Guards from [validation_rules.md](validation_rules.md). Invalid transitions → `SYS.UNPROCESSABLE_STATE`.

## Authorization
Detection by participant (own withdrawal), timer (`sys_`), or peer report (`participant`). Escalation by any participant or `sys_`.

## Failure, idempotency, concurrency, offline
Timer transitions idempotent by (dropout_id, event). Concurrent detections merge (R01 in domain_schema). Partial lock release: the case stays RESOLVING until mod_lock confirms.

## Privacy, retention, abuse
Events carry reason_code only; partial outcomes carry per-party booleans, not free text.

## Observability & budgets
Gauge per state; time in RESOLVING p95 ≤ 2 h (ASSUMPTION).

## Tests
- TEST-PS-022-03-01 (unit): each transition in the table.
- TEST-PS-022-03-02 (property): no path from RESOLVED_* back to OPEN.
- TEST-PS-022-03-03 (integration): escalation after 7 days creates mod_recovery case once.

## Acceptance criteria
1. All transitions implemented; invalid ones return the stated code.
2. No money movement occurs in this module's transitions.
3. Escalation idempotent under duplicate timer fires.

## Assumptions & open decisions
- ASSUMPTION: 7-day escalation timer.
- [DECISIONS.md](../../../DECISIONS.md) D04 — PROVISIONAL (D04 default, unapproved): partial outcomes are per-party with compensating recovery; no atomic completion claim.
