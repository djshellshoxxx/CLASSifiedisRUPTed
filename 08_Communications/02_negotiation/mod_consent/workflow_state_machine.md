# PS-062-03 — workflow state machine
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/02_negotiation/mod_consent. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (revision), CTR-CAP-001, CTR-COM-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-062-03.R01 | Consent states: `given`, `declined`, `withdrawn`, `superseded`, `expired`. `declined`, `withdrawn`, `superseded`, `expired` are terminal. | MVP |
| PS-062-03.R02 | `given` → `superseded` automatically when the proposal version increments. | MVP |
| PS-062-03.R03 | `given` → `withdrawn` allowed until execution lock; after lock, withdrawal is refused and routed to dispute ([PS-062-06](failure_recovery_idempotency.md)). | MVP |
| PS-062-03.R04 | `given` → `expired` when `effective_until` passes. | MVP |
| PS-062-03.R05 | A `declined` record does not block a later `given` on a new version. | MVP |
| PS-062-03.R06 | Every transition emits one event with the next per-slot revision (CTR-EVT-001 R02). | MVP |

## Data / schema
State lives on the `consent` record in [PS-062-01](domain_schema.md).

## Commands / queries / events
Triggers in [PS-062-04](commands_queries_events.md).

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | consent.given | valid per PS-062-02 | given | notify proposal owner (generic) |
| (none) | consent.declined | party is a slot participant | declined | notify proposal owner |
| given | consent.withdrawn | not execution-locked | withdrawn | notify proposal owner; F02 re-plans slot |
| given | consent.superseded | proposal version incremented | superseded | none; party must re-consent |
| given | consent.expired | `effective_until` passed | expired | notify party |
| given | (lock event) | F02.S03.M01 execution lock | given (frozen) | withdrawal now refused |

Forbidden transitions return `CONSENT.ALREADY_WITHDRAWN` or `CONSENT.EXECUTION_LOCKED`.

## Validation & errors
Guards use codes from [PS-062-02](validation_rules.md).

## Authorization
Actor = slot party only ([PS-062-05](authorization_capabilities.md)).

## Failure, idempotency, concurrency, offline
Concurrent withdraw and lock: lock evaluated first on commit; withdraw after lock fails. Per-slot revision guards ordering.

## Privacy, retention, abuse
Event payloads carry consent and proposal IDs and states only.

## Observability & budgets
Metric `consent_transition_total{from,event,to}`. Alert: any `withdrawn` committed after a lock event (should be zero).

## Tests
- TEST-PS-062-03-01 (unit): transition table rows; forbidden transitions return the stated codes.
- TEST-PS-062-03-02 (integration): withdraw races lock; exactly one wins; if lock wins, withdraw returns `CONSENT.EXECUTION_LOCKED`.
- TEST-PS-062-03-03 (integration): version bump supersedes all `given` records for that proposal.

## Acceptance criteria
1. No `withdrawn` event after a lock event for the same proposal (TEST-PS-062-03-02).
2. Version bump supersedes all prior `given` records (TEST-PS-062-03-03).

## Assumptions & open decisions
- ASSUMPTION: lock event is owned by F02.S03.M01 (`cyc_` execution); this module consumes it by ID.
- OPEN: whether withdrawal after lock should trigger automatic `dsp_` creation (default: no; user must open dispute).
