# F11.S02.M02 — dedup

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Platform Lead (role). **Parent:** F11.S02.

## Purpose and business behavior
Decide, for each inbound federated event, whether it is new, a duplicate of an event already accepted, or equivocation (two different events claiming the same origin revision). Keys are `(origin_node, event_id)` for duplicates and `(origin_node, aggregate_id, revision)` for equivocation, per CTR-FED-001. Duplicate results let relays re-send safely; equivocation quarantines the peer and keeps evidence.

## User stories
- As a relay, I can re-send a batch after a timeout without causing double application.
- As a receiving node, a conflicting event under the same revision is detected and the sender quarantined.
- As a trust and safety reviewer, I can read equivocation evidence under case control.
- As an operator, a dedupe outage stops acceptance rather than risking double application.

## Scope
- [domain_schema.md](domain_schema.md) — PS-087-01
- [validation_rules.md](validation_rules.md) — PS-087-02
- [workflow_state_machine.md](workflow_state_machine.md) — PS-087-03
- [commands_queries_events.md](commands_queries_events.md) — PS-087-04
- [authorization_capabilities.md](authorization_capabilities.md) — PS-087-05
- [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-087-06
- [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-087-07
- [observability_performance.md](observability_performance.md) — PS-087-08
- [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-087-09
- [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-087-10

## Public interfaces
Internal command `dedup.check_and_record`; query `dedup.lookup`. Events `dedup.duplicate_seen`, `dedup.equivocation_detected`. Details in PS-087-04.

## Relationships, dependencies and integration
Upstream: inbound verification (CTR-FED-001 steps 1–11), event log (CTR-EVT-001). Downstream: `11_Federation/02_relay_sync/mod_delivery` (per-event result), `11_Federation/02_relay_sync/mod_conflicts` (revision gaps), trust and safety (F12) via peer quarantine.

## Data ownership
Owns dedupe index and equivocation records. Event bodies are owned by the origin aggregate.

## Risk considerations
Index eviction causing double application. Clock-based expiry allowing replay of old events. Equivocation evidence retained too long or too briefly. Race between two relays inserting the same event. Flood of distinct IDs exhausting the index.

## Completion criteria
All 10 process specs reviewed; race test defined; equivocation path to quarantine tested.

## Required process specification inventory
- [x] `domain_schema.md` — PS-087-01, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `validation_rules.md` — PS-087-02, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `workflow_state_machine.md` — PS-087-03, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `commands_queries_events.md` — PS-087-04, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `authorization_capabilities.md` — PS-087-05, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `failure_recovery_idempotency.md` — PS-087-06, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `privacy_retention_abuse.md` — PS-087-07, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `observability_performance.md` — PS-087-08, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `contract_and_acceptance_tests.md` — PS-087-09, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `import_export_backup_rollback.md` — PS-087-10, SPEC-DRAFT-COMPLETE (pending approval)
