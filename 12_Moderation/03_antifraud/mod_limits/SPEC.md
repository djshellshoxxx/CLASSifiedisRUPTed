# F12.S03.M04 — limits

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Trust&Safety Lead (accountable role). **Parent:** F12.S03.

## Purpose and business behavior
Hold the versioned quota policies that cap how many active items or open commitments one account, or one coarse region cell, may hold at a time: active listings, open barter proposals, open auctions, open rental bookings and open message threads. Owning modules call `limits.check` before creating an item. This module does not store usage counts; it returns allow or deny against the policy in force. Policies change through two-person approval and staged rollout.

## User stories
- As a seller, I am told which limit I reached and what generic step to take, without seeing anyone else's activity.
- As a trust operator, I can draft a limit change, have a second operator approve it, and roll it out in steps.
- As a participant in a barter cycle, a proposal limit never silently drops an accepted proposal of mine; it only blocks new ones.

## Scope
- Quota policy registry (`lim_`), versions and rollout.
- Synchronous `limits.check` for owning modules.
- Out of scope: throughput rate limits (`mod_rate`), account risk tiers (`mod_risk`), jurisdiction definitions (F18.S01.M01), usage counts (owners).

## Public interfaces
Internal `limits.check` (sys_); policy commands `limits.policy_draft`, `limits.policy_activate`, `limits.rollout_advance`, `limits.policy_retire`; events `limits.policy_drafted`, `limits.policy_activated`, `limits.rollout_advanced`, `limits.policy_retired`. Details in PS-098-04.

## Relationships, dependencies and integration
Upstream (DEPENDENCY_MATRIX): F12.S03.M03 `mod_rate` (shared check tooling), F18.S01.M01 `mod_jurisdictions` (jurisdiction codes). Downstream: F01.S01.M01 listing creation, F12.S03.M01 `mod_risk` (limit-hit signals). Contracts: CTR-SCH-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001 (cells).

## Data ownership
This module owns quota policy records only. Counts and item state belong to the owning modules (F01, F02, F04, F05, F08). Jurisdiction codes belong to F18.

## Risk considerations
Limits that exclude legitimate users (new accounts, rural cells); limit values chosen to suppress competition; race conditions letting items exceed limits; policy changes applied without rollout; leakage of usage through denial messages; Sybil accounts defeating per-account limits. No platform custody of money; limits do not touch deposits or payments.

## Completion criteria
Trust&Safety Lead and F18 approval of default limit values (not yet obtained, values not set here); concurrency test for owner-side serialization; privacy review scheduled (not performed).

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-098-01, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [validation_rules.md](validation_rules.md) — PS-098-02, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-098-03, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-098-04, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-098-05, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-098-06, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-098-07, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [observability_performance.md](observability_performance.md) — PS-098-08, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-098-09, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-098-10, SPEC-DRAFT-COMPLETE (pending approval)
