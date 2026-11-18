# F11.S01.M02 — records

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Platform Lead (role). **Parent:** F11.S01.

## Purpose and business behavior
Hold the federation record-type registry and the per-item `federate` flag. The registry states, for each local record type, the most sensitive class it may reach, whether it can federate at all, and whether each item needs explicit opt-in or may federate as a registered region cell. Other federation modules read these rules; this module does not build envelopes (CTR-EVT-001) or verify them (CTR-FED-001).

## User stories
- As a participant, my listing is never shared to another node unless I opt in for that listing.
- As an operator, I can see which record types are federable and at what class.
- As a privacy reviewer, I can block a record type from federation without a code change.
- As a participant, opting out stops future sharing of that item.

## Scope
- [domain_schema.md](domain_schema.md) — PS-084-01
- [validation_rules.md](validation_rules.md) — PS-084-02
- [workflow_state_machine.md](workflow_state_machine.md) — PS-084-03
- [commands_queries_events.md](commands_queries_events.md) — PS-084-04
- [authorization_capabilities.md](authorization_capabilities.md) — PS-084-05
- [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-084-06
- [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-084-07
- [observability_performance.md](observability_performance.md) — PS-084-08
- [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-084-09
- [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-084-10

## Public interfaces
Commands `records.set_federate`, `registry.register`, `registry.deprecate`; queries `records.query_registry`. Events `record.federate_enabled`, `record.federate_disabled`, `record_type.registered`, `record_type.deprecated`. Details in PS-084-04.

## Relationships, dependencies and integration
Upstream: data classes (CTR-PRV-001), schema registry (CTR-SCH-001), capability model (CTR-CAP-001). Downstream: `11_Federation/01_protocol/mod_portable`, `11_Federation/02_relay_sync/mod_delivery`, federation envelope (CTR-FED-001).

## Data ownership
Owns the registry and item federate flags. Does not own items or their content.

## Risk considerations
A record type registered as `public_auto` by mistake federates private content. Class raised without review. Flags applied while offline before acknowledgement. Cell mode with small cells reveals a location. Registry drift from code.

## Completion criteria
All 10 process specs reviewed; registry seeded from code inventory; class-raise review path tested.

## Required process specification inventory
- [x] `domain_schema.md` — PS-084-01, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `validation_rules.md` — PS-084-02, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `workflow_state_machine.md` — PS-084-03, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `commands_queries_events.md` — PS-084-04, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `authorization_capabilities.md` — PS-084-05, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `failure_recovery_idempotency.md` — PS-084-06, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `privacy_retention_abuse.md` — PS-084-07, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `observability_performance.md` — PS-084-08, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `contract_and_acceptance_tests.md` — PS-084-09, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `import_export_backup_rollback.md` — PS-084-10, SPEC-DRAFT-COMPLETE (pending approval)
