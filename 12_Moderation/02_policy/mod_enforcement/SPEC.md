# F12.S02.M01 — enforcement

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Trust&Safety Lead (accountable role; named person UNASSIGNED). **Parent:** F12.S02.

## Purpose and business behavior
Apply, approve, expire, reverse and supersede visibility or account-level actions taken on a case: warning, hiding, unpublishing, removing content, restricting publishing and suspending an account. Every action is tied to a moderation case, has a reason code and an expiry, and is reversible by appeal. Enforcement changes what others can see and do on the platform. It never changes money, escrow-free commitments or the terms of a barter cycle; those are renegotiated by the owning module.

## User stories
- As a moderator with a case grant, I hide a listing with a reason code and an expiry, and the owner sees a generic notice.
- As a second moderator, I approve a suspension that I did not apply.
- As a participant whose listing is hidden mid-cycle, I am told the cycle needs renegotiation rather than seeing my items silently removed from the trade.

## Scope
- Six action types and their lifecycle (`enf_`).
- Two-person approval for account suspension; reversal and supersession via appeals.
- Effect dispatch to owning modules (listings, services, messages, accounts).
- Out of scope: the case record and report intake (`mod_flags`), evidence (`mod_evidence`), appeals (`mod_appeals`), spam verdicts (`mod_spam`), rate and quota limits (F12.S03).

## Public interfaces
Commands `enf.apply`, `enf.approve`, `enf.reject`, `enf.reverse`, `enf.supersede`; queries `enf.get`, `enf.list_by_target`; events `enf.applied`, `enf.approved`, `enf.rejected`, `enf.expired`, `enf.reversed`, `enf.superseded`. Details in PS-096-04.

## Relationships, dependencies and integration
Upstream (DEPENDENCY_MATRIX): F07.S01.M01 accounts (target and suspension), F12.S01.M01 `mod_flags` (case inputs). Downstream: F01.S01.M03 listings, F12.S01.M03 `mod_appeals` (reversal and supersession), F18.S01.M02 and F18.S02.M02 governance consumers. Renegotiation signals go to F02 cycle modules. Contracts: CTR-CAP-001, CTR-EVT-001, CTR-ERR-001.

## Data ownership
This module owns `enf_` actions and their history. Listing and service visibility is owned by F01 and F03; accounts by F07; messages by F08. Enforcement only records the action and dispatches the effect. Case narrative stays in F12.

## Risk considerations
Weaponized enforcement against rivals or critics; unfair suspension of a counterparty mid-trade; hidden content still visible through stale caches (fail-open risk); a suspended account's counterparties left in unclear state; leakage of moderator identity to targets; reversal applied twice. No platform custody of money: enforcement never freezes or moves funds.

## Completion criteria
Trust&Safety Lead approval of action types and two-person rule (not yet obtained); all ten process specs at SPEC-DRAFT-COMPLETE; cross-module contract tests defined; privacy and security review scheduled (not performed).

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-096-01, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [validation_rules.md](validation_rules.md) — PS-096-02, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-096-03, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-096-04, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-096-05, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-096-06, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-096-07, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [observability_performance.md](observability_performance.md) — PS-096-08, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-096-09, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-096-10, SPEC-DRAFT-COMPLETE (pending approval)
