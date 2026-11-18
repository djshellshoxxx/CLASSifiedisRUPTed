# F07.S01.M02 — sessions

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Identity&Trust Lead (F07). **Parent:** [F07.S01 accounts](../SPEC.md).

## Purpose and business behavior
Issue, rotate, expire and revoke the authenticated sessions that let an `acc_` holder act on the platform from one or more devices. Users see their active devices and can end any of them. Sessions are short-lived for access and single-use for refresh, with family-wide revocation when a refresh secret is reused.

## User stories
- As an account holder, I see every device signed in to my account and can end any of them.
- As an account holder, I am told when a new device signs in, and I can end that session with one action.
- As an account holder on a mobile connection, I stay signed in without re-entering credentials until the absolute timeout.

## Scope
Ten canonical process specifications listed in the inventory below. Out of scope: credential enrolment and recovery ([mod_recovery](../mod_recovery/SPEC.md)).

## Public interfaces
Commands `session.create`, `session.refresh`, `session.revoke`, `session.revoke_others`, `session.step_up`; query `session.list`. Events `session.*` (CTR-EVT-001). Error prefix `MOD_SESSIONS.`. Prefixes `ses_` and `rfm_` are PENDING CTR-ID-001 registry entries.

## Relationships, dependencies and integration
Upstream: identity credential store (password, passkey proofs). Downstream: every module that validates a session (edge cache), mod_recovery (session revocation on completion), notifications (generic new-device notice), F12 signals. Canonical contracts: CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-SCH-001, CTR-PRV-001.

## Data ownership
Canonical owner of session and refresh-family records: `07_Identity/01_accounts/mod_sessions` (F07.S01.M02). No other module stores session secrets. Consumers use `ses_` IDs only.

## Risk considerations
Session theft (bearer tokens on shared or stolen devices), refresh replay, stale revocation at edge caches, session fixation, credential stuffing against login and step-up, and over-collection of device and network data. Store outage must fail closed. Token lifetime trades usability against exposure; defaults are provisional.

## Completion criteria
All 10 process specs at SPEC-DRAFT-COMPLETE; TEST-PS-054-01 to -23 mapped; Security Lead (F16) review of token design pending; D10 and D08 interactions resolved or default accepted.

## Required process specification inventory
- [x] `domain_schema.md` — PS-054-01
- [x] `validation_rules.md` — PS-054-02
- [x] `workflow_state_machine.md` — PS-054-03
- [x] `commands_queries_events.md` — PS-054-04
- [x] `authorization_capabilities.md` — PS-054-05
- [x] `failure_recovery_idempotency.md` — PS-054-06
- [x] `privacy_retention_abuse.md` — PS-054-07
- [x] `observability_performance.md` — PS-054-08
- [x] `contract_and_acceptance_tests.md` — PS-054-09
- [x] `import_export_backup_rollback.md` — PS-054-10
