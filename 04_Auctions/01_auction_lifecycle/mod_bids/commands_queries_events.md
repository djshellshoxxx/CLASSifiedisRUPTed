# PS-033-04 — Commands, queries and events: Bidding

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S01.M02 Bidding](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_lifecycle/bids` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-033-04.R01** The bidder vault command auctions.bid.submit signs the bid and sends it to the host; the host relay command auctions.bid.place validates, orders and receipts it; retraction mirrors this pair.
- **PS-033-04.R02** Bid events are host-local events and are derived in participant vaults when the host-signed receipt or result arrives (actor.kind federated); max amounts are never in any event.
- **PS-033-04.R03** Bidding has no offline queue; time and order are decided by the host.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `auctions.bid.submit` | auctions.bid.submit | [vault command plus statement classrup.auctions.bid/v1 signed by bidder, maxAmount encrypted to host key, sent to host] { auctionId, amount, maxAmount?, acceptHostKeyId } | { bidId, status: submitted, receipt?: host-signed bid_receipt, minNextBid } | NOT_FOUND, VALIDATION_FAILED, AUCTIONS_HOST_NOT_ACCEPTED, AUCTIONS_NOT_OPEN, AUCTIONS_BID_TOO_LOW, AUCTIONS_MAX_DECREASE, AUCTIONS_BIDDER_NOT_ELIGIBLE, AUCTIONS_BID_LIMIT, DEPENDENCY_UNAVAILABLE, RATE_LIMITED |  | yes (Idempotency-Key) |
| `auctions.bid.place` | auctions.bid.place | [relay command at the host, authorized by the bidder-signed bid] { bidEnvelope } | { receipt: statement classrup.auctions.bid_receipt/v1 signed by host key {bidCid, seq, hostTime, currentPrice, leaderAlias, reserveMet, currentEndsAt, prevHash, hash}, minNextBid } | VALIDATION_FAILED, AUCTIONS_HOST_NOT_ACCEPTED, AUCTIONS_NOT_OPEN, AUCTIONS_BID_TOO_LOW, AUCTIONS_MAX_DECREASE, AUCTIONS_BIDDER_NOT_ELIGIBLE, AUCTIONS_BID_LIMIT, RATE_LIMITED, DEPENDENCY_UNAVAILABLE | auctions.bid.placed, auctions.bid.outbid | yes (Idempotency-Key) |
| `auctions.bid.retract` | auctions.bid.retract | [vault command plus statement classrup.auctions.bid_retraction/v1 signed by bidder, sent to host; host executes under the lease] { auctionId, bidId, reason } | { receipt: host-signed retraction receipt, newPrice, newLeaderAlias? } | NOT_FOUND, CONFLICT_STATE, AUCTIONS_RETRACT_NOT_ALLOWED, AUCTIONS_NOT_OPEN, DEPENDENCY_UNAVAILABLE | auctions.bid.retracted | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `auctions.bid.list_for_auction` | auctions.bid.read_public | { auctionId, cursor?, limit ≤ 100 } (relay query or vault cache of host-signed ledger) | { items: [{ seq, alias, amount, kind, hostTime, hash }], head: { seq, hash }, nextCursor? } — no bidder keys and no maxima | NOT_FOUND |
| `auctions.bid.list_mine` | auctions.bid.read_own | [vault-local] { status?, cursor?, limit ≤ 50 } | { items: Bid[] with receipts and own maxima, nextCursor? } |  |
| `auctions.bid.verify_ledger` | auctions.bid.read_own | [vault-local] { auctionId } | { ok: boolean, firstBrokenSeq?, receiptsChecked } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `auctions.bid.placed` | P2 | { auctionId, bidId, alias, bidderId, amount, newPrice, seq, leaderChanged, reserveMet, hostTime } |
| `auctions.bid.outbid` | P2 | { auctionId, outbidBidId, outbidderId, newPrice, seq } |
| `auctions.bid.retracted` | P2 | { auctionId, bidId, alias, newPrice, newLeaderAlias?, seq, hostTime } |

### Events consumed

| Type | Effect |
|---|---|
| `auctions.auction.opened` | enable bidding for the auction in the vault view and on the host |
| `auctions.auction.closed` | mark winning bid won and remaining non-retracted bids lost |
| `auctions.auction.cancelled` | mark live bids void |
| `auctions.auction.extended` | update currentEndsAt shown in the bid sheet and in my bids |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| AUCTIONS_HOST_NOT_ACCEPTED | 409 | no | the bid does not carry the bidder's acceptance of this auction's host |
| AUCTIONS_NOT_OPEN | 409 | no | auction is not open at host time (not started, closed or past its end) |
| AUCTIONS_BID_TOO_LOW | 409 | no | amount is below the next minimum bid; params.minNextBid gives it |
| AUCTIONS_MAX_DECREASE | 409 | no | a proxy maximum cannot be lowered |
| AUCTIONS_BIDDER_NOT_ELIGIBLE | 403 | no | bidder cannot bid on this auction; no reason is disclosed |
| AUCTIONS_BID_LIMIT | 409 | no | per-bidder or per-auction bid limit reached |
| AUCTIONS_RETRACT_NOT_ALLOWED | 409 | no | retraction window, count or target rule not satisfied |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
bidder vault: auctions.bid.submit { "auctionId": "0192f400-0002-…", "amount": { "amount": "1050", "currency": "EUR" },
  "maxAmount": { "amount": "3000", "currency": "EUR" }, "acceptHostKeyId": "ed25519:hostkey1" }
host: -> receipt { "bidCid": "sha256-Bc…", "seq": 3, "hostTime": "2026-11-05T12:00:01.204Z", "currentPrice": { "amount": "1050", "currency": "EUR" },
  "leaderAlias": "K3QZ7A", "reserveMet": false, "currentEndsAt": "2026-11-12T10:00:00.000Z", "prevHash": "sha256-Pa…", "hash": "sha256-Hh…" }
later another bidder bids 1100 with max 1500 -> proxy raises this bidder to 1150 (1100 + 50 increment) and the other is outbid at 1100
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-033-09.T06 | integration | PS-033-06.R02, PS-033-04.R02 | 20 bids submitted concurrently from 20 vaults to one auction | seq 1..20 without gaps or duplicates, one winning, lease wait metric recorded |
| TEST-PS-033-09.T08 | contract | PS-033-04.R01, PS-033-04.R03, PS-033-09.R02 | submit, place, retract and queries | statements, events and projections validate against registry schemas; projection has no key and no maximum |
| TEST-PS-033-09.T09 | integration | PS-033-04.R03, PS-033-06.R01 | replay same bid body and replay same nonce with different body | original receipt; IDEMPOTENCY_KEY_REUSED |

## Dependencies

Module depends on: F04.S01.M01, F04.S02.M01, F04.S02.M02, F07.S01.M01, F11.S01.M03, F09.S03.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
