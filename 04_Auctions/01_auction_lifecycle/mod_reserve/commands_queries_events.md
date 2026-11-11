# PS-035-04 — Commands, queries and events: Auction setup and reserve

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S01.M01 Auction setup and reserve](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_lifecycle/reserve` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-035-04.R01** Vault commands create, schedule and cancel the seller's auction; schedule and cancel produce signed statements to the host; the host relay offers accept_hosting, open, apply_cancel, adjust_end and mark_closed as relay commands and answers with host-signed statements that the vault ingests with auctions.auction.receive.
- **PS-035-04.R02** Auction events exist on the host as relay-local events and are derived again in each participant vault when the host-signed statement arrives (actor.kind federated); they never leave a device otherwise.
- **PS-035-04.R03** The module consumes listing events to cancel auctions whose listing becomes unavailable.
- **PS-035-04.R04** Every statement this module sends or accepts is registered with the F11.S01.M01 statement registry with its signer role - classrup.auctions.auction/v1 and classrup.auctions.auction_cancel/v1 by the seller key (sellerId), classrup.auctions.host_acceptance/v1, classrup.auctions.auction_opened/v1 and classrup.auctions.host_cancel/v1 by the host key named in the terms - and vaults act only on records they accepted (N2).
- **PS-035-04.R05** The vault query auctions.auction.edit_lock answers F01.S01.M02 before a material listing edit from the cached host projection, so material edits are refused while the auction has bids (N11).
- **PS-035-04.R06** Host-produced auction events call the relay hook notify.notification.dispatch for a content-free push - opening to the seller, a host cancellation to the seller and bidders - for recipients who set pushOptIn (N17); the hook is provided by the relay runtime.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `auctions.auction.create` | auctions.auction.create | [vault-local] { listingId?, hostRelayId, currency, startPrice, reservePrice?, incrementTable?, startsAt, durationMs } | { auctionId, revision: 1, status: draft, reserveCommitment?, subtypeRef: { slug: auctions, entity: Auction, id: auctionId } } | VALIDATION_FAILED, AUCTIONS_HOST_REQUIRED, AUCTIONS_RESERVE_INVALID, AUCTIONS_SCHEDULE_INVALID, AUCTIONS_INCREMENT_INVALID, AUCTIONS_LISTING_NOT_ELIGIBLE, FEATURE_DISABLED |  | yes (Idempotency-Key) |
| `auctions.auction.schedule` | auctions.auction.schedule | [vault-local plus statement classrup.auctions.auction/v1 terms signed by seller, sent to the host; reserve and salt in an envelope E2E-encrypted to hostKeyId] { auctionId, expectedRevision, listingId? } | { auctionId, revision, termsCid, listingCid, acceptBy, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, AUCTIONS_HOST_REQUIRED, AUCTIONS_LISTING_NOT_ELIGIBLE, VALIDATION_FAILED, PRECONDITION_FAILED, DEPENDENCY_UNAVAILABLE, FEATURE_DISABLED |  | yes (Idempotency-Key) |
| `auctions.auction.accept_hosting` | auctions.auction.host_accept | [relay command, authorized by the seller's signed terms; passes RateLimitPort.consume and the F12.S03.M04 limits check] { termsEnvelope, reserveEnvelope? } | { hostAcceptance: statement classrup.auctions.host_acceptance/v1 signed by host key, hostTime } or { hostCancel: statement classrup.auctions.host_cancel/v1 with reason host_refused } | VALIDATION_FAILED, EXPIRED, AUCTIONS_RESERVE_INVALID, AUCTIONS_SCHEDULE_INVALID, AUCTIONS_INCREMENT_INVALID, AUCTIONS_LISTING_NOT_ELIGIBLE, AUCTIONS_SELLER_LIMIT, FORBIDDEN, RATE_LIMITED | auctions.auction.scheduled, auctions.auction.cancelled | yes (Idempotency-Key) |
| `auctions.auction.open` | auctions.auction.run | [relay command, host timer] { auctionId } | { auctionId, revision, hostTime, opened: statement classrup.auctions.auction_opened/v1 signed by host key } | NOT_FOUND, CONFLICT_STATE | auctions.auction.opened | yes (Idempotency-Key) |
| `auctions.auction.cancel` | auctions.auction.cancel | [vault command; draft - local discard; proposed, scheduled or open - statement classrup.auctions.auction_cancel/v1 signed by seller, sent to the host] { auctionId, expectedRevision, reason } | { auctionId, revision, status: cancelled \| cancel_pending, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, AUCTIONS_HAS_BIDS | auctions.auction.cancelled | yes (Idempotency-Key) |
| `auctions.auction.apply_cancel` | auctions.auction.host_cancel | [relay command, authorized by a seller-signed auction_cancel or by a host moderator signed request with a reason; produces statement classrup.auctions.host_cancel/v1 signed by host key] { auctionId, cancelEnvelope?, moderatorReason? } | { auctionId, revision, hostCancel } or, when bids exist for a seller cancel, AUCTIONS_HAS_BIDS with the host acceptance and auction_opened statements in params | NOT_FOUND, CONFLICT_STATE, AUCTIONS_HAS_BIDS, AUCTIONS_HOST_STATEMENT_INVALID, FORBIDDEN | auctions.auction.cancelled | yes (Idempotency-Key) |
| `auctions.auction.receive` | auctions.auction.receive | [vault-local ingestion of host_acceptance, auction_opened and host_cancel envelopes per CTR-FED-001, or of the reply to an acceptance fetch by termsCid] { envelope, via? } | { auctionId, accepted: boolean, quarantined?: boolean, code?, status } | AUCTIONS_HOST_STATEMENT_INVALID, UNSUPPORTED_SCHEMA_VERSION, NOT_FOUND | auctions.auction.scheduled, auctions.auction.opened, auctions.auction.cancelled | yes (Idempotency-Key) |
| `auctions.auction.adjust_end` | auctions.auction.run | [relay internal, called by F04.S02.M02 inside the bid transaction] { auctionId, newEndsAt, expectedExtensionCount, fenceToken } | { auctionId, currentEndsAt, extensionCount } | NOT_FOUND, CONFLICT_STATE, CONFLICT_REVISION, PRECONDITION_FAILED |  | yes (Idempotency-Key) |
| `auctions.auction.mark_closed` | auctions.auction.run | [relay internal, called by F04.S01.M03 holding the close lease] { auctionId, fenceToken } | { auctionId, revision } | NOT_FOUND, CONFLICT_STATE, PRECONDITION_FAILED |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `auctions.auction.get_public` | auctions.auction.read_public | [vault-local from cached host-signed projection, or relay query] { auctionId } | { auction: public projection without reserve value or bidder identities, softCloseRulesVersion, listingCid, listingEditedAfterBids: boolean, host: {relayId, name, policyUrl}, hostTime } | NOT_FOUND |
| `auctions.auction.list_mine` | auctions.auction.read_own | [vault-local] { status?, cursor?, limit ≤ 50 } | { items: Auction[] including reservePrice for the seller, nextCursor? } |  |
| `auctions.auction.edit_lock` | auctions.auction.read_own | [vault query in the seller vault; also registered as the listing edit-lock port that F01.S01.M02 calls before a material edit] { listingId } | { locked: boolean, bidCount, lastKnownAt, auctionId? } — locked when an auction on the listing is open, cancel_pending or needs_host_check with last known bidCount > 0, or open with a host projection older than 5 minutes |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `auctions.auction.scheduled` | P0 | { auctionId, listingId, listingCid, sellerId, hostRelayId, startsAt, scheduledEndsAt, currency, startPrice, reserveCommitment?, softCloseRulesVersion, termsCid } |
| `auctions.auction.opened` | P0 | { auctionId, sellerId, hostRelayId, openedAt, currentEndsAt, openedCid } |
| `auctions.auction.cancelled` | P0 | { auctionId, sellerId, reason, bidCount, hostCancelCid? } |

### Events consumed

| Type | Effect |
|---|---|
| `bazaar.listing.unpublished` | seller vault - send auction_cancel with reason listing_unavailable for a scheduled auction, or an open auction with zero bids; an auction with bids stays open |
| `bazaar.listing.expired` | same as unpublished |
| `auctions.auction.closed` | move an open, host_silent or needs_host_check auction to closed and store the final projection |
| `privacy.deletion.completed` | replace the erased principal's did in retained Auction evidence with the per-deletion pseudonym, delete drafts and the reserve with its salt, and keep signed envelopes marked unverifiable-after-pseudonymization |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| AUCTIONS_HOST_REQUIRED | 409 | no | no host relay selected, or the host is not accepted; auctions are disabled without a host |
| AUCTIONS_RESERVE_INVALID | 422 | no | reserve is below the start price or does not match its commitment |
| AUCTIONS_SCHEDULE_INVALID | 422 | no | duration outside 1 h to 14 d or start outside the allowed window |
| AUCTIONS_INCREMENT_INVALID | 422 | no | increment table breaks the tier rules |
| AUCTIONS_LISTING_NOT_ELIGIBLE | 409 | no | listing is not published, not an auction listing for this auction, not owned by the seller, changed since listingCid, or already has a live auction |
| AUCTIONS_SELLER_LIMIT | 409 | no | seller reached 20 live auctions on this host, a limit applies, or the host policy refuses the seller |
| AUCTIONS_HAS_BIDS | 409 | no | cancellation is not allowed once a bid exists |
| AUCTIONS_HOST_STATEMENT_INVALID | 422 | no | a host statement's signature, host key or terms binding failed; quarantined |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Statements: classrup.auctions.auction/v1 (terms, signer seller key; payload {auctionId, listingId, listingCid, sellerId, hostRelayId, hostKeyId, currency, startPrice, reserveCommitment?, incrementTable, softCloseRulesVersion, startsAt, scheduledEndsAt, acceptBy, pushOptIn}); a separate reserve envelope {auctionId, reservePrice, reserveSalt} E2E-encrypted to hostKeyId; classrup.auctions.auction_cancel/v1 (seller key) {auctionId, termsCid, reason}; classrup.auctions.host_acceptance/v1 (host key) {termsCid, softCloseRulesVersion, hostTime}; classrup.auctions.auction_opened/v1 (host key) {auctionId, termsCid, openedAt, currentEndsAt}; classrup.auctions.host_cancel/v1 (host key) {auctionId, termsCid, reason: host_refused | host_policy | seller | listing_unavailable | accept_window_passed, bidCount, hostTime}. Execution sites: create, schedule, cancel, receive and the queries run in the seller vault; accept_hosting, open, apply_cancel, adjust_end and mark_closed run on the host relay.

### Example

```
seller vault: auctions.auction.create { "hostRelayId": "relay.example.org", "currency": "EUR",
  "startPrice": { "amount": "1000", "currency": "EUR" }, "reservePrice": { "amount": "5000", "currency": "EUR" },
  "startsAt": "2026-11-05T10:00:00.000Z", "durationMs": 604800000 } -> { "auctionId": "0192f400-0002-…", "status": "draft", "subtypeRef": { "slug": "auctions", "entity": "Auction", "id": "0192f400-0002-…" } }
F01: bazaar.listing.create { "kind": "auction", "subtypeRef": { … } } then bazaar.listing.publish -> listing 0192f400-0001-… published
auctions.auction.schedule { "auctionId": "0192f400-0002-…", "expectedRevision": 1, "listingId": "0192f400-0001-…" }
  -> terms signed with listingCid sha256-Lc…, acceptBy 2026-11-05T10:05:00.000Z, softCloseRulesVersion softclose-v1; reserve envelope encrypted to ed25519:hostkey1
host replies host_acceptance (cid sha256-Ha…) -> auctions.auction.receive -> status scheduled
host timer at 2026-11-05T10:00:00Z -> auction_opened (cid sha256-Op…) -> vault derives auctions.auction.opened
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-035-09.T06 | contract | PS-035-04.R01, PS-035-04.R02, PS-035-09.R02, PS-035-01.R04 | each command, statement, event and public projection | payloads and signatures validate; terms carry listingCid, acceptBy and softCloseRulesVersion softclose-v1 and host_acceptance echoes the version; the reserve travels only in the envelope encrypted to hostKeyId; projection and events contain no reserve value |
| TEST-PS-035-09.T07 | integration | PS-035-04.R03 | listing unpublished with and without bids | scheduled or zero-bid auction cancelled through a verified host_cancel; auction with bids stays open |
| TEST-PS-035-09.T20 | integration | PS-035-04.R05 | F01.S01.M02 asks edit_lock for a listing whose auction has 0 and then 1 bid; material and non-material edits | unlocked at 0 bids; locked at 1 bid so F01 refuses the material edit; the non-material edit is recorded in listingCidHistory and shown on the page |
| TEST-PS-035-09.T21 | contract | PS-035-04.R04, PS-035-05.R04 | F11.S01.M01 registry entries for the five statements; host statement signed by another key | roleFor returns seller key or host key as declared; wrong key quarantined with AUCTIONS_HOST_STATEMENT_INVALID |
| TEST-PS-035-09.T23 | integration | PS-035-04.R06 | host opens and later cancels an auction by host policy | notify.notification.dispatch called once per opted-in recipient with a template key and reference only |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M03, F09.S03.M01, F11.S01.M01, F11.S01.M03, F07.S01.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F12.S03.M03, F12.S03.M04, F13.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-FED-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
