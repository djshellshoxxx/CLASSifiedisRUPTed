# F02.S01.M04 — counteroffer

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Marketplace Lead (F02). **Parent:** [F02.S01 trade_proposals](../SPEC.md).

## Purpose and business behavior
Lets the other slot holder of a two-person barter proposal (`cyc_`, revision N) answer the current terms with changed terms (items given and received, value compensation) as revision N+1. The original proposer may accept, reject, withdraw, or answer once more. The chain ends by acceptance, rejection, withdrawal, expiry, invalidation, or the revision cap of 5. Counteroffers never reserve items, move value, execute an exchange, or create settlement claims. Acceptance records mutual agreement on one revision; consent and execution are owned by F02.S02 and F02.S03 and by CTR-COM-001.

## User stories
- As a trade partner, I can propose different items or a value difference inside the existing pseudonymous thread.
- As a proposer, I can accept, reject, or withdraw a counteroffer and see which revision is in force.
- As a participant, I see why a counteroffer expired, was invalidated (item gone, holder inactive, target changed), or reached the revision cap.
- As an operator, I can disable new counteroffers without stranding open ones.

## Scope
- MVP: two-person counteroffers; item and value-term changes; accept, reject, withdraw, expire, invalidate; revision cap 5 per `cyc_`.
- Future: N-party counteroffers with per-slot consent (3, 4, N slots); federated counteroffers (CTR-FED-001); counteroffers on rentals and services (F03, F05).
- Out of scope: cycle search (F02.S02), N-party consent ceremony, settlement claims (CTR-COM-001), messaging (F08).

## Public interfaces
Commands `counter.create`, `counter.accept`, `counter.reject`, `counter.withdraw`; queries `counter.get`, `counter.list`; events `counter.*`. Specified in [commands_queries_events.md](commands_queries_events.md). Errors use the `CTROFFER.*` codes in [validation_rules.md](validation_rules.md).

## Relationships, dependencies and integration
Upstream: `mod_offer` (F02.S01.M03) supplies revision 1 terms on `cyc_`; `mod_party` (F02.S01.M02) supplies slot-holder status; F01 listings supply item availability by `lst_` ID; F07 supplies `acc_` status; CTR-COM-001 supplies quotes and claim IDs. Downstream: notifications (F13), audit (F16), cycle consent and execution (F02.S02, F02.S03). Owner of the `cyc_` aggregate is unresolved (see [domain_schema.md](domain_schema.md)). Integration uses explicit timeouts and contract tests.

## Data ownership
This module owns `counter` rows and their lifecycle only. It owns no listing, account, holder, quote or claim record; it references them by ID. Only `value_terms` is FINANCIAL_EVIDENCE. Export and deletion follow CTR-PRV-001 and D07 PROVISIONAL.

## Risk considerations
Main module risks: negotiation loops used to stall or harass a counterpart (revision cap, create rate limit, block control PENDING F12); acceptance of terms whose items were taken by another trade or whose quote expired (guards and invalidation sweep); concurrent accept and counter races producing two live revisions (single OPEN rule and row lock); value terms drifting from the pinned quote; and linkage of pseudonyms through counter timing and item refs. A counter is an assertion between parties and is not evidence of handover. Pseudonyms do not guarantee anonymity. No security audit has been performed.

## Completion criteria
All ten process specs drafted (done). Owner, privacy (F10), security (F16) and QA (F17) reviews recorded. Open items in [TODO.md](TODO.md) closed or deferred with a decision reference. No implementation in this phase.

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-012-01 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] [validation_rules.md](validation_rules.md) — PS-012-02 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-012-03 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-012-04 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-012-05 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-012-06 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-012-07 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] [observability_performance.md](observability_performance.md) — PS-012-08 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-012-09 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-012-10 — SPEC-DRAFT-COMPLETE (pending approval)
