# F16.S03.M03 — response

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Security Lead (F16). **Parent:** F16.S03.

## Purpose and business behavior
Executes and records containment actions taken during an incident: disabling a feature flag, revoking a scope of sessions, requesting key revocation through the key service, quarantining a federated peer, pausing federation, publishing an incident notice, or placing a data hold. Every action is proposed, approved by two people, executed as recorded steps, and rollbackable where reversible. It acts only on incidents declared in F16.S03.M02 (`mod_incident`).

## User stories
- As a responder, I propose quarantining a peer that sends forged events, and a second responder approves it within minutes.
- As a user affected by a session revocation, I receive a notice explaining the action and how to appeal, without internal details.
- As a Security Lead, I can see every containment step and roll back a reversible flag change.

## Scope
- Containment action catalog, approval flow, executor, step log, rollback.
- Excludes: incident records (`mod_incident`), key generation and revocation mechanics (`mod_key`), federation trust rules (F11), appeals (F12).

## Public interfaces
`response.propose | approve | execute | rollback | get | list_by_incident`; events `response.*`. Errors `RESPONSE.*`. Detail in PS-132-04.

## Relationships, dependencies and integration
Upstream: F15.S03.M02 (`mod_observability`, signals), F16.S03.M02 (`mod_incident`, parent incident). Downstream: F15.S03.M03 (`mod_recovery`, restore after containment). Calls into F16.S02.M01 (`mod_key`) for revocation requests and F11 for peer quarantine. Contracts: CTR-EVT-001, CTR-ERR-001, CTR-FED-001.

## Data ownership
Owns `containment_action` records and step logs. Does not own the revoked keys, sessions, flags, or peer records; it references them by ID.

## Risk considerations
Over-containment that disables service for many users; a single compromised responder freezing others; containment that tips off an attacker or leaks tokens; partial execution leaving inconsistent state; rollback that restores a compromised configuration. Mitigations: two approvals, platform-wide rule, rollback plan required, token-free logs, idempotent steps, human decision after partial failure. No platform custody of money. Pseudonyms do not guarantee anonymity of responders.

## Completion criteria
10 process specs approved; every action type rehearsed in staging; `rsp` prefix registered; key-revocation and quarantine contracts with F16.S02.M01 and F11 confirmed; D10 resolved; security review passed.

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-132-01 (SPEC-DRAFT-COMPLETE)
- [x] [validation_rules.md](validation_rules.md) — PS-132-02 (SPEC-DRAFT-COMPLETE)
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-132-03 (SPEC-DRAFT-COMPLETE)
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-132-04 (SPEC-DRAFT-COMPLETE)
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-132-05 (SPEC-DRAFT-COMPLETE)
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-132-06 (SPEC-DRAFT-COMPLETE)
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-132-07 (SPEC-DRAFT-COMPLETE)
- [x] [observability_performance.md](observability_performance.md) — PS-132-08 (SPEC-DRAFT-COMPLETE)
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-132-09 (SPEC-DRAFT-COMPLETE)
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-132-10 (SPEC-DRAFT-COMPLETE)
