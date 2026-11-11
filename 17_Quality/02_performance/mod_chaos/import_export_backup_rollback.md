# PS-138-10 — Import, export, backup and rollback: Chaos testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S02.M02 Chaos testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/chaos` · **Contracts:** [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-138-10.R01** Scenario files and reports are the exports; a failed run exports its seed and fault schedule for replay.
- **PS-138-10.R02** Scenario schema is versioned (classrup-chaos-scenario/v1) and the runner reads v1 only.
- **PS-138-10.R03** Rollback is a git revert; no state outside git and CI artifacts exists.

## Specification

- **export:** reports/chaos.json with seed, fault schedule and invariant verdicts; scenario YAML files in git.
- **import:** The runner imports scenario YAML (v1) and, for replay, a previously exported seed and fault schedule; other formats are rejected.
- **backup:** Scenario files in git; reports 30 days in CI.
- **migration rollback:** Scenario schema classrup-chaos-scenario/v1; rollback by git revert.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-138-09.T14 | integration | PS-138-10.R01, PS-138-10.R02, PS-138-10.R03 | replay a failed run from its exported seed and fault schedule | same violation reproduced; v1 scenario schema enforced |

## Dependencies

Module depends on: CTR-EVT-001, CTR-IDM-001, CTR-ERR-001, CTR-FED-001, CTR-TST-001, CTR-OBS-001, F17.S01.M01, F17.S01.M03, F15.S02.M03, F15.S01.M01, F11.S02.M01, F11.S01.M02, F01.S03.M01, F16.S02.M02, F16.S01.M01. Predecessor: [domain_schema.md](domain_schema.md).
