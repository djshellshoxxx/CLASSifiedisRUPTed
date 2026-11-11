# F13.S01.M03 — In-app notifications

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F13.S01](../SPEC.md). **Process IDs:** PS-103-01…PS-103-10. **Code:** `packages/notify/src/delivery/inapp`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

The in-app notification inbox. It runs in the user's vault while the app is open or while the service worker processes a wake-up: local domain events derived from the user's own commands and from verified signed statements of other parties are mapped by a routing table to content-free Notifications (category, template key, reference), filtered through the block list of F07.S02.M02, deduplicated and collapsed, filtered by the in-app column of the preference matrix, and shown with read state. Every routing decision, with or without an inbox row, is handed to the vault gate through NotificationDispatchPort, so push and email follow their own matrix columns. Texts are rendered on the device from the template key and local data. Security notifications are always on and are raised for changes made on the user's other devices. Nothing here needs a relay.

## Responsibilities

- Own the Notification record (category, template key, reference, collapse key, count, muted flag, actor class, read state) and the vault-local known-actor index used for flood budgets.
- Own the routing table that maps domain events to category, template key, recipient rule over producer payload fields, filters, urgency class and collapse key, listed in events_consumed below.
- Drop events from blocked DIDs silently through F07.S02.M02 filterBlocked and isBlockedEither (N7) before any row or dispatch decision.
- Deduplicate by event ID, collapse repeated alerts with the same template and collapse key within 10 minutes, cap the inbox at 500 items and apply per-actor and new-actor flood budgets.
- Respect the in-app preference column of F13.S02.M04 for every category except security, and hand every routing decision to NotificationDispatchPort (declared here, implemented by F13.S02.M01) for OS alert, push and email decisions.
- Provide mark-read, mark-all-read, list and unread-count operations and emit notify.notification.created and notify.notification.read for the gate and badge consumers.

## Not responsible for

- Deciding whether an alert leaves the device as OS alert, push or email, quiet hours and sealing (F13.S02.M01).
- Preferences, consent and schedules (F13.S02.M04, F13.S02.M03, F13.S02.M02).
- Message content; the inbox shows only templates and references and the thread screens show content.
- Mute per thread (F08.S01.M02) beyond reading it as an input to the routing rule for comms.message.received.
- Block list storage (F07.S02.M02); this module only calls its filter functions.
- Future: synchronized read state across the user's devices, rich actions inside notifications, a discovery category for saved-search matches.

## User stories

- As a seller, I see in my inbox that a buyer made an offer and tapping opens that offer.
- As a member, I see one collapsed entry for ten new messages in one thread instead of ten entries.
- As a member, I always see security notices, for example a new device key was added from my other phone.
- As a party to a deal, booking or rental, I am told when it completes.
- As a member, I can mark everything as read in one tap and the badge goes to zero.

## Edge cases

- Event is delivered twice (at-least-once); the second delivery is acknowledged as a duplicate skip because the event ID is already in the consumer inbox, and it is never retried.
- A verified statement from a blocked user arrives; no notification and no dispatch decision is created, silently (N7).
- A thread is muted; message rows for that thread are created marked muted and never cause OS alerts, email or vault-originated push; a content-free wake push for the mailbox arrival may still reach the device, where the service worker shows no alert once the vault has routed the message, and shows only the generic activity alert while the vault is locked, which the settings disclose.
- The inbox reaches 500 items; read rows are removed first, then rows from unknown actors, then the oldest unread non-security rows from known counterparties; security rows are removed last and only after 30 days.
- Event concerns another participant only (for example another buyer's offer on a listing not owned); it is skipped with outcome not_recipient.
- The user's own action produces an event (they accepted the offer); no row is created for the actor, and the counterparty is recorded in the known-actor index.
- The user links a new device key on device B; device A derives identity.device_key.added from the verified device-link statement signed on device B and creates an urgent security row, while device B itself shows none.
- Vault locks on idle timeout, or keys rotate on schedule; identity.session.revoked with reason idle, locked, absolute, rotated, limit or erased is skipped with outcome filtered.
- Preference for a category is off for in-app; no row is created but the decision still reaches NotificationDispatchPort so push and email follow their own columns; security ignores the in-app preference.
- 600 freshly created DIDs each send one offer; after 20 rows in the offers category in one day the rest collapse into one row N new from new members, and every pre-existing unread row survives.
- App starts after being closed for a week; events derived from statements received during fetch are routed in order and collapsed, and notifications older than 30 days are skipped with outcome expired.

## UX and accessibility

- Inbox: list newest first grouped by day, each item with category icon and label, rendered title and short line from the template, count badge when collapsed, unread dot, tap opens the referenced screen.
- Badge on the app icon and nav item showing unread count capped at 99+.
- Empty state: No notifications yet with a link to notification settings.

**States:** loading; empty; unread; all-read; muted-item; offline; ref-unavailable

**Accessibility:** Inbox is a list; each item has an accessible name composed of category, title and time, and unread state is text not only a dot.; Mark all read is a button with a live region announcement of the new count.; Items are reachable by keyboard, with targets of at least 44 by 44 px.

## Owned data

- `Notification` (classrup.notify.notification/v1, P2, RET-SHORT)

## Interfaces

- Commands: `notify.notification.create`, `notify.notification.mark_read`, `notify.notification.mark_all_read`
- Queries: `notify.notification.list_mine`, `notify.notification.unread_count`
- Emits: `notify.notification.created`, `notify.notification.read`
- Consumes: `bazaar.offer.made`, `bazaar.offer.accepted`, `bazaar.offer.rejected`, `bazaar.offer.expired`, `bazaar.offer.withdrawn`, `bazaar.negotiation.countered`, `commerce.deal.opened`, `commerce.payment.claimed`, `commerce.payment.acknowledged`, `commerce.payment.disputed`, `commerce.deal.completed`, `comms.message.received`, `mutiny.cycle.proposed`, `mutiny.cycle.committed`, `mutiny.cycle.declined`, `mutiny.cycle.participant_dropped`, `mutiny.cycle.cancelled`, `mutiny.cycle.completed`, `mutiny.recovery.opened`, `mutiny.proposal.revised`, `auctions.bid.outbid`, `auctions.auction.won`, `auctions.auction.unsold`, `auctions.auction.closed`, `auctions.result.voided`, `services.quote.issued`, `services.quote.accepted`, `services.booking.confirmed`, `services.booking.cancelled`, `services.booking.completed`, `services.milestone.submitted`, `services.milestone.approved`, `services.dispute.opened`, `rentals.reservation.requested`, `rentals.reservation.confirmed`, `rentals.reservation.cancelled`, `rentals.rental.overdue`, `rentals.damage.claimed`, `rentals.rental.closed`, `comms.meetup.proposed`, `comms.meetup.agreed`, `comms.meetup.cancelled`, `comms.meetup.no_show`, `moderation.action.applied`, `moderation.appeal.decided`, `identity.device_key.added`, `identity.device_key.revoked`, `identity.session.revoked`, `identity.recovery.completed`, `identity.recovery.kit_created`, `federation.account.moved`, `privacy.export.ready`, `notify.email.bounced`, `notify.preference.changed`, `identity.block.added`, `privacy.deletion.completed`

## Dependencies

F13.S02.M04, F07.S02.M02, F08.S01.M01, F08.S01.M02, F08.S03.M03, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-103-01 | [Domain schema](domain_schema.md) | 4 |
| PS-103-02 | [Validation rules](validation_rules.md) | 4 |
| PS-103-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-103-04 | [Commands, queries and events](commands_queries_events.md) | 5 |
| PS-103-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-103-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 4 |
| PS-103-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-103-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-103-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 4 |
| PS-103-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/notify/src/delivery/inapp/index.ts`.

## Acceptance criteria

- All tests T01 to T18 pass in CI.
- Every routed event exists in the catalog, every routing field exists in its producer payload, and the inbox never stores text content.
- Security notifications are created regardless of the in-app preference and for changes made on the user's other devices.
- Duplicate event delivery never creates a second row and never retries.
