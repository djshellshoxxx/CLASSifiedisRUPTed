# PS-103-04 — Commands, queries and events: In-app notifications

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S01.M03 In-app notifications](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/delivery/inapp` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-103-04.R01** Creation is a vault-internal command invoked by the routing consumers; mark-read and mark-all-read are vault commands; list and unread-count are vault queries.
- **PS-103-04.R02** Creation and read emit their events in the same IndexedDB transaction as the row change (CTR-EVT-001 EVT-8).
- **PS-103-04.R03** The routing table below is the complete set of routed events; every listed event exists in the module catalog emits.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `notify.notification.create` | notify.notification.create | [vault internal command called by the routing consumers] { sourceEventId, category, templateKey, ref?, collapseKey?, urgency?, muted? } | { notificationId, created: boolean, collapsed: boolean, count } | VALIDATION_FAILED, NOT_FOUND, BLOCKED_PARTY, CONFLICT_STATE, EXPIRED | notify.notification.created | yes (Idempotency-Key) |
| `notify.notification.mark_read` | notify.notification.mark_read | [vault command] { notificationId, expectedRevision } | { notificationId, status: read, revision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | notify.notification.read | yes (Idempotency-Key) |
| `notify.notification.mark_all_read` | notify.notification.mark_read | [vault command] { category?, beforeTimestamp } | { marked, unreadCount } | VALIDATION_FAILED | notify.notification.read | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `notify.notification.list_mine` | notify.notification.read_own | [vault query] { status?: unread\|all, category?, cursor?, limit ≤ 50 } | { items: Notification[], nextCursor? } |  |
| `notify.notification.unread_count` | notify.notification.read_own | [vault query] {} | { total, byCategory: { offers, cycles, messages, auctions, bookings, moderation, security } } |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `notify.notification.created` | P2 | { notificationId, category, templateKey, ref?, urgency, collapsed, count, muted } |
| `notify.notification.read` | P2 | { notificationId, category, readAt } |

### Events consumed

| Type | Effect |
|---|---|
| `bazaar.offer.made` | category offers; template notify.tpl.offers.made; recipient the seller; collapse key offerListingId |
| `bazaar.offer.accepted` | category offers; template notify.tpl.offers.accepted; recipient the buyer; collapse key offerId |
| `bazaar.offer.rejected` | category offers; template notify.tpl.offers.rejected; recipient the buyer; collapse key offerId |
| `bazaar.offer.expired` | category offers; template notify.tpl.offers.expired; recipient buyer and seller; collapse key offerId |
| `bazaar.negotiation.countered` | category offers; template notify.tpl.offers.countered; recipient the other party; collapse key negotiationId |
| `commerce.deal.opened` | category offers; template notify.tpl.offers.deal_opened; recipient the counterparty; collapse key dealId |
| `commerce.payment.claimed` | category offers; template notify.tpl.offers.payment_claimed; recipient the payee; collapse key dealId |
| `commerce.payment.acknowledged` | category offers; template notify.tpl.offers.payment_acknowledged; recipient the payer; collapse key dealId |
| `commerce.payment.disputed` | category offers; template notify.tpl.offers.payment_disputed; recipient the other party; collapse key dealId |
| `comms.message.received` | category messages; template notify.tpl.messages.new; recipient the local principal; collapse key threadId; muted true when the thread is muted |
| `mutiny.cycle.proposed` | category cycles; template notify.tpl.cycles.proposed; recipient each participant except the proposer; collapse key cycleId |
| `mutiny.cycle.committed` | category cycles; template notify.tpl.cycles.committed; recipient each participant; collapse key cycleId |
| `mutiny.cycle.declined` | category cycles; template notify.tpl.cycles.declined; recipient each participant except the decliner; collapse key cycleId |
| `mutiny.cycle.participant_dropped` | category cycles; template notify.tpl.cycles.participant_dropped; recipient remaining participants; collapse key cycleId |
| `mutiny.cycle.cancelled` | category cycles; template notify.tpl.cycles.cancelled; recipient each participant; collapse key cycleId |
| `mutiny.cycle.completed` | category cycles; template notify.tpl.cycles.completed; recipient each participant; collapse key cycleId |
| `mutiny.recovery.opened` | category cycles; template notify.tpl.cycles.recovery_opened; recipient each participant; collapse key cycleId |
| `mutiny.proposal.revised` | category cycles; template notify.tpl.cycles.proposal_revised; recipient each other party; collapse key proposalId |
| `auctions.bid.outbid` | category auctions; template notify.tpl.auctions.outbid; recipient the outbid bidder; collapse key auctionId |
| `auctions.auction.won` | category auctions; template notify.tpl.auctions.won; recipient the winner; collapse key auctionId |
| `auctions.auction.unsold` | category auctions; template notify.tpl.auctions.unsold; recipient the seller; collapse key auctionId |
| `auctions.auction.closed` | category auctions; template notify.tpl.auctions.closed; recipient the seller; collapse key auctionId |
| `auctions.result.voided` | category auctions; template notify.tpl.auctions.voided; recipient seller and bidders of the auction; collapse key auctionId |
| `services.quote.issued` | category bookings; template notify.tpl.bookings.quote_issued; recipient the requester; collapse key quoteId |
| `services.quote.accepted` | category bookings; template notify.tpl.bookings.quote_accepted; recipient the provider; collapse key quoteId |
| `services.booking.confirmed` | category bookings; template notify.tpl.bookings.confirmed; recipient both parties; collapse key bookingId |
| `services.booking.cancelled` | category bookings; template notify.tpl.bookings.cancelled; recipient the other party; collapse key bookingId |
| `services.milestone.submitted` | category bookings; template notify.tpl.bookings.milestone_submitted; recipient the client; collapse key bookingId |
| `services.milestone.approved` | category bookings; template notify.tpl.bookings.milestone_approved; recipient the provider; collapse key bookingId |
| `services.dispute.opened` | category bookings; template notify.tpl.bookings.dispute_opened; recipient the other party; collapse key bookingId |
| `rentals.reservation.requested` | category bookings; template notify.tpl.bookings.rental_requested; recipient the owner; collapse key reservationId |
| `rentals.reservation.confirmed` | category bookings; template notify.tpl.bookings.rental_confirmed; recipient the renter; collapse key reservationId |
| `rentals.reservation.cancelled` | category bookings; template notify.tpl.bookings.rental_cancelled; recipient the other party; collapse key reservationId |
| `rentals.rental.overdue` | category bookings; template notify.tpl.bookings.rental_overdue; recipient owner and renter; collapse key rentalId |
| `rentals.damage.claimed` | category bookings; template notify.tpl.bookings.damage_claimed; recipient the renter; collapse key rentalId |
| `comms.meetup.proposed` | category bookings; template notify.tpl.bookings.meetup_proposed; recipient the other parties; collapse key meetupId |
| `comms.meetup.agreed` | category bookings; template notify.tpl.bookings.meetup_agreed; recipient each party; collapse key meetupId |
| `comms.meetup.cancelled` | category bookings; template notify.tpl.bookings.meetup_cancelled; recipient the other parties; collapse key meetupId |
| `comms.meetup.no_show` | category bookings; template notify.tpl.bookings.meetup_no_show_claim; recipient the accused party; collapse key meetupId |
| `moderation.action.applied` | category moderation; template notify.tpl.moderation.action_applied; recipient the affected user; collapse key actionId |
| `moderation.appeal.decided` | category moderation; template notify.tpl.moderation.appeal_decided; recipient the appellant; collapse key appealId |
| `identity.device_key.added` | category security; template notify.tpl.security.device_added; urgency urgent; recipient the local principal; collapse key keyId |
| `identity.device_key.revoked` | category security; template notify.tpl.security.device_revoked; urgency urgent; recipient the local principal; collapse key keyId |
| `identity.session.revoked` | category security; template notify.tpl.security.session_revoked; urgency normal; recipient the local principal; collapse key sessionId |
| `identity.recovery.completed` | category security; template notify.tpl.security.recovery_completed; urgency urgent; recipient the local principal; collapse key recoveryId |
| `identity.recovery.kit_created` | category security; template notify.tpl.security.recovery_kit_created; urgency normal; recipient the local principal; collapse key recoveryKitId |
| `federation.account.moved` | category security; template notify.tpl.security.account_moved; urgency normal; recipient the local principal; collapse key moveId |
| `privacy.export.ready` | category security; template notify.tpl.security.export_ready; urgency normal; recipient the local principal; collapse key exportId |
| `notify.preference.changed` | apply the in-app column to newly routed events and remove unread items of categories now off, except security |

### Module errors

_None._

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
vault event bazaar.offer.made (derived from a verified signed offer statement) -> routing row
notify.notification.create { "sourceEventId": "0192f3b7-0000-7000-8000-000000000001", "category": "offers", "templateKey": "notify.tpl.offers.made", "ref": { "type": "offer", "id": "0192f3a5-1111-7000-8000-000000000001" }, "collapseKey": "listing-0192f3a4" }
-> { "notificationId": "0192f3b7-1111-7000-8000-000000000001", "created": true, "collapsed": false, "count": 1 }
vault command notify.notification.mark_read { "notificationId": "0192f3b7-1111-7000-8000-000000000001", "expectedRevision": 1 }
-> { "notificationId": "0192f3b7-1111-7000-8000-000000000001", "status": "read", "revision": 2 }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-103-09.T04 | contract | PS-103-04.R01, PS-103-04.R02, PS-103-09.R02 | create, mark_read, mark_all_read, list, unread_count execute | outputs and event payloads validate against registry schemas |
| TEST-PS-103-09.T05 | contract | PS-103-04.R03, PS-103-09.R03 | iterate the routing table | every routed type is in modules.yaml emits, has recipient rule and collapse key, urgent only on 3 security templates |
| TEST-PS-103-09.T06 | integration | PS-103-04.R03, PS-103-06.R01 | deliver each event type twice, shuffled | exactly one row per rule, duplicates skipped |
| TEST-PS-103-09.T14 | a11y | PS-103-04.R01 | inbox with screen reader and keyboard | list semantics, unread state in text, mark all read announced, zero serious axe issues |

## Dependencies

Module depends on: F13.S02.M04, F08.S01.M01, F08.S01.M02, F08.S03.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
