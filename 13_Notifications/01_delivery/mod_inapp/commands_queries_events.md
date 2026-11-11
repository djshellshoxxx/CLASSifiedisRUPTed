# PS-103-04 — Commands, queries and events: In-app notifications

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S01.M03 In-app notifications](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/delivery/inapp` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-103-04.R01** Creation is a vault-internal command invoked by the routing consumers, which also hand every routing decision to NotificationDispatchPort.route (declared here, implemented by F13.S02.M01) whether or not an inbox row is created; mark-read and mark-all-read are vault commands; list and unread-count are vault queries.
- **PS-103-04.R02** Creation and read emit their events in the same IndexedDB transaction as the row change (CTR-EVT-001 EVT-8).
- **PS-103-04.R03** The routing table below lists every routed event with category, template, recipient rule over producer payload fields, filters and collapse key, and every listed event exists in the module catalog emits.
- **PS-103-04.R04** The routing table includes the N3 completion events commerce.deal.completed, mutiny.cycle.completed, services.booking.completed and rentals.rental.closed, bazaar.offer.withdrawn for the seller, and the vault-local notify.email.bounced as a security notice.
- **PS-103-04.R05** The module registers ExportSectionPort (section notify.notifications), DeletionPort (purge step) and RetentionPurgePort (kind notify.notification) with F10 (N6), classifies every field with F10.S02.M02, drops events from blocked DIDs silently through F07.S02.M02 (N7), and keeps its flood budgets in RateLimitPort of F12.S03.M03 in vault-local mode (N18).
- **PS-103-04.R06** Recipient rules read only the party DID fields that producers carry (N4) - participantIds and remainingParticipantIds for cycles and recovery, proposerId and counterpartyId for two-party proposals, clientId and providerId for quotes, bookings, milestones and disputes, ownerId, renterId and cancelledBy for rentals, sellerId, winnerId, candidateId and parties[] for auctions, and partyDids[] for meetups - and a host-local auction event reaches its parties only through the host relay hook notify.notification.dispatch (N17), never through an inbox row outside the vault.
- **PS-103-04.R07** Each auction outcome is announced once per recipient - a sale by auctions.auction.won to the seller (notify.tpl.auctions.sold) and to the winner (notify.tpl.auctions.won), no sale by auctions.auction.unsold to the seller - so auctions.auction.closed never creates a second row for an outcome that has its own announcement event.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `notify.notification.create` | notify.notification.create | [vault internal command called by the routing consumers] { sourceEventId, payloadHash, category, templateKey, ref?, collapseKey?, urgency?, muted?, actorDid?, arrival, raisedOnThisDevice } | { notificationId?, created: boolean, collapsed: boolean, count?, skipped?: not_recipient\|blocked\|duplicate\|expired\|filtered\|category_off\|flood_collapsed } | VALIDATION_FAILED, IDEMPOTENCY_KEY_REUSED, ID_TIMESTAMP_SKEW | notify.notification.created | yes (Idempotency-Key) |
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
| `notify.notification.created` | P2 | { notificationId, category, templateKey, ref?, collapseKey?, urgency, collapsed, count, muted, arrival } |
| `notify.notification.read` | P2 | { notificationId, category, collapseKey?, readAt } |

### Events consumed

| Type | Effect |
|---|---|
| `bazaar.offer.made` | category offers; template notify.tpl.offers.made; recipient sellerId; actor buyerId; ref offer offerId; collapse key listingId |
| `bazaar.offer.accepted` | category offers; template notify.tpl.offers.accepted; recipient buyerId; ref offer offerId; collapse key offerId |
| `bazaar.offer.rejected` | category offers; template notify.tpl.offers.rejected; recipient buyerId; ref offer offerId; collapse key offerId |
| `bazaar.offer.expired` | category offers; template notify.tpl.offers.expired; recipient buyerId and sellerId; ref offer offerId; collapse key offerId |
| `bazaar.offer.withdrawn` | category offers; template notify.tpl.offers.withdrawn; recipient sellerId; filter reason buyer_withdrew; ref offer offerId; collapse key offerId |
| `bazaar.negotiation.countered` | category offers; template notify.tpl.offers.countered; recipient recipientId; actor proposerId; ref negotiation negotiationId; collapse key negotiationId |
| `commerce.deal.opened` | category offers; template notify.tpl.offers.deal_opened; recipient each did in parties[] except the actor; ref deal dealId; collapse key dealId |
| `commerce.payment.claimed` | category offers; template notify.tpl.offers.payment_claimed; recipient payeeId; actor payerId; ref deal dealId; collapse key dealId |
| `commerce.payment.acknowledged` | category offers; template notify.tpl.offers.payment_acknowledged; recipient payerId; actor payeeId; ref deal dealId; collapse key dealId |
| `commerce.payment.disputed` | category offers; template notify.tpl.offers.payment_disputed; recipient whichever of payerId and payeeId is not the actor; ref deal dealId; collapse key dealId |
| `commerce.deal.completed` | category offers; template notify.tpl.offers.deal_completed; recipient each did in parties[] except the actor; ref deal dealId; collapse key contextId |
| `comms.message.received` | category messages; template notify.tpl.messages.new; recipient the local principal (mailbox owner); actor senderDid; ref thread threadId; collapse key threadId; muted true when the F08.S01.M02 thread query reports the thread muted |
| `mutiny.cycle.proposed` | category cycles; template notify.tpl.cycles.proposed; recipient each did in parties[] except coordinatorId; ref cycle cycleId; collapse key cycleId |
| `mutiny.cycle.committed` | category cycles; template notify.tpl.cycles.committed; recipient each did in parties[]; ref cycle cycleId; collapse key cycleId |
| `mutiny.cycle.declined` | category cycles; template notify.tpl.cycles.declined; recipient each of participantIds except participantId (the decliner); ref cycle cycleId; collapse key cycleId |
| `mutiny.cycle.participant_dropped` | category cycles; template notify.tpl.cycles.participant_dropped; recipient each of remainingParticipantIds; ref cycle cycleId; collapse key cycleId |
| `mutiny.cycle.cancelled` | category cycles; template notify.tpl.cycles.cancelled; recipient each of participantIds; ref cycle cycleId; collapse key cycleId |
| `mutiny.cycle.completed` | category cycles; template notify.tpl.cycles.completed; recipient each of participantIds except the actor (the same DIDs as parties[], N3); ref cycle cycleId; collapse key contextId |
| `mutiny.recovery.opened` | category cycles; template notify.tpl.cycles.recovery_opened; recipient each of participantIds except the actor; ref cycle cycleId; collapse key cycleId |
| `mutiny.recovery.resolved` | category cycles; template notify.tpl.cycles.recovery_resolved; recipient each of participantIds except the actor; ref cycle cycleId; collapse key recoveryCaseId |
| `mutiny.proposal.revised` | category cycles; template notify.tpl.cycles.proposal_revised; recipient each did in parties[] except authorId; ref type from subjectType with id subjectId; collapse key subjectId |
| `mutiny.proposal.rejected` | category cycles; template notify.tpl.cycles.proposal_rejected; recipient whichever of proposerId and counterpartyId is not rejectedBy; actor rejectedBy; ref proposal proposalId; collapse key proposalId |
| `mutiny.proposal.withdrawn` | category cycles; template notify.tpl.cycles.proposal_withdrawn; recipient whichever of proposerId and counterpartyId is not withdrawnBy; actor withdrawnBy; ref proposal proposalId; collapse key proposalId |
| `mutiny.proposal.expired` | category cycles; template notify.tpl.cycles.proposal_expired; recipient proposerId and counterpartyId (no actor, timer event); ref proposal proposalId; collapse key proposalId |
| `auctions.bid.outbid` | category auctions; template notify.tpl.auctions.outbid; recipient outbidderId; ref auction auctionId; collapse key auctionId |
| `auctions.auction.won` | category auctions; recipient sellerId with template notify.tpl.auctions.sold and winnerId with template notify.tpl.auctions.won; winnerId is present only in the seller, winner and host copies, so a non-party vault's copy (winnerAlias only) is skipped with outcome not_recipient; ref auction auctionId; collapse key auctionId |
| `auctions.auction.unsold` | category auctions; template notify.tpl.auctions.unsold; recipient sellerId; ref auction auctionId; collapse key auctionId |
| `auctions.auction.closed` | category auctions; template notify.tpl.auctions.closed; recipient sellerId; filter outcome is neither won nor unsold (a sale is announced once by auctions.auction.won to seller and winner, no sale once by auctions.auction.unsold), so in v1, whose outcomes are won and unsold, every closed event is skipped with outcome filtered and only additive future outcomes create a row; ref auction auctionId; collapse key auctionId |
| `auctions.result.voided` | category auctions; template notify.tpl.auctions.voided; vault-derived event from receive_void - recipient the local principal, its only entry in parties[]; host-local event - recipients are every did in parties[], reached only through the host relay hook notify.notification.dispatch with hookSource auction_host (N17) and never as an inbox row on the relay; ref auction auctionId; collapse key auctionId |
| `auctions.result.second_chance_offered` | category auctions; template notify.tpl.auctions.second_chance; recipient candidateId; actor sellerId; ref auction auctionId; collapse key resultId |
| `auctions.result.non_payment` | category auctions; template notify.tpl.auctions.non_payment; recipient winnerId; actor sellerId (the seller's own vault-local copy is skipped as own action); ref auction auctionId; collapse key resultId |
| `services.quote.issued` | category bookings; template notify.tpl.bookings.quote_issued; recipient clientId; actor providerId; ref quote quoteId; collapse key quoteId |
| `services.quote.accepted` | category bookings; template notify.tpl.bookings.quote_accepted; recipient providerId; actor clientId; ref quote quoteId; collapse key quoteId |
| `services.quote.declined` | category bookings; template notify.tpl.bookings.quote_declined; recipient whichever of clientId and providerId is not declinedBy; actor declinedBy; filter reason client_declined, provider_request, request_cancelled or offering_withdrawn (superseded is announced by the superseding services.quote.issued and blocked is never announced, N7); ref quote quoteId when present; collapse key requestId |
| `services.quote.expired` | category bookings; template notify.tpl.bookings.quote_expired; recipient clientId and providerId (no actor, timer event); ref quote quoteId; collapse key quoteId |
| `services.booking.confirmed` | category bookings; template notify.tpl.bookings.confirmed; recipient clientId and providerId except the actor; ref booking bookingId; collapse key bookingId |
| `services.booking.cancelled` | category bookings; template notify.tpl.bookings.cancelled; recipient whichever of clientId and providerId is not cancelledBy; ref booking bookingId; collapse key bookingId |
| `services.booking.completed` | category bookings; template notify.tpl.bookings.completed; recipient each did in parties[] except the actor; ref booking bookingId; collapse key contextId |
| `services.milestone.submitted` | category bookings; template notify.tpl.bookings.milestone_submitted; recipient clientId; actor providerId; ref booking bookingId; collapse key bookingId |
| `services.milestone.approved` | category bookings; template notify.tpl.bookings.milestone_approved; recipient providerId; actor clientId; ref booking bookingId; collapse key bookingId |
| `services.milestone.changes_requested` | category bookings; template notify.tpl.bookings.milestone_changes_requested; recipient providerId; actor clientId; ref booking bookingId; collapse key bookingId |
| `services.dispute.opened` | category bookings; template notify.tpl.bookings.dispute_opened; recipient counterpartyId; actor openerId; ref booking bookingId; collapse key bookingId |
| `services.dispute.closed` | category bookings; template notify.tpl.bookings.dispute_closed; recipient both parties, clientId and providerId, except the actor (the opener's own withdrawal is skipped as own action); ref booking bookingId; collapse key linkId |
| `rentals.reservation.requested` | category bookings; template notify.tpl.bookings.rental_requested; recipient ownerId; actor renterId; ref rental reservationId; collapse key reservationId |
| `rentals.reservation.confirmed` | category bookings; template notify.tpl.bookings.rental_confirmed; recipient renterId; actor ownerId; ref rental reservationId; collapse key reservationId |
| `rentals.reservation.cancelled` | category bookings; template notify.tpl.bookings.rental_cancelled; recipient whichever of ownerId and renterId is not cancelledBy (a DID); ref rental reservationId; collapse key reservationId |
| `rentals.rental.overdue` | category bookings; template notify.tpl.bookings.rental_overdue; recipient ownerId and renterId (no actor, timer event); ref rental reservationId; collapse key reservationId |
| `rentals.damage.claimed` | category bookings; template notify.tpl.bookings.damage_claimed; recipient renterId; actor ownerId; ref rental reservationId; collapse key reservationId |
| `rentals.rental.closed` | category bookings; template notify.tpl.bookings.rental_closed; recipient whichever of ownerId and renterId is not the actor (the same DIDs as parties[], N3); ref rental reservationId; collapse key contextId |
| `comms.meetup.proposed` | category bookings; template notify.tpl.bookings.meetup_proposed; recipient each did in partyDids[] except proposerDid; ref meetup meetupId; collapse key meetupId |
| `comms.meetup.agreed` | category bookings; template notify.tpl.bookings.meetup_agreed; recipient each did in partyDids[] except the actor; ref meetup meetupId; collapse key meetupId |
| `comms.meetup.cancelled` | category bookings; template notify.tpl.bookings.meetup_cancelled; recipient each did in partyDids[] except cancelledByDid; ref meetup meetupId; collapse key meetupId |
| `comms.meetup.no_show` | category bookings; template notify.tpl.bookings.meetup_no_show_claim; recipient targetDid; actor reportedByDid; ref meetup meetupId; collapse key meetupId |
| `moderation.action.applied` | category moderation; template notify.tpl.moderation.action_applied; recipient the local principal on the vault copy derived from the verified statement (origin vault only); ref case caseId; collapse key actionId |
| `moderation.appeal.decided` | category moderation; template notify.tpl.moderation.appeal_decided; recipient the local principal on the vault copy derived from the verified decision; ref appeal appealId; collapse key appealId |
| `identity.device_key.added` | category security; template notify.tpl.security.device_added; urgency urgent; recipient the local principal (did); skipped only when raised by a command on this device; collapse key deviceKeyId |
| `identity.device_key.revoked` | category security; template notify.tpl.security.device_revoked; urgency urgent; recipient the local principal (did); skipped only when raised on this device; collapse key deviceKeyId |
| `identity.session.revoked` | category security; template notify.tpl.security.session_revoked; urgency normal; recipient the local principal (did); filter reason in user_revoked, device_revoked, recovery, passphrase_changed and user_revoked only when raised on another device; locked, idle, absolute, rotated, limit and erased are skipped; collapse key sessionId |
| `identity.recovery.completed` | category security; template notify.tpl.security.recovery_completed; urgency urgent; recipient the local principal (did); collapse key kitId |
| `identity.recovery.kit_created` | category security; template notify.tpl.security.recovery_kit_created; urgency normal; recipient the local principal (did); skipped only when raised on this device; collapse key kitId |
| `federation.account.moved` | category security; template notify.tpl.security.account_moved; urgency normal; filter kind account and subject equal to the local principal DID (moves of other principals and relay moves are skipped); collapse key moveCid |
| `privacy.export.ready` | category security; template notify.tpl.security.export_ready; urgency normal; recipient the local principal; ref export jobId; collapse key jobId |
| `notify.email.bounced` | vault-local event only (origin vault); category security; template notify.tpl.security.email_stopped; urgency normal; recipient the local principal; collapse key emailAddressId |
| `notify.preference.changed` | apply the in-app column to newly routed events and remove unread items of categories now off, except security |
| `identity.block.added` | hide unread rows whose actor is blockedDid and stop further rows from it (N7); rows are not shown again if the block is removed |
| `privacy.deletion.completed` | notification only; confirm that the DeletionPort purge step removed every row and the known-actor index; nothing is signed |

### Module errors

_None._

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Execution site (ADR-0016): vault only, including the service worker when a push wakes the vault. Ports. NotificationDispatchPort.route(decision) is declared here and implemented by F13.S02.M01 at vault composition (no depends_on edge, so no cycle); decision = {sourceEventId, notificationId?, category, templateKey, ref?, collapseKey?, urgency, muted, arrival, collapsed, actorClass}. It is called after the row transaction commits, for every event that was not skipped as not_recipient, blocked, duplicate, expired or filtered, including events whose category is off in-app. Recipient rules read only the producer payload fields named below (N4), and the actor is the envelope actor or statement author; producers are not listed in depends_on because only their events are consumed. Arrival comes from provenance: mailbox for statements fetched from a relay mailbox, direct for file or QR exchange, local for commands on this device. Flood budgets: 50 rows per actor DID per day and, for actors not in the known-actor index, 20 rows per category per day, after which events collapse into one row notify.tpl.<category>.new_members with count. Privacy ports (N6): ExportSectionPort section notify.notifications with schema classrup.notify.notification/v1; DeletionPort plan {willDelete: all rows and the known-actor index, willPseudonymize: none, blockers: none} and step purge; RetentionPurgePort kind notify.notification, class RET-SHORT, anchorField createdAt. Every field is classified with F10.S02.M02.

### Example

```
vault event bazaar.offer.made (derived from a verified signed offer statement fetched from a mailbox) -> isBlockedEither(buyerId, local) false -> routing row
notify.notification.create { "sourceEventId": "0192f3b7-0000-7000-8000-000000000001", "payloadHash": "sha256-…", "category": "offers", "templateKey": "notify.tpl.offers.made", "ref": { "type": "offer", "id": "0192f3a5-1111-7000-8000-000000000001" }, "collapseKey": "0192f3a4-2222-7000-8000-000000000001", "actorDid": "did:key:z6MkBuyer…", "arrival": "mailbox", "raisedOnThisDevice": false }
-> { "notificationId": "0192f3b7-1111-7000-8000-000000000001", "created": true, "collapsed": false, "count": 1 }
-> NotificationDispatchPort.route({ …, "arrival": "mailbox", "collapsed": false, "muted": false })
same event delivered again -> { "created": false, "collapsed": false, "skipped": "duplicate" }   (acknowledged, no retry)
vault command notify.notification.mark_read { "notificationId": "0192f3b7-1111-7000-8000-000000000001", "expectedRevision": 1 }
-> { "notificationId": "0192f3b7-1111-7000-8000-000000000001", "status": "read", "revision": 2 }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-103-09.T04 | contract | PS-103-04.R01, PS-103-04.R02, PS-103-09.R03 | create, mark_read, mark_all_read, list, unread_count execute | outputs and event payloads validate against registry schemas; created carries collapseKey; the dispatch port receives one decision per non-skipped event, also for in-app off |
| TEST-PS-103-09.T05 | contract | PS-103-04.R03, PS-103-04.R04, PS-103-09.R02 | iterate the routing table against modules.yaml and the schema registry | every routed type is in the catalog emits; every recipient, ref, collapse and filter field exists in the producer payload; completion, offer withdrawal and email_stopped rows present; filters present for identity.session.revoked reasons, federation.account.moved kind and subject, auctions.auction.closed outcome, bazaar.offer.withdrawn reason and services.quote.declined reason; urgent only on 3 security templates |
| TEST-PS-103-09.T09 | integration | PS-103-02.R02, PS-103-04.R01 | muted thread message; category with in-app off; security category with an in-app disable attempt | muted flag set and the decision carries muted; no row for the off category but a decision reaches the dispatch port; security row always created |
| TEST-PS-103-09.T17 | integration | PS-103-04.R05 | DeletionPort plan and purge, export section and retention purge with F10 registry doubles; block added for an actor with unread rows | purge removes rows and the known-actor index; section notify.notifications exported; rows purged after 30 days; blocked actor's unread rows hidden |
| TEST-PS-103-09.T18 | unit | PS-103-04.R04, PS-103-04.R07, PS-103-02.R01 | auctions.auction.unsold followed by auctions.auction.closed with outcome unsold; auctions.auction.won and auctions.auction.closed with outcome won in the seller, winner and a non-party vault; commerce.deal.completed; notify.email.bounced (origin vault) | exactly one unsold row for the seller; one sold row for the seller and one won row for the winner, none in the non-party vault and no closed row; deal completion row for the other party; email_stopped security row |
| TEST-PS-103-09.T19 | contract | PS-103-04.R06, PS-103-02.R01 | route every cycle, recovery, proposal, quote, booking, milestone, dispute, rental, auction and meetup event in the vaults of each party and of a non-party, with an own-action copy for each actor field; deliver a host-local auctions.result.voided to the relay instance | each party gets exactly one row resolved from the documented DID fields (participantIds, remainingParticipantIds, proposerId, counterpartyId, clientId, providerId, ownerId, renterId, cancelledBy, sellerId, winnerId, candidateId, parties[], partyDids[]); the actor and the non-party get none; quote.declined with reason superseded or blocked creates none; the host-local void creates no inbox row and its parties are reached only through the dispatch hook |

## Dependencies

Module depends on: F13.S02.M04, F07.S02.M02, F08.S01.M02, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
