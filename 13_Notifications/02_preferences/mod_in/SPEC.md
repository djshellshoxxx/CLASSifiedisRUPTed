# F13.S02.M04 — In-app notification preferences

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F13.S02](../SPEC.md). **Process IDs:** PS-106-01…PS-106-10. **Code:** `packages/notify/src/preferences/in`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

The per-category by channel notification matrix. Categories are offers, cycles, messages, auctions, bookings, moderation and security; channels are in-app, push and email. The matrix lives in the user's vault and decides which in-app notifications appear and which categories a relay may push or email. Security is always on in-app and cannot be switched off. Only the push and email columns, which a relay needs, are mirrored to the relays the user chose as a signed statement; the in-app column never leaves the device. Channel permission itself (consent) is F13.S02.M03 and quiet hours are F13.S02.M02 and F13.S02.M01.

## Responsibilities

- Own the NotificationPreference records, one per user and category, holding the in-app, push and email flags and their lock state.
- Provide the default matrix and apply it for new vaults and for the reset command.
- Enforce that the security category stays on in-app and that no flag is stored for a channel the user has not consented to, which is shown as inactive instead of silently enabled.
- Produce the signed mirror statement classrup.notify.preference_mirror/v1 with the push and email columns only, and accept it at relays that hold the user's channel consent.
- Answer relay-side lookups of whether a category may be sent over a channel for a user.

## Not responsible for

- Channel consent (F13.S02.M03), schedules (F13.S02.M02), deferral (F13.S02.M01).
- Routing of events to categories and templates (F13.S01.M03 owns the routing table).
- Per-thread mute (F08.S01.M02) and per-listing alerts (F06.S01.M02 saved searches).
- Future: per-event-type overrides within a category, digest frequency, per-relay overrides, a discovery category for saved-search matches.

## User stories

- As a member, I can turn off push for auctions but keep it for messages and see the whole matrix on one screen.
- As a member, I cannot turn off in-app security notices and the screen explains why.
- As a member, I can reset everything to defaults in one tap.
- As a member, I see that email is inactive because I have not enabled the email channel.

## Edge cases

- User sets push for a category while the push channel is not consented; the flag is saved but displayed inactive with a link to enable the channel.
- User tries to switch off security in-app; the command refuses with NOTIFY_PREF_LOCKED and the UI keeps the switch on.
- Mirror statement reaches the relay twice or out of order; the relay applies only the highest seq.
- Relay is unreachable when preferences change; the vault applies locally and the UI says the relay will use the old push settings until it confirms.
- Two devices of one user change different cells at the same time; both changes are kept per cell and the later seq of the mirror carries the merged matrix.
- Unknown category arrives from a newer app version; it is stored with defaults of in-app on and push and email off and shown in a generic Other row.

## UX and accessibility

- Notification settings matrix: 7 category rows by 3 channel columns of switches, channel status line (inactive when not consented), security row with locked in-app switch.
- Reset to defaults confirmation.
- Channel inactive banner with Enable button leading to F13.S02.M03.

**States:** loading; ready; saving; saved-local; relay-pending; relay-confirmed; locked-cell; channel-inactive; offline

**Accessibility:** Matrix is a table with row and column headers; each switch has an accessible name such as Auctions, push.; Locked switch is exposed as disabled with an explanation linked by aria-describedby.; All switches are at least 44 by 44 px and changes are announced politely.

## Owned data

- `NotificationPreference` (classrup.notify.preference/v1, P2, RET-STANDARD)

## Interfaces

- Commands: `notify.preference.set`, `notify.preference.reset`, `notify.preference.mirror`
- Queries: `notify.preference.get_matrix`, `notify.preference.resolve`
- Emits: `notify.preference.changed`
- Consumes: `notify.channel.opted_in`, `notify.channel.opted_out`

## Dependencies

F13.S02.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-106-01 | [Domain schema](domain_schema.md) | 3 |
| PS-106-02 | [Validation rules](validation_rules.md) | 3 |
| PS-106-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-106-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-106-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-106-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-106-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-106-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-106-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-106-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/notify/src/preferences/in/index.ts`.

## Acceptance criteria

- All tests T01 to T14 pass in CI.
- The security category in-app flag can never be false through any command, import or merge.
- Relay storage and traffic captures contain no in-app column and no content.
