# F13.S02.M02 — hours

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Platform Lead. **Parent:** [F13.S02 preferences](../SPEC.md).

## Purpose and business behavior
Hold each account's recurring weekly delivery windows (local time, per channel) and decide whether a gated notification is delivered now, deferred to the next window, or dropped. Windows restrict interruptions only; the in-app inbox still records items outside windows (mod_in). Security notices bypass windows; deadline notices bypass windows but not quiet pauses (mod_quiet).

## User stories
- As a participant, I can allow push and email only between 08:00 and 22:00 on weekdays, and receive deadline notices regardless.
- As a participant, I can change my time zone when I travel, and my windows keep their local meaning across daylight-saving changes.
- As an operator, I can see how many notifications are deferred per channel without seeing any schedule.

## Scope
- In scope: window storage, validation, gating decisions, deferral timers, DST rules, export.
- Out of scope: quiet pauses (F13.S02.M01), channel consent (F13.S02.M03), inbox recording (F13.S02.M04), zone detection from location (F10 precision rules).

## Public interfaces
Commands `hours.set_windows`; internal `hours.evaluate`; query `hours.get_windows`. Events `delivery_window.updated`, `notification.window_*`. See [commands_queries_events.md](commands_queries_events.md).

## Relationships, dependencies and integration
Upstream: profile time zone (F07.S02.M02); consent and privacy controls (F10.S01.M01, mod_consent). Downstream: mod_quiet and mod_in (gating order), push and email dispatch (F13.S01). Contracts: CTR-PRV-001, CTR-SCH-001, CTR-ERR-001. Edges per DEPENDENCY_MATRIX.md.

## Data ownership
Owns `delivery_window` (`dwn_`, PENDING CTR-ID-001) and deferral records. Time zone value remains owned by F07 profile; this module stores its copy only for gating and references the profile by `acc_`. Consent evidence is owned by F10.S01.M01 (canonical owner: `10_Privacy/01_data_controls/mod_consent`); this module references consent by ID only.

## Risk considerations
- Privacy: schedules reveal sleep and work patterns; leakage via event timing or logs.
- Correctness: DST gaps and overlaps, stale tzdata, clock skew.
- Abuse: window-toggling to load the evaluator; enumeration of others' schedules through deferral timing.
- Failure: evaluator outage leaves notifications deferred; dropped items must be explained to users.
- No platform custody of money; not applicable.

## Completion criteria
Process specs PS-105-01 to PS-105-10 at SPEC-DRAFT-COMPLETE; DST fixtures defined; Privacy Lead review pending; PENDING prefix resolved.

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-105-01
- [x] [validation_rules.md](validation_rules.md) — PS-105-02
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-105-03
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-105-04
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-105-05
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-105-06
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-105-07
- [x] [observability_performance.md](observability_performance.md) — PS-105-08
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-105-09
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-105-10
