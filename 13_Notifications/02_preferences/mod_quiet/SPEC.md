# F13.S02.M01 — Quiet-hours enforcement

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F13.S02](../SPEC.md). **Process IDs:** PS-108-01…PS-108-10. **Code:** `packages/notify/src/preferences/quiet`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

The dispatch gate for outbound notification channels and the owner of deferral, running in two places. In the vault it receives every routing decision of F13.S01.M03 through NotificationDispatchPort and decides, per channel, the local operating-system alert (os_alert) and whether to ask the user's relay for push or email; it evaluates mute, the category matrix, channel consent (privacy.consent.check plus the registered channel consent) and quiet hours locally, and seals push content for the user's other devices so the relay receives only the user DID, channel, urgency, an opaque collapse tag, an optional release time and boxes it cannot open. On the relay it gates those sealed requests and the in-process hooks of relay services (mailbox arrival wake-ups, auction host, cycle matching, moderation), using only the registered channel consent, the mirrored matrix and the mirrored schedule. Outside quiet hours it sends at once; inside quiet hours it defers and releases at window end with up to 5 minutes of jitter and digest collapsing. The urgent security class bypasses quiet hours but never bypasses consent. Each event has a single alert producer per channel.

## Responsibilities

- Own the vault DeferredNotification (classrup.notify.deferred/v1) and the relay DeferredNotification (classrup.notify.deferred_relay/v1); the relay record never holds a reference, template key or collapse key of a vault-originated alert.
- Implement NotificationDispatchPort for F13.S01.M03 and the single decision order caller authentication, deletion pause, mute, collapse, consent or browser permission, matrix cell, single-producer arrival rule, urgency, quiet hours, rate - identical in vault and relay where both apply.
- Seal vault-originated push content per target device to the X25519 agreement key that F16.S02.M01 agreementPublicKeyOf derives from that device's listed Ed25519 key and derive opaque collapse tags, so relays and push services cannot read or link alerts.
- Release deferred items at the end of the quiet window with jitter of 0 to 300 s in batch loops, collapse items with the same collapse key or tag and replace more than 5 due items for one user and channel by one digest alert.
- Re-evaluate deferred items when the schedule, a channel consent or a preference changes, cancel items the user already read through the relay command notify.notification.cancel, and re-defer items whose checks cannot be read.
- Enforce the urgent security class rule - only category security may be urgent, and urgent alerts skip quiet hours and the digest but are still subject to consent and the security cell of that channel.

## Not responsible for

- Schedule definition and DST evaluation (F13.S02.M02 provides isQuiet and nextQuietEnd).
- Channel consent (F13.S02.M03), matrix (F13.S02.M04), subscriptions and the Web Push protocol (F13.S01.M01), email transport (F13.S01.M02), inbox rows and the routing table (F13.S01.M03).
- Block filtering, which F13.S01.M03 applies through F07.S02.M02 before any decision reaches this gate; relay hooks carry no counterparty data and the service worker routes wake-ups through F13.S01.M03.
- Do-not-disturb of the operating system; the gate cannot override device-level focus modes.
- Future: per-category quiet windows, adaptive digest timing, delivery-time optimization.

## User stories

- As a member, I do not get a push at 03:00 about a new offer and I see a single summary when my quiet hours end.
- As a member, I still get a push on my other devices when a new device key is added to my account at 03:00.
- As a member, I do not get an email for a category I switched off, and a muted thread never alerts me.
- As a member, I see in the app inbox everything that was held back, because the inbox is never deferred.
- As a member in a cycle with others on the same relay, I know the relay cannot tell from my alerts who else is in it.

## Edge cases

- Quiet window ends at 07:00 and 2 000 users have deferred items; releases are spread over 0 to 300 s of jitter and the sweep loops in batches of 500 bounded by the push budget.
- User changes quiet hours while items are deferred; vault items are recomputed at once and relay items when the relay-local notify.quiet_hours.changed of the mirror arrives; items now outside quiet hours are released within 60 s with reason schedule_changed.
- User reads the notification in the app while its push is deferred at the relay; the vault calls notify.notification.cancel with the dispatch ID and no push is sent.
- Channel consent is withdrawn while items are deferred; vault items for that channel are dropped with reason no_consent and the relay drops its items when the withdrawal is registered there.
- A deferred item reaches 24 hours of age because the schedule was changed to be always quiet; it is dropped with reason expired and remains visible in the in-app inbox.
- Urgent security alert while no push consent exists; nothing is pushed and the in-app notification and, if the user enabled email and it is verified, email are used.
- An offer arrives through a relay mailbox while the app is closed; the mailbox hook sends one content-free activity wake, the service worker routes the offer in the vault and shows the alert only if the offers push cell is on and the thread is not muted; the vault does not ask the relay for a second push.
- The auction host pushes an outbid alert and puts the bid_outbid statement into the mailbox 2 seconds later; the mailbox wake is collapsed because a push reached the user in the last 60 s.
- The relay has no preference mirror for a user; the hook gate applies the versioned default matrix, so the activity wake is sent and no urgent security push is dropped for that reason.
- The preference store cannot be read during a vault decision; the item is re-deferred for 5 minutes up to 3 times, then dropped for push and email and kept in the inbox.
- A deletion request is pending; non-security decisions are held without sending anything to relays, and cancelling the request resumes normal dispatch without any undo.
- Relay clock differs from the user's clock by 40 seconds; the relay uses its own clock with the mirrored schedule and the difference is tolerated within the 60 s re-evaluation tolerance.

## UX and accessibility

- Inbox shows all notifications with a small icon Held until quiet hours end on items whose OS alert, push or email was deferred.
- Quiet hours screen (F13.S02.M02) links to a Held notifications list showing counts per category and channel, not contents.
- Digest alert text such as 5 new notifications waiting, opens the inbox.
- Notification settings note: while the vault is locked, wake-up alerts show only generic text and cannot apply per-category choices or thread mute.

**States:** loading; none-held; held; releasing; released; dropped; cancelled; paused-deletion; offline

**Accessibility:** Held indicator has text alternative Held until 07:00 and is not conveyed by icon alone.; Digest alerts use plain text titles that screen readers announce without markup.; The held list is a table with category and count headers.

## Owned data

- `DeferredNotification` (classrup.notify.deferred/v1, P2, RET-EPHEMERAL)
- `DeferredNotification` (classrup.notify.deferred_relay/v1, P2, RET-EPHEMERAL)

## Interfaces

- Commands: `notify.notification.dispatch`, `notify.notification.release`, `notify.notification.cancel`
- Queries: `notify.notification.list_deferred`
- Emits: `notify.notification.deferred`, `notify.notification.released`
- Consumes: `notify.notification.read`, `notify.quiet_hours.changed`, `notify.channel.opted_out`, `notify.preference.changed`, `privacy.deletion.requested`, `privacy.deletion.completed`

## Dependencies

F13.S02.M02, F13.S02.M03, F13.S02.M04, F13.S01.M01, F13.S01.M02, F13.S01.M03, F16.S02.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F16.S02.M02, F07.S02.M01, F15.S01.M01, F12.S03.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-108-01 | [Domain schema](domain_schema.md) | 4 |
| PS-108-02 | [Validation rules](validation_rules.md) | 5 |
| PS-108-03 | [Workflow state machine](workflow_state_machine.md) | 4 |
| PS-108-04 | [Commands, queries and events](commands_queries_events.md) | 6 |
| PS-108-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-108-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-108-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-108-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-108-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 4 |
| PS-108-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/notify/src/preferences/quiet/index.ts`.

## Acceptance criteria

- All tests T01 to T20 pass in CI.
- No send occurs on any path without a granted unexpired channel consent, and no muted item alerts on any channel.
- Urgent bypass works only for category security and is visible in metrics.
- Released times match the golden DST fixtures to within the 300 s jitter, and relay captures never contain references, template keys or collapse keys of vault-originated alerts.
