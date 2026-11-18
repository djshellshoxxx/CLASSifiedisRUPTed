# F07.S01.M03 — recovery

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Identity&Trust Lead (F07). **Parent:** [F07.S01 accounts](../SPEC.md).

## Purpose and business behavior
Let an `acc_` holder regain access after losing every session and credential, using only proofs enrolled in advance: saved recovery codes or a verified contact address. Recovery never discloses the account's contact address, region cell or home location, never gives support staff access to credentials (CTR-CAP-001 R12), and never completes before a 24 h cooldown (ASSUMPTION) during which the holder can cancel. Trusted-contact quorum recovery is deferred (Future).

## User stories
- As an account holder who lost my device, I start recovery with a code I saved earlier and regain access after the cooldown.
- As an account holder, I get a notice on every verified contact and active session when recovery starts, and I can cancel it.
- As a support operator, I see that a recovery exists for a case without seeing codes or contact addresses.

## Scope
Ten canonical process specifications listed in the inventory below. Out of scope: session token lifecycle ([mod_sessions](../mod_sessions/SPEC.md)), pseudonym management ([mod_pseudonyms](../mod_pseudonyms/SPEC.md)).

## Public interfaces
Commands `recovery.start`, `recovery.submit_proof`, `recovery.complete`, `recovery.cancel`, `recovery.method.enroll`, `recovery.method.revoke`. Events `recovery_request.*` and `recovery_method.*` (CTR-EVT-001). Error prefix `MOD_RECOVERY.`. Prefixes `rec_` and `rmt_` are PENDING CTR-ID-001 registry entries.

## Relationships, dependencies and integration
Upstream: mod_sessions (step-up and session revocation), mod_pseudonyms (`acc_` lookup), identity credential store (contact addresses by ID). Downstream: generic notifications (CTR-PRV-001 R10), F12 moderation (case-scoped read only), observability. Canonical contracts: CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-SCH-001, CTR-PRV-001.

## Data ownership
Canonical owner of account-recovery request and recovery-method records: `07_Identity/01_accounts/mod_recovery` (F07.S01.M03). The slug is shared with `02_LocalMutiny/03_cycle_execution/mod_recovery` (cycle recovery) and `15_Platform/03_operations/mod_recovery` (platform recovery). Those own different record classes. Consumers reference `F07.S01.M03` by full ID only (REVIEW B-06). Contact addresses stay owned by the identity credential store.

## Risk considerations
Account takeover through recovery is the main threat: social engineering of contact channels, replay of consumed codes, enumeration of valid accounts, and brute force of short codes. Mis-scoped recovery can bypass MFA (CTR-CAP-001 R12 cites S3-01). Legitimate holders can be locked out if they never saved codes. Masking limits contact exposure to the contact provider but cannot remove it. Pseudonyms do not guarantee anonymity.

## Completion criteria
All 10 process specs at SPEC-DRAFT-COMPLETE; TEST-PS-053-01 to -23 mapped; approval by Identity&Trust Lead and Security Lead (F16) pending; D10 resolved or PROVISIONAL default accepted.

## Required process specification inventory
- [x] `domain_schema.md` — PS-053-01
- [x] `validation_rules.md` — PS-053-02
- [x] `workflow_state_machine.md` — PS-053-03
- [x] `commands_queries_events.md` — PS-053-04
- [x] `authorization_capabilities.md` — PS-053-05
- [x] `failure_recovery_idempotency.md` — PS-053-06
- [x] `privacy_retention_abuse.md` — PS-053-07
- [x] `observability_performance.md` — PS-053-08
- [x] `contract_and_acceptance_tests.md` — PS-053-09
- [x] `import_export_backup_rollback.md` — PS-053-10
