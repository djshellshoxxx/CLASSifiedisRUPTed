# PS-019-10 — Import, export, backup and rollback: Matching participant eligibility

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S02.M04 Matching participant eligibility](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_matching/party` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-019-10.R01** Export contains the local MatchingProfile including exclusions and the last published seq, but not peer mirrors, which are re-fetchable.
- **PS-019-10.R02** Import restores the local profile and requires the user to re-confirm opt-in before the next projection is published.
- **PS-019-10.R03** Schema changes follow expand and contract and keep v1 readable for 180 days.

## Specification

- **export:** Section mutiny.matching_profile in classrup-export/v1; exactly one line for the local profile (schema classrup.mutiny.matching_profile/v1).
- **import:** Imported profile gets optedIn false until the user confirms again; seq continues from the stored value so earlier tombstones are not contradicted.
- **backup:** The vault export is the primary backup (IOX-6); relays hold only signed public projections (IOX-7).
- **migration rollback:** Additive optional fields only in v1; rollback ignores unknown fields; old releases ignore new distance buckets by treating them as gt50 only for peers, never for the local record.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-019-09.T14 | integration | PS-019-10.R01, PS-019-10.R02, PS-019-10.R03 | export, import to fresh vault, rollback | local profile round-trips with exclusions; peer mirrors imported read-only |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M02, F06.S02.M02, F16.S02.M03, F12.S03.M04, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
