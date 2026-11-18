# F05.S02.M01 — handoff (rental)

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Commerce Lead (F05 accountable). **Parent:** F05.S02.

## Purpose and business behavior
Record the start-of-rental custody handoff for one rental (`rnt_`): the scheduled window, a fixed checklist of the item's condition and accessories, photo digests, and a signed attestation from each party. A matching pair of attestations moves the rental to `ACTIVE`. The module records what both parties asserted. It does not verify the physical transfer, and it holds no item or money (D04 OPEN, D06 PROVISIONAL, unapproved).

## User stories
- As an owner, I schedule a handover window and attest the item's condition with photos at the handover.
- As a renter, I check the same checklist, flag any issue, and attest that I received the item.
- As an operator, I see contested or expired handoffs without seeing content outside my case.

## Scope
- PS-042-01 domain_schema.md
- PS-042-02 validation_rules.md
- PS-042-03 workflow_state_machine.md
- PS-042-04 commands_queries_events.md
- PS-042-05 authorization_capabilities.md
- PS-042-06 failure_recovery_idempotency.md
- PS-042-07 privacy_retention_abuse.md
- PS-042-08 observability_performance.md
- PS-042-09 contract_and_acceptance_tests.md
- PS-042-10 import_export_backup_rollback.md

## Public interfaces
Commands `rental_handoff.schedule`, `rental_handoff.attest`, `rental_handoff.contest`, `rental_handoff.cancel`. Queries `rental_handoff.get`, `rental_handoff.list_by_rental`. Events `rental_handoff.*`. Contracts in PS-042-04.

## Relationships, dependencies and integration
Upstream: F05.S01.M01 availability (reservation state), F08 attachments (photo bytes). Downstream: F05.S02.M02 return (baseline), F05.S02.M03 damage (baseline condition), F05.S01.M02 deposits (deposit hold can start after rental ACTIVE), F13 notifications. Meetup exchange (F08.S03.M02) is a separate record class and is referenced by full ID only.

## Data ownership
Owns `hnd_` rental custody-handoff records (canonical owner for this class, PROVISIONAL pending lead listing in CONTRACTS.md). Rental state belongs to F05.S02; photo bytes to F08.

## Risk considerations
Self-attested handover mistaken for verified transfer; one party attesting for both; exact meeting locations leaking through checklists or photos; baseline disputes after the fact; silent expiry leaving renters with items and no record. No platform custody.

## Completion criteria
All 10 canonical process files at SPEC-DRAFT-COMPLETE; canonical owner listed in CONTRACTS.md; EXIF and coarse-location rules confirmed by F10; baseline fields agreed with damage and return modules.

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-042-01
- [x] [validation_rules.md](validation_rules.md) — PS-042-02
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-042-03
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-042-04
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-042-05
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-042-06
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-042-07
- [x] [observability_performance.md](observability_performance.md) — PS-042-08
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-042-09
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-042-10
