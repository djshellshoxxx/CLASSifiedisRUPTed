# F08.S03.M03 — coordination

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Platform Lead (F08). **Parent:** F08.S03.

## Purpose and business behavior
Lets the two parties of an exchange agree a meetup window and a place, reschedule, cancel and confirm completion. Default place is a public venue from a registry; a precise point is shared only with the other party, within the meetup window, through an expiring per-meetup disclosure. Does not own the message thread (mod_private), the physical handover confirmation (mod_handoff), exchange state (F02–F05), or moderation of meetup reports (F12).

## User stories
- As a buyer, I propose a Saturday window at a listed public venue and the seller accepts or proposes another time.
- As a seller, I share my exact meeting point with the buyer only for the meetup window; afterwards the point is gone.
- As either party, I cancel or reschedule up to three times without a penalty recorded by the system.
- As a participant, I report that the other party did not show, and the report goes to review rather than an automatic sanction.

## Scope
- [domain_schema.md](domain_schema.md) — PS-064-01
- [validation_rules.md](validation_rules.md) — PS-064-02
- [workflow_state_machine.md](workflow_state_machine.md) — PS-064-03
- [commands_queries_events.md](commands_queries_events.md) — PS-064-04
- [authorization_capabilities.md](authorization_capabilities.md) — PS-064-05
- [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-064-06
- [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-064-07
- [observability_performance.md](observability_performance.md) — PS-064-08
- [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-064-09
- [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-064-10

## Public interfaces
Commands `ProposeMeetup`, `AcceptMeetup`, `ProposeReschedule`, `AcceptReschedule`, `CancelMeetup`, `ConfirmCompleted`, `ReportNoShow`, `ShareMeetupPoint`, `RevokeMeetupPoint`; queries `GetMeetup`, `ListMeetupsForThread`; events `meetup.*` (CTR-EVT-001). Details in PS-064-04.

## Relationships, dependencies and integration
Upstream: mod_private (thread membership), F02–F05 (exchange references), venue registry (F08), F10 retention rules. Downstream: mod_handoff (references meetup ID), F12 review (no-show objections), notifications (generic reminders). Canonical IDs: CTR-ID-001 `thr`, `prf`, `trx`, `par`, `rnt`; meetup prefix PENDING.

## Data ownership
Owns meetup records, reschedule history, per-meetup disclosures and no-show reports. Does not own threads, exchanges, handoff attestations or moderation cases. Retention per PS-064-07.

## Risk considerations
Specific to meetup coordination: (1) a precise point or a predictable window reveals where a person will be; (2) stalking after a one-off exchange; (3) no-show reports used for harassment; (4) fake proposals used to profile users; (5) a point disclosure copied and shared off-platform; (6) venue registry errors placing users in unsafe places. The system cannot guarantee physical safety.

## Completion criteria
All ten process specs at SPEC-DRAFT-COMPLETE; every `PS-064-*.Rnn` mapped to `TEST-PS-064-*`; meetup prefix assigned in CTR-ID-001; D05 approved or kept PROVISIONAL; F10 review of location copy; privacy and security review pass (future gate).

## Required process specification inventory
- [x] `domain_schema.md` — PS-064-01, SPEC-DRAFT-COMPLETE
- [x] `validation_rules.md` — PS-064-02, SPEC-DRAFT-COMPLETE
- [x] `workflow_state_machine.md` — PS-064-03, SPEC-DRAFT-COMPLETE
- [x] `commands_queries_events.md` — PS-064-04, SPEC-DRAFT-COMPLETE
- [x] `authorization_capabilities.md` — PS-064-05, SPEC-DRAFT-COMPLETE
- [x] `failure_recovery_idempotency.md` — PS-064-06, SPEC-DRAFT-COMPLETE
- [x] `privacy_retention_abuse.md` — PS-064-07, SPEC-DRAFT-COMPLETE
- [x] `observability_performance.md` — PS-064-08, SPEC-DRAFT-COMPLETE
- [x] `contract_and_acceptance_tests.md` — PS-064-09, SPEC-DRAFT-COMPLETE
- [x] `import_export_backup_rollback.md` — PS-064-10, SPEC-DRAFT-COMPLETE
