# F05.S02.M03 — damage

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Commerce Lead (F05 accountable). **Parent:** F05.S02.

## Purpose and business behavior
Record owner-reported damage and missing-item charges against one rental (`rnt_`), collect the renter's acknowledgment or contest line by line, and route agreed amounts to deposit release or to a separate payment claim. Damage entries are signed statements by the owner and renter. ClassRup makes no automated damage verdict and collects no money (D06 and D09, PROVISIONAL, unapproved).

## User stories
- As an owner, I report a damaged or missing item with photos and a per-line amount within a set window after return.
- As a renter, I see each charged line with its evidence and accept or contest it line by line, with time to respond.
- As an operator, I see contested and silent reports in a case queue, without seeing content beyond my case scope.

## Scope
- PS-041-01 domain_schema.md
- PS-041-02 validation_rules.md
- PS-041-03 workflow_state_machine.md
- PS-041-04 commands_queries_events.md
- PS-041-05 authorization_capabilities.md
- PS-041-06 failure_recovery_idempotency.md
- PS-041-07 privacy_retention_abuse.md
- PS-041-08 observability_performance.md
- PS-041-09 contract_and_acceptance_tests.md
- PS-041-10 import_export_backup_rollback.md

## Public interfaces
Commands `damage.report`, `damage.acknowledge`, `damage.contest`, `damage.withdraw`, `damage.resolve`. Queries `damage.get`, `damage.list_by_rental`. Events `damage.*`. Contracts in PS-041-04.

## Relationships, dependencies and integration
Upstream: F05.S02.M01 handoff (baseline condition report, `hnd_`), F05.S02.M02 return (renter return attestation opens the window), F08 attachments (photo bytes, `att_`). Downstream: F05.S01.M02 deposits (partial release request), F09 claims for excess amounts (CTR-COM-001), F09 disputes, F12 case queue, F13 notifications.

## Data ownership
Owns `dmg_` damage records and line items. Photo bytes belong to F08 attachments; claim state belongs to F09; deposit state belongs to F05.S01.M02.

## Risk considerations
Inflated or retaliatory charges against deposits; charges with no baseline condition evidence; silence treated as acceptance; photos that expose home interiors or GPS location; excess amounts pursued through the platform despite no custody. Evidence is self-attested unless independently verified.

## Completion criteria
All 10 canonical process files at SPEC-DRAFT-COMPLETE; window, caps and categories approved by F05; EXIF rule confirmed by F10; dependent deposit and handoff specs aligned.

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-041-01
- [x] [validation_rules.md](validation_rules.md) — PS-041-02
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-041-03
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-041-04
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-041-05
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-041-06
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-041-07
- [x] [observability_performance.md](observability_performance.md) — PS-041-08
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-041-09
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-041-10
