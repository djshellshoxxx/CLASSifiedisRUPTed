# F13.S01 — 01_delivery

**Status:** SPECIFIED. **Parent:** [F13](../SPEC.md).

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Modules

| Module | Name | Status | Responsibility |
|---|---|---|---|
| F13.S01.M01 | [Web push delivery](mod_push/SPEC.md) | SPECIFIED | Web Push (RFC 8030/8291/8292, VAPID) subscriptions and sends with content-free payloads (reference + template key), expiry/410 handling. |
| F13.S01.M02 | [Email delivery](mod_email/SPEC.md) | SPECIFIED | Optional verified email (P3), templated minimal emails via EmailTransportPort (SMTP adapter, dev log adapter), unsubscribe links. |
| F13.S01.M03 | [In-app notifications](mod_inapp/SPEC.md) | SPECIFIED | Notification inbox generated from domain events via routing table, dedupe/collapse keys, read state. |

## Aggregation

Modules in this subfeature share the feature package `packages/notify` (or the app path in each module) and integrate only through the events and ports below; no module reads another module's tables.

### Event dependencies

| Event | Producer | Consumer | Scope |
|---|---|---|---|
| notify.channel.opted_out | F13.S02.M03 | F13.S01.M01 | external |
| notify.channel.opted_in | F13.S02.M03 | F13.S01.M01 | external |
| security.key.revoked | F16.S02.M02 | F13.S01.M01 | external |
| privacy.deletion.completed | F10.S01.M04 | F13.S01.M01 | external |
| notify.channel.opted_out | F13.S02.M03 | F13.S01.M02 | external |
| notify.channel.opted_in | F13.S02.M03 | F13.S01.M02 | external |
| privacy.deletion.requested | F10.S01.M04 | F13.S01.M02 | external |
| privacy.deletion.completed | F10.S01.M04 | F13.S01.M02 | external |
| mutiny.coordination.observed | F02.S03.M01 | F13.S01.M03 | external |
| bazaar.offer.made | F01.S04.M01 | F13.S01.M03 | external |
| bazaar.offer.accepted | F01.S04.M01 | F13.S01.M03 | external |
| bazaar.offer.rejected | F01.S04.M01 | F13.S01.M03 | external |
| bazaar.offer.expired | F01.S04.M01 | F13.S01.M03 | external |
| bazaar.negotiation.countered | F01.S04.M02 | F13.S01.M03 | external |
| commerce.deal.opened | F09.S01.M01 | F13.S01.M03 | external |
| commerce.payment.claimed | F09.S01.M01 | F13.S01.M03 | external |
| commerce.payment.acknowledged | F09.S01.M01 | F13.S01.M03 | external |
| commerce.payment.disputed | F09.S01.M01 | F13.S01.M03 | external |
| comms.message.received | F08.S01.M01 | F13.S01.M03 | external |
| mutiny.cycle.proposed | F02.S03.M01 | F13.S01.M03 | external |
| mutiny.cycle.committed | F02.S03.M01 | F13.S01.M03 | external |
| mutiny.cycle.declined | F02.S03.M01 | F13.S01.M03 | external |
| mutiny.cycle.participant_dropped | F02.S03.M03 | F13.S01.M03 | external |
| mutiny.cycle.cancelled | F02.S03.M03 | F13.S01.M03 | external |
| mutiny.cycle.completed | F02.S03.M04 | F13.S01.M03 | external |
| mutiny.recovery.opened | F02.S03.M04 | F13.S01.M03 | external |
| mutiny.proposal.revised | F02.S01.M04 | F13.S01.M03 | external |
| auctions.bid.outbid | F04.S01.M02 | F13.S01.M03 | external |
| auctions.auction.won | F04.S01.M03 | F13.S01.M03 | external |
| auctions.auction.unsold | F04.S01.M03 | F13.S01.M03 | external |
| auctions.auction.closed | F04.S01.M03 | F13.S01.M03 | external |
| auctions.result.voided | F04.S02.M03 | F13.S01.M03 | external |
| services.quote.issued | F03.S02.M01 | F13.S01.M03 | external |
| services.quote.accepted | F03.S02.M01 | F13.S01.M03 | external |
| services.booking.confirmed | F03.S02.M01 | F13.S01.M03 | external |
| services.booking.cancelled | F03.S02.M01 | F13.S01.M03 | external |
| services.milestone.submitted | F03.S02.M02 | F13.S01.M03 | external |
| services.milestone.approved | F03.S02.M02 | F13.S01.M03 | external |
| services.dispute.opened | F03.S02.M03 | F13.S01.M03 | external |
| rentals.reservation.requested | F05.S01.M01 | F13.S01.M03 | external |
| rentals.reservation.confirmed | F05.S01.M01 | F13.S01.M03 | external |
| rentals.reservation.cancelled | F05.S01.M01 | F13.S01.M03 | external |
| rentals.rental.overdue | F05.S02.M02 | F13.S01.M03 | external |
| rentals.damage.claimed | F05.S02.M03 | F13.S01.M03 | external |
| comms.meetup.proposed | F08.S03.M03 | F13.S01.M03 | external |
| comms.meetup.agreed | F08.S03.M03 | F13.S01.M03 | external |
| comms.meetup.cancelled | F08.S03.M03 | F13.S01.M03 | external |
| comms.meetup.no_show | F08.S03.M02 | F13.S01.M03 | external |
| moderation.action.applied | F12.S02.M01 | F13.S01.M03 | external |
| moderation.appeal.decided | F12.S01.M03 | F13.S01.M03 | external |
| identity.device_key.added | F07.S01.M01 | F13.S01.M03 | external |
| identity.device_key.revoked | F07.S01.M01 | F13.S01.M03 | external |
| identity.session.revoked | F07.S01.M02 | F13.S01.M03 | external |
| identity.recovery.completed | F07.S01.M03 | F13.S01.M03 | external |
| identity.recovery.kit_created | F07.S01.M03 | F13.S01.M03 | external |
| federation.account.moved | F11.S03.M03 | F13.S01.M03 | external |
| privacy.export.ready | F10.S01.M03 | F13.S01.M03 | external |
| notify.preference.changed | F13.S02.M04 | F13.S01.M03 | external |
