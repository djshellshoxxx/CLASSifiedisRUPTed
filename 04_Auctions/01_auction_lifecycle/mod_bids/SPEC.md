# F04.S01.M02 — Bidding

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F04.S01](../SPEC.md). **Process IDs:** PS-033-01…PS-033-10. **Code:** `packages/auctions/src/auction_lifecycle/bids`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Bidders place bids on an open auction through the auction's host relay. A bid is signed by the bidder (including an explicit acceptance of that host for that auction and a validity window that ends at most 60 s after the bidder's createdAt claim) and carries a visible amount and an optional proxy maximum; the maximum, the bidder key and the nonce travel only inside an envelope end-to-end encrypted to the host key. The host serializes all bids of an auction under a per-auction lease, assigns a strictly increasing sequence number and its own time, applies English ascending bidding and the numbered proxy rules proxy-v1 against the bid increment table, and returns a host-signed bid receipt that links to the previous ledger entry by hash. Outbid bidders receive a host-signed bid_outbid statement. Bidders keep their receipts as evidence; receipts show omission or reordering of the holder's own bids and nothing more. The host is trusted for order and time and is named in the UI.

## Responsibilities

- Own the Bid record - on the host as the authoritative ledger entry, in the bidder vault as the bidder's copy of the signed bid and receipts.
- Validate each bid after the idempotency lookup in a fixed order - schema, signature, host acceptance, validity window, auction state and host time, minimum or max-only rule, eligibility and revoked keys from F04.S02.M01, rate limits through RateLimitPort - and apply proxy rules proxy-v1 deterministically.
- Maintain a hash-chained bid ledger per auction (hash of seq, auction id, bid cid, alias, kind, amount, host time and previous hash) and return host-signed receipts so bidders can detect omission or reordering of their own bids.
- Apply retraction rules - more than 12 h before the current end, at most 1 retraction per bidder per auction, only of the bidder's current leading bid - executed on the host by auctions.bid.apply_retraction with a host-signed retraction receipt, and recompute the leader and price.
- Deliver host-signed bid_outbid statements to outbid bidders and call the relay notification hook for content-free pushes.

## Not responsible for

- Auction terms, hosting acceptance and opening (F04.S01.M01) and closing and winner determination (F04.S01.M03).
- Soft-close extension decisions (F04.S02.M02) and shill scoring and linkage (F04.S02.M01); this module only calls them inside the bid transaction.
- Payment, delivery and disputes (F09).
- Distributed bidding across multiple hosts; one auction has exactly one host.
- Future: sealed maxima using threshold encryption so the host cannot read proxy maxima, and bid bots disclosure.

## User stories

- As a bidder, I see the host and its trust panel, accept the host for this auction, and place a bid at or above the next minimum.
- As a bidder, I set a maximum and the host bids for me in increments only as far as needed, and I see my receipt for every bid.
- As a bidder, I retract my leading bid more than 12 hours before the end, once per auction, and see the price fall to the next bidder's level.
- As any viewer, I see the bid history by auction-specific alias with host times, not by account keys.
- As an outbid bidder, I get a host-signed outbid notice in my vault and a content-free push if I opted in.

## Edge cases

- Two bidders submit the same maximum within the same millisecond; the lease orders them, the bidder who held that maximum first keeps the lead at a price equal to the tied maximum (PX2), and the other is recorded outbid; two equal visible amounts without maxima - the second is refused with AUCTIONS_BID_TOO_LOW and params.minNextBid.
- A bid arrives at host time exactly equal to currentEndsAt; it is refused (the end is exclusive) with AUCTIONS_NOT_OPEN.
- Bidder's network drops after sending; the receipt is lost; on reconnect the bidder fetches the receipt by bid cid and the UI shows submitted until the receipt is held; with no receipt by notAfter plus 45 s and a final fetch the bid shows not placed, and the host refuses it after notAfter anyway.
- Leader raises their maximum while leading with a max-only update (kind proxy, amount absent); it is exempt from the minimum (V04), appends no visible ledger entry unless it triggers the reserve rule PX4, and lowering a maximum is refused with AUCTIONS_MAX_DECREASE.
- Bid amount is below the minimum because a faster bid arrived; refused with AUCTIONS_BID_TOO_LOW and params.minNextBid so the UI offers the new minimum.
- Seller or a linked key tries to bid; the answer is the generic AUCTIONS_BIDDER_NOT_ELIGIBLE (owned by F04.S02.M01) with no linkage detail.
- Retraction is requested 11 h 59 min before the end by host time; refused with AUCTIONS_RETRACT_NOT_ALLOWED.
- Host relay becomes unreachable; bidding is disabled with a clear message (no offline queue, because order and time are decided by the host).
- Proxy resolution reaches a currency exponent boundary (JPY); increments are whole yen and proxy prices never fall between minor units.
- A bid is delayed in transport or held back by the host and arrives after its signed notAfter; the host refuses it with EXPIRED, and a receipt whose hostTime is after notAfter is rejected by the vault as host misbehaviour evidence.
- A key the host knows is revoked (a device revocation statement or the identity document it holds) signs a bid; refused with the generic AUCTIONS_BIDDER_NOT_ELIGIBLE.
- The leader of an auction whose reserve was not met is shown lost at close, never won; won comes only from auctions.auction.won naming this bidder.
- The host stops answering; with no result or cancel by scheduledEndsAt plus 60 minutes plus 72 h the bidder's live bids show host did not report a result, and a later valid result still applies.
- The bidder has blocked the seller (or holds the seller's block); the bidder vault refuses to sign the bid with BLOCKED_PARTY and sends nothing.

## UX and accessibility

- Bid sheet: next minimum bid, bid amount field, optional maximum, host acceptance checkbox naming the host and its power - the host sees your key and maximum, orders bids and decides time; receipts show only omission or reordering of your own bids; if the winner does not pay, the host may disclose your key to the seller as one of up to 3 second-chance candidates - and a Place bid button with the exact amount.
- Bid history: alias, amount, host time, kind (bid, proxy raise, retraction), and the user's own receipts with a Check against my receipts action whose result reads consistent with your receipts, never verified.
- My bids: status per auction (leading, outbid, retracted, won, lost, not placed, host did not report) and receipt fingerprints.

**States:** loading; host-unreachable; not-open; eligible; submitting; leading; outbid; rejected; not-placed; retracted; won; lost; void; host-silent

**Accessibility:** Bid amount and maximum fields have visible labels with currency and inputmode=decimal; the next minimum is in the label text.; Bid outcome (leading, outbid, rejected with reason) is announced through an aria-live assertive region once per submission.; Place bid and Retract buttons are at least 44x44 px with accessible names including the amount and the auction title.

## Owned data

- `Bid` (classrup.auctions.bid/v1, P2, RET-EVIDENCE)

## Interfaces

- Commands: `auctions.bid.submit`, `auctions.bid.place`, `auctions.bid.retract`, `auctions.bid.apply_retraction`, `auctions.bid.receive`
- Queries: `auctions.bid.list_for_auction`, `auctions.bid.list_mine`, `auctions.bid.verify_ledger`
- Emits: `auctions.bid.placed`, `auctions.bid.outbid`, `auctions.bid.retracted`
- Consumes: `auctions.auction.opened`, `auctions.auction.closed`, `auctions.auction.won`, `auctions.auction.cancelled`, `auctions.auction.extended`, `auctions.result.voided`, `privacy.deletion.completed`

## Dependencies

F04.S01.M01, F04.S02.M01, F04.S02.M02, F07.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F09.S03.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F12.S03.M03, F13.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-FED-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-033-01 | [Domain schema](domain_schema.md) | 4 |
| PS-033-02 | [Validation rules](validation_rules.md) | 4 |
| PS-033-03 | [Workflow state machine](workflow_state_machine.md) | 4 |
| PS-033-04 | [Commands, queries and events](commands_queries_events.md) | 5 |
| PS-033-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-033-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 4 |
| PS-033-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-033-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-033-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-033-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/auctions/src/auction_lifecycle/bids/index.ts`.

## Acceptance criteria

- All tests T01–T25 pass in CI.
- The proxy algorithm matches the proxy-v1 reference model on 100 000 random sequences and ledger replay reproduces every price.
- No proxy maximum or bidder key is visible to any party other than the bidder and the host, and both reach the host only encrypted to its key.
- No bid is shown as won unless auctions.auction.won names its bidder, and no bid stays submitted past notAfter plus 45 s.
