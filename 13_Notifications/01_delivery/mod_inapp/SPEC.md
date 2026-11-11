# F13.S01.M03 — In-app notifications

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F13.S01](../SPEC.md). **Process IDs:** PS-103-01…PS-103-10. **Code:** `packages/notify/src/delivery/inapp`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

The in-app notification inbox. It runs in the user's vault while the app is open: local domain events derived from the user's own commands and from verified signed statements of other parties are mapped by a routing table to content-free Notifications (category, template key, reference), deduplicated and collapsed, filtered by the in-app column of the preference matrix, and shown with read state. Texts are rendered on the device from the template key and local data. Security notifications are always on. Nothing here needs a relay; push and email are separate channels fed by relays.

## Responsibilities

- Own the Notification record (category, template key, reference, collapse key, count, read state) in the vault.
- Own the routing table that maps domain events to category, template key, recipient rule, urgency class and collapse key, listed in events_consumed below.
- Deduplicate by event ID, collapse repeated alerts with the same template and collapse key within 10 minutes, and cap the inbox at 500 items.
- Respect the in-app preference column of F13.S02.M04 for every category except security.
- Provide mark-read, mark-all-read, list and unread-count operations and emit notify.notification.created and notify.notification.read for the gate and badge consumers.

## Not responsible for

- Deciding whether an alert leaves the device as OS alert, push or email (F13.S02.M01).
- Preferences, consent and schedules (F13.S02.M04, F13.S02.M03, F13.S02.M02).
- Message content; the inbox shows only templates and references and the thread screens show content.
- Mute per thread (F08.S01.M02) beyond reading it as an input to the routing rule for comms.message.received.
- Future: server-synchronized read state across devices, rich actions inside notifications, a discovery category for saved-search matches.

## User stories

- As a seller, I see in my inbox that a buyer made an offer and tapping opens that offer.
- As a member, I see one collapsed entry for ten new messages in one thread instead of ten entries.
- As a member, I always see security notices, for example a new device key was added.
- As a member, I can mark everything as read in one tap and the badge goes to zero.

## Edge cases

- Event is delivered twice (at-least-once); the second delivery is skipped because the event ID is already in the consumer inbox.
- A verified statement from a blocked user arrives; no notification is created.
- A thread is muted; message alerts for that thread are created silently marked muted and never cause OS alerts, push or email.
- The inbox reaches 500 items; the oldest read items are removed first, then the oldest unread non-security items; security items are removed last and only after 30 days.
- Event concerns an actor other than the local principal (for example another participant's offer on a listing not owned); no notification is created because the recipient rule fails.
- The user's own action produces an event (they accepted the offer); no notification is created for the actor.
- Preference for a category is off for in-app; the notification is not created but a hidden counter increments for diagnostics, except security which ignores the preference.
- App starts after being closed for a week; events derived from statements received during fetch are routed in order and collapsed, and notifications older than 30 days are never created.

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
- Consumes: `bazaar.offer.made`, `bazaar.offer.accepted`, `bazaar.offer.rejected`, `bazaar.offer.expired`, `bazaar.negotiation.countered`, `commerce.deal.opened`, `commerce.payment.claimed`, `commerce.payment.acknowledged`, `commerce.payment.disputed`, `comms.message.received`, `mutiny.cycle.proposed`, `mutiny.cycle.committed`, `mutiny.cycle.declined`, `mutiny.cycle.participant_dropped`, `mutiny.cycle.cancelled`, `mutiny.cycle.completed`, `mutiny.recovery.opened`, `mutiny.proposal.revised`, `auctions.bid.outbid`, `auctions.auction.won`, `auctions.auction.unsold`, `auctions.auction.closed`, `auctions.result.voided`, `services.quote.issued`, `services.quote.accepted`, `services.booking.confirmed`, `services.booking.cancelled`, `services.milestone.submitted`, `services.milestone.approved`, `services.dispute.opened`, `rentals.reservation.requested`, `rentals.reservation.confirmed`, `rentals.reservation.cancelled`, `rentals.rental.overdue`, `rentals.damage.claimed`, `comms.meetup.proposed`, `comms.meetup.agreed`, `comms.meetup.cancelled`, `comms.meetup.no_show`, `moderation.action.applied`, `moderation.appeal.decided`, `identity.device_key.added`, `identity.device_key.revoked`, `identity.session.revoked`, `identity.recovery.completed`, `identity.recovery.kit_created`, `federation.account.moved`, `privacy.export.ready`, `notify.preference.changed`

## Dependencies

F13.S02.M04, F08.S01.M01, F08.S01.M02, F08.S03.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-103-01 | [Domain schema](domain_schema.md) | 3 |
| PS-103-02 | [Validation rules](validation_rules.md) | 3 |
| PS-103-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-103-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-103-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-103-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-103-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-103-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-103-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-103-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/notify/src/delivery/inapp/index.ts`.

## Acceptance criteria

- All tests T01 to T14 pass in CI.
- Every routed event exists in the catalog and the inbox never stores text content.
- Security notifications are created regardless of the in-app preference.
- Duplicate event delivery never creates a second row.
