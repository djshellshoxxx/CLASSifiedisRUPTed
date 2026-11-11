# PS-036-04 — Commands, queries and events: Anti-shill controls

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S02.M01 Anti-shill controls](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_integrity/anti` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-036-04.R01** The host relay exposes auctions.shill.check as an internal synchronous command called inside the bid transaction and auctions.shill.score as an asynchronous job command.
- **PS-036-04.R02** Moderators read the review queue through a relay query; the public policy query describes the controls and their limits in words.
- **PS-036-04.R03** The module consumes host-local bid and result events, identity events and review events on the host; nothing here runs in participant vaults.
- **PS-036-04.R04** auctions.shill.check also answers whether the bidder key is revoked as known to the host, so the bid path rejects revoked keys with the same generic error (F04.S01.M02 V07).

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `auctions.shill.check` | auctions.shill.check | [relay internal, called by F04.S01.M02 inside the bid transaction] { auctionId, bidderId } | { verdict: allow \| deny, checkId?, flags?: [linkage_stale] } | NOT_FOUND, DEPENDENCY_UNAVAILABLE |  | yes (Idempotency-Key) |
| `auctions.shill.score` | auctions.shill.score | [relay job, triggered by auctions.bid.placed or auctions.bid.retracted] { auctionId, bidderId, triggerBidSeq } | { score, flagged: boolean, checkId?, scoringVersion: shill-v1 } | NOT_FOUND, DEPENDENCY_UNAVAILABLE | auctions.shill.suspected | yes (Idempotency-Key) |
| `auctions.shill.allow_pair` | auctions.shill.allow_pair | [relay command by host operator, signed request] { auctionId, bidderId, coveredReasons: [linked_host_registration \| linked_attestation], reason } | { allowListId, expiresAt } | NOT_FOUND, FORBIDDEN, VALIDATION_FAILED |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `auctions.shill.list_for_review` | auctions.shill.read_review | [relay query] { status?: flagged\|under_review, reason?: linkage_stale, minScore?, cursor?, limit ≤ 50 } | { items: ShillCheck[] ordered by score desc, nextCursor? } |  |
| `auctions.shill.get_policy` | auctions.shill.read_public | { hostRelayId } | { controls: [string], limits: [string], scoringVersion: shill-v1, thresholds: { flag: 60, highPriority: 85 }, appealContact } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `auctions.shill.suspected` | P3 | { checkId, auctionId, subjectId, score, reasons[], triggerBidSeq, scoringVersion } — host-local only; never emitted for linkage_stale flags |

### Events consumed

| Type | Effect |
|---|---|
| `auctions.bid.placed` | append alias, bidderId, kind, amount, newPrice, seq and leaderChanged to the scoring projection and enqueue the scoring job for the bidder and trigger bid |
| `auctions.bid.outbid` | append the outbid entry to the scoring projection (price_pump, probing) |
| `auctions.bid.retracted` | append the retraction and enqueue scoring of the retracting bidder |
| `auctions.auction.closed` | close the auction in the scoring projection |
| `auctions.auction.won` | record the winner key for never_wins and price_pump |
| `auctions.auction.scheduled` | record the scheduling time used by the revocation rule (01.R04) |
| `auctions.review.opened` | move each flagged check listed in triggers to under_review, on open and on merge |
| `auctions.review.closed` | move checks listed in confirmedCheckIds to confirmed and the other checks of the review to dismissed |
| `identity.attestation.added` | refresh the linkage cache for the attested keys when the attestation is of kind same_owner and signed by both keys |
| `identity.attestation.revoked` | mark the attestation revoked with its time and keep the link per 01.R04 |
| `identity.portable_doc.published` | refresh the owner's key set and rotation chain, keep keys that left the document as revoked links per 01.R04, and ingest the classrup.identity.device_revocation/v1 statements the document references |
| `privacy.deletion.completed` | host relay, when the relay applies the deletion - replace the erased principal's did in retained ShillChecks with the per-deletion pseudonym |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| AUCTIONS_BIDDER_NOT_ELIGIBLE | 403 | no | bidder cannot bid on this auction; no reason is disclosed |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
bid transaction on host: auctions.shill.check { "auctionId": "0192f400-0002-…", "bidderId": "did:key:z6Mk…" } -> { "verdict": "allow" }
after bid seq 17: auctions.shill.score -> concentration 0.9 (35) + probing 5 bids (30) = 65 -> { "score": 65, "flagged": true, "checkId": "0192f420-0001-…", "scoringVersion": "shill-v1" }
event auctions.shill.suspected { "checkId": "0192f420-0001-…", "auctionId": "0192f400-0002-…", "score": 65, "reasons": ["concentration", "probing"], "scoringVersion": "shill-v1" }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-036-09.T05 | unit | PS-036-04.R01, PS-036-02.R02 | shill-v1 totals - alternation only; concentration 0.6 plus alternation plus new_key; damped concentration 0.9 plus damped price_pump plus probing 5; concentration 0.9 plus probing 5 plus price_pump; every feature at its maximum | 25 no flag; 60 flag; 17 + 12 + 30 = 59 no flag; 35 + 30 + 25 = 90 flag at high priority; 135 capped at 99 |
| TEST-PS-036-09.T06 | contract | PS-036-04.R02, PS-036-04.R03, PS-036-09.R02 | check, score, allow_pair, queries and the event | payloads validate against registry schemas; no check data in bid errors; no event for linkage_stale flags |
| TEST-PS-036-09.T20 | integration | PS-036-04.R04 | bid with a key revoked by a device revocation statement the host holds | check returns deny with internal reason revoked_key; the bidder sees AUCTIONS_BIDDER_NOT_ELIGIBLE; never DEPENDENCY_UNAVAILABLE |

## Dependencies

Module depends on: F04.S01.M01, F07.S01.M01, F07.S01.M02, F07.S02.M01, F07.S03.M02, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
