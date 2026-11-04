# PS-011-10 — Import, export, backup and rollback: Purchase offers

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S04.M01 Purchase offers](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/pricing/offers` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-011-10.R01** A user's export contains offers they made and offers on their listings.
- **PS-011-10.R02** Import of offers validates IDs, schema version and that both parties exist on the target relay; otherwise records are kept as read-only history.
- **PS-011-10.R03** Schema changes to Offer follow expand/contract and keep v1 readable for 180 days.

## Specification

- **export:** Section bazaar.offers in classrup-export/v1; one line per Offer (schema classrup.bazaar.offer/v1).
- **import:** Terminal offers import as read-only history; open offers import as expired with reason superseded to avoid stale commitments.
- **backup:** Covered by relay SQLite backup (CTR-IOX-001 IOX-3); no module-specific backup.
- **migration rollback:** Additive fields only in v1; rollback to the previous release is safe because new optional fields are ignored by older readers.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-011-09.T16 | integration | PS-011-10.R01, PS-011-10.R02, PS-011-10.R03 | export, re-import into fresh relay, and restore from backup | offers round-trip identical; import rejects conflicting IDs |

## Dependencies

Module depends on: F01.S01.M03, F01.S02.M01, F01.S03.M01, F09.S01.M01, F09.S03.M03, F07.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-MNY-001, CTR-IDM-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
