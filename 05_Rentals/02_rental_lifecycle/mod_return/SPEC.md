# F05.S02.M02 — return

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Commerce Lead (F05 accountable). **Parent:** F05.S02.

## Purpose and business behavior
Record the end-of-rental return for one rental (`rnt_`): when it was due, when the renter declared the return, the renter's checklist, the owner's confirmation or damage report, and the close that requests deposit release. Lateness is recorded, not charged. Items and money never pass through the platform (D04 OPEN, D09 PROVISIONAL, unapproved).

## User stories
- As a renter, I declare the return with a checklist and a note, and see whether it is late.
- As an owner, I confirm the item came back as handed over, or open a damage report within the window.
- As a participant, I see when the return is closed and what happens to the deposit next.

## Scope
- PS-043-01 domain_schema.md
- PS-043-02 validation_rules.md
- PS-043-03 workflow_state_machine.md
- PS-043-04 commands_queries_events.md
- PS-043-05 authorization_capabilities.md
- PS-043-06 failure_recovery_idempotency.md
- PS-043-07 privacy_retention_abuse.md
- PS-043-08 observability_performance.md
- PS-043-09 contract_and_acceptance_tests.md
- PS-043-10 import_export_backup_rollback.md

## Public interfaces
Commands `return.declare`, `return.confirm`, `return.report_damage`, `return.close`. Queries `return.get`, `return.list_by_rental`. Events `rental_return.*`. Contracts in PS-043-04.

## Relationships, dependencies and integration
Upstream: F05.S02.M01 handoff (baseline checklist and window), F05.S01.M01 availability (rental end time). Downstream: F05.S02.M03 damage (charges), F05.S01.M02 deposits (release request on close), F13 notifications.

## Data ownership
Owns `rtn_` return records and lateness. Damage records belong to F05.S02.M03; deposit records to F05.S01.M02.

## Risk considerations
Owner silence read as confirmation; renter declaring "no issue" to avoid damage reports; lateness converted to charges without agreement; return location leaking precise place; deposit release requested while damage is open. No platform custody.

## Completion criteria
All 10 canonical process files at SPEC-DRAFT-COMPLETE; early and owner windows approved by F05; late-charge policy decided (OPEN); release-request contract agreed with deposits module.

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-043-01
- [x] [validation_rules.md](validation_rules.md) — PS-043-02
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-043-03
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-043-04
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-043-05
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-043-06
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-043-07
- [x] [observability_performance.md](observability_performance.md) — PS-043-08
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-043-09
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-043-10
