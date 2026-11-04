# PS-016-10 — Import, export, backup and rollback: Cycle feasibility checks

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S02.M05 Cycle feasibility checks](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_matching/feasibility` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-016-10.R01** FeasibilityReports are derived data and are not exported; the hash of the report cited by a signed revision travels inside that revision.
- **PS-016-10.R02** After import every imported subject is re-checked before any consent or proposal action is allowed.
- **PS-016-10.R03** Check codes are never renamed or reused; new codes are additive in a minor release of the schema.

## Specification

- **export:** Not exported (derived). Section mutiny.proposals carries the cited report hash inside each ProposalRevision.
- **import:** No report import; first open after import runs mutiny.feasibility.check for each open subject.
- **backup:** Reports are regenerable; the vault export is the primary backup (IOX-6).
- **migration rollback:** New checks are additive; an older release ignores unknown check codes and treats them as warn, so rollback cannot make a cycle look feasible.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-016-09.T16 | integration | PS-016-10.R01, PS-016-10.R02, PS-016-10.R03 | export and import | reports are not exported; imported subjects re-run checks on first open |

## Dependencies

Module depends on: F02.S02.M04, F01.S03.M01, F01.S01.M01, F06.S02.M01, F07.S02.M02, F09.S03.M02, F09.S03.M03, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
