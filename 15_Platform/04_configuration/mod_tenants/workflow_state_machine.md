# PS-125-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** [mod_tenants](SPEC.md) (Platform Lead). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-CAP-001, CTR-FED-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-125-03.R01 | Every status change is one transition from the table below; any other transition returns `TEN.INVALID_TRANSITION` (conflict / 409). | MVP |
| PS-125-03.R02 | `deleted` is terminal. No transition leaves it. | MVP |
| PS-125-03.R03 | `suspended` blocks all tenant writes at commit within 0 s and all cached reads within 60 s (CTR-CAP-001 R09). | MVP |
| PS-125-03.R04 | Provisioning completes or compensates within 10 min (ASSUMPTION). | MVP |
| PS-125-03.R05 | Offboarding cannot finish while a legal hold covers any tenant record (CTR-PRV-001 RET-LEGAL). | MVP |

## Data / schema
Transition log is the event stream of `aggregate_type = tenant` (CTR-EVT-001). Fields: `from`, `to`, `event`, `actor_ref`, `decision_id`, `revision`.

## Commands / queries / events
Transitions are triggered only by commands in [PS-125-04](commands_queries_events.md).

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | tenant.create | slug unique; admin active | provisioning | Emit `tenant.created`; start saga. |
| provisioning | provision.completed | all steps succeeded | active | Emit `tenant.activated`. |
| provisioning | provision.failed | retries exhausted or 10 min elapsed | deleted | Compensate reserved resources; emit `tenant.deleted`. |
| active | tenant.suspend | two distinct ope approvals (ASSUMPTION) | suspended | Invalidate decision cache; emit `tenant.suspended`. |
| suspended | tenant.resume | two distinct ope approvals (ASSUMPTION) | active | Emit `tenant.resumed`. |
| active | tenant.offboard | requested by admin_ref; export job created | offboarding | Freeze writes; emit `tenant.offboarding_started`. |
| suspended | tenant.offboard | as above | offboarding | As above. |
| offboarding | offboard.completed | export delivered; RET-ACC grace elapsed; no legal hold | deleted | Tombstone; purge per PS-125-07; emit `tenant.deleted`. |
| active | config.updated | `expected_revision` equals `revision` | active | `revision` +1; emit `tenant.config_changed`. |
| suspended | config.updated | as above; admin changes only | suspended | As above. |

## Validation & errors
Invalid transitions return `TEN.INVALID_TRANSITION` (conflict / 409, not retryable). Revision mismatch returns `EVT.REVISION_CONFLICT`.

## Authorization
Actor rules are in [PS-125-05](authorization_capabilities.md). The state machine does not grant rights.

## Failure, idempotency, concurrency, offline
Each transition is one committed event under the aggregate lock (CTR-EVT-001 R02). A crash during provisioning resumes from the last completed step; steps carry step IDs so replay is a no-op. Offline clients see status only after sync.

## Privacy, retention, abuse
Transition events carry no personal data beyond `actor_ref`. Retention follows RET-AUD for the log and RET-ACC for the record.

## Observability & budgets
`tenant_transitions_total{from,to}`. Alert on any `provisioning` tenant older than 10 min.

## Tests
- TEST-PS-125-03-01 (unit): every row of the table passes; every other pair is rejected.
- TEST-PS-125-03-02 (integration): crash after step 2 of 4 resumes without duplicate tenant.
- TEST-PS-125-03-03 (negative): offboarding with a legal hold stays in `offboarding`.

## Acceptance criteria
1. Transition table is exhaustive over the five statuses.
2. Suspension blocks a write issued 1 ms after the commit of suspend.
3. `deleted` cannot be reached from `suspended` without offboarding.

## Assumptions & open decisions
- ASSUMPTION: two-approver rule for suspend and resume, consistent with CTR-CAP-001 dual control for operator actions.
- PROVISIONAL (D07 default, unapproved): offboarding export and purge windows follow RET-ACC.
- PROVISIONAL (D01 default, unapproved): suspension propagates to federation peers as a CTR-FED-001 peer state change.
