# F13.S02.M03 — opt

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Platform Lead. **Parent:** [F13.S02 preferences](../SPEC.md).

## Purpose and business behavior
Hold each account's channel and category choices for notifications (push, email, in-app), and act as the category registry that all notification modules use. Nothing is enabled by default except in-app delivery and security email (ASSUMPTION). Email enabling needs a confirmation step. Every email carries a one-click unsubscribe for its category. Consent evidence stays with F10 mod_consent; this module holds the operational state.

## User stories
- As a participant, I choose which categories reach my phone, and nothing is switched on without my action.
- As a participant, I can unsubscribe from one category of email with one click, with no login.
- As an operator, I can see opt-in and withdrawal volumes without seeing any address.

## Scope
- In scope: 3 × 4 notification matrix, enable and withdraw, email confirmation, unsubscribe tokens, category registry.
- Out of scope: consent records (F10 mod_consent), actual sending (mod_push, mod_email), quiet and hours (mod_quiet, mod_hours), inbox policy (mod_in).

## Public interfaces
Commands `opt.set_cell`, `opt.withdraw_all`, `opt.confirm_email`, `opt.unsubscribe_cell`; query `opt.get_matrix`; events `notification_preference.*`. See [commands_queries_events.md](commands_queries_events.md).

## Relationships, dependencies and integration
Upstream: consent (`10_Privacy/01_data_controls/mod_consent`, F10.S01.M01, canonical owner of consent records); account and session (F07). Downstream: mod_push, mod_email, mod_in read the matrix through the gating path. Contracts: CTR-CAP-001, CTR-PRV-001, CTR-ID-001. Edges per DEPENDENCY_MATRIX.md.

## Data ownership
Owns `notification_preference` (`npf_`, PENDING) and token hashes. Consent evidence referenced by ID only (canonical owner F10 mod_consent). Email address owned by F07 profile.

## Risk considerations
- Privacy: channel choices and email addresses; tokens as bearer credentials.
- Abuse: forced subscriptions by third parties; enumeration through unsubscribe responses; email scanners consuming links.
- Correctness: stale writes overriding withdrawal; security notices accidentally disabled.
- Compliance: consent wording and records require Privacy Lead review; no legal conclusion is made here.
- No platform custody of money.

## Completion criteria
Process specs PS-107-01 to PS-107-10 at SPEC-DRAFT-COMPLETE; PENDING prefix resolved; consent wording and legal review pending (Privacy Lead).

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-107-01
- [x] [validation_rules.md](validation_rules.md) — PS-107-02
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-107-03
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-107-04
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-107-05
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-107-06
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-107-07
- [x] [observability_performance.md](observability_performance.md) — PS-107-08
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-107-09
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-107-10
