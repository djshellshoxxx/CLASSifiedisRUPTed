# F12.S03.M01 — risk

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Trust&Safety Lead (accountable role; named person UNASSIGNED). **Parent:** F12.S03.

## Purpose and business behavior
Assess how risky a specific subject (an account, listing, service, rental, auction or cycle proposal) looks, using signals from `mod_signals`, limit hits and reports, and turn the result into one of four tiers. The tier triggers only holds on public visibility, step-up verification or routing to a human reviewer. Risk never blocks consent, a committed exchange or a payment claim, never moves money, and is never shown to the subject as a number.

## User stories
- As a seller, my new listing is either published or shown as "under review", and I can ask for a human review.
- As a trust reviewer, I see the category codes behind a hold and can clear or escalate it with a case reference.
- As a barter participant, my consent is never withdrawn by the system because another party is under risk review.

## Scope
- Subject assessments (`rsk_`) with tier, up to three category codes and expiry.
- Holds on public visibility, step-up requests to identity, review routing and escalation.
- Out of scope: signal collection (`mod_signals`), rate and quota limits (`mod_rate`, `mod_limits`), account identity and recovery (F07), payment evidence and settlement (F09), dispute handling (F09.S02).

## Public interfaces
Internal `risk.assess` (sys_); reviewer commands `risk.clear`, `risk.escalate`; F07 callback `risk.step_up_result`; queries `risk.get_status`, `risk.list_queue`; events `risk.assessed`, `risk.review_routed`, `risk.step_up_requested`, `risk.hold_applied`, `risk.cleared`, `risk.escalated`, `risk.expired`. Details in PS-100-04.

## Relationships, dependencies and integration
Upstream (DEPENDENCY_MATRIX): F12.S03.M02 `mod_signals`, F12.S03.M04 `mod_limits`. Downstream: F04.S02.M03 (auction integrity consumers), F09.S01.M01 (claim handling reads claimed status only). Contracts: CTR-PRV-001, CTR-COM-001 (claim status as input), CTR-CAP-001.

## Data ownership
This module owns `rsk_` assessments and their hold state. Listing and auction visibility is owned by F01 and F04; accounts by F07; payment claims by F09; signals by `mod_signals`. Risk holds visibility only.

## Risk considerations
Discriminatory scoring through proxies; feedback loops that hide legitimate sellers; rival-driven flagging; gaming by sophisticated actors; explanations leaking features; holds that interfere with commitments. No platform custody of money: a hold never freezes funds or deposits.

## Completion criteria
Trust&Safety Lead and F10 approval of the feature allow-list and tier thresholds (not yet obtained); fairness and regression gates defined; privacy review scheduled (not performed).

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-100-01, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [validation_rules.md](validation_rules.md) — PS-100-02, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-100-03, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-100-04, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-100-05, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-100-06, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-100-07, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [observability_performance.md](observability_performance.md) — PS-100-08, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-100-09, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-100-10, SPEC-DRAFT-COMPLETE (pending approval)
