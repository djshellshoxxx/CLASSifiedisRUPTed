# F05.S01.M02 — deposits

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Commerce Lead (F05 accountable). **Parent:** F05.S01.

## Purpose and business behavior
Record the security-deposit arrangement attached to one rental (`rnt_`): the agreed amount, the payment claims the two parties submit, the holding status, and the release or agreed deduction at return. ClassRup never holds deposit funds. It records assertions by the renter and owner and any external verification result. Direct payment of the deposit is outside the platform (D09, PROVISIONAL, unapproved).

## User stories
- As a renter, I propose or accept a deposit amount and record that I gave it, without the platform holding my money.
- As an owner, I confirm receipt, approve a full or partial release, and see which deduction lines I can claim.
- As a participant, I see why a release is pending, disputed or overdue, in plain wording that does not say "paid" before verification.

## Scope
- PS-040-01 domain_schema.md
- PS-040-02 validation_rules.md
- PS-040-03 workflow_state_machine.md
- PS-040-04 commands_queries_events.md
- PS-040-05 authorization_capabilities.md
- PS-040-06 failure_recovery_idempotency.md
- PS-040-07 privacy_retention_abuse.md
- PS-040-08 observability_performance.md
- PS-040-09 contract_and_acceptance_tests.md
- PS-040-10 import_export_backup_rollback.md

## Public interfaces
Commands `deposit.propose`, `deposit.agree`, `deposit.cancel`, `deposit.record_given`, `deposit.attest_received`, `deposit.request_release`, `deposit.release`, `deposit.partial_release`, `deposit.dispute`. Queries `deposit.get`, `deposit.list_by_rental`. Events `deposit.*`. Full contracts in PS-040-04.

## Relationships, dependencies and integration
Upstream: F05.S01.M01 availability (rental eligibility), F05.S02.M03 damage (deduction lines), F05.S02.M02 return (release trigger), F09 commerce (claims, CTR-COM-001). Downstream: F13 notifications, F12 moderation (case disputes), F16 audit. Shared services are referenced by ID only.

## Data ownership
Owns `dep_` deposit records and their links to `clm_` claims. Claim state belongs to F09 (CTR-COM-001). Rental state belongs to F05.S02.

## Risk considerations
Deposit terms that act as a disguised payment or fee; implied platform custody in copy, schema or UI; "given" claims for cash that cannot be verified; owner withholding with no escalation; FINANCIAL_EVIDENCE reaching logs, federation or operators without dual control. Pseudonyms do not hide payment identity from the counterparty.

## Completion criteria
All 10 canonical process files at SPEC-DRAFT-COMPLETE; cap rule and retention approved by F05 and F10; CTR-ID-001 and CTR-SCH-001 registrations complete; implementation and tests deferred to later phases.

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-040-01
- [x] [validation_rules.md](validation_rules.md) — PS-040-02
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-040-03
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-040-04
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-040-05
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-040-06
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-040-07
- [x] [observability_performance.md](observability_performance.md) — PS-040-08
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-040-09
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-040-10
