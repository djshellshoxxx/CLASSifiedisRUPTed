# F13 — Notifications

**Status:** SPECIFIED. **Parent:** [ClassRup](../PROJECT_SPEC.md). **Package slug:** `notify`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Subfeatures

- [F13.S01 01_delivery](01_delivery/SPEC.md) — 3 modules
- [F13.S02 02_preferences](02_preferences/SPEC.md) — 4 modules

## Aggregation

The feature is enabled by flag `F13` (CTR-FLG-001); each module can be disabled independently when no enabled module depends on it. Upstream features: F07, F08, F10, F11, F12, F15, F16.

### Cross-subfeature and external events

| Event | Producer | Consumer | Scope |
|---|---|---|---|
| notify.channel.opted_out | F13.S02.M03 | F13.S01.M01 | internal |
| notify.channel.opted_in | F13.S02.M03 | F13.S01.M01 | internal |
| security.key.revoked | F16.S02.M02 | F13.S01.M01 | external |
| privacy.deletion.completed | F10.S01.M04 | F13.S01.M01 | external |
| notify.channel.opted_out | F13.S02.M03 | F13.S01.M02 | internal |
| notify.channel.opted_in | F13.S02.M03 | F13.S01.M02 | internal |
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
| notify.preference.changed | F13.S02.M04 | F13.S01.M03 | internal |
| notify.notification.read | F13.S01.M03 | F13.S02.M01 | internal |
| privacy.deletion.requested | F10.S01.M04 | F13.S02.M01 | external |
| privacy.deletion.completed | F10.S01.M04 | F13.S02.M01 | external |
| security.key.revoked | F16.S02.M02 | F13.S02.M02 | external |
| privacy.deletion.completed | F10.S01.M04 | F13.S02.M02 | external |
| privacy.consent.withdrawn | F10.S01.M01 | F13.S02.M03 | external |
| privacy.consent.granted | F10.S01.M01 | F13.S02.M03 | external |
| privacy.deletion.requested | F10.S01.M04 | F13.S02.M03 | external |
| privacy.deletion.completed | F10.S01.M04 | F13.S02.M03 | external |
| security.key.revoked | F16.S02.M02 | F13.S02.M04 | external |
| privacy.deletion.completed | F10.S01.M04 | F13.S02.M04 | external |
