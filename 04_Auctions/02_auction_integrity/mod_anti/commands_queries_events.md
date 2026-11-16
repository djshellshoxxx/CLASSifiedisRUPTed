# PS-036-04 — Commands, queries and events: Anti-shill controls

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S02.M01 Anti-shill controls](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_integrity/anti` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-036-04.R01** The host relay exposes auctions.shill.check as an internal synchronous command called inside the bid transaction and auctions.shill.score as an asynchronous job command.
- **PS-036-04.R02** Moderators read the review queue through a relay query; the public policy query describes the controls and their limits in words.
- **PS-036-04.R03** The module consumes bid, identity and review events on the host; nothing here runs in participant vaults.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `auctions.shill.check` | auctions.shill.check | [relay internal, called by F04.S01.M02 inside the bid transaction] { auctionId, bidderId } | { verdict: allow \| deny, checkId? } | NOT_FOUND, DEPENDENCY_UNAVAILABLE |  | yes (Idempotency-Key) |
| `auctions.shill.score` | auctions.shill.score | [relay job, triggered by auctions.bid.placed] { auctionId, bidderId, triggerBidSeq } | { score, flagged: boolean, checkId? } | NOT_FOUND, DEPENDENCY_UNAVAILABLE | auctions.shill.suspected | yes (Idempotency-Key) |
| `auctions.shill.allow_pair` | auctions.shill.allow_pair | [relay command by host operator, signed request] { auctionId, bidderId, reason } | { allowListId, expiresAt } | NOT_FOUND, FORBIDDEN, VALIDATION_FAILED |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `auctions.shill.list_for_review` | auctions.shill.read_review | [relay query] { status?: flagged\|under_review, minScore?, cursor?, limit ≤ 50 } | { items: ShillCheck[] ordered by score desc, nextCursor? } |  |
| `auctions.shill.get_policy` | auctions.shill.read_public | { hostRelayId } | { controls: [string], limits: [string], thresholds: { flag: 60, highPriority: 85 }, appealContact } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `auctions.shill.suspected` | P3 | { checkId, auctionId, subjectId, score, reasons[], triggerBidSeq } |

### Events consumed

| Type | Effect |
|---|---|
| `auctions.bid.placed` | enqueue the scoring job for the bidder and trigger bid |
| `auctions.bid.retracted` | enqueue scoring of the retracting bidder |
| `auctions.review.opened` | move the matching flagged check to under_review |
| `auctions.review.closed` | move the matching check to dismissed when no void was decided |
| `auctions.result.voided` | move under_review checks of the auction to confirmed when the reason is shill_bidding or bidder_collusion |
| `identity.device_key.revoked` | drop cached linkage entries that include the key |
| `identity.attestation.added` | refresh the linkage cache for the attested keys |
| `identity.attestation.revoked` | refresh the linkage cache for the attested keys |
| `identity.portable_doc.published` | refresh the cached key set of the document owner |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| AUCTIONS_BIDDER_NOT_ELIGIBLE | 403 | no | bidder cannot bid on this auction; no reason is disclosed |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
bid transaction on host: auctions.shill.check { "auctionId": "0192f400-0002-…", "bidderId": "did:key:z6Mk…" } -> { "verdict": "allow" }
after bid seq 17: auctions.shill.score -> { "score": 70, "flagged": true, "checkId": "0192f420-0001-…" }
event auctions.shill.suspected { "checkId": "0192f420-0001-…", "auctionId": "0192f400-0002-…", "score": 70, "reasons": ["concentration", "probing"] }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-036-09.T05 | unit | PS-036-04.R01, PS-036-02.R02 | alternation, probing, concentration, price pump features at their thresholds | scores add as specified; 59 does not flag, 60 flags, 85 marks high priority |
| TEST-PS-036-09.T06 | contract | PS-036-04.R02, PS-036-04.R03, PS-036-09.R02 | check, score, allow_pair, queries and the event | payloads validate against registry schemas; no check data in bid errors |

## Dependencies

Module depends on: F04.S01.M01, F07.S01.M01, F07.S02.M01, F07.S03.M02, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
