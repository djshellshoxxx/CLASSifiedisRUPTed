# PS-081-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/02_security_boundaries/mod_model. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-081-04.R01 | Every state-changing command takes `idempotency_key` and `expected_version`. | MVP |
| PS-081-04.R02 | Events use `model.*`, `flow.*` and `asset.*` aggregate names per CTR-EVT-001 R10. | MVP |
| PS-081-04.R03 | `model.query_current` returns the approved version and digest only. | MVP |

## Data / schema
Payload schemas registered in CTR-SCH-001 under `model.*`. Field definitions in [domain_schema.md](domain_schema.md).

| Command | Actor | Event | Errors |
|---|---|---|---|
| model.propose_version | Privacy Lead | model.version_proposed | FLOW_UNCLASSIFIED, SAMPLE_DATA_FORBIDDEN |
| model.approve | Security Lead | model.version_approved | INVALID_TRANSITION, CAP.SELF_APPROVAL_FORBIDDEN |
| flow.register | Privacy Lead | flow.registered | BOUNDARY_CONTROL_MISSING, CLASS_NOT_CROSSABLE |
| flow.retire | Privacy Lead | flow.retired | INVALID_TRANSITION |
| model.query_current | any reader with `model.read` | none | SYS.NOT_FOUND |

## States & transitions
Event order per [workflow_state_machine.md](workflow_state_machine.md). Each event increments the aggregate revision by 1.

## Validation & errors
Rules in [validation_rules.md](validation_rules.md). Envelope per CTR-ERR-001.

## Authorization
Capabilities in [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Same key + same digest returns original; different digest → `EVT.IDEMPOTENCY_KEY_REUSED`. No offline writes.

## Privacy, retention, abuse
Event payloads contain IDs and classes only.

## Observability & budgets
Event count per type; consumer lag budget 60 s (ASSUMPTION).

## Tests
- TEST-PS-081-04-01 (contract): each event validates against registered schema.
- TEST-PS-081-04-02 (idempotency): duplicate proposal yields one event.
- TEST-PS-081-04-03 (query): `model.query_current` omits proposal history.

## Acceptance criteria
1. Command/event table complete for the module.
2. Duplicate command produces one event.
3. Query output contains only approved version fields.

## Assumptions & open decisions
- ASSUMPTION: consumer lag budget.
- Downstream consumers (CI drift check, F12) listed in DEPENDENCY_MATRIX.md; PENDING registry confirmation.
