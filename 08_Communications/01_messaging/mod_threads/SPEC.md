# F08.S01.M02 — threads

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Platform Lead (F08). **Parent:** [F08.S01](../SPEC.md).

## Purpose and business behavior
Two-party message threads (`thr_`) and messages (`msg_`) that buyers, sellers, cycle participants, renters and dispute parties use to coordinate inside a listing, cycle, rental or dispute context. Supports optional image attachments (`att_`) with metadata stripping and pseudonymous sender display. Threads hold conversation only: they do not record agreement, offers, consent or payment, which belong to sibling modules and CTR-COM-001.

## User stories
- As a participant, I send and receive messages under my pseudonym without my account identifier or home address being shown.
- As a participant, I attach a photo and know that GPS and device metadata were removed before the counterparty sees it.
- As a participant, I see why a send failed (archived, locked, rate limited) and what to do next.
- As an operator, I can disable sending for the module without deleting any stored message.

## Scope
- Required process spec: [PS-061-01 domain schema](domain_schema.md)
- Required process spec: [PS-061-02 validation rules](validation_rules.md)
- Required process spec: [PS-061-03 workflow state machine](workflow_state_machine.md)
- Required process spec: [PS-061-04 commands queries events](commands_queries_events.md)
- Required process spec: [PS-061-05 authorization capabilities](authorization_capabilities.md)
- Required process spec: [PS-061-06 failure recovery idempotency](failure_recovery_idempotency.md)
- Required process spec: [PS-061-07 privacy retention abuse](privacy_retention_abuse.md)
- Required process spec: [PS-061-08 observability performance](observability_performance.md)
- Required process spec: [PS-061-09 contract and acceptance tests](contract_and_acceptance_tests.md)
- Required process spec: [PS-061-10 import export backup rollback](import_export_backup_rollback.md)

## Public interfaces
Commands `thr.open`, `msg.send`, `msg.redact`, `att.init`, `att.complete`, `thr.archive`; queries `thr.list`, `msg.page`; events `thread.*`, `message.*`, `attachment.*`. Envelope CTR-EVT-001, schemas CTR-SCH-001, errors `THREADS.*` per CTR-ERR-001. Full detail in PS-061-04.

## Relationships, dependencies and integration
Upstream: identity and blocks (F07), listing, cycle, rental and dispute references by ID (F01, F02, F05, F09), moderation cases (F12). Downstream: notifications (F13, generic text only), evidence references (F09). Consent and offers are not carried in threads; they are referenced from [F08.S02.M02 consent](../../02_negotiation/mod_consent/SPEC.md) and [F08.S02.M01 offers](../../02_negotiation/mod_offers/SPEC.md). Integration with F12 requires contract tests (PS-061-09).

## Data ownership
Owns `thr_`, `msg_`, `att_` records (CTR-ID-001 registry, F08). Does not own identity credentials, payment evidence or precise location. Export and deletion follow CTR-PRV-001 RET-PRIV.

## Risk considerations
- Content leakage through push previews, logs or analytics.
- EXIF location leakage from attachments; stripping is verified by fixture only.
- Timing metadata between accounts is not hidden in MVP.
- Unsolicited first-contact spam and mass repeated messages.
- Moderator read beyond case scope.
- Offline duplicate sends on flaky mobile networks.
Pseudonyms do not prevent correlation by content or timing.

## Completion criteria
All ten PS-061 specs at SPEC-DRAFT-COMPLETE; cross-module references resolve to CTR IDs or are listed as PENDING; TODO items closed in later phases; privacy, security and accessibility reviews pass.

## Required process specification inventory
- [x] [domain_schema](domain_schema.md) — PS-061-01
- [x] [validation_rules](validation_rules.md) — PS-061-02
- [x] [workflow_state_machine](workflow_state_machine.md) — PS-061-03
- [x] [commands_queries_events](commands_queries_events.md) — PS-061-04
- [x] [authorization_capabilities](authorization_capabilities.md) — PS-061-05
- [x] [failure_recovery_idempotency](failure_recovery_idempotency.md) — PS-061-06
- [x] [privacy_retention_abuse](privacy_retention_abuse.md) — PS-061-07
- [x] [observability_performance](observability_performance.md) — PS-061-08
- [x] [contract_and_acceptance_tests](contract_and_acceptance_tests.md) — PS-061-09
- [x] [import_export_backup_rollback](import_export_backup_rollback.md) — PS-061-10
