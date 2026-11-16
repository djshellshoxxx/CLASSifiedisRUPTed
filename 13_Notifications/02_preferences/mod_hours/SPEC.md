# F13.S02.M02 — Quiet-hours schedule

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F13.S02](../SPEC.md). **Process IDs:** PS-105-01…PS-105-10. **Code:** `packages/notify/src/preferences/hours`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

The user's quiet-hours schedule: up to four weekly windows in an IANA time zone, evaluated by a pure, DST-correct function isQuiet(at) and a companion nextQuietEnd(at). The schedule is authored and evaluated in the user's vault; when a relay sends push or email for the user, the schedule (time zone and windows, nothing else) is mirrored to that relay as a signed statement so it can defer sends at the right local time. This module only defines and evaluates the schedule; deferral, release and the security bypass are enforced by F13.S02.M01 (ADR-0014).

## Responsibilities

- Own the QuietHoursSchedule record per user (time zone, up to 4 windows, enabled flag, sequence).
- Provide the pure evaluation functions isQuiet(at, schedule) and nextQuietEnd(at, schedule) with documented DST behavior, identical in the vault and on the relay.
- Validate schedules and the time zone against the pinned IANA tzdata of the build.
- Produce the signed mirror statement classrup.notify.quiet_hours/v1 and accept it at relays that hold the user's push or email consent.
- Emit notify.quiet_hours.changed on every change so deferred items can be re-evaluated.

## Not responsible for

- Deferring, queueing and releasing notifications and the urgent security bypass (F13.S02.M01).
- Channel consent (F13.S02.M03) and category preferences (F13.S02.M04).
- Detecting the user's time zone from location; the user or the browser time zone setting chooses it and no location is read.
- Future: per-category quiet windows, one-off do-not-disturb for N hours, calendar-aware focus modes.

## User stories

- As a member, I can set quiet hours from 22:00 to 07:00 on every day in my own time zone.
- As a member who travels, I can change my time zone and see the schedule apply from that moment.
- As a member, I see when my quiet hours currently end.
- As a member, I am told that security alerts still arrive during quiet hours.

## Edge cases

- Window 22:00 to 07:00 on the night clocks go forward in America/New_York (2026-03-08); the window covers 8 real hours and the missing local hour does not shift the end.
- Window 22:00 to 07:00 on the night clocks go back (2026-11-01); the window covers 10 real hours because the repeated hour is inside it.
- A window starts at 02:30 on the spring-forward day in a zone where 02:30 does not exist; the start moves forward by the gap to 03:30 and an empty window is treated as no quiet period for that day.
- Time zone with a 30-minute DST change (Australia/Lord_Howe); evaluation uses real offsets and the window end is correct on 2026-04-05 and 2026-10-04.
- Zone with no DST (Asia/Kolkata); the evaluation never shifts.
- tzdata update changes a zone's rules; the pinned build data is used until the next release and the version is recorded in diagnostics.
- Window equals 24 hours or has equal start and end; refused as invalid because it would silence everything and the user is directed to disable push instead.

## UX and accessibility

- Quiet hours settings: toggle, time zone picker (searchable IANA list defaulting to the browser time zone), up to 4 windows each with days of week checkboxes, start time and end time, summary line such as Quiet until 07:00 local time.
- Security note: Security alerts are delivered during quiet hours.
- Preview: next 7 days with quiet intervals drawn as text list.

**States:** loading; disabled; enabled; currently-quiet; saving; saved-local; relay-pending; relay-confirmed; invalid; offline

**Accessibility:** Time inputs are native time controls with visible labels; days of week are a checkbox group with a legend.; Currently quiet status is conveyed by text and announced politely on change.; Add and remove window buttons are at least 44 by 44 px with accessible names including the window number.

## Owned data

- `QuietHoursSchedule` (classrup.notify.quiet_hours/v1, P2, RET-STANDARD)

## Interfaces

- Commands: `notify.quiet_hours.set`, `notify.quiet_hours.mirror`
- Queries: `notify.quiet_hours.get`, `notify.quiet_hours.evaluate`
- Emits: `notify.quiet_hours.changed`
- Consumes: `notify.channel.opted_in`, `notify.channel.opted_out`

## Dependencies

F13.S02.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-105-01 | [Domain schema](domain_schema.md) | 3 |
| PS-105-02 | [Validation rules](validation_rules.md) | 3 |
| PS-105-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-105-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-105-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-105-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-105-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-105-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-105-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-105-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/notify/src/preferences/hours/index.ts`.

## Acceptance criteria

- All tests T01 to T15 pass in CI.
- Golden DST fixtures for the six listed transitions produce the documented durations in the vault and on the relay with identical results.
- No notification payload or event contains the schedule.
