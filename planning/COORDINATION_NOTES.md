# Coordination decisions (Stage 3 → 4)

**Status:** APPROVED by the coordinator on 2026-11-04. These cross-module decisions override older module text; module specs are being aligned to them in the review pass.

- **N1** Error codes: define each code once in its owner module; other modules reference it by listing the owner in depends_on. Remove duplicate definitions reported as warnings (keep the definition in the most upstream module).
- **N2** Statement registry: F11.S01.M01 holds the registry envelope type -> required signer role; every module that sends signed statements lists its statement schemas with signer role in commands_queries_events (note or payload) and acts only on records the receiving vault accepted.
- **N3** Completion events commerce.deal.completed, mutiny.cycle.completed, services.booking.completed, rentals.rental.closed carry contextId, completionCid and parties [{did, role}] (cycles also legs). Consumers (reputation F07.S03.M01, notifications, privacy) rely on this.
- **N4** Notification routing (F13.S01.M03): event payloads carry the party DIDs needed to resolve recipients (buyer/seller, participants, outbid bidder, winner, provider/client, owner/renter).
- **N5** Deals: commerce.deal.open is a generic vault command {contextRef{type,id}, contextCid, parties[], obligations[]} with deterministic dealId; context types offer, auction_result, cycle_compensation, service_milestone, rental_deposit, rental_damage, listing_fee; DealPort.open/cancel; payment events carry contextRef; commerce.deal.cancelled releases holds.
- **N6** Privacy duties: every module owning user data registers ExportSectionPort, DeletionPort and RetentionPurgePort, classifies fields (F10.S02.M02), consumes privacy.deletion.completed to pseudonymize evidence, and calls privacy.consent.check for purposes federation_publish, notify_email, notify_push, analytics_share, location_precise.
- **N7** Blocks: modules acting on counterparties call F07.S02.M02 isBlockedEither/filterBlocked and silently drop statements from blocked DIDs.
- **N8** Location: modules publishing location call F06.S02.M01 assertPublicCell (max L2 = geohash 5).
- **N9** Media: F15.S02.M03 owns MediaBlob (content-addressed `blob:sha256-<base64url>`, ≤ 5 MiB, metadata stripped via F10.S02.M03 before storing, relay stores P0 blobs only).
- **N10** Offers (F01.S04.M01): add decisionReason `countered`; bazaar.offer.reject takes optional reason; F01.S04.M02 negotiation treats the offer as round zero; offers are vault commands + signed statements (classrup.bazaar.offer/v1 etc.), never relay-authoritative.
- **N11** Auctions: F07 exposes key-linkage reads (portable identity doc key set, rotation chain, same-owner attestations) usable by the host relay for anti-shill; F01 rejects material listing edits while an auction on it has bids.
- **N12** Read-only switch: the bus returns SECURITY_READ_ONLY_MODE (owned by F16.S03.M03).
- **N13** Consent API (F08.S02.M02): comms.consent.sign/verify; verify statuses valid|stale|revoked|conflicted|missing; subjectType enum bazaar_offer, bazaar_negotiation, mutiny_proposal, mutiny_cycle, services_booking, rentals_reservation, rentals_deposit, comms_meetup; statement keys `consent.<slug>.<subject>.<action>.v1`.
- **N14** Reservations: the single signed reservation statement is classrup.bazaar.reservation/v1 owned by F01.S03.M01 (holder {type, id}, items, absolute expiresAt). F02 cycle locks use it with holder {type: cycle, id}; drop or alias classrup.mutiny.cycle_lock/v1 to it.
- **N15** Listing projection has barterAcceptable boolean; WantSpec has category, minCondition, maxBudget; public projections carry the author's mailbox hint for E2E delivery.
- **N16** FX quotes for barter normalization may be pinned up to 24 h (purpose barter_normalization) and must be shown as "pinned rate agreed by all parties"; cross-currency cycle deadlines are ≤ 24 h or require re-quote and fresh consent.
- **N17** Relay-produced events (auction host, mailbox put) call the relay hook notify.notification.dispatch for content-free push; vaults re-derive local events from verified relay-signed statements.
- **N18** Rate limits: the bus calls RateLimitPort.consume (F12.S03.M03) and the F12.S03.M04 limits check in-process.
- **N19** Spam/risk checks used by F01.S01.M03 publish: F12.S02.M02 exposes in-process vault query moderation.spam.evaluate; F12.S03.M01 exposes moderation.risk.assess.
- **N20** No relay is ever authoritative: any remaining wording implying a central account, global suspension/takedown, platform custody, server-held user secrets, distributed locks or "paid/verified" overclaims is a blocker.
