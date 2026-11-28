# PS-038-01 — Domain schema: Anti-sniping soft close

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S02.M02 Anti-sniping soft close](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_integrity/sniping` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-038-01.R01** An Extension stores auction, sequence number 1 to 30, the triggering bid sequence, previous and new end, host time and the host signature, with revision per CTR-ID-001.
- **PS-038-01.R02** Extensions are public P0 because bidders must be able to audit the end time; they contain no bidder identity or key.
- **PS-038-01.R03** The rule constants (window 120 000 ms, extension 120 000 ms, maximum 30) are rules version softclose-v1, which the seller signs as softCloseRulesVersion in the auction terms and the host echoes in host_acceptance (F04.S01.M01), so they cannot change during a running auction.

## Specification

### Extension

Schema `classrup.auctions.extension/v1` · storage **relay+device** · privacy **P0** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — host relay tenant scope |
| auctionId | uuidv7 — ref F04.S01.M01 Auction |
| termsCid | string — cid of the auction terms whose softCloseRulesVersion applies |
| seq | int — 1..30; unique per auction; consecutive |
| triggerBidSeq | int — ledger sequence of the qualifying bid |
| previousEndsAt | timestamp — RFC 3339 UTC |
| newEndsAt | timestamp — equals previousEndsAt plus 120000 ms |
| hostTime | timestamp — host clock at decision; non-decreasing |
| rulesVersion | string — fixed value softclose-v1; must equal the terms' softCloseRulesVersion |
| hostSignature | string — Ed25519 host signature over JCS of the payload |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- seq values of one auction are consecutive from 1 and never exceed 30.
- newEndsAt minus previousEndsAt is exactly 120000 ms and previousEndsAt minus hostTime is between 0 exclusive and 120000 ms inclusive.
- The sum of extensions of one auction never exceeds 3 600 000 ms.
- rulesVersion equals the softCloseRulesVersion signed in the auction terms and echoed in host_acceptance.

### Storage DDL

```sql
CREATE TABLE auctions_extension (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, auction_id TEXT NOT NULL, seq INTEGER NOT NULL, trigger_bid_seq INTEGER NOT NULL,
  previous_ends_at TEXT NOT NULL, new_ends_at TEXT NOT NULL, host_time TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX auctions_extension_seq ON auctions_extension(tenant_id, auction_id, seq);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-038-09.T01 | unit | PS-038-01.R01, PS-038-01.R02, PS-038-02.R01, PS-038-02.R02 | bids with 120001, 120000, 1 and 0 ms remaining | 120001 no; 120000 yes; 1 yes; 0 refused by bid path with AUCTIONS_NOT_OPEN, no extension |
| TEST-PS-038-09.T02 | unit | PS-038-02.R03, PS-038-01.R03 | extensionCount 29 then 30 and a bid in window | 30th extension created; next qualifying bid accepted without extension; constants equal softclose-v1 |
| TEST-PS-038-09.T03 | property | PS-038-01.R02, PS-038-03.R02 | random bid times and kinds against reference model for 100 000 sequences | end time equals model; total extension ≤ 3 600 000 ms; seq consecutive |
| TEST-PS-038-09.T11 | abuse | PS-038-07.R02, PS-038-01.R01 | adversary bids minimum increments every 100 ms in each window | auction ends at scheduledEnd plus at most 60 minutes; alert at 25 extensions |
| TEST-PS-038-09.T15 | e2e | PS-038-01.R03, PS-038-03.R01 | mobile bidder watches countdown through two extensions | countdown follows host time, extension toasts announced, axe zero serious issues |
| TEST-PS-038-09.T16 | contract | PS-038-07.R01, PS-038-01.R02 | schema check of Extension, its statement and its event | no field holds a DID, key, alias or bidder reference |

## Dependencies

Module depends on: F04.S01.M01, F11.S01.M01, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F13.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [module SPEC](SPEC.md).
