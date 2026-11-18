# F02.S03.M03 — mod_dropouts (cycle dropout handling)

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Marketplace Lead (accountable role). **Parent:** [F02.S03 cycle_execution](../SPEC.md).

## Purpose and business behavior
Handle a participant who withdraws, misses the lock-confirmation window or misses the attestation window after a cycle is consented or locked. The module moves the affected cycle version to exactly one resolution: re-solve with a successor proposal (which must be consented again), cancel and release all locks, record a partial outcome for recovery, or escalate. It never completes or settles a cycle.

## User stories
- As a participant, I can withdraw before locks are placed, and the other parties are told why in plain words without seeing my home address.
- As a remaining participant, I get a successor proposal to consent to instead of a silently broken cycle.
- As an operator, I see dropout rates by cycle size without party identities.

## Scope
Process specs (all MVP unless marked):
- domain_schema, validation_rules, workflow_state_machine, commands_queries_events, authorization_capabilities, failure_recovery_idempotency, privacy_retention_abuse, observability_performance, contract_and_acceptance_tests, import_export_backup_rollback.

Out of scope: lock acquisition (mod_lock), consent (mod_consent), compensation (mod_recovery), federated dropout signals (FUTURE, PS-022-07 R05).

## Canonical ownership (B-06)
Dropout case records are owned by this module (`F02.S03.M03`). No duplicate slug in the registry. Compensation claims are owned by CTR-COM-001 (F09 Commerce), referenced by `clm_` ID only.

## Public interfaces
Commands `cyc.withdraw`, `cyc.dropout.report`, `cyc.dropout.resolve`; queries `cyc.dropout.get`; events `cycle.dropout_detected`, `cycle.dropout_resolving`, `cycle.resolved_again`, `cycle.cancelled`, `cycle.partially_resolved`, `cycle.escalated`. See [commands_queries_events.md](commands_queries_events.md).

## Relationships, dependencies and integration
Upstream: mod_consent (consent state and expiry), mod_lock (lock state), F02.S02 cycle proposals (successor versions, D02), CTR-CAP-001. Downstream: mod_recovery (escalation), F07.S03 reputation (count signal only), F13 notifications. Contract tests required for each consumer.

## Data ownership
Owns `dropout_case` and `dropout_lock_ref`. Lock records belong to mod_lock; claims to CTR-COM-001.

## Risk considerations
Griefing by repeated withdrawal; false reports used to exclude a rival; timing inference of which party backed out; stranded locks after a dropout (fixed by R03 in failure spec); reconciliation that moves state backward. No platform custody of money; dropout does not settle anything.

## Completion criteria
PS-022-01..10 approved; locks-before-resolution property test passes; abuse review rules approved by F12; privacy review of reason enum complete.

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-022-01
- [x] [validation_rules.md](validation_rules.md) — PS-022-02
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-022-03
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-022-04
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-022-05
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-022-06
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-022-07
- [x] [observability_performance.md](observability_performance.md) — PS-022-08
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-022-09
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-022-10
