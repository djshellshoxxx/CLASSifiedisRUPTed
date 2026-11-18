# F12.S03.M03 — rate

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Trust&Safety Lead (accountable role). **Parent:** F12.S03.

## Purpose and business behavior
Throttle how fast any single subject can perform actions that cost the platform or other users: sending messages, creating listings, attempting logins and submitting federated batches. Each decision is allow or limited, with a retry time and no disclosure of counts. This module holds no durable user records. Its job is to slow abuse without making ordinary use fail: authenticated limits are per account, network-level limits apply only to unauthenticated routes, and store outages degrade per class.

## User stories
- As a messaging user, when I send a burst of messages, I see when I can send again, in plain language.
- As an operator, I can see which classes are throttling and whether the limiter has fallen back to local mode.
- As a federated peer operator, I receive an explicit retry-after when my batches exceed the agreed rate.

## Scope
- GCRA rate limiter for named classes (`msg.send`, `lst.create`, `auth.login`, `fed.inbound`, public reads).
- Signed policy versions and fail modes per class.
- Out of scope: quota or stock limits (`mod_limits`), account risk (`mod_risk`), abuse signals (`mod_signals`), federation trust state (`mod_trust`).

## Public interfaces
Internal `rate.consume` (sys_ only); policy events `rate.policy_loaded`, `rate.policy_activated`, `rate.policy_rejected`, `rate.policy_superseded`; edge error `RATE.LIMITED`. Details in PS-099-04.

## Relationships, dependencies and integration
Upstream (DEPENDENCY_MATRIX): F12.S03.M02 `mod_signals`, F15.S02.M02 (platform backend, store). Downstream: F06.S03.M02 (search throttling), F12.S02.M02 `mod_spam` (message throttle), F12.S03.M04 `mod_limits` (shared check tooling). Contracts: CTR-ERR-001, CTR-FED-001 (R11), CTR-EVT-001.

## Data ownership
This module owns policy definitions and transient bucket state only. No durable subject data. Federation batch content belongs to F11.

## Risk considerations
Lockout of legitimate users behind shared network sources; limiter bypass by IP rotation or account creation; limiter outage letting abuse through; limit values disclosed and used for calibration; clock skew and restarts resetting buckets. No platform custody of money; rate limits never block a payment-related state change that is already committed.

## Completion criteria
Trust&Safety Lead approval of class values and fail modes (values not final); reference-implementation tests defined; privacy review scheduled (not performed).

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-099-01, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [validation_rules.md](validation_rules.md) — PS-099-02, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-099-03, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-099-04, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-099-05, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-099-06, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-099-07, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [observability_performance.md](observability_performance.md) — PS-099-08, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-099-09, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-099-10, SPEC-DRAFT-COMPLETE (pending approval)
