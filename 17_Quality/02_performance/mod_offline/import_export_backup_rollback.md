# PS-140-10 — Import, export, backup and rollback: Offline testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S02.M03 Offline testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/offline` · **Contracts:** [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-140-10.R01** Reports are JUnit XML and reports/offline.json; no user data.
- **PS-140-10.R02** Scenarios are plain data files and can be reused by the e2e module.
- **PS-140-10.R03** Rollback is a git revert; no persistent state.

## Specification

- **export:** reports/offline.json and JUnit XML; scenario data files in tests/offline/scenarios/.
- **import:** The suite imports scenario data files (JSON) that describe network steps; other inputs are rejected.
- **backup:** Scenario files in git; reports 14 days in CI.
- **migration rollback:** Outbox schema changes are covered by F15.S01.M01; this module updates scenarios in the same pull request; rollback by git revert.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-140-09.T14 | integration | PS-140-10.R01, PS-140-10.R02, PS-140-10.R03 | export report and reuse scenario files in e2e | reports contain no user data; scenarios load in both harnesses |

## Dependencies

Module depends on: CTR-IDM-001, CTR-ERR-001, CTR-UX-001, CTR-TST-001, CTR-OBS-001, F17.S01.M01, F17.S01.M04, F15.S01.M01, F15.S01.M02. Predecessor: [domain_schema.md](domain_schema.md).
