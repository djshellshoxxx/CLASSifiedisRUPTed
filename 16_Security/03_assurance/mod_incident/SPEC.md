# F16.S03.M02 — incident

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Security Lead (F16). **Parent:** F16.S03.

## Purpose and business behavior
Records and runs security incidents from declaration to closure: severity, responder roster, containment and eradication steps, a tamper-evident timeline, the affected-data scope counted in buckets, and notification obligations. It is the system of record for what happened and when. Containment actions themselves belong to F16.S03.M03 (`mod_response`); threat modelling belongs to F16.S03.M01 (`mod_threats`).

## User stories
- As an on-call responder, I declare a SEV1 incident from my phone, offline if needed, and the timer starts when the report reaches the server.
- As a Security Lead, I see open incidents by severity without reading personal data in the timeline.
- As a privacy officer, I see which notification obligations are pending and their jurisdictions, without the module computing deadlines on its own.

## Scope
- Incident lifecycle, severity, roster, timeline hash chain, scope buckets, notification tracking, post-incident review gate.
- Excludes: containment actions (`mod_response`), threat models (`mod_threats`), legal breach-notification determinations (OPEN, F10 and counsel).

## Public interfaces
`incident.declare | triage | change_severity | update_scope | append_timeline | get | list_open`; events `incident.*`. Errors `INCIDENT.*`. Detail in PS-131-04.

## Relationships, dependencies and integration
Upstream: F15.S03.M01 (`mod_backups`, storage of encrypted timelines), F16.S03.M01 (`mod_threats`, linked threats). Downstream: F07.S01.M03 (session and account actions), F16.S03.M03 (`mod_response`). Contracts: CTR-EVT-001, CTR-ERR-001.

## Data ownership
Owns `security_incident` records and their timelines. Does not own threats (F16.S03.M01), containment actions (F16.S03.M03), account data (F07), or affected personal records (their owning modules). Export and deletion follow legal-hold rules.

## Risk considerations
Incident records leaking the very data they describe; timeline tampering that hides attacker actions; late declaration because responders are offline; false declarations used to target a user; over-broad responder access; notification deadlines missed. Mitigations: bucketed counts, hash-chained timeline, offline queue with original timestamps, scoped access with audit, SLA timers, OPEN legal review. No platform custody of money. Pseudonyms do not guarantee anonymity of responders.

## Completion criteria
10 process specs approved; SLA drill passed; `inc` prefix registered; legal review of notification obligations complete; D07 resolved; privacy and security review passed.

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-131-01 (SPEC-DRAFT-COMPLETE)
- [x] [validation_rules.md](validation_rules.md) — PS-131-02 (SPEC-DRAFT-COMPLETE)
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-131-03 (SPEC-DRAFT-COMPLETE)
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-131-04 (SPEC-DRAFT-COMPLETE)
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-131-05 (SPEC-DRAFT-COMPLETE)
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-131-06 (SPEC-DRAFT-COMPLETE)
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-131-07 (SPEC-DRAFT-COMPLETE)
- [x] [observability_performance.md](observability_performance.md) — PS-131-08 (SPEC-DRAFT-COMPLETE)
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-131-09 (SPEC-DRAFT-COMPLETE)
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-131-10 (SPEC-DRAFT-COMPLETE)
