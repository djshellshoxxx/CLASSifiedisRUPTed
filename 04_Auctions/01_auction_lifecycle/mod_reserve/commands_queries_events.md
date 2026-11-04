# PS-035-04 — Commands, queries and events: Auction setup and reserve

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S01.M01 Auction setup and reserve](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_lifecycle/reserve` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-035-04.R01** Vault commands create, schedule and cancel the seller's auction; schedule and cancel produce signed statements to the host; the host relay offers accept_hosting, open, adjust_end and mark_closed as relay commands.
- **PS-035-04.R02** Auction events exist on the host as relay-local events and are derived again in each participant vault when the host-signed statement arrives (actor.kind federated); they never leave a device otherwise.
- **PS-035-04.R03** The module consumes listing events to cancel auctions whose listing becomes unavailable.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `auctions.auction.create` | auctions.auction.create | [vault-local] { listingId, hostRelayId, currency, startPrice, reservePrice?, incrementTable?, startsAt, durationMs } | { auctionId, revision: 1, status: draft, reserveCommitment? } | VALIDATION_FAILED, AUCTIONS_HOST_REQUIRED, AUCTIONS_RESERVE_INVALID, AUCTIONS_SCHEDULE_INVALID, AUCTIONS_INCREMENT_INVALID, AUCTIONS_LISTING_NOT_ELIGIBLE, FEATURE_DISABLED |  | yes (Idempotency-Key) |
| `auctions.auction.schedule` | auctions.auction.schedule | [vault-local plus statement classrup.auctions.auction/v1 terms signed by seller, sent to the host; reserve encrypted to the host key] { auctionId, expectedRevision } | { auctionId, revision, termsCid, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, AUCTIONS_HOST_REQUIRED, DEPENDENCY_UNAVAILABLE, FEATURE_DISABLED |  | yes (Idempotency-Key) |
| `auctions.auction.accept_hosting` | auctions.auction.host_accept | [relay command, authorized by the seller's signed terms] { termsEnvelope } | { hostAcceptance: statement classrup.auctions.host_acceptance/v1 signed by host key, hostTime } | VALIDATION_FAILED, AUCTIONS_RESERVE_INVALID, AUCTIONS_SCHEDULE_INVALID, AUCTIONS_INCREMENT_INVALID, AUCTIONS_LISTING_NOT_ELIGIBLE, AUCTIONS_SELLER_LIMIT, FORBIDDEN, RATE_LIMITED | auctions.auction.scheduled | yes (Idempotency-Key) |
| `auctions.auction.open` | auctions.auction.run | [relay command, host timer] { auctionId } | { auctionId, revision, hostTime } | NOT_FOUND, CONFLICT_STATE | auctions.auction.opened | yes (Idempotency-Key) |
| `auctions.auction.cancel` | auctions.auction.cancel | [statement classrup.auctions.auction_cancel/v1 signed by seller, or relay command by host moderator with reason] { auctionId, expectedRevision, reason } | { auctionId, revision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, AUCTIONS_HAS_BIDS, FORBIDDEN | auctions.auction.cancelled | yes (Idempotency-Key) |
| `auctions.auction.adjust_end` | auctions.auction.run | [relay internal, called by F04.S02.M02 inside the bid transaction] { auctionId, newEndsAt, expectedExtensionCount } | { auctionId, currentEndsAt, extensionCount } | NOT_FOUND, CONFLICT_STATE, CONFLICT_REVISION |  | yes (Idempotency-Key) |
| `auctions.auction.mark_closed` | auctions.auction.run | [relay internal, called by F04.S01.M03 holding the close lease] { auctionId, leaseToken } | { auctionId, revision } | NOT_FOUND, CONFLICT_STATE, PRECONDITION_FAILED |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `auctions.auction.get_public` | auctions.auction.read_public | [vault-local from cached host-signed projection, or relay query] { auctionId } | { auction: public projection without reserve value or bidder identities, host: {relayId, name, policyUrl}, hostTime } | NOT_FOUND |
| `auctions.auction.list_mine` | auctions.auction.read_own | [vault-local] { status?, cursor?, limit ≤ 50 } | { items: Auction[] including reservePrice for the seller, nextCursor? } |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `auctions.auction.scheduled` | P0 | { auctionId, listingId, sellerId, hostRelayId, startsAt, scheduledEndsAt, currency, startPrice, reserveCommitment?, termsCid } |
| `auctions.auction.opened` | P0 | { auctionId, hostRelayId, openedAt, currentEndsAt } |
| `auctions.auction.cancelled` | P0 | { auctionId, reason, bidCount } |

### Events consumed

| Type | Effect |
|---|---|
| `bazaar.listing.unpublished` | cancel a scheduled auction, or an open auction with zero bids, with reason listing_unavailable; an auction with bids stays open |
| `bazaar.listing.expired` | same as unpublished |
| `auctions.auction.closed` | set status closed and store final projection after the close lease releases |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| AUCTIONS_HOST_REQUIRED | 409 | no | no host relay selected, or the host is not accepted; auctions are disabled without a host |
| AUCTIONS_RESERVE_INVALID | 422 | no | reserve is below the start price or does not match its commitment |
| AUCTIONS_SCHEDULE_INVALID | 422 | no | duration outside 1 h to 14 d or start outside the allowed window |
| AUCTIONS_INCREMENT_INVALID | 422 | no | increment table breaks the tier rules |
| AUCTIONS_LISTING_NOT_ELIGIBLE | 409 | no | listing is not published, not an auction listing, not owned by the seller, or already has a live auction |
| AUCTIONS_SELLER_LIMIT | 409 | no | seller reached 20 live auctions on this host or the host policy refuses the seller |
| AUCTIONS_HAS_BIDS | 409 | no | cancellation is not allowed once a bid exists |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
seller vault: auctions.auction.create { "listingId": "0192f400-0001-…", "hostRelayId": "relay.example.org", "currency": "EUR",
  "startPrice": { "amount": "1000", "currency": "EUR" }, "reservePrice": { "amount": "5000", "currency": "EUR" },
  "startsAt": "2026-11-05T10:00:00.000Z", "durationMs": 604800000 } -> { "auctionId": "0192f400-0002-…", "status": "draft" }
auctions.auction.schedule -> terms statement signed and sent; host replies host_acceptance (cid sha256-Ha…) -> status scheduled
host timer at 2026-11-05T10:00:00Z -> auctions.auction.opened
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-035-09.T06 | contract | PS-035-04.R01, PS-035-04.R02, PS-035-09.R02 | each command, statement, event and public projection | payloads and signatures validate; projection and events contain no reserve value |
| TEST-PS-035-09.T07 | integration | PS-035-04.R03 | listing unpublished with and without bids | scheduled or zero-bid auction cancelled; auction with bids stays open |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M03, F09.S03.M01, F11.S01.M03, F07.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-FED-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
