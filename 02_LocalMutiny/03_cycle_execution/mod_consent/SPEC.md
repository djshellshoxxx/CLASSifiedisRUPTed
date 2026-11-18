# F02.S03.M01 — mod_consent (cycle participation consent)

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Marketplace Lead (accountable role). **Parent:** [F02.S03 cycle_execution](../SPEC.md).

## Purpose and business behavior
Record each cycle participant's explicit ACCEPT or REJECT of one exact proposal version before any item is locked. Consent binds the snapshot (ordered parties, items, quotes, compensation, expiry) by `snapshot_hash`. A revised proposal voids earlier consents. Consent records a decision only; it does not show that any item changed hands.

## User stories
- As a participant in a 2–8 party cycle, I read the full snapshot as text and accept or reject it under my pseudonym, without revealing my home address.
- As a participant, if the proposal changes I am asked again and my old acceptance no longer counts.
- As an operator, I can see consent counts per cycle version without reading party content.

## Scope
Process specs (all MVP):
- domain_schema, validation_rules, workflow_state_machine, commands_queries_events, authorization_capabilities, failure_recovery_idempotency, privacy_retention_abuse, observability_performance, contract_and_acceptance_tests, import_export_backup_rollback.

Out of scope: the consent record itself (F10), cycle optimization (F02.S02), item locking (mod_lock).

## Canonical ownership (B-06)
- Consent record class: canonical owner **F10.S01.M01 mod_consent** (`10_Privacy/01_data_controls/mod_consent`).
- This module owns only `cycle_consent` decisions and references the canonical record by full ID.
- F08.S02.M02 mod_consent (message-level negotiation consent) is a separate record class; not referenced here.
- Status: PROVISIONAL (proposed resolution of REVIEW B-06; unapproved).

## Public interfaces
Command `cyc.consent`, `cyc.consent.withdraw`; queries `cyc.consent.get`, `cyc.consent.counts`; events `cycle.consent_recorded`, `cycle.consent_withdrawn`, `cycle.consent_expired`, `cycle.consented`. Details in [commands_queries_events.md](commands_queries_events.md).

## Relationships, dependencies and integration
Upstream: F02.S02 cycle proposals (snapshot, D02), F07.S01 identities (`acc_`), F10.S01.M01 (consent record), CTR-CAP-001. Downstream: mod_lock (consumes `cycle.consented`), mod_dropouts (consumes withdrawal and expiry), F13 notifications. Contract tests required for both consumers.

## Data ownership
Owns `cycle_consent` rows and the per-version consent projection. Consent record content, export and deletion of record content remain with F10.S01.M01.

## Risk considerations
Consent given by omission or after a silent proposal change (replay and race); consent mistaken for proof of handover (it is not, D04); inference of participation from consent timing across cycles (graph deanonymization); accessibility failure of the snapshot review screen. No platform custody of money. Pseudonyms do not guarantee anonymity.

## Completion criteria
All ten process specs (PS-021-01..10) approved; consent race and offline tests pass; privacy review of consent fields complete; F10 owner accepts the `consent_record_ref` contract.

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-021-01
- [x] [validation_rules.md](validation_rules.md) — PS-021-02
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-021-03
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-021-04
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-021-05
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-021-06
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-021-07
- [x] [observability_performance.md](observability_performance.md) — PS-021-08
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-021-09
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-021-10
