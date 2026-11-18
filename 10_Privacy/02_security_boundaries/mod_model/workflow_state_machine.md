# PS-081-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/02_security_boundaries/mod_model. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02), CTR-SCH-001 (R10 class changes).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-081-03.R01 | A model version moves draft → review → approved only. Approval requires the Security Lead role and a different actor than the proposer. | MVP |
| PS-081-03.R02 | A flow moves proposed → active → retired. Activation runs validation rules in PS-081-02. | MVP |
| PS-081-03.R03 | Lowering a control or class on an active flow requires review and creates a new version (no in-place edit). | MVP |

## Data / schema
States stored in `status` fields of `mdv_` and `flw_` (see [domain_schema.md](domain_schema.md)).

## Commands / queries / events
Transitions emitted as `model.version_approved`, `flow.registered`, `flow.retired`. See [commands_queries_events.md](commands_queries_events.md).

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | model.propose_version | validation passes | draft | none |
| draft | model.submit_review | digest computed | review | notify Security Lead |
| review | model.approve | approver ≠ proposer; role Security Lead | approved | version becomes current |
| review | model.reject | reason code | draft | notify proposer |
| approved | model.supersede | newer version approved | superseded | none |
| (none) | flow.register | PS-081-02 passes | proposed | none |
| proposed | flow.activate | boundary controls verified | active | enables CI drift check |
| active | flow.retire | no active consumer | retired | archive |

## Validation & errors
Illegal transitions: `MODEL.INVALID_TRANSITION` (409).

## Authorization
Approve/reject: Security Lead only. Propose: Privacy Lead.

## Failure, idempotency, concurrency, offline
Transitions use `expected_version` checks. Retries return the current state.

## Privacy, retention, abuse
No personal data in transitions.

## Observability & budgets
Gauge of flows per status; review lead time metric (target ≤ 5 business days, ASSUMPTION).

## Tests
- TEST-PS-081-03-01 (state): table rows pass; undefined transitions rejected.
- TEST-PS-081-03-02 (separation of duties): proposer cannot approve own version.
- TEST-PS-081-03-03 (versioning): class lowering creates a new version.

## Acceptance criteria
1. Transition table exhaustive and tested.
2. Separation of duties holds.
3. Active flows always link to an approved version.

## Assumptions & open decisions
- ASSUMPTION: 5 business day review target.
- PROVISIONAL (D10 default, unapproved): key-related assets require review on change.
