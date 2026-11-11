# PS-037-01 — Domain schema: Auction fraud review

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S02.M03 Auction fraud review](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_integrity/fraud` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-037-01.R01** An AuctionReview stores auction, optional result, triggers with per-check outcomes, priority, assignee, evidence snapshot references, findings, decision, the EnforcementAction id, and void and rescission statement references, with revision per CTR-ID-001.
- **PS-037-01.R02** Reviews are P3 host records visible only to host moderators and operators; participants receive only the void statement with a reason category and never the evidence or other parties' keys.
- **PS-037-01.R03** The evidence is frozen at assignment - the listing and bids through F12.S01.M02 snapshots of target types listing and bid, and the ledger head, extension history and result by their host-signed cids - so later bids or edits cannot change what the decision rested on.

## Specification

### AuctionReview

Schema `classrup.auctions.review/v1` · storage **relay** · privacy **P3** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — host relay tenant scope |
| auctionId | uuidv7 — ref F04.S01.M01 Auction |
| resultId? | uuidv7 — ref F04.S01.M03 AuctionResult once closed |
| triggers | Trigger[] — 1..10 items {kind: shill_suspected \| report \| winner_defaults \| listing_changed \| manual, ref, at}; ref is the checkId for shill_suspected and the receiptId of moderation.report.received for report |
| confirmedCheckIds | uuidv7[] — ShillChecks the findings confirm; a subset of the shill_suspected trigger refs |
| priority | enum — normal \| high; high for shill score ≥ 85, a sold result, or a material listing change |
| status | enum — opened \| in_review \| void_proposed \| voided \| dismissed |
| assigneeId? | actorId — host moderator; must not be a party or bidder of the auction nor linked to one |
| evidenceSnapshotIds | uuidv7[] — F12.S01.M02 snapshots of the listing (targetType listing) and of bids (targetType bid), and the snapshotIds of received reports |
| frozenRefs? | object — {termsCid, ledgerHeadSeq, ledgerHeadHash, extensionCids[], resultCid?} |
| findings? | string — ≤ 2000 code points, plain text |
| ruleRefs? | string[] — 1..5 policy rule versions in force (F12.S02.M03), passed to moderation.action.record_host_policy |
| factsSummary? | string — 50..2000 code points for the statement of reasons shown to the subject, passed to moderation.action.record_host_policy; never the findings text, reporter identity or other parties' keys |
| decision? | enum — dismiss \| cancel_auction \| void_result |
| voidReason? | enum — shill_bidding \| seller_fraud \| bidder_collusion \| listing_prohibited \| technical_error |
| subjectKeys? | actorId[] — host-only; parties the finding concerns (seller for seller_fraud and listing_prohibited, confirmed bidders for shill_bidding and bidder_collusion, none for technical_error) |
| proposedBy? | actorId — moderator who proposed the void |
| confirmedBy? | actorId — second moderator, different from proposedBy |
| voidCid? | string — cid of the host-signed void statement |
| enforcementActionId? | uuidv7 — ref F12.S02.M01 EnforcementAction recorded for the void under host policy |
| appealOutcome? | enum — upheld \| overturned \| reduced |
| appealReducedTo? | object — {kind, expiresAt?, restrictedCapabilities?} copied from moderation.appeal.decided with outcome reduced; the void stays issued |
| rescissionCid? | string — cid of the host-signed void_rescission statement after an overturned appeal |
| moderationCaseId? | uuidv7 — ref F12.S02.M01 ModerationCase returned by moderation.action.record_host_policy |
| openedAt | timestamp — host clock, RFC 3339 UTC |
| decidedAt? | timestamp — host clock, RFC 3339 UTC |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- status voided implies voidReason, proposedBy, confirmedBy, voidCid and enforcementActionId are set and proposedBy differs from confirmedBy.
- At most one review per auction is in status opened, in_review or void_proposed; later triggers are merged into it.
- assigneeId, proposedBy and confirmedBy are never a seller or bidder key of the auction, nor a key F04.S02.M01 links to one.
- A void is recorded only for a won, not yet voided result closed at most 60 days before; whether it applies over a payment is decided in each vault, and no vault applies a void over an acknowledged or final payment (F04.S01.M03).
- confirmedCheckIds is a subset of the refs of the review's shill_suspected triggers.
- rescissionCid is set only when appealOutcome is overturned, and never changes the review status.
- appealReducedTo is set only when appealOutcome is reduced, and never changes the review status or the issued void.

### Storage DDL

```sql
CREATE TABLE auctions_review (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, auction_id TEXT NOT NULL, result_id TEXT, priority TEXT NOT NULL,
  status TEXT NOT NULL, opened_at TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX auctions_review_open ON auctions_review(tenant_id, auction_id) WHERE status IN ('opened','in_review','void_proposed');
CREATE INDEX auctions_review_queue ON auctions_review(tenant_id, status, priority, opened_at);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-037-09.T01 | integration | PS-037-01.R01, PS-037-04.R01, PS-037-04.R03 | shill score 90 event and a report on the auction's listing | one review opened with both triggers merged at high priority; auctions.review.opened emitted twice with the full triggers list |
| TEST-PS-037-09.T10 | abuse | PS-037-07.R01, PS-037-07.R02, PS-037-07.R03, PS-037-01.R02 | inspect participant notices, logs, public projection, user exports | only reason category in notices; no evidence, findings or keys elsewhere; statement says host finding, not a ruling |
| TEST-PS-037-09.T18 | integration | PS-037-01.R03 | review assigned, then new bids, a listing edit and an extension arrive | snapshots of target types listing and bid and the frozen ledger head, extension cids and result cid are unchanged |
| TEST-PS-037-09.T24 | integration | PS-037-01.R01 | flagged bidders B1 and B2; findings confirm only B1 | auctions.review.closed lists only B1's checkId in confirmedCheckIds; the host-local voided event carries subjectKeys [B1] and the void statement names nobody |

## Dependencies

Module depends on: F04.S01.M01, F04.S01.M02, F04.S01.M03, F04.S02.M01, F04.S02.M02, F12.S01.M01, F12.S01.M02, F12.S01.M03, F12.S02.M01, F11.S01.M01, F11.S01.M03, F07.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F13.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [module SPEC](SPEC.md).
