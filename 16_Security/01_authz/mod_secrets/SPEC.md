# F16.S01.M02 — secrets

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Security Lead (F16). **Parent:** [F16.S01 authz](../SPEC.md).

## Purpose and business behavior
Holds the platform's own secrets (service credentials, provider API keys, webhook signing secrets, verifier keys for hashed tokens) and issues short-lived leases to the named modules that need them. Values are write-once from the operator's side, never readable after creation, and never shown in logs or exports. User key material is out of scope (F16.S02.M01).

## User stories
- As a platform engineer, I can rotate a provider credential without downtime and with a rollback path.
- As a security lead, I can revoke a leaked credential and see every lease it produced.
- As a participant, my data is not exposed if a platform credential leaks, because it is scoped to one module.

## Scope
Platform secret records, rotation, revocation, destruction, short-lived leases and audit. Process specifications: [domain_schema](domain_schema.md), [validation_rules](validation_rules.md), [workflow_state_machine](workflow_state_machine.md), [commands_queries_events](commands_queries_events.md), [authorization_capabilities](authorization_capabilities.md), [failure_recovery_idempotency](failure_recovery_idempotency.md), [privacy_retention_abuse](privacy_retention_abuse.md), [observability_performance](observability_performance.md), [contract_and_acceptance_tests](contract_and_acceptance_tests.md), [import_export_backup_rollback](import_export_backup_rollback.md).

## Public interfaces
Internal `secret.create`, `secret.rotate`, `secret.revoke`, `secret.destroy`, `lease.issue`; queries `secret.get_metadata`, `secret.list`. Error codes `SECRETS.*` (module code 7 letters, CTR-ERR-001 R02).

## Relationships, dependencies and integration
Depends on F15.S02.M03 (storage) and F16.S02.M02 (KMS and key management). Consumed by F07.S01.M02 (sessions), F09.S01.M01 (noncustodial payment provider credentials), F15.S01.M02 (cache), F15.S02.M01 (relays). Contracts: CTR-PRV-001 (SECRET class), CTR-CAP-001 (lease capability).

## Data ownership
Canonical owner of record class "platform secret" (metadata and KMS handles). Owner modules own the behavior that uses the secret.

## Risk considerations
Credential leakage through logs or backups; overbroad leases; slow revocation; rotation outage; insider read of values. Mitigations in PS-127-02, -03, -05, -06 and -07. KMS choice and secret-scanning tool are open.

## Completion criteria
All ten process specs SPEC-DRAFT-COMPLETE; `sec` prefix approved; KMS and scanning tools chosen by F16 with ADR; consumer lists approved.

## Required process specification inventory
- [x] `domain_schema.md` — SPEC-DRAFT-COMPLETE (PS-127-01)
- [x] `validation_rules.md` — SPEC-DRAFT-COMPLETE (PS-127-02)
- [x] `workflow_state_machine.md` — SPEC-DRAFT-COMPLETE (PS-127-03)
- [x] `commands_queries_events.md` — SPEC-DRAFT-COMPLETE (PS-127-04)
- [x] `authorization_capabilities.md` — SPEC-DRAFT-COMPLETE (PS-127-05)
- [x] `failure_recovery_idempotency.md` — SPEC-DRAFT-COMPLETE (PS-127-06)
- [x] `privacy_retention_abuse.md` — SPEC-DRAFT-COMPLETE (PS-127-07)
- [x] `observability_performance.md` — SPEC-DRAFT-COMPLETE (PS-127-08)
- [x] `contract_and_acceptance_tests.md` — SPEC-DRAFT-COMPLETE (PS-127-09)
- [x] `import_export_backup_rollback.md` — SPEC-DRAFT-COMPLETE (PS-127-10)
