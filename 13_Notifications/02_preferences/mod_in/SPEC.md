# F13.S02.M04 — In-app notification preferences

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F13.S02](../SPEC.md). **Process IDs:** PS-106-01…PS-106-10. **Code:** `packages/notify/src/preferences/in`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

The per-category by channel notification matrix. Categories are offers, cycles, messages, auctions, bookings, moderation and security, plus activity for content-free wake-ups on mailbox arrival and an other bucket for categories of newer app versions; channels are in-app, push and email, and the local OS alert follows the in-app column. The matrix lives in the user's vault and decides which in-app notifications appear, which categories the vault gate may alert, push or email, and which hook categories a relay may push or email. Security is always on in in-app and cannot be switched off. Only the column of a channel the user consented to at a relay is mirrored to that relay, as a signed per-channel statement on its own chain per device; the in-app column never leaves the device. The relay applies the statement it accepted most recently across the user's active devices, the versioned defaults when no mirror exists, and deletes its copy when the consent ends. Channel permission itself (consent) is F13.S02.M03 and quiet hours are F13.S02.M02 and F13.S02.M01.

## Responsibilities

- Own the vault NotificationPreference records (classrup.notify.preference/v1), one per user and category, with the in-app, push and email flags and their locks, and the relay copy (classrup.notify.preference_relay/v1) per user, channel and device chain.
- Provide the versioned default matrix and apply it for new vaults, for the reset command, and at relays without a mirror.
- Enforce the locks (security stays on in-app, activity has no in-app cell) and store flags for channels without consent, shown as inactive instead of silently enabled.
- Produce the signed mirror statement classrup.notify.preference_mirror/v1 for one consented channel at a time, and accept it at relays that hold a registered consent for that channel.
- Answer the vault in-process check for every channel and the relay internal resolve for hook dispatches.

## Not responsible for

- Channel consent (F13.S02.M03), schedules (F13.S02.M02), deferral (F13.S02.M01).
- Routing of events to categories and templates (F13.S01.M03 owns the routing table).
- Per-thread mute (F08.S01.M02) and per-listing alerts (F06.S01.M02 saved searches).
- Synchronizing the matrix between the user's devices; each device keeps its own matrix and the UI shows which device's matrix a relay uses.
- Blocks (N7) do not apply because the matrix involves only the user and the selected relays.
- Future: per-event-type overrides within a category, digest frequency, per-relay overrides, a discovery category for saved-search matches.

## User stories

- As a member, I can turn off push for auctions but keep it for messages and see the whole matrix on one screen.
- As a member, I cannot turn off in-app security notices and the screen explains why.
- As a member, I can switch off wake-up pushes for new mailbox activity with one switch.
- As a member, I can reset everything to defaults in one tap.
- As a member, I see that email is inactive because I have not enabled the email channel.

## Edge cases

- User sets push for a category while the push channel is not consented; the flag is saved, displayed inactive with a link to enable the channel, and not mirrored.
- User tries to switch off security in-app; the command refuses with NOTIFY_PREF_LOCKED and the UI keeps the switch on.
- Mirror statement reaches the relay twice or out of order; the relay applies only a statement that extends its device chain head and reports the rest as stale.
- Relay is unreachable when preferences change; the vault applies locally and the UI says the relay will use the old push settings until it confirms.
- Two devices of one user change different cells; each device mirrors its own complete column, the relay applies the one it accepted last, and the other device's settings show The relay uses the settings saved on device B with a Use this device's settings action.
- A restored vault signs a mirror with a seq already used on its device chain and a different cid; the relay refuses with CONFLICT_STATE naming the current cid and the vault shows the conflict.
- The relay has no mirror for a user; resolve applies the versioned default matrix and reports source defaults.
- Unknown category arrives from a newer app version through import; it is stored in the other bucket with in-app on and push and email off, shown in a generic Other row, and never mirrored.
- A relay holds push consent only; it receives only the push column and stores no email flags.

## UX and accessibility

- Notification settings matrix: 8 category rows by 3 channel columns of switches (activity has a push and an email switch only), channel status line (inactive when not consented), security row with locked in-app switch, and per relay which device's settings it uses.
- Reset to defaults confirmation.
- Channel inactive banner with Enable button leading to F13.S02.M03.
- Note under activity: wake-ups are content-free; while the vault is locked the alert is generic and cannot apply per-category choices or thread mute.

**States:** loading; ready; saving; saved-local; relay-pending; relay-confirmed; relay-uses-other-device; conflict; locked-cell; channel-inactive; offline

**Accessibility:** Matrix is a table with row and column headers; each switch has an accessible name such as Auctions, push.; Locked switch is exposed as disabled with an explanation linked by aria-describedby.; All switches are at least 44 by 44 px and changes are announced politely.

## Owned data

- `NotificationPreference` (classrup.notify.preference/v1, P2, RET-STANDARD)
- `NotificationPreference` (classrup.notify.preference_relay/v1, P2, RET-STANDARD)

## Interfaces

- Commands: `notify.preference.set`, `notify.preference.reset`, `notify.preference.mirror`
- Queries: `notify.preference.get_matrix`, `notify.preference.check`, `notify.preference.resolve`
- Emits: `notify.preference.changed`
- Consumes: `notify.channel.opted_in`, `notify.channel.opted_out`, `security.key.revoked`, `privacy.deletion.completed`

## Dependencies

F13.S02.M03, F11.S01.M01, F16.S02.M02, F07.S02.M01, F15.S01.M01, F15.S02.M01, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-106-01 | [Domain schema](domain_schema.md) | 5 |
| PS-106-02 | [Validation rules](validation_rules.md) | 4 |
| PS-106-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-106-04 | [Commands, queries and events](commands_queries_events.md) | 5 |
| PS-106-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-106-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-106-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-106-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-106-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 4 |
| PS-106-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/notify/src/preferences/in/index.ts`.

## Acceptance criteria

- All tests T01 to T16 pass in CI.
- The security category in-app flag can never be false through any command, import or app-update merge.
- Relay storage and traffic captures contain no in-app column, no unconsented channel and no content.
