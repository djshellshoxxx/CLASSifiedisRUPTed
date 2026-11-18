# F10.S01.M01 — consent

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Privacy Lead (role). **Parent:** F10.S01.

## Purpose and business behavior
Record each participant's privacy-consent grants and withdrawals per processing purpose (analytics, push notifications, federation item opt-in, location precision disclosure, counterparty contact). Downstream modules check this state before processing; this module does not process personal data itself. Canonical owner of privacy-consent records (B-06, PROVISIONAL). Cycle-participation and negotiation consent are separate record classes owned elsewhere and referenced by full ID.

## User stories
- As a participant, I can grant or withdraw consent for one purpose without affecting my other purposes.
- As a participant, I see which notice version I agreed to and when it expires or is superseded.
- As a participant offline, my withdrawal is kept until the server acknowledges it.
- As a privacy operator, I can audit consent state for a case without reading consent content outside dual control.

## Scope
- [domain_schema.md](domain_schema.md) — PS-076-01
- [validation_rules.md](validation_rules.md) — PS-076-02
- [workflow_state_machine.md](workflow_state_machine.md) — PS-076-03
- [commands_queries_events.md](commands_queries_events.md) — PS-076-04
- [authorization_capabilities.md](authorization_capabilities.md) — PS-076-05
- [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-076-06
- [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-076-07
- [observability_performance.md](observability_performance.md) — PS-076-08
- [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-076-09
- [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-076-10

## Public interfaces
Commands `consent.grant`, `consent.withdraw`, query `consent.query`, system jobs `consent.expire`, `consent.supersede`. Events `consent.granted`, `consent.withdrawn`, `consent.expired`, `consent.superseded`. Details in PS-076-04. Canonical contracts: CTR-EVT-001, CTR-ERR-001, CTR-CAP-001.

## Relationships, dependencies and integration
Upstream: identity (CTR-ID-001, F07), capability model (CTR-CAP-001, F16), notice registry (F10). Downstream: notifications (F13), federation item opt-in (CTR-FED-001, F11), evidence and moderation (F12) for audit reads. Integration requires contract tests and a 60 s propagation budget for withdrawals.

## Data ownership
Owns consent records and their lifecycle only. Identity credentials, messages, payment evidence and precise geolocation remain with their owning features.

## Risk considerations
Consent state going stale on offline clients, so processing continues after withdrawal. Bundled or pre-ticked grants that do not represent real choice. Old grants replayed after a notice change. Withdrawals not propagated to federated peers. Consent records revealing sensitive interests through purpose names. Restore from backup resurrecting withdrawn consent. Operator reads of consent without dual control.

## Completion criteria
All 10 process specs reviewed by Privacy Lead; tests TEST-PS-076-* defined; B-06 owner link confirmed by Governance Lead; no implementation claimed.

## Required process specification inventory
- [x] `domain_schema.md` — PS-076-01, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `validation_rules.md` — PS-076-02, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `workflow_state_machine.md` — PS-076-03, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `commands_queries_events.md` — PS-076-04, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `authorization_capabilities.md` — PS-076-05, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `failure_recovery_idempotency.md` — PS-076-06, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `privacy_retention_abuse.md` — PS-076-07, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `observability_performance.md` — PS-076-08, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `contract_and_acceptance_tests.md` — PS-076-09, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `import_export_backup_rollback.md` — PS-076-10, SPEC-DRAFT-COMPLETE (pending approval)
