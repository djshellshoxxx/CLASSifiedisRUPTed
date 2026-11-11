# F13.S02.M02 — Quiet-hours schedule

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F13.S02](../SPEC.md). **Process IDs:** PS-105-01…PS-105-10. **Code:** `packages/notify/src/preferences/hours`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

The user's quiet-hours schedule: up to four weekly windows in an IANA time zone, evaluated by a pure, DST-correct function isQuiet(at) and a companion nextQuietEnd(at). The schedule is authored and evaluated in the user's vault. When a relay sends push or email for the user, the schedule is mirrored to that relay as a signed statement (classrup.notify.quiet_hours_mirror/v1) carrying only a rule-equivalent canonical time zone, the windows and the tzdata version, so the relay can defer its hook sends at the right local time without learning more than a region shared by many places. Each device of the principal is its own vault with its own mirror chain; the relay applies the statement it accepted most recently across the user's active devices, rejects forks, and emits a relay-local event when the effective schedule changes. This module only defines and evaluates the schedule; deferral, release and the security bypass are enforced by F13.S02.M01 (ADR-0014).

## Responsibilities

- Own the vault QuietHoursSchedule (classrup.notify.quiet_hours/v1) and the relay mirror copy (classrup.notify.quiet_hours_relay/v1) keyed by user and device chain.
- Provide the pure evaluation functions isQuiet(at, schedule) and nextQuietEnd(at, schedule) with documented DST behavior, identical in the vault and on the relay.
- Validate schedules and the time zone against the pinned IANA tzdata of the build, and map each zone to its canonical rule-equivalent zone before mirroring.
- Produce the signed mirror statement in the vault, accept it at relays that hold a registered push or email consent of the user, and emit relay-local notify.quiet_hours.changed when the effective mirror changes.
- Emit vault-local notify.quiet_hours.changed on every save so deferred items can be re-evaluated.

## Not responsible for

- Deferring, queueing and releasing notifications and the urgent security bypass (F13.S02.M01).
- Channel consent (F13.S02.M03) and category preferences (F13.S02.M04).
- Detecting the user's time zone from location; the user or the browser time zone setting chooses it and no location is read.
- Synchronizing the schedule between the user's devices; each device keeps its own schedule and the UI shows which device's schedule a relay applies.
- Blocks (N7) do not apply because the schedule involves only the user and the selected relays.
- Future: per-category quiet windows, one-off do-not-disturb for N hours, calendar-aware focus modes.

## User stories

- As a member, I can set quiet hours from 22:00 to 07:00 on every day in my own time zone.
- As a member who travels, I can change my time zone and see the schedule apply from that moment.
- As a member, I see when my quiet hours currently end and which device's schedule each relay uses.
- As a member, I am told that security alerts still arrive during quiet hours.

## Edge cases

- Window 22:00 to 07:00 on the night clocks go forward in America/New_York (2026-03-08); the window covers 8 real hours and the missing local hour does not shift the end.
- Window 22:00 to 07:00 on the night clocks go back (2026-11-01); the window covers 10 real hours because the repeated hour is inside it.
- A window starts at 02:30 on the spring-forward day in a zone where 02:30 does not exist; the start moves forward by the gap to 03:30 and an empty window is treated as no quiet period for that day.
- Time zone with a 30-minute DST change (Australia/Lord_Howe); evaluation uses real offsets and the window end is correct on 2026-04-05 and 2026-10-04.
- Zone with no DST (Asia/Kolkata); the evaluation never shifts.
- The user picks Europe/Busingen; the mirror carries Europe/Zurich, which has identical rules for 2020 to 2100, and the relay's isQuiet results equal the vault's.
- Devices A and B of the same user save different schedules; the relay applies the one it accepted last, device A's settings show The relay uses the schedule saved on device B, and A can re-send its own.
- A vault restored from an old backup signs a mirror with a seq already used on that device chain and a different cid; the relay refuses with CONFLICT_STATE naming the current cid and the vault shows the conflict instead of peer accepted.
- tzdata update changes a zone's rules; the pinned build data is used until the next release and the version is recorded in diagnostics.
- Window equals 24 hours or has equal start and end; refused as invalid because it would silence everything and the user is directed to disable push instead.

## UX and accessibility

- Quiet hours settings: toggle, time zone picker (searchable IANA list defaulting to the browser time zone), up to 4 windows each with days of week checkboxes, start time and end time, summary line such as Quiet until 07:00 local time.
- Security note: Security alerts are delivered during quiet hours.
- Relay note: The relay learns the time zone region shown here (for example Europe/Zurich, shared by many places) and your quiet windows; per relay, whether it uses this device's schedule or another device's.
- Preview: next 7 days with quiet intervals drawn as text list.

**States:** loading; disabled; enabled; currently-quiet; saving; saved-local; relay-pending; relay-confirmed; relay-uses-other-device; conflict; invalid; offline

**Accessibility:** Time inputs are native time controls with visible labels; days of week are a checkbox group with a legend.; Currently quiet status is conveyed by text and announced politely on change.; Add and remove window buttons are at least 44 by 44 px with accessible names including the window number.

## Owned data

- `QuietHoursSchedule` (classrup.notify.quiet_hours/v1, P2, RET-STANDARD)
- `QuietHoursSchedule` (classrup.notify.quiet_hours_relay/v1, P2, RET-STANDARD)

## Interfaces

- Commands: `notify.quiet_hours.set`, `notify.quiet_hours.mirror`
- Queries: `notify.quiet_hours.get`, `notify.quiet_hours.get_mirror`, `notify.quiet_hours.evaluate`
- Emits: `notify.quiet_hours.changed`
- Consumes: `notify.channel.opted_in`, `notify.channel.opted_out`, `security.key.revoked`, `privacy.deletion.completed`

## Dependencies

F13.S02.M03, F11.S01.M01, F16.S02.M02, F07.S02.M01, F15.S01.M01, F15.S02.M01, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-105-01 | [Domain schema](domain_schema.md) | 5 |
| PS-105-02 | [Validation rules](validation_rules.md) | 4 |
| PS-105-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-105-04 | [Commands, queries and events](commands_queries_events.md) | 5 |
| PS-105-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-105-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-105-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-105-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-105-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 4 |
| PS-105-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/notify/src/preferences/hours/index.ts`.

## Acceptance criteria

- All tests T01 to T18 pass in CI.
- Golden DST fixtures for the six listed transitions produce the documented durations in the vault and on the relay with identical results.
- No notification payload or event contains the schedule, and no mirror carries a non-canonical zone.
