# PS-027-01 — Domain schema: Participant valuation

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S04.M03 Participant valuation](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/value_balancing/valuation` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-027-01.R01** An ItemValuation links one inventory item to a declared Money amount, basis, optional reference price, plausibility verdict, status and the per-author sequence of its signed projection.
- **PS-027-01.R02** The declared value is a public claim of the owner once the owner opts the item into barter, and the UI discloses this before signing; it is P0 and retained RET-STANDARD until the owner deletes it.
- **PS-027-01.R03** Flags are stored as local records on the flagger's side and as received statements on the owner's side, with only the reason code and an optional comment up to 280 code points.

## Specification

### ItemValuation

Schema `classrup.mutiny.item_valuation/v1` · storage **device** · privacy **P0** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — vault tenant scope |
| ownerId | did — declaring owner; signer of the projection |
| inventoryItemId | uuidv7 — item valued (F01.S03.M01) |
| listingCid | cid — listing projection the item belongs to |
| declared | Money — CTR-MNY-001; > 0 and ≤ 1 000 000 000 000 minor units |
| basis | enum — retail_estimate \| purchase_price \| replacement_cost \| other |
| note? | string — ≤ 280 code points, plain text |
| referencePrice? | Money — asking price of the listing at declaration, same-currency only |
| ratioPermille? | int — declared divided by referencePrice times 1000, floor; absent when currencies differ or no reference |
| plausibility | enum — ok \| low \| high \| unchecked |
| status | enum — declared \| flagged \| acknowledged \| superseded |
| flagCount | int — 0..100 flags received in this vault, counted not stored individually beyond 10 |
| flags | array — 0..10 items {byActorId did, reason too_high\|too_low\|unclear\|implausible_auto, comment?, flaggedAtLocal} |
| ackNote? | string — owner's justification, 10..280 code points |
| lockedBySubjectId? | uuidv7 — subject with an active reservation on this item, set by mutiny.cycle.locked |
| seq | int — projection sequence per author per item starting at 1 |
| prev? | cid — hash of previous projection envelope |
| cid | cid — sha256 of JCS(envelope minus sig) |
| sig | string — Ed25519 signature (base64url) per CTR-FED-001 FED-2 |
| origin | enum — local \| peer |
| provenance? | object — {originRelay?, receivedAt (local clock), via[], verifiedAt} for peers |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- Exactly one ItemValuation per (ownerId, inventoryItemId) has a status other than superseded.
- declared is positive and in a registered currency, and ratioPermille exists only when referencePrice has the same currency.
- status flagged implies the item is excluded from matching and cannot be consented to until acknowledged or redeclared.
- A valuation with lockedBySubjectId set cannot be changed or superseded by its owner.

### Storage DDL

```sql
CREATE TABLE mutiny_item_valuation (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, owner_id TEXT NOT NULL, inventory_item_id TEXT NOT NULL, status TEXT NOT NULL,
  seq INTEGER NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX mutiny_valuation_current ON mutiny_item_valuation(tenant_id, owner_id, inventory_item_id) WHERE status <> 'superseded';
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-027-09.T01 | unit | PS-027-01.R01, PS-027-02.R01, PS-027-02.R03 | declare 12000 EUR on I1 | stored with ratio 960 permille, plausibility ok, signed projection seq 1 |
| TEST-PS-027-09.T05 | integration | PS-027-03.R03, PS-027-01.R03 | participant flags an item in a proposal, owner acknowledges | status flagged then acknowledged, flag history kept, item usable again |
| TEST-PS-027-09.T15 | e2e | PS-027-01.R02, PS-027-07.R03 | mobile owner declares a value | disclosure and not-an-appraisal notice shown; axe zero serious issues |

## Dependencies

Module depends on: F01.S02.M01, F01.S03.M01, F01.S01.M01, F09.S03.M01, F09.S03.M03, F16.S02.M03, F07.S01.M01, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [module SPEC](SPEC.md).
