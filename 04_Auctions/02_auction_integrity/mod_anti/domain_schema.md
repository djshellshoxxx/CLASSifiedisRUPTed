# PS-036-01 — Domain schema: Anti-shill controls

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S02.M01 Anti-shill controls](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_integrity/anti` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-036-01.R01** A ShillCheck stores auction, subject key, verdict, reason codes, evidence references, score, host time and status, with revision per CTR-ID-001.
- **PS-036-01.R02** ShillChecks are P3 host records because they reveal key linkage; they never appear in public projections, events to bidders, exports of other users or logs.
- **PS-036-01.R03** Only denied and flagged evaluations are stored; allowed evaluations leave only counters.
- **PS-036-01.R04** Revoked keys and revoked attestations stay in the linkage cache as linked for the seller for at least 30 days, and permanently for auctions scheduled before the revocation; linked_host_registration evidence is never dropped on revocation.

## Specification

### ShillCheck

Schema `classrup.auctions.shill_check/v1` · storage **relay** · privacy **P3** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — host relay tenant scope |
| auctionId | uuidv7 — ref F04.S01.M01 Auction |
| subjectId | actorId — bidder key being evaluated; host only |
| verdict | enum — deny \| flag |
| reasons | string[] — 1..8 codes; deterministic seller_self, linked_identity_doc, linked_attestation, linked_host_registration, revoked_key; heuristic concentration, alternation, probing, price_pump, new_key, never_wins; data quality linkage_stale |
| evidence | object[] — 0..10 items {type, ref, ageSeconds}; refs are ids, never key material beyond the subject key |
| score | int — 0..100; deterministic links 100; heuristic 0..99 per shill-v1; linkage_stale flags 0 |
| scoringVersion | string — shill-v1 |
| triggerBidSeq? | int — ledger sequence that triggered the flag |
| status | enum — evaluated \| denied \| flagged \| under_review \| confirmed \| dismissed \| expired |
| reviewId? | uuidv7 — ref F04.S02.M03 AuctionReview |
| decidedAt | timestamp — host clock, RFC 3339 UTC |
| retentionClass | enum — RET-EVIDENCE for denied and confirmed \| RET-SHORT for dismissed and expired |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- verdict deny implies at least one deterministic reason (seller_self, linked_identity_doc, linked_attestation, linked_host_registration, revoked_key) and score 100.
- verdict flag implies either score between 60 and 99 with heuristic reasons only, or the single reason linkage_stale with score 0.
- At most one open (flagged or under_review) ShillCheck per (auctionId, subjectId).
- No allow-list entry names the seller key of its auction as the bidder key.

### Storage DDL

```sql
CREATE TABLE auctions_shill_check (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, auction_id TEXT NOT NULL, subject_id TEXT NOT NULL, verdict TEXT NOT NULL,
  score INTEGER NOT NULL, status TEXT NOT NULL, decided_at TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX auctions_shill_open ON auctions_shill_check(tenant_id, auction_id, subject_id) WHERE status IN ('flagged','under_review');
CREATE INDEX auctions_shill_queue ON auctions_shill_check(tenant_id, status, score DESC);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-036-09.T01 | unit | PS-036-01.R01, PS-036-01.R03, PS-036-02.R01 | evaluate seller key, K2, K0, attested B3 and B4 | all denied with the right internal reasons (seller_self, linked_identity_doc, linked_attestation, linked_host_registration); B1 allowed; allow leaves no record |
| TEST-PS-036-09.T14 | integration | PS-036-01.R04, PS-036-03.R01 | same_owner attestation revoked after a denial; seller revokes K2 and bids with it; auction scheduled before the revocation | within 30 days the attestation still denies; K2 denied as revoked_key; for the earlier auction the link is permanent; after 30 days a later auction allows the attested key; past denial kept as history |
| TEST-PS-036-09.T15 | integration | PS-036-01.R02 | inspect public projections, bidder errors and events, seller views, logs, federation outbox and user exports | no ShillCheck field appears outside host moderator views and the operator export |

## Dependencies

Module depends on: F04.S01.M01, F07.S01.M01, F07.S01.M02, F07.S02.M01, F07.S03.M02, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [module SPEC](SPEC.md).
