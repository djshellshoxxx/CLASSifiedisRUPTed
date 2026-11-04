# PS-013-10 — Import, export, backup and rollback: Barter offer items

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S01.M03 Barter offer items](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/trade_proposals/offer` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-013-10.R01** Export contains referenced legs of the user's subjects with provenance, since they are part of signed evidence.
- **PS-013-10.R02** Import verifies each leg against the revision that references it and rejects legs not referenced by any imported revision.
- **PS-013-10.R03** Schema changes follow expand and contract and keep v1 readable for 180 days.

## Specification

- **export:** Section mutiny.legs in classrup-export/v1; one line per referenced TradeLeg (schema classrup.mutiny.trade_leg/v1).
- **import:** Each leg is matched to its sealed revision; orphan legs are dropped with a report; identical IDs are skipped and conflicting IDs rejected.
- **backup:** The vault export is the primary backup (IOX-6); relays never hold plaintext legs (IOX-7).
- **migration rollback:** Additive fields only in v1; rollback ignores unknown fields; multi-item cycle legs are a future major and are not produced by v1.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-013-09.T15 | integration | PS-013-10.R01, PS-013-10.R02, PS-013-10.R03 | export, import, rollback | referenced legs round-trip; voided legs not exported; conflicting IDs rejected |

## Dependencies

Module depends on: F01.S03.M01, F01.S01.M01, F02.S04.M03, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
