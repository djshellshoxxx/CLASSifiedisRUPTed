# PS-007-01 — Domain schema: Wanted listing type

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S02.M02 Wanted listing type](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listing_types/wanted` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-007-01.R01** WantSpec holds the search intent of a wanted listing: category, keywords, acceptable conditions, quantity, optional budget as Money, barter flag, distance bucket and needed-by date.
- **PS-007-01.R02** The maximum budget is P3 by default and part of any projection only when budgetVisible is true; keywords and category are P0 once published.
- **PS-007-01.R03** WantSpec status is derived from the listing lifecycle events plus explicit owner actions.

## Specification

### WantSpec

Schema `classrup.bazaar.want_spec/v1` · storage **device** · privacy **P3** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — fixed local-vault tenant (ID-6) |
| listingId | uuidv7 — ref F01.S01.M01 Listing of kind wanted; unique |
| ownerId | did:key — local principal |
| categoryId | uuidv7 — ref F18.S01.M03 Category; active leaf |
| keywords | string[] — 1..10 items, each 2..40 code points lowercase |
| conditionsAccepted | string[] — subset of new \| like_new \| good \| fair \| poor \| for_parts; at least 1 |
| quantityWanted | int — 1..100 |
| maxBudget? | Money — CTR-MNY-001; > 0; <= 1 000 000 000 000 minor units |
| budgetVisible | boolean — default false |
| barterAcceptable | boolean — default false |
| barterNote? | string — <= 280 code points, plain text |
| maxDistanceBucket? | enum — lt_5km \| 5_10km \| 10_25km \| 25_50km \| gt_50km (CTR-PRV-001 PRV-2 buckets) |
| neededBy? | date — ISO 8601 date, not more than 365 days ahead |
| status | enum — draft \| open \| paused \| fulfilled \| withdrawn |
| withdrawReason? | enum — owner \| expired \| listing_closed \| listing_archived \| listing_deleted |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- Exactly one WantSpec exists per wanted listing and none for other kinds.
- maxBudget never appears in an event payload, and in a projection only if budgetVisible is true.
- status open implies the listing status is published.

### Storage DDL

```sql
CREATE TABLE bazaar_want_spec (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, listing_id TEXT NOT NULL, owner_id TEXT NOT NULL,
  category_id TEXT NOT NULL, status TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX bazaar_want_spec_listing ON bazaar_want_spec(tenant_id, listing_id);
CREATE INDEX bazaar_want_spec_open ON bazaar_want_spec(tenant_id, status, category_id);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-007-09.T01 | unit | PS-007-01.R01, PS-007-01.R02, PS-007-02.R01, PS-007-02.R02 | define a valid want with private budget | stored; keywords normalized; budget absent from projection builder output |
| TEST-PS-007-09.T02 | unit | PS-007-01.R03, PS-007-02.R03 | violate each rule V01-V09 | documented error code returned and nothing stored |

## Dependencies

Module depends on: F01.S01.M01, F18.S01.M03, F09.S03.M01, F09.S03.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [module SPEC](SPEC.md).
