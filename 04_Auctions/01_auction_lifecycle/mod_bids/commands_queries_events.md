# PS-033-04 — Commands, queries and events: Bidding

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S01.M02 Bidding](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_lifecycle/bids` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-033-04.R01** The bidder vault command auctions.bid.submit signs the bid and sends it to the host; the host relay command auctions.bid.place validates, orders and receipts it; retraction mirrors this pair with auctions.bid.retract and auctions.bid.apply_retraction.
- **PS-033-04.R02** Bid events are host-local events and are derived in participant vaults only from host-signed statements - bid_receipt, retraction_receipt and bid_outbid - ingested with auctions.bid.receive (actor.kind federated); max amounts are never in any event.
- **PS-033-04.R03** Bidding has no offline queue; time and order are decided by the host.
- **PS-033-04.R04** Statements are registered with F11.S01.M01 with their signer roles - classrup.auctions.bid/v1 and classrup.auctions.bid_retraction/v1 by the bidder key (bidderId), classrup.auctions.bid_receipt/v1, classrup.auctions.retraction_receipt/v1 and classrup.auctions.bid_outbid/v1 by the host key named in the terms - and vaults act only on records they accepted (N2).
- **PS-033-04.R05** The host delivers bid_outbid to the outbid bidder's mailbox so its vault can derive auctions.bid.outbid, and calls the relay hook notify.notification.dispatch for a content-free push to that bidder when it set pushOptIn (N17).
- **PS-033-04.R06** The host delivers a seller copy of the bid_receipt of each accepted bid with a visible amount to the seller's mailbox - the first at once, later ones coalesced to the newest at most once per 60 s - and the seller vault derives auctions.bid.placed from each verified copy with listingId, sellerId, seq and bidCount and without bidderId or bidId, so the seller vault's listing edit lock (F04.S01.M01 for F01.S01.M02) knows that bids exist (N11, N17).
- **PS-033-04.R07** Bid intake - auctions.bid.place and auctions.bid.apply_retraction - returns with the host-signed receipt a classrup.platform.relay_receipt/v1 from F15.S02.M01 ReceiptPort.issue with destination '<relayId>/auction/<auctionId>', digest over the exact request bytes and no cid; the bidder vault verifies it against the host relay's published key set and records it as transport acknowledged only, because only the host-signed bid_receipt shows the bid placed.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `auctions.bid.submit` | auctions.bid.submit | [vault command plus statement classrup.auctions.bid/v1 signed by bidder; bidderId, maxAmount and clientNonce E2E-encrypted to the host key; sent to host] { auctionId, amount?, maxAmount?, acceptHostKeyId } | { bidId, status: submitted, notAfter, receipt?: host-signed bid_receipt, relayReceipt?: classrup.platform.relay_receipt/v1, minNextBid } | NOT_FOUND, VALIDATION_FAILED, EXPIRED, IDEMPOTENCY_KEY_REUSED, CONFLICT_STATE, BLOCKED_PARTY, AUCTIONS_HOST_NOT_ACCEPTED, AUCTIONS_NOT_OPEN, AUCTIONS_BID_TOO_LOW, AUCTIONS_MAX_DECREASE, AUCTIONS_BIDDER_NOT_ELIGIBLE, AUCTIONS_BID_LIMIT, MODERATION_ACCOUNT_LIMIT_REACHED, AUCTIONS_RECEIPT_INVALID, DEPENDENCY_UNAVAILABLE, RATE_LIMITED | auctions.bid.placed, auctions.bid.outbid | yes (Idempotency-Key) |
| `auctions.bid.place` | auctions.bid.place | [relay command at the host, authorized by the bidder-signed bid; idempotency lookup by (bidder, auction, clientNonce) first; passes RateLimitPort.consume and the F12.S03.M04 moderation.accountlimit.check for bids_per_day in-process (N18)] { bidEnvelope } | { receipt: statement classrup.auctions.bid_receipt/v1 signed by host key, relayReceipt: classrup.platform.relay_receipt/v1 from F15.S02.M01 ReceiptPort.issue (returned again on an idempotent replay), minNextBid } | VALIDATION_FAILED, EXPIRED, IDEMPOTENCY_KEY_REUSED, CONFLICT_STATE, AUCTIONS_HOST_NOT_ACCEPTED, AUCTIONS_NOT_OPEN, AUCTIONS_BID_TOO_LOW, AUCTIONS_MAX_DECREASE, AUCTIONS_BIDDER_NOT_ELIGIBLE, AUCTIONS_BID_LIMIT, MODERATION_ACCOUNT_LIMIT_REACHED, RATE_LIMITED, DEPENDENCY_UNAVAILABLE | auctions.bid.placed, auctions.bid.outbid | yes (Idempotency-Key) |
| `auctions.bid.retract` | auctions.bid.retract | [vault command plus statement classrup.auctions.bid_retraction/v1 signed by bidder, sent to host] { auctionId, bidId, reason } | { retractionCid, syncState, receipt?: host-signed retraction_receipt } | NOT_FOUND, CONFLICT_STATE, AUCTIONS_RETRACT_NOT_ALLOWED, AUCTIONS_NOT_OPEN, AUCTIONS_RECEIPT_INVALID, DEPENDENCY_UNAVAILABLE | auctions.bid.retracted | yes (Idempotency-Key) |
| `auctions.bid.apply_retraction` | auctions.bid.apply_retraction | [relay command at the host, authorized by the bidder-signed retraction; runs under the auction lease] { retractionEnvelope } | { receipt: statement classrup.auctions.retraction_receipt/v1 signed by host key, relayReceipt: classrup.platform.relay_receipt/v1 from F15.S02.M01 ReceiptPort.issue } | VALIDATION_FAILED, NOT_FOUND, CONFLICT_STATE, EXPIRED, IDEMPOTENCY_KEY_REUSED, AUCTIONS_RETRACT_NOT_ALLOWED, AUCTIONS_NOT_OPEN | auctions.bid.retracted | yes (Idempotency-Key) |
| `auctions.bid.receive` | auctions.bid.receive | [vault-local ingestion per CTR-FED-001 of bid_receipt, retraction_receipt and bid_outbid envelopes in the bidder vault, and of seller copies of bid_receipt in the seller vault; a seller copy with a seq at or below the last held one is stored as history without an event] { envelope, via? } | { bidId?, accepted: boolean, quarantined?: boolean, code?, status? } | AUCTIONS_RECEIPT_INVALID, UNSUPPORTED_SCHEMA_VERSION, NOT_FOUND | auctions.bid.placed, auctions.bid.outbid, auctions.bid.retracted | yes (Idempotency-Key) |
| `auctions.bid.freeze_activity` | auctions.bid.freeze | [relay internal; this module's AuctionHostPort.freezeActivityIn(lostWindow) implementation, registered with the relay process and called by F15.S03.M03 after a restore before the port opens; F04.S01.M03 registers the second implementation, F15.S03.M03 calls each with the same lostWindow and counts an auction frozen by both once] { lostWindow: { from, to } } | { frozenAuctionIds: uuidv7[] } — every hosted scheduled or open auction whose startsAt to currentEndsAt overlaps lostWindow, frozen through F04.S01.M01 auctions.auction.freeze with cause bids_possibly_lost | DEPENDENCY_UNAVAILABLE |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `auctions.bid.list_for_auction` | auctions.bid.read_public | { auctionId, cursor?, limit ≤ 100 } (relay query or vault cache of host-signed ledger) | { items: [{ seq, alias, amount, kind, hostTime, bidCid, hash }], head: { seq, hash, hostSig }, nextCursor? } — no bidder keys and no maxima | NOT_FOUND |
| `auctions.bid.list_mine` | auctions.bid.read_own | [vault-local] { status?, cursor?, limit ≤ 50 } | { items: Bid[] with receipts and own maxima, nextCursor? } |  |
| `auctions.bid.verify_ledger` | auctions.bid.read_own | [vault-local] { auctionId } | { consistentWithReceipts: boolean, firstBrokenSeq?, receiptsChecked, scope: own_receipts_only } — shown as consistent with your receipts, never verified | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `auctions.bid.placed` | P2 | { auctionId, listingId, sellerId, bidId?, bidCid, alias, bidderId?, kind, amount, newPrice, seq, bidCount, leaderChanged, reserveMet, hostTime } — host-local with every field; derived in the bidder's own vault from its receipt with bidderId the local principal and bidId; derived in the seller's vault from a verified seller copy of the receipt (N17) without bidderId and bidId; listingId comes from the verified terms |
| `auctions.bid.outbid` | P2 | { auctionId, outbidBidId, outbidderId, newPrice, seq } — host-local; derived in the outbid bidder's vault from the host-signed bid_outbid, with outbidderId the local principal |
| `auctions.bid.retracted` | P2 | { auctionId, bidId, bidderId, alias, newPrice, newLeaderAlias?, seq, hostTime } — host-local; derived in the retracting bidder's vault from the retraction receipt |

### Events consumed

| Type | Effect |
|---|---|
| `auctions.auction.opened` | enable bidding for the auction in the vault view and on the host |
| `auctions.auction.closed` | with outcome unsold, winning and outbid bids become lost; with outcome won, bids not named by auctions.auction.won become lost; submitted bids without a receipt become lost |
| `auctions.auction.won` | the bid matching winnerAlias (non-party vaults), winnerId (winner vault) or the bidder key (host) becomes won from submitted, winning, outbid or host_silent |
| `auctions.auction.cancelled` | mark live bids void |
| `auctions.auction.extended` | update currentEndsAt shown in the bid sheet and in my bids |
| `auctions.auction.frozen` | bidder vault - show the live bids of the auction as frozen after host restore and, when a held relay receipt lies inside lostWindow, as possibly lost by the host; host - nothing more, bids are refused because the auction is not open (V03) |
| `auctions.result.voided` | won bids become void; the sale record stays with F04.S01.M03 and F09 |
| `privacy.deletion.completed` | replace the erased principal's did in retained bids and receipts with the per-deletion pseudonym, delete own maxima and nonces of closed auctions, and keep signed envelopes marked unverifiable-after-pseudonymization |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| AUCTIONS_HOST_NOT_ACCEPTED | 409 | no | the bid does not carry the bidder's acceptance of this auction's host |
| AUCTIONS_NOT_OPEN | 409 | no | auction is not open at host time (not started, frozen after a host restore, closed or past its end) |
| AUCTIONS_BID_TOO_LOW | 409 | no | amount is below the next minimum bid; params.minNextBid gives it |
| AUCTIONS_MAX_DECREASE | 409 | no | a proxy maximum cannot be lowered |
| AUCTIONS_BID_LIMIT | 409 | no | per-bidder or per-auction bid limit reached |
| AUCTIONS_RETRACT_NOT_ALLOWED | 409 | no | retraction window, count or target rule not satisfied |
| AUCTIONS_RECEIPT_INVALID | 422 | no | a host receipt or outbid statement failed the signature, host key, binding or notAfter check; quarantined as evidence |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Statements: classrup.auctions.bid/v1 (bidder key) {auctionId, termsCid, kind, amount?, hostAck, createdAtClaim, notAfter, mailboxHint, pushOptIn} with {bidderId, maxAmount?, clientNonce} inside the part E2E-encrypted to hostKeyId; classrup.auctions.bid_receipt/v1 (host key) {auctionId, termsCid, bidCid, alias, kind, amount?, seq?, hostTime, currentPrice, leaderAlias, reserveMet, bidCount, currentEndsAt, prevHash?, hash?, head {seq, hash}, extension?: classrup.auctions.extension/v1 envelope}, E2E to the bidder and, as a seller copy of the same signed statement, E2E to the seller's mailbox named in the pinned listing projection (N15); classrup.auctions.bid_retraction/v1 (bidder key) {auctionId, bidCid, reason, notAfter}; classrup.auctions.retraction_receipt/v1 (host key) {auctionId, retractionCid, retractedBidCid, seq, hostTime, newPrice, newLeaderAlias?, head}; classrup.auctions.bid_outbid/v1 (host key, E2E to the outbid bidder) {auctionId, termsCid, outbidBidCid, newPrice, seq, headHash, currentEndsAt}. Bid intake responses also carry classrup.platform.relay_receipt/v1 (relay key, F15.S02.M01 ReceiptPort.issue), which is evidence of byte receipt by the host relay only.

### Example

```
fixture increments: [{ fromMinor 1000, incrementMinor 50 }, { fromMinor 5000, incrementMinor 100 }], start 1000, reserve 5000 (EUR)
bidder vault B1: auctions.bid.submit { "auctionId": "0192f400-0002-…", "amount": { "amount": "1050", "currency": "EUR" },
  "maxAmount": { "amount": "3000", "currency": "EUR" }, "acceptHostKeyId": "ed25519:hostkey1" } -> notAfter = createdAtClaim + 60 s
host: -> receipt { "bidCid": "sha256-Bc…", "seq": 3, "hostTime": "2026-11-05T12:00:01.204Z", "currentPrice": { "amount": "1050", "currency": "EUR" },
  "leaderAlias": "K3QZ7A", "reserveMet": false, "currentEndsAt": "2026-11-12T10:00:00.000Z", "prevHash": "sha256-Pa…", "hash": "sha256-Hh…" }
later B2 bids 1100 with max 1500 -> PX3 price = max(1050, min(3000, 1500 + 50)) = 1550; ledger seq 4 = B2 at 1100, seq 5 = auto entry for K3QZ7A at 1550;
  B2 is outbid and receives a host-signed bid_outbid; the host calls notify.notification.dispatch for B2 when B2 set pushOptIn
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-033-09.T06 | integration | PS-033-06.R02, PS-033-04.R02 | 20 bids submitted concurrently from 20 vaults to one auction | seq 1..20 without gaps or duplicates, one winning, lease wait metric recorded |
| TEST-PS-033-09.T08 | contract | PS-033-04.R01, PS-033-04.R02, PS-033-09.R02 | submit, place, retract, apply_retraction, receive and queries | statements, events and projections validate against registry schemas; projection has no key and no maximum; a receipt of an extending bid carries the extension envelope |
| TEST-PS-033-09.T16 | e2e | PS-033-01.R02, PS-033-04.R03 | mobile bidder accepts host, bids with max, is outbid by proxy, retracts a leading bid on another auction, goes offline | UI statuses correct; trust panel states key visibility to the host, receipt limits and possible second-chance key disclosure; offline shows bidding disabled with no queue; axe zero serious issues |
| TEST-PS-033-09.T21 | contract | PS-033-04.R04 | F11.S01.M01 registry entries for the five statements; receipt signed by a key other than the host key in the terms | roles resolve as declared; quarantined with AUCTIONS_RECEIPT_INVALID |
| TEST-PS-033-09.T22 | integration | PS-033-04.R05, PS-033-04.R02 | B1 is outbid by B2's proxy | the host delivers bid_outbid to B1's mailbox and calls notify.notification.dispatch once with a template key only; B1's vault derives auctions.bid.outbid with actor.kind federated |
| TEST-PS-033-09.T27 | integration | PS-033-04.R06, PS-033-04.R02 | first bid and 30 more bids within 60 s on auction A; one seller copy replayed and one delivered out of order | the seller vault gets one copy at once and coalesced copies at most once per 60 s; it derives auctions.bid.placed with listingId, sellerId, seq and bidCount, without bidderId or bidId, actor.kind federated; the out-of-order copy is stored as history without an event; edit_lock answers locked |
| TEST-PS-033-09.T28 | contract | PS-033-04.R07 | place and apply_retraction responses; a replayed bid; a tampered relay receipt | each carries classrup.platform.relay_receipt/v1 with destination '<relayId>/auction/<auctionId>', digest over the request bytes and no cid; the replay returns the same relay receipt; the tampered one is rejected by the vault and the bid stays submitted until the host-signed receipt arrives |

## Dependencies

Module depends on: F04.S01.M01, F04.S02.M01, F04.S02.M02, F07.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F09.S03.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F12.S03.M03, F12.S03.M04, F13.S02.M01, F15.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
