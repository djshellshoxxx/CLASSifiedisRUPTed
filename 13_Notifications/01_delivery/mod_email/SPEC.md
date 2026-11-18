# F13.S01.M02 — email

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Platform Lead (F13). **Parent:** F13.S01.

## Purpose and business behavior
Send account and security email (address verification, account recovery, sign-in and consent notices, moderation notices, deletion confirmations) through one outbound provider. Own the verified-address binding for email: store the address encrypted, verify it by single-use token, and suppress bounced or complained addresses. Marketing and digest email are Future scope and need a separate opt-in category (F13.S02.M03).

## User stories
- As a participant, I can attach an email address to my pseudonymous account and verify it without the address appearing on my public profile.
- As a participant, I can remove my address at any time, and it is erased within 24 hours of account deletion.
- As a participant, I receive security notices by email even when I have muted other channels.

## Scope
- PS-102-01 `domain_schema.md`
- PS-102-02 `validation_rules.md`
- PS-102-03 `workflow_state_machine.md`
- PS-102-04 `commands_queries_events.md`
- PS-102-05 `authorization_capabilities.md`
- PS-102-06 `failure_recovery_idempotency.md`
- PS-102-07 `privacy_retention_abuse.md`
- PS-102-08 `observability_performance.md`
- PS-102-09 `contract_and_acceptance_tests.md`
- PS-102-10 `import_export_backup_rollback.md`

## Public interfaces
Commands `eml.bind`, `eml.verify`, `eml.remove`, `eml.send`, `eml.webhook_ingest`. Query `eml.status`. Events `email_address.*`, `email_delivery.*`. Errors `EMAIL.*` (CTR-ERR-001). Details: PS-102-04.

## Relationships, dependencies and integration
Upstream: F07.S01.M01 `07_Identity/01_accounts/mod_pseudonyms` (account binding); F13.S02.M03 `13_Notifications/02_preferences/mod_opt` (category permission).
Downstream: F07.S01.M03 `07_Identity/01_accounts/mod_recovery` (recovery mail); F13.S01.M03 `13_Notifications/01_delivery/mod_inapp` (notice mirror, PS-103-01 owns notification record).
Integration: provider contract tests with timeouts of 10 s and retries per PS-102-06.

## Data ownership
Owns `eml_` address bindings and their verification tokens. Does not own the account (F07), the notification record `ntf_` or attempt `dlv_` (F13.S01.M03, PROVISIONAL), consent (F10.S01.M01) or credentials. Export and deletion follow CTR-PRV-001 retention.

## Risk considerations
Email is the most identifying channel and conflicts with pseudonymity. Risks: account enumeration through bind and recover; token theft from mail clients; header or template injection; provider or webhook compromise; bounce and complaint abuse damaging sender reputation; bodies leaking listing or counterparty detail; email-based takeover if verification is weak. Mitigations: encrypted address, keyed HMAC, single-use tokens, generic bodies, identical responses, HMAC-signed webhooks and no credential reset by email alone. Pseudonyms do not guarantee anonymity once an address is verified.

## Completion criteria
All child SPEC/TODO chains exist; every process spec is implemented and tested in later phases; privacy/security review, error handling and traceability pass.

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-102-01 — SPEC-DRAFT-COMPLETE
- [x] [validation_rules.md](validation_rules.md) — PS-102-02 — SPEC-DRAFT-COMPLETE
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-102-03 — SPEC-DRAFT-COMPLETE
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-102-04 — SPEC-DRAFT-COMPLETE
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-102-05 — SPEC-DRAFT-COMPLETE
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-102-06 — SPEC-DRAFT-COMPLETE
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-102-07 — SPEC-DRAFT-COMPLETE
- [x] [observability_performance.md](observability_performance.md) — PS-102-08 — SPEC-DRAFT-COMPLETE
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-102-09 — SPEC-DRAFT-COMPLETE
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-102-10 — SPEC-DRAFT-COMPLETE
