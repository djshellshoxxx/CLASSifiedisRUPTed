# F16.S02.M01 — key

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Security Lead (F16). **Parent:** [F16.S02 cryptography](../SPEC.md).

## Purpose and business behavior
Manages the public-key records that identify a user's pseudonymous account, a device, a federation node or a system principal: registration with proof of possession, purpose-specific keys, rotation, revocation and public-key snapshots for verification. The platform never holds user private keys. Recovery after key loss runs through the account recovery flow in F07, which revokes the old key and registers a new one.

## User stories
- As a participant, I can register a device key and sign my actions so others can verify them.
- As a participant who lost a device, I can revoke its key and register a new one after proving recovery.
- As a federation operator, I can verify a peer's signed events against a current, signed revocation snapshot.

## Scope
Public key records, proof of possession, rotation, revocation, public-key read and revocation snapshots. Key operations (KMS, wrapping) belong to F16.S02.M02; signing operations to F16.S02.M03. Process specifications: [domain_schema](domain_schema.md), [validation_rules](validation_rules.md), [workflow_state_machine](workflow_state_machine.md), [commands_queries_events](commands_queries_events.md), [authorization_capabilities](authorization_capabilities.md), [failure_recovery_idempotency](failure_recovery_idempotency.md), [privacy_retention_abuse](privacy_retention_abuse.md), [observability_performance](observability_performance.md), [contract_and_acceptance_tests](contract_and_acceptance_tests.md), [import_export_backup_rollback](import_export_backup_rollback.md).

## Public interfaces
Commands `key.register`, `key.prove`, `key.rotate`, `key.revoke`; queries `key.get`, `key.list`; signed revocation snapshot. Error codes `KEY.*`.

## Relationships, dependencies and integration
Depends on F16.S02.M02 (management). Consumed by F07.S01.M01 (pseudonyms), F08.S01.M01 (private messaging), F10.S02.M02 (model), F16.S01.M01 (authorization), F16.S02.M03 (signatures). Contracts: CTR-ID-001 (`key` prefix owned by F16), CTR-SCH-001, CTR-CAP-001, CTR-FED-001 (node and peer key use).

## Data ownership
Canonical owner of record class "key record (public metadata)". Private keys are not owned by any platform module.

## Risk considerations
Key compromise and late revocation; platform-side key escrow creep; graph linkage through key reuse; Sybil through key multiplication; stale revocation snapshots. Mitigations in PS-128-02, -03, -05, -06 and -07. User key recovery is an open decision (D10).

## Completion criteria
All ten process specs SPEC-DRAFT-COMPLETE; D10 decided; cryptographic choices (Ed25519, X25519, library) confirmed by F16 review; recovery flow agreed with F07.

## Required process specification inventory
- [x] `domain_schema.md` — SPEC-DRAFT-COMPLETE (PS-128-01)
- [x] `validation_rules.md` — SPEC-DRAFT-COMPLETE (PS-128-02)
- [x] `workflow_state_machine.md` — SPEC-DRAFT-COMPLETE (PS-128-03)
- [x] `commands_queries_events.md` — SPEC-DRAFT-COMPLETE (PS-128-04)
- [x] `authorization_capabilities.md` — SPEC-DRAFT-COMPLETE (PS-128-05)
- [x] `failure_recovery_idempotency.md` — SPEC-DRAFT-COMPLETE (PS-128-06)
- [x] `privacy_retention_abuse.md` — SPEC-DRAFT-COMPLETE (PS-128-07)
- [x] `observability_performance.md` — SPEC-DRAFT-COMPLETE (PS-128-08)
- [x] `contract_and_acceptance_tests.md` — SPEC-DRAFT-COMPLETE (PS-128-09)
- [x] `import_export_backup_rollback.md` — SPEC-DRAFT-COMPLETE (PS-128-10)
