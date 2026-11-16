# PS-027-10 — Import, export, backup and rollback: Participant valuation

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S04.M03 Participant valuation](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/value_balancing/valuation` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-027-10.R01** Export contains the user's own ItemValuation records with signatures and sequence chain, and not other owners' projections, which are re-fetchable.
- **PS-027-10.R02** Import verifies signatures and chains, continues seq from the highest stored value and never imports a lock marker.
- **PS-027-10.R03** Schema changes follow expand and contract and keep v1 readable for 180 days.

## Specification

- **export:** Section mutiny.valuations in classrup-export/v1; one line per own ItemValuation (schema classrup.mutiny.item_valuation/v1) including flags received.
- **import:** Records are verified; superseded history imports read-only; the current record per item is restored with lockedBySubjectId cleared; conflicting IDs rejected.
- **backup:** The vault export is the primary backup (IOX-6); relays hold only signed public projections (IOX-7).
- **migration rollback:** Additive optional fields only in v1; rollback ignores unknown fields; the basis enum only grows and unknown values read as other.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-027-09.T14 | integration | PS-027-06.R03, PS-027-10.R01, PS-027-10.R02, PS-027-10.R03 | export, import into fresh vault, rollback | own valuations round-trip with signatures; imported peer projections re-verified; seq continues |

## Dependencies

Module depends on: F01.S02.M01, F01.S03.M01, F01.S01.M01, F09.S03.M01, F09.S03.M03, F16.S02.M03, F07.S01.M01, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
