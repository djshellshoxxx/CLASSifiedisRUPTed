# PS-009-07 — Privacy, retention and abuse: Listing variants

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S03.M02 Listing variants](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/inventory/variants` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-009-07.R01** Variant data is P3 while the listing is a draft and becomes public only through the signed projection; quantities are never part of it beyond an in-stock flag.
- **PS-009-07.R02** Variants are retained RET-STANDARD with the listing; tombstones are kept 180 days.
- **PS-009-07.R03** Attribute text is plain text and is scanned by the same prohibited-item rules as listing text at publication.

## Specification

**Data classification**
- Variant: P3 draft data, P0 when projected.
- Quantity: P2 in F01.S03.M01.

**Retention**
- Variant: RET-STANDARD; removed with the listing; tombstone {id, type, deletedAt} for 180 days.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Variant price bait-and-switch against buyers with open offers | price changes are material revisions reported to F01.S01.M02 and notify offers; buyers must re-confirm |
| T02 | Variant spam to bloat a listing | 50-variant limit, 5 attributes per variant, plain text only |
| T03 | Hidden prohibited item in variant text | attributes included in publication policy evaluation |

**Abuse controls**
- At most 100 variant commands per hour per vault.
- Price changes on one variant limited to 10 per day (RATE_LIMITED beyond).

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-009-09.T02 | unit | PS-009-01.R02, PS-009-07.R01 | read projection and events | variants only in projection; no quantities in event or projection beyond in-stock flag |
| TEST-PS-009-09.T11 | abuse | PS-009-07.R02, PS-009-07.R03 | variant attribute with prohibited keyword at publish | publication blocked by policy; retention shows RET-STANDARD |
| TEST-PS-009-09.T12 | abuse | PS-009-07.R01, PS-009-07.R03 | 101 commands in an hour; 11 price changes in a day | RATE_LIMITED on the 101st and 11th |

## Dependencies

Module depends on: F01.S03.M01, F01.S01.M01, F01.S01.M02, F01.S02.M01, F09.S03.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
