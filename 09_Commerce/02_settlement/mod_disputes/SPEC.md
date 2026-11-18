# F09.S02.M02 — disputes

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Commerce Lead. **Parent:** F09.S02.

## Purpose and business behavior
Let either party to a payment or settlement claim contest it: raise a dispute inside a 14-day window, receive one response, and escalate silence or disagreement to a moderation case. A dispute changes claim state through CTR-COM-001 commands only. It never moves money and never implies that a payment did or did not happen; resolution outcomes are `restore_prior` or `reverse`.

## User stories
- As a payer whose counterparty claims a payment I did not receive, I can dispute the claim with a reason code and evidence within 14 days.
- As a payee, I can respond to a dispute, attach my evidence, and see the due date.
- As a moderator with a case grant, I can read the dispute statement and evidence for one case and record an outcome, with a second approver where private evidence is opened.

## Scope
- Process specifications PS-070-01 to PS-070-10.
- In scope: `dsp_` dispute records, raise/respond/withdraw, auto-escalation, case resolution hand-off, redaction.
- Out of scope: claim creation and attestation (PS-071), external verification (PS-072), moderation case workflow (F12), service-booking disputes (PS-030, consumes `dsp_` by ID).

## Public interfaces
Commands `dispute.raise`, `dispute.respond`, `dispute.withdraw`, `case.resolve`; queries `dispute.get`, `dispute.list`. Signatures in PS-070-04.

## Relationships, dependencies and integration
- Upstream: claims and states (CTR-COM-001, PS-071); identity and participant relation (CTR-CAP-001).
- Downstream: moderation cases (`cas_`, F12); notifications (generic text); evidence records (`evd_`, PS-071).
- Reference by full ID only.

## Data ownership
Owns `dispute` records and their transition log. Does not own claims, evidence items, or moderation cases.

## Risk considerations
- Retaliatory or frivolous disputes used as leverage.
- Harassment or personal data inside free-text statements.
- Dispute status read as proof of fraud or non-payment; states must not imply real-world outcomes.
- Timer failures leaving claims stuck in `DISPUTED`.
- Moderator overreach into cases they are not assigned.
No platform custody of money. Pseudonyms do not guarantee anonymity.

## Completion criteria
All ten process specs at SPEC-DRAFT-COMPLETE; implementation and tests in later phases; privacy and security review pending.

## Pending canonical contract items
- None for this module; `dsp` prefix is registered in CTR-ID-001.
- PENDING CTR-COM-001 confirmation: `dispute.withdraw` restoring prior claim state is not explicit in CTR-COM-001 command table (only `clm.dispute` and `case.resolve` appear).

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-070-01
- [x] [validation_rules.md](validation_rules.md) — PS-070-02
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-070-03
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-070-04
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-070-05
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-070-06
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-070-07
- [x] [observability_performance.md](observability_performance.md) — PS-070-08
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-070-09
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-070-10
