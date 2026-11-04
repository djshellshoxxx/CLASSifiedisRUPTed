# PS-037-01 — Domain schema: Auction fraud review

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S02.M03 Auction fraud review](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_integrity/fraud` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-037-01.R01** An AuctionReview stores auction, optional result, triggers, priority, assignee, evidence snapshot reference, findings, decision and void statement reference, with revision per CTR-ID-001.
- **PS-037-01.R02** Reviews are P3 host records visible only to host moderators and operators; participants receive only the void statement with a reason category and never the evidence or other parties' keys.
- **PS-037-01.R03** The evidence snapshot is frozen at open time through F12.S01.M02 so later bids or edits cannot change what the decision rested on.

## Specification

### AuctionReview

Schema `classrup.auctions.review/v1` · storage **relay** · privacy **P3** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — host relay tenant scope |
| auctionId | uuidv7 — ref F04.S01.M01 Auction |
| resultId? | uuidv7 — ref F04.S01.M03 AuctionResult once closed |
| triggers | Trigger[] — 1..10 items {kind: shill_suspected \| report \| winner_defaults \| manual, ref, at} |
| priority | enum — normal \| high; high for shill score ≥ 85 or a sold result |
| status | enum — opened \| in_review \| void_proposed \| voided \| dismissed |
| assigneeId? | actorId — host moderator; must not be a party or bidder of the auction |
| evidenceSnapshotId? | uuidv7 — ref F12.S01.M02 EvidenceSnapshot |
| findings? | string — ≤ 2000 code points, plain text |
| decision? | enum — dismiss \| cancel_auction \| void_result |
| voidReason? | enum — shill_bidding \| seller_fraud \| bidder_collusion \| listing_prohibited \| technical_error |
| proposedBy? | actorId — moderator who proposed the void |
| confirmedBy? | actorId — second moderator, different from proposedBy |
| voidCid? | string — cid of the host-signed void statement |
| moderationCaseId? | uuidv7 — ref F12.S02.M01 ModerationCase when escalated |
| openedAt | timestamp — host clock, RFC 3339 UTC |
| decidedAt? | timestamp — host clock, RFC 3339 UTC |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- status voided implies voidReason, proposedBy, confirmedBy and voidCid are set and proposedBy differs from confirmedBy.
- At most one review per auction is in status opened, in_review or void_proposed for the same trigger kind.
- assigneeId is never a seller or bidder key of the auction.
- A void is never recorded for a result whose payment is acknowledged or final.

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
| TEST-PS-037-09.T01 | integration | PS-037-01.R01, PS-037-01.R02, PS-037-04.R01, PS-037-02.R02 | shill score 90 event and a report event for the same auction | one review opened with both triggers attached at high priority |
| TEST-PS-037-09.T15 | e2e | PS-037-03.R03, PS-037-01.R03 | two moderators in two browsers void a sale; bidder and seller vaults open notice | statuses correct on all four; notice has no names; axe zero serious issues |

## Dependencies

Module depends on: F04.S01.M01, F04.S01.M03, F04.S02.M01, F12.S01.M01, F12.S01.M02, F12.S01.M03, F12.S02.M01, F11.S01.M03, F07.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [module SPEC](SPEC.md).
