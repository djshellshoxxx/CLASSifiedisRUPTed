# PS-084-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/01_protocol/mod_records. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-FED-001, CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-084-04.R01 | `records.set_federate` requires `idempotency_key` and `expected_revision`. | MVP |
| PS-084-04.R02 | Events are `record.federate_enabled`, `record.federate_disabled`, `record_type.registered`, `record_type.deprecated`. | MVP |
| PS-084-04.R03 | `records.query_registry` returns registry rows (public metadata) without item IDs. | MVP |

## Data / schema
Schemas `record.*@1.0.0`, `record_type.*@1.0.0` per CTR-SCH-001.

| Command | Actor | Event | Errors |
|---|---|---|---|
| records.set_federate | item owner | record.federate_enabled / _disabled | CLASS_NOT_FEDERABLE, OPT_IN_REQUIRED |
| registry.register | Platform Lead | record_type.registered | TYPE_UNREGISTERED, SCH.BREAKING_UNVERSIONED |
| registry.deprecate | Platform Lead | record_type.deprecated | INVALID_TRANSITION |

## States & transitions
[workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
[validation_rules.md](validation_rules.md).

## Authorization
[authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Same key and digest return original; different digest → `EVT.IDEMPOTENCY_KEY_REUSED`.

## Privacy, retention, abuse
Events carry aggregate IDs and enums only.

## Observability & budgets
Event counts per type.

## Tests
- TEST-PS-084-04-01 (contract): events validate.
- TEST-PS-084-04-02 (idempotency): repeated set_federate yields one event.
- TEST-PS-084-04-03 (query): registry response has no item IDs.

## Acceptance criteria
1. Command table complete.
2. Duplicate writes produce one event.
3. Registry query leaks no item IDs.

## Assumptions & open decisions
- PENDING: consumers (`mod_portable`, `mod_delivery`) confirmed in DEPENDENCY_MATRIX.md.
