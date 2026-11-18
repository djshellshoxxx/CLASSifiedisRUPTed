# F02.S03.M02 — mod_lock (item reservation for consented cycles)

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Marketplace Lead (accountable role). **Parent:** [F02.S03 cycle_execution](../SPEC.md).

## Purpose and business behavior
Reserve every offered item of a consented cycle version so the same item cannot appear in two open cycles at once. A lock is a reservation with an expiry, not a transfer: it does not show that any item changed hands. Locks are acquired only after all parties have consented (mod_consent) and are released or consumed when the cycle ends.

## User stories
- As a participant in a consented cycle, my offered items are reserved so another cycle cannot take them while we exchange.
- As a participant, if the cycle fails, my items are released automatically and I see the release time.
- As an operator, I can see contention and expiry rates without item-to-cycle mapping.

## Scope
Process specs (all MVP):
- domain_schema, validation_rules, workflow_state_machine, commands_queries_events, authorization_capabilities, failure_recovery_idempotency, privacy_retention_abuse, observability_performance, contract_and_acceptance_tests, import_export_backup_rollback.

Out of scope: availability counts (F01.S03.M01), consent (mod_consent), dropout handling (mod_dropouts), compensation (mod_recovery).

## Canonical ownership (B-06)
Lock records (`item_lock`) are owned by this module. Item availability counts are owned by **F01.S03.M01 mod_availability** and referenced by full ID. No duplicate slug is owned here.

## Public interfaces
Commands `cyc.execute.lock`, `cyc.execute.release`, `cyc.execute.extend`; query `cyc.lock.get`; events `item.locked`, `item.lock_failed`, `item.lock_released`, `item.lock_expired`, `item.lock_extended`, `item.lock_consumed`. See [commands_queries_events.md](commands_queries_events.md).

## Relationships, dependencies and integration
Upstream: mod_consent (`cycle.consented`), F02.S02 snapshot items, F01.S03.M01 (availability), CTR-CAP-001. Downstream: F01.S03.M01 (availability), mod_dropouts (release), mod_recovery (orphan cases), F13 notifications. Contract tests for F01 and mod_dropouts.

## Data ownership
Owns `item_lock` rows. Listing and item data remain with F01; claims and money with F09 (CTR-COM-001).

## Risk considerations
Reservation spam to block others' items; inventory probing via lock errors; double-held items under race; stranded locks after crash; contention as popularity signal. No platform custody of money; locks do not move money.

## Completion criteria
PS-023-01..10 approved; race and orphan-sweep tests pass; F01 consumer contract signed; privacy review of error uniformity complete.

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-023-01
- [x] [validation_rules.md](validation_rules.md) — PS-023-02
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-023-03
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-023-04
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-023-05
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-023-06
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-023-07
- [x] [observability_performance.md](observability_performance.md) — PS-023-08
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-023-09
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-023-10
