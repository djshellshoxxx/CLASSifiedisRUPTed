# F16.S02.M02 — management

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Security Lead (F16). **Parent:** F16.S02.

## Purpose and business behavior
Governs cryptographic policy metadata for ClassRup: which signature and wrapping suites are allowed, minimum strength, per-key-class rotation intervals, activation windows and deprecation/retirement of suites. Policy changes are dual-approved, scheduled, versioned and public so that peers and clients can verify which rules applied at any time. This module does not hold key material (F16.S02.M01 `mod_key`) and does not sign anything (F16.S02.M03 `mod_signatures`).

## User stories
- As a Security Lead, I propose a suite deprecation and a second `ope` approves it, so no single operator can weaken signing.
- As a client, I can read the active policy for a key class and know which suites to accept.
- As a federated peer operator, I can import a signed policy bundle and see it queued for local approval, never auto-activated.

## Scope
- Policy records and state machine (`crypto_policy`).
- Suite registry metadata (identifiers, status, dates; no implementations).
- Rotation schedule per key class and overdue alerts.
- Excludes: key generation, storage, wrapping (`mod_key`); signing and verification (`mod_signatures`).

## Public interfaces
`crypto_policy.propose | approve | cancel | deprecate | get | list_active` and events `crypto_policy.*`. Errors `MGMT.*`. Detail in PS-129-04.

## Relationships, dependencies and integration
Upstream: none (DEPENDENCY_MATRIX). Downstream: F09.S01.M03, F15.S02.M03 (`mod_storage`), F15.S03.M02 (`mod_observability`), F16.S01.M02, F16.S02.M01 (`mod_key`, which reads rotation intervals). Contracts: CTR-SCH-001, CTR-CAP-001. Integration tests use contract fixtures; policy reads are cached up to 24 h by clients.

## Data ownership
Owns `crypto_policy` records and suite registry metadata. Does not own key records (`key_` prefix, F16 via `mod_key`), signatures, or approver identities (F07). Export and rollback are forward-only.

## Risk considerations
Downgrade to weak or deprecated suites by a single or compromised operator; stale clients accepting retired suites; activation lost or doubled across a scheduler crash; silent rotation failure leaving keys past their interval; policy bundles from malicious peers; approvals by colluding operators. Mitigations: dual control, forward-only versions, 24 h stale-cache limit, overdue alerts, signed exports. No platform custody of money. Pseudonyms do not guarantee anonymity of approvers.

## Completion criteria
All 10 process specs approved; PROVISIONAL decisions D07 and D10 resolved; `pol` prefix registered in CTR-ID-001; privacy and security review passed; traceability to TEST-PS-129-* complete.

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-129-01 (SPEC-DRAFT-COMPLETE)
- [x] [validation_rules.md](validation_rules.md) — PS-129-02 (SPEC-DRAFT-COMPLETE)
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-129-03 (SPEC-DRAFT-COMPLETE)
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-129-04 (SPEC-DRAFT-COMPLETE)
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-129-05 (SPEC-DRAFT-COMPLETE)
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-129-06 (SPEC-DRAFT-COMPLETE)
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-129-07 (SPEC-DRAFT-COMPLETE)
- [x] [observability_performance.md](observability_performance.md) — PS-129-08 (SPEC-DRAFT-COMPLETE)
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-129-09 (SPEC-DRAFT-COMPLETE)
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-129-10 (SPEC-DRAFT-COMPLETE)
