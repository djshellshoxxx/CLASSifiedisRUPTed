# PS-037-04 — Commands, queries and events: Auction fraud review

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S02.M03 Auction fraud review](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_integrity/fraud` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-037-04.R01** Reviews are host relay commands authorized by host moderator roles; vaults only ingest the signed void statement.
- **PS-037-04.R02** Decisions are atomic with their events, statements and the call into F04.S01.M03 or F04.S01.M01 on the host.
- **PS-037-04.R03** Reviews are opened by consumed events or manually; no participant can open or read a review.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `auctions.review.open` | auctions.review.open | [relay command, moderator signed request or system trigger] { auctionId, trigger: { kind, ref }, priority? } | { reviewId, revision, status: opened, merged: boolean } | NOT_FOUND, FORBIDDEN, AUCTIONS_REVIEW_DUPLICATE, VALIDATION_FAILED | auctions.review.opened | yes (Idempotency-Key) |
| `auctions.review.assign` | auctions.review.decide | [relay command] { reviewId, expectedRevision } | { reviewId, revision, evidenceSnapshotId } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, FORBIDDEN |  | yes (Idempotency-Key) |
| `auctions.review.dismiss` | auctions.review.decide | [relay command] { reviewId, expectedRevision, findings } | { reviewId, revision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, FORBIDDEN, VALIDATION_FAILED | auctions.review.closed | yes (Idempotency-Key) |
| `auctions.review.cancel_auction` | auctions.review.decide | [relay command, calls F04.S01.M01 cancel with reason host_policy] { reviewId, expectedRevision, findings } | { reviewId, revision, auctionStatus } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, FORBIDDEN, VALIDATION_FAILED |  | yes (Idempotency-Key) |
| `auctions.review.propose_void` | auctions.review.decide | [relay command] { reviewId, expectedRevision, voidReason, findings } | { reviewId, revision, expiresAt } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, FORBIDDEN, VALIDATION_FAILED, AUCTIONS_RESULT_NOT_VOIDABLE |  | yes (Idempotency-Key) |
| `auctions.review.confirm_void` | auctions.review.confirm | [relay command by a second moderator; produces statement classrup.auctions.void/v1 signed by the host key] { reviewId, expectedRevision, confirm: boolean } | { reviewId, revision, voidCid } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, FORBIDDEN, AUCTIONS_RESULT_NOT_VOIDABLE | auctions.result.voided, auctions.review.closed | yes (Idempotency-Key) |
| `auctions.review.receive_void` | auctions.review.receive | [vault-local ingestion of the host-signed void envelope per CTR-FED-001] { envelope, via? } | { accepted: boolean, quarantined?: boolean, code? } | AUCTIONS_RESULT_INVALID, UNSUPPORTED_SCHEMA_VERSION | auctions.result.voided | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `auctions.review.list` | auctions.review.read | [relay query] { status?, priority?, cursor?, limit ≤ 50 } | { items: AuctionReview[], nextCursor? } |  |
| `auctions.review.get` | auctions.review.read | [relay query] { reviewId } | { review: AuctionReview, evidenceSummary } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `auctions.review.opened` | P3 | { reviewId, auctionId, triggerKind, priority } |
| `auctions.result.voided` | P2 | { auctionId, resultId, reason, voidCid, decidedAt } |
| `auctions.review.closed` | P3 | { reviewId, auctionId, decision, voided: boolean } |

### Events consumed

| Type | Effect |
|---|---|
| `auctions.shill.suspected` | open a high-priority review when score is 85 or more; scores 60 to 84 stay in the anti-shill queue for a manual open |
| `moderation.report.filed` | open a review when the report targets an auction on this host |
| `auctions.result.non_payment` | open a review when the winner key has 2 or more non-payment reports in 30 days |
| `auctions.auction.closed` | attach the result id to an open review of the auction |
| `moderation.appeal.decided` | record the appeal outcome on the review; a void already issued is not reversed |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| AUCTIONS_RESULT_NOT_VOIDABLE | 409 | no | result has an acknowledged or final payment, is completed, or is not in a voidable state |
| AUCTIONS_REVIEW_DUPLICATE | 409 | no | an open review for this auction and trigger kind already exists |
| AUCTIONS_RESULT_INVALID | 422 | no | void statement signature or host key check failed; quarantined |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
shill flag score 90 -> auctions.review.open { "auctionId": "0192f400-0002-…", "trigger": { "kind": "shill_suspected", "ref": "0192f420-0001-…" } }
-> { "reviewId": "0192f430-0001-…", "status": "opened", "merged": false }
moderator A: assign, then propose_void { "voidReason": "shill_bidding", "findings": "Alternating bids from linked registrations ..." }
moderator B: confirm_void -> { "voidCid": "sha256-Vd…" } and event auctions.result.voided; participants' vaults ingest the host-signed statement
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-037-09.T01 | integration | PS-037-01.R01, PS-037-01.R02, PS-037-04.R01, PS-037-02.R02 | shill score 90 event and a report event for the same auction | one review opened with both triggers attached at high priority |
| TEST-PS-037-09.T04 | integration | PS-037-03.R03, PS-037-04.R02, PS-037-06.R02 | confirm void while a payment is acknowledged concurrently | one wins by lease order; void refused AUCTIONS_RESULT_NOT_VOIDABLE if payment first; no partial void |
| TEST-PS-037-09.T06 | contract | PS-037-04.R01, PS-037-04.R03, PS-037-09.R02 | each command, event and the void statement | payloads and signatures validate against registry schemas; vault rejects wrong host key |
| TEST-PS-037-09.T07 | integration | PS-037-04.R02, PS-037-06.R01 | open auction cancel_auction then dismiss | auction cancelled with host_policy, bids void, review closed once |

## Dependencies

Module depends on: F04.S01.M01, F04.S01.M03, F04.S02.M01, F12.S01.M01, F12.S01.M02, F12.S01.M03, F12.S02.M01, F11.S01.M03, F07.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
