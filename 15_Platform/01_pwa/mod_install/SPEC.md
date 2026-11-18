# F15.S01.M03 — install

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Platform Lead. **Parent:** [F15.S01 pwa](../SPEC.md).

## Purpose and business behavior
Make ClassRup installable as a web app. This module owns the manifest, icons, the install control and its guided fallback for browsers without a prompt (iOS Safari), the update notice, and the clear-data control. The install flow never asks for permissions, never prompts automatically, and never sends install state to the server.

## User stories
- As a participant on Android Chrome, I can install ClassRup from a button I choose to press.
- As a participant on iPhone, I get clear steps to add ClassRup to my home screen.
- As a participant on a shared phone, I can clear the app's local data before handing it over.

## Scope
- In scope: manifest, icons, install control states, iOS instructions, update notice, clear-data guard.
- Out of scope: offline cache contents (mod_cache), pending-write queue (mod_offline), push permission (mod_push), native store packaging (Future).

## Public interfaces
No server interface. Local operations `install.show_prompt`, `install.show_instructions`, `update.apply`, `data.clear`. See [commands_queries_events.md](commands_queries_events.md).

## Relationships, dependencies and integration
Upstream: cache (F15.S01.M02), build pipeline and release checks (F17.S03.M01). Downstream: none. Contracts: CTR-ERR-001, CTR-PRV-001. Edges per DEPENDENCY_MATRIX.md.

## Data ownership
Owns the manifest and icon artifacts and one device-local cooldown key. Owns no server records.

## Risk considerations
- Privacy: install analytics would reveal device and habit; excluded in MVP.
- Abuse: phishing copies and fake install buttons; mitigated by fixed manifest and browser-only prompts.
- Data loss: update reload or clear-data can discard unsent writes; guarded by pending-queue checks.
- Accessibility: install and instructions must work by keyboard and screen reader.
- No platform custody of money.

## Completion criteria
Process specs PS-115-01 to PS-115-10 at SPEC-DRAFT-COMPLETE; installability checks defined for CI; Privacy Lead and Accessibility Lead reviews pending.

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-115-01
- [x] [validation_rules.md](validation_rules.md) — PS-115-02
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-115-03
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-115-04
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-115-05
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-115-06
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-115-07
- [x] [observability_performance.md](observability_performance.md) — PS-115-08
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-115-09
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-115-10
