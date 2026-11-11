# PS-027-01 — Domain schema: Participant valuation

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S04.M03 Participant valuation](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/value_balancing/valuation` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-027-01.R01** An ItemValuation links one inventory item to a declared Money amount, basis, optional reference price, plausibility verdict, status and the per-author sequence of its signed projection.
- **PS-027-01.R02** The declared value is a public claim of the owner once the owner opts the item into barter, and the UI discloses this before signing; the published projection fields are P0 and retained RET-STANDARD until the owner deletes them, while the local ItemValuation record is P2 because it also holds flags, flagger DIDs and lock state.
- **PS-027-01.R03** Flags are stored as local records on the flagger's side and as received statements on the owner's side, with only the reason code, the flagger's subject and an optional comment up to 280 code points.
- **PS-027-01.R04** The projection classrup.mutiny.item_valuation_projection/v1 carries exactly {ownerId, inventoryItemId, listingCid, declared, basis, note, plausibility, ackNote?, seq, prev}; ackNote is present only when the owner acknowledged an automatic plausibility flag and is published because it is the owner's own explanation of a public verdict, written under the disclosure 'visible to anyone who sees your listing'; flags, flagCount, lockedBySubjectId, referencePrice and ratioPermille are never published.

## Specification

### ItemValuation

Schema `classrup.mutiny.item_valuation/v1` · storage **device** · privacy **P2** · retention **RET-STANDARD**

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
| projectionCid? | cid — cid of the last signed classrup.mutiny.item_valuation_projection/v1 built from the whitelisted fields |
| status | enum — declared \| flagged \| acknowledged \| superseded |
| flagCount | int — 0..100 flags received in this vault, counted not stored individually beyond 10 |
| flags | array — 0..10 items {flagId, byActorId did, subjectType, subjectId (scope of the block), reason too_high\|too_low\|unclear\|implausible_auto, comment?, status open\|answered\|closed, flaggedAtLocal}; P2, local only |
| ackNote? | string — owner's justification, 10..280 code points; published only for automatic plausibility flags, sent end-to-end encrypted to the flagging subject's participants for peer flags |
| lastFlagStateChangeAt? | timestamp — local clock of the last flag-triggered state change; one per item per 30 days |
| lockedBySubjectId? | uuidv7 — subject with an active own reservation on this item, set by mutiny.cycle.locked with direction own; never published |
| seq | int — projection sequence per author per item starting at 1 |
| prev? | cid — hash of previous projection envelope |
| cid | cid — sha256 of JCS(projection envelope minus sig) |
| sig | string — Ed25519 signature (base64url) per CTR-FED-001 FED-2 |
| origin | enum — local \| peer |
| provenance? | object — {originRelay?, receivedAt (local clock), via[], verifiedAt} for peers |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- Exactly one ItemValuation per (ownerId, inventoryItemId) has a status other than superseded.
- declared is positive and in a registered currency, and ratioPermille exists only when referencePrice has the same currency.
- status flagged means an unacknowledged automatic plausibility flag and implies the item is excluded from matching and consent everywhere until acknowledged or redeclared; an open peer flag blocks consent only in its own subject.
- The signed projection never contains flags, flagCount, flagger DIDs, lockedBySubjectId, referencePrice or ratioPermille.
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
| TEST-PS-027-09.T05 | integration | PS-027-03.R03, PS-027-01.R03 | participant flags an item in a proposal in which the owner signed consent, owner acknowledges with a kind ack statement | flag scoped to that proposal and answered, flag history kept, item usable again; the same item stays usable in another subject throughout |
| TEST-PS-027-09.T07 | contract | PS-027-04.R01, PS-027-04.R02, PS-027-04.R04, PS-027-09.R02, PS-027-09.R03, PS-027-01.R04 | commands and events | statements and payloads validate against classrup.mutiny.item_valuation_projection/v1, valuation_flag/v1 and the registry; the local record classrup.mutiny.item_valuation/v1 is never sent; F11.S01.M01 registry signer roles match (owner for projection and ack, subject participant for flag) |
| TEST-PS-027-09.T15 | e2e | PS-027-01.R02, PS-027-07.R03 | mobile owner declares a value | disclosure and not-an-appraisal notice shown; axe zero serious issues |
| TEST-PS-027-09.T16 | contract | PS-027-01.R04, PS-027-01.R02, PS-027-02.R01 | schema assertions on the signed projection envelope and the flag payload for declared, auto-flagged, acknowledged and locked valuations | projection fields equal the whitelist exactly; flags, flagCount, lockedBySubjectId, referencePrice and ratioPermille never appear; ackNote appears only after acknowledging an automatic flag; flag payload has only subject, item, reason and comment |

## Dependencies

Module depends on: F01.S02.M01, F01.S03.M01, F01.S01.M01, F09.S03.M01, F09.S03.M03, F16.S02.M03, F07.S01.M01, F07.S02.M02, F15.S01.M01, F11.S01.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [module SPEC](SPEC.md).
