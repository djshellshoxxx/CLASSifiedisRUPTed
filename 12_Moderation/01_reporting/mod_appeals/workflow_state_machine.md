# PS-092-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/01_reporting/mod_appeals. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (revision, correlation), CTR-CAP-001 (decision records).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-092-03.R01 | Only the transitions in the table are reachable. Others → `APPEALS.TRANSITION_NOT_ALLOWED` (422, non-retryable). | MVP |
| PS-092-03.R02 | `decided` with `REVERSED` or `MODIFIED` emits `appeal.decided` consumed by `mod_enforcement`; the enforcement effect is applied exactly once, keyed by `apl_` ID. | MVP |
| PS-092-03.R03 | Enforcement stays in force during review unless a `stay` is recorded by a reviewer with reason code (ASSUMPTION). | MVP |
| PS-092-03.R04 | Decision SLA: `decided` within 14 days of `accepted` (ASSUMPTION); breach raises an alert, not an automatic outcome. | MVP |
| PS-092-03.R05 | `closed` is set automatically 7 days after `decided` if no implementation failure is open. | MVP |

## Data / schema
States: `received`, `ineligible`, `accepted`, `in_review`, `decided`, `implemented`, `closed`, `withdrawn`. Stored in `apl_appeal.state` (PS-092-01).

## Commands / queries / events
Transitions produce events listed in [PS-092-04](commands_queries_events.md).

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | `appeal.received` | target appealable, inside window, no open appeal | received | notify appellant (generic text) |
| received | `appeal.ineligible` | window or duplicate check fails at triage | ineligible | terminal; reason to appellant |
| received | `appeal.accepted` | triage passes | accepted | SLA clock starts |
| accepted | `appeal.assigned` | reviewer passes PS-092-02 R06 | in_review | reviewer sees case scope |
| in_review | `appeal.decided` | decision code and reason valid | decided | outbox event to `mod_enforcement` if reversed or modified |
| decided | `appeal.implemented` | enforcement service acknowledges | implemented | none |
| implemented | `appeal.closed` | 7 days elapsed | closed | terminal |
| received, accepted, in_review | `appeal.withdrawn` | appellant request | withdrawn | terminal; enforcement unchanged |

## Validation & errors
Invalid pairs → `APPEALS.TRANSITION_NOT_ALLOWED`. Withdrawal after `decided` is refused.

## Authorization
Transitions require capabilities in [PS-092-05](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
If `implemented` is not reached within 24 h of `decided`, the appeal is listed on the operator backlog (see PS-092-06).

## Privacy, retention, abuse
Appellant sees state names only (`received`, `in_review`, `decided`, `closed`, `withdrawn`), not reviewer identity.

## Observability & budgets
Metric `appeals_transition_total{from,to}`; `appeals_time_to_decision_seconds` histogram.

## Tests
- `TEST-PS-092-03-01` unit: exhaustive state × event matrix; only table rows succeed.
- `TEST-PS-092-03-02` integration: `REVERSED` decision reverses the enforcement exactly once when the event is delivered twice.
- `TEST-PS-092-03-03` property: `closed`, `withdrawn` and `ineligible` have no outgoing transitions.
- `TEST-PS-092-03-04` integration: enforcement service down → `decided` persists, backlog listing shows it, no state skipped.

## Acceptance criteria
1. Table is the sole source of allowed transitions.
2. No enforcement reversal occurs without an `appeal.decided` event with `REVERSED` or `MODIFIED`.
3. SLA breach alert fires in test at day 14 + 1 hour.

## Assumptions & open decisions
- ASSUMPTION: enforcement stay is off by default; reviewers must record a stay explicitly.
- ASSUMPTION: no second-level appeal in MVP; a second review is a future scope item.
- D07 (retention), PROVISIONAL default applies to `closed` appeals (unapproved).
