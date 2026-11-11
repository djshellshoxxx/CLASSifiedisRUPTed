# PS-016-05 — Authorization and capabilities: Cycle feasibility checks

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S02.M05 Cycle feasibility checks](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_matching/feasibility` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-016-05.R01** Only the local principal can run and read feasibility checks in its vault.
- **PS-016-05.R02** Checks use only data the principal is already allowed to see, so a report never discloses a peer's private data.
- **PS-016-05.R03** Relays never run this module for private subjects; relay matching uses only the public edge admission rules of F02.S02.M03.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| mutiny.feasibility.check | principal | vault unlocked; subject exists in this vault |
| mutiny.feasibility.read | principal | own vault |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-016-09.T09 | abuse | PS-016-05.R01, PS-016-05.R02, PS-016-05.R03, PS-016-07.R02 | other principal reads report; blocked pair and elsewhere-reserved item | NOT_FOUND; generic messages with no names or cycle ids |

## Dependencies

Module depends on: F02.S02.M04, F02.S01.M02, F02.S01.M03, F02.S04.M02, F02.S04.M03, F01.S03.M01, F01.S01.M01, F06.S02.M01, F07.S02.M02, F09.S03.M02, F09.S03.M03, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
