# F04.S01.M02 — Bidding

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F04.S01](../SPEC.md). **Process IDs:** PS-033-01…PS-033-10. **Code:** `packages/auctions/src/auction_lifecycle/bids`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Bidders place bids on an open auction through the auction's host relay. A bid is signed by the bidder (including an explicit acceptance of that host for that auction) and carries a visible amount and an optional proxy maximum encrypted to the host. The host serializes all bids of an auction under a per-auction lease, assigns a strictly increasing sequence number and its own time, applies English ascending and proxy rules against the bid increment table, and returns a host-signed bid receipt that links to the previous entry by hash. Bidders keep their receipts as evidence. The host is trusted for order and time and is named in the UI; the module never claims the order is verifiable beyond the receipt chain the bidders hold.

## Responsibilities

- Own the Bid record - on the host as the authoritative ledger entry, in the bidder vault as the bidder's copy of the signed bid and receipt.
- Validate each bid in a fixed order - host acceptance, signature, auction state and host time, minimum bid, eligibility from F04.S02.M01, rate limits - and apply proxy resolution deterministically.
- Maintain a hash-chained bid ledger per auction (hash of seq, alias, amount, kind, host time and previous hash) and return host-signed receipts so bidders can detect omission or reordering.
- Apply retraction rules - more than 12 h before the current end, at most 1 retraction per bidder per auction, only of the bidder's current leading bid - and recompute the leader and price.

## Not responsible for

- Auction terms, hosting acceptance and opening (F04.S01.M01) and closing and winner determination (F04.S01.M03).
- Soft-close extension decisions (F04.S02.M02) and shill scoring (F04.S02.M01); this module only calls them inside the bid transaction.
- Payment, delivery and disputes (F09).
- Distributed bidding across multiple hosts; one auction has exactly one host.
- Future: sealed maxima using threshold encryption so the host cannot read proxy maxima, and bid bots disclosure.

## User stories

- As a bidder, I see the host and its trust panel, accept the host for this auction, and place a bid at or above the next minimum.
- As a bidder, I set a maximum and the host bids for me in increments only as far as needed, and I see my receipt for every bid.
- As a bidder, I retract my leading bid more than 12 hours before the end, once per auction, and see the price fall to the next bidder's level.
- As any viewer, I see the bid history by auction-specific alias with host times, not by account keys.

## Edge cases

- Two bidders submit the same amount within the same millisecond; the host lease orders them by arrival at the lease, the first gets the lead and the second is recorded outbid at the tied amount.
- A bid arrives at host time exactly equal to currentEndsAt; it is refused (the end is exclusive) with AUCTIONS_NOT_OPEN.
- Bidder's network drops after sending; the receipt is lost; on reconnect the bidder fetches the receipt by bid cid and the UI shows submitted until the receipt is held.
- Bidder raises their max while leading; allowed, price unchanged; lowering a max is refused with AUCTIONS_MAX_DECREASE.
- Bid amount is below the minimum because a faster bid arrived; refused with AUCTIONS_BID_TOO_LOW and params.minNextBid so the UI offers the new minimum.
- Seller or a linked key tries to bid; the answer is the generic AUCTIONS_BIDDER_NOT_ELIGIBLE with no linkage detail.
- Retraction is requested 11 h 59 min before the end by host time; refused with AUCTIONS_RETRACT_NOT_ALLOWED.
- Host relay becomes unreachable; bidding is disabled with a clear message (no offline queue, because order and time are decided by the host).
- Proxy resolution reaches a currency exponent boundary (JPY); increments are whole yen and proxy prices never fall between minor units.

## UX and accessibility

- Bid sheet: next minimum bid, bid amount field, optional maximum, host acceptance checkbox naming the host and its power, Place bid button with the exact amount.
- Bid history: alias, amount, host time, kind (bid, proxy raise, retraction), and the user's own receipts with verify chain action.
- My bids: status per auction (leading, outbid, retracted, won, lost) and receipt fingerprints.

**States:** loading; host-unreachable; not-open; eligible; submitting; leading; outbid; rejected; retracted; won; lost

**Accessibility:** Bid amount and maximum fields have visible labels with currency and inputmode=decimal; the next minimum is in the label text.; Bid outcome (leading, outbid, rejected with reason) is announced through an aria-live assertive region once per submission.; Place bid and Retract buttons are at least 44x44 px with accessible names including the amount and the auction title.

## Owned data

- `Bid` (classrup.auctions.bid/v1, P3, RET-EVIDENCE)

## Interfaces

- Commands: `auctions.bid.submit`, `auctions.bid.place`, `auctions.bid.retract`
- Queries: `auctions.bid.list_for_auction`, `auctions.bid.list_mine`, `auctions.bid.verify_ledger`
- Emits: `auctions.bid.placed`, `auctions.bid.outbid`, `auctions.bid.retracted`
- Consumes: `auctions.auction.opened`, `auctions.auction.closed`, `auctions.auction.cancelled`, `auctions.auction.extended`

## Dependencies

F04.S01.M01, F04.S02.M01, F04.S02.M02, F07.S01.M01, F11.S01.M03, F09.S03.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-FED-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-033-01 | [Domain schema](domain_schema.md) | 3 |
| PS-033-02 | [Validation rules](validation_rules.md) | 3 |
| PS-033-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-033-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-033-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-033-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-033-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-033-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-033-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-033-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/auctions/src/auction_lifecycle/bids/index.ts`.

## Acceptance criteria

- All tests T01–T16 pass in CI.
- The proxy algorithm matches the reference model on 100 000 random sequences and ledger replay reproduces every price.
- No proxy maximum or bidder key is visible to any party other than the bidder and the host.
