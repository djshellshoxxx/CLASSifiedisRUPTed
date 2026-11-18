# F13.S02.M01 — quiet

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Platform Lead. **Parent:** [F13.S02 preferences](../SPEC.md).

## Purpose and business behavior
Let an account pause interruptions for a short, explicit period (1 hour, 8 hours, until the next morning, or a custom instant up to 7 days). While paused, push, email and banners are held; the in-app inbox still records everything. Security notices are never held. On resume or expiry, held items are released only if they are still timely (24 hours) and only for categories that remain relevant. Pause state is private and never signalled to senders.

## User stories
- As a participant in a barter cycle, I can pause pushes for a focus block without missing a security alert.
- As a participant, I can end a pause early and see what was held.
- As a participant, senders cannot tell that I am paused.

## Scope
- In scope: presets, custom end instant, single active period, hold and release rules, resume.
- Out of scope: recurring windows (mod_hours), channel consent (mod_opt), inbox policy (mod_in), delivery (mod_push, mod_email).

## Public interfaces
Commands `quiet.start`, `quiet.resume`; query `quiet.get_status`; events `quiet_period.*` and `notification.quiet_held`. See [commands_queries_events.md](commands_queries_events.md).

## Relationships, dependencies and integration
Upstream: account time zone (mod_hours for `until_morning`); gating order defined jointly with mod_hours and mod_in. Downstream: mod_push and mod_email consume hold decisions. Contracts: CTR-EVT-001, CTR-ERR-001, CTR-PRV-001, CTR-ID-001. Edges per DEPENDENCY_MATRIX.md.

## Data ownership
Owns `quiet_period` (`qpd_`, PENDING) and held-item records. Does not own notification content, windows or consent.

## Risk considerations
- Privacy: pause reveals availability; must stay invisible to senders.
- Missed deadlines: a held deadline notice can be missed; mitigated by inbox recording and 24-hour release rule.
- Fail-safe: gating outage must hold, not send.
- Abuse: churning pauses; using long pauses to conceal a stalled deadline.
- No platform custody of money.

## Completion criteria
Process specs PS-108-01 to PS-108-10 at SPEC-DRAFT-COMPLETE; PENDING prefix resolved; Privacy Lead review pending.

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-108-01
- [x] [validation_rules.md](validation_rules.md) — PS-108-02
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-108-03
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-108-04
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-108-05
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-108-06
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-108-07
- [x] [observability_performance.md](observability_performance.md) — PS-108-08
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-108-09
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-108-10
