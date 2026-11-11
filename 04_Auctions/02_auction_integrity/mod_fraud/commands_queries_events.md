# PS-037-04 — Commands, queries and events: Auction fraud review

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S02.M03 Auction fraud review](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_integrity/fraud` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-037-04.R01** Reviews are host relay commands authorized by host moderator roles; vaults only ingest the signed void and rescission statements.
- **PS-037-04.R02** Decisions are atomic on the host with their events, statements, the host's own result row and the calls into F04.S01.M01 or F12.S02.M01; vault-side effects follow only from the host-signed statements.
- **PS-037-04.R03** Reviews are opened by consumed events - shill suspicion, reports on the auction's listing or bids, non-payment counts and listing edits after bids - or manually; no participant can open or read a review.
- **PS-037-04.R04** Statements are registered with F11.S01.M01 - classrup.auctions.void/v1 and classrup.auctions.void_rescission/v1 by the host key named in the terms (N2) - and the host calls notify.notification.dispatch for a content-free push to the seller and the auction's participants with pushOptIn when a void or rescission is issued (N17).
- **PS-037-04.R05** Each void records a host-policy EnforcementAction through F12.S02.M01 moderation.action.apply (kind remove_from_index for the auction, subject the seller) whose actionId is stored on the review, and moderation.appeal.decided is matched on that actionId.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `auctions.review.open` | auctions.review.open | [relay command, moderator signed request or system trigger] { auctionId, trigger: { kind, ref }, priority? } | { reviewId, revision, status, merged: boolean } | NOT_FOUND, FORBIDDEN, AUCTIONS_REVIEW_DUPLICATE, VALIDATION_FAILED | auctions.review.opened | yes (Idempotency-Key) |
| `auctions.review.assign` | auctions.review.decide | [relay command; captures F12.S01.M02 snapshots of the listing and bids and freezes the ledger head, extension cids and result cid] { reviewId, expectedRevision } | { reviewId, revision, evidenceSnapshotIds, frozenRefs } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, FORBIDDEN, DEPENDENCY_UNAVAILABLE |  | yes (Idempotency-Key) |
| `auctions.review.dismiss` | auctions.review.decide | [relay command] { reviewId, expectedRevision, findings } | { reviewId, revision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, FORBIDDEN, VALIDATION_FAILED | auctions.review.closed | yes (Idempotency-Key) |
| `auctions.review.cancel_auction` | auctions.review.decide | [relay command, calls F04.S01.M01 apply_cancel with reason host_policy] { reviewId, expectedRevision, findings } | { reviewId, revision, auctionStatus } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, FORBIDDEN, VALIDATION_FAILED |  | yes (Idempotency-Key) |
| `auctions.review.propose_void` | auctions.review.decide | [relay command] { reviewId, expectedRevision, voidReason, findings, confirmedCheckIds?, subjectKeys? } | { reviewId, revision, expiresAt } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, FORBIDDEN, VALIDATION_FAILED, AUCTIONS_RESULT_NOT_VOIDABLE |  | yes (Idempotency-Key) |
| `auctions.review.confirm_void` | auctions.review.confirm | [relay command by a second moderator; produces statement classrup.auctions.void/v1 signed by the host key; records the EnforcementAction through F12.S02.M01] { reviewId, expectedRevision, confirm: boolean } | { reviewId, revision, voidCid, enforcementActionId } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, FORBIDDEN, AUCTIONS_RESULT_NOT_VOIDABLE, DEPENDENCY_UNAVAILABLE | auctions.result.voided, auctions.review.closed | yes (Idempotency-Key) |
| `auctions.review.rescind_void` | auctions.review.rescind | [relay command, system on moderation.appeal.decided with outcome overturned; produces statement classrup.auctions.void_rescission/v1 signed by the host key] { reviewId, appealId, appealDecisionCid } | { reviewId, rescissionCid } | NOT_FOUND, CONFLICT_STATE |  | yes (Idempotency-Key) |
| `auctions.review.receive_void` | auctions.review.receive | [vault-local ingestion of host-signed void and void_rescission envelopes per CTR-FED-001] { envelope, via? } | { accepted: boolean, quarantined?: boolean, code?, kind: void \| rescission } | AUCTIONS_RESULT_INVALID, UNSUPPORTED_SCHEMA_VERSION | auctions.result.voided | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `auctions.review.list` | auctions.review.read | [relay query] { status?, priority?, cursor?, limit ≤ 50 } | { items: AuctionReview[], nextCursor? } |  |
| `auctions.review.get` | auctions.review.read | [relay query] { reviewId } | { review: AuctionReview, evidenceSummary } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `auctions.review.opened` | P3 | { reviewId, auctionId, triggers: [{kind, ref}], priority, merged } — host-local; emitted on open and again on each merge with the full triggers list |
| `auctions.result.voided` | P2 | { auctionId, resultId, sellerId, winnerId?, parties: [{did, role: seller \| winner \| bidder}], reason, voidCid, decidedAt, subjectKeys? } — the host-local event lists parties from the host's participant list and carries the host-only P3 field subjectKeys for F12 signals; the vault-derived event from receive_void carries the local principal as its only party, sellerId and winnerId when the vault knows them, and never subjectKeys |
| `auctions.review.closed` | P3 | { reviewId, auctionId, decision, voided: boolean, voidReason?, confirmedCheckIds[] } — host-local |

### Events consumed

| Type | Effect |
|---|---|
| `auctions.shill.suspected` | open or merge into the auction's review at high priority when score is 85 or more, with trigger {kind shill_suspected, ref checkId}; scores 60 to 84 stay in the anti-shill queue for a manual open |
| `moderation.report.filed` | when targetType is listing and a hosted auction has that listingId, or targetType is bid and the Bid's auctionId is hosted here, open or merge a report trigger at normal priority |
| `auctions.result.non_payment` | host-local event from record_non_payment - open or merge a winner_defaults trigger when the winner key has 2 or more reports in 30 days |
| `auctions.auction.closed` | attach the result id to an open review of the auction |
| `bazaar.listing.edited` | host side, when the edited projection of a listing whose auction has bids reaches the host - open or merge a listing_changed trigger at normal priority, high when the change is material (material edits are refused in the seller vault per N11) |
| `moderation.appeal.decided` | when actionId equals a review's enforcementActionId, record appealOutcome; outcome overturned runs auctions.review.rescind_void; a void already issued stays issued |
| `privacy.deletion.completed` | host relay - replace the erased principal's did in retained reviews (assignee, proposer, confirmer, subjectKeys) with the per-deletion pseudonym; vault - received void statements are kept as counterparty evidence and the erased principal's own copies are deleted |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| AUCTIONS_RESULT_NOT_VOIDABLE | 409 | no | result is unsold, already voided, not closed, or closed more than 60 days ago |
| AUCTIONS_REVIEW_DUPLICATE | 409 | no | this trigger is already attached to the auction's open review |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Statements: classrup.auctions.void/v1 (host key) {auctionId, termsCid, resultCid, reason, decidedAt} names no individual; classrup.auctions.void_rescission/v1 (host key) {voidCid, auctionId, appealDecisionCid, decidedAt}. Both are E2E-delivered to the seller and every bidder through their mailbox hints and shown on the public result projection by reason category only.

### Example

```
shill flag score 90 -> auctions.review.open { "auctionId": "0192f400-0002-…", "trigger": { "kind": "shill_suspected", "ref": "0192f420-0001-…" } }
-> { "reviewId": "0192f430-0001-…", "status": "opened", "merged": false }
report on the auction's listing -> merged into the same review (auctions.review.opened with merged true)
moderator A: assign, then propose_void { "voidReason": "shill_bidding", "findings": "Alternating bids from keys registered together ...", "confirmedCheckIds": ["0192f420-0001-…"] }
moderator B: confirm_void -> { "voidCid": "sha256-Vd…", "enforcementActionId": "0192f3b8-…" } and event auctions.result.voided;
  participants' vaults ingest the host-signed statement with receive_void and F04.S01.M03 applies it by local payment state
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-037-09.T01 | integration | PS-037-01.R01, PS-037-04.R01, PS-037-04.R03 | shill score 90 event and a report on the auction's listing | one review opened with both triggers merged at high priority; auctions.review.opened emitted twice with the full triggers list |
| TEST-PS-037-09.T04 | integration | PS-037-06.R04, PS-037-04.R02 | vault-side race - in the winner vault a payment acknowledgement and the void statement arrive concurrently; in the seller vault the void arrives first | the local transaction that commits first decides; acknowledgement first gives void_after_payment with no state change; void first gives voided with the Deal kept; the host issued the same void in both cases and took no lock |
| TEST-PS-037-09.T06 | contract | PS-037-04.R01, PS-037-09.R02 | each command, event and the void and rescission statements | payloads and signatures validate against registry schemas; vault rejects a wrong host key with AUCTIONS_RESULT_INVALID |
| TEST-PS-037-09.T07 | integration | PS-037-04.R02, PS-037-06.R01 | open auction cancel_auction then dismiss | auction cancelled through apply_cancel with host_policy, bids void, review closed once |
| TEST-PS-037-09.T19 | integration | PS-037-04.R05, PS-037-03.R04 | void confirmed; seller appeals; appeal overturned | EnforcementAction recorded and actionId stored; moderation.appeal.decided matched on actionId; rescission statement issued; vaults show it as advisory and the review stays voided |
| TEST-PS-037-09.T20 | integration | PS-037-04.R04 | void issued in an auction where the seller and two bidders set pushOptIn; registry lookup | dispatch called once per opted-in recipient with template key and reference only; void and rescission roles resolve to the host key |
| TEST-PS-037-09.T21 | integration | PS-037-04.R03 | reports with targetType listing and bid for a hosted auction; a report on an unrelated listing | the two open or merge triggers on the auction's review; the unrelated report is ignored |

## Dependencies

Module depends on: F04.S01.M01, F04.S01.M02, F04.S01.M03, F04.S02.M01, F04.S02.M02, F12.S01.M01, F12.S01.M02, F12.S01.M03, F12.S02.M01, F11.S01.M01, F11.S01.M03, F07.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F13.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
