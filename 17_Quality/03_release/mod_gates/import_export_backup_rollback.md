# PS-143-10 — Import, export, backup and rollback: Release gates

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S03.M02 Release gates](SPEC.md) · **Scope:** MVP · **Code:** `tools/gates` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-143-10.R01** reports/gates.json, reports/trace.json and reports/gates.md are the exports and are attached to the release.
- **PS-143-10.R02** Gate input formats are JUnit XML, load report v1 (reports/load.json), PWA budget report v1 (reports/pwa-budgets.json), axe JSON, compat report v1 (reports/compat.json), the specgen check --strict --report output (SPEC_COMPLETENESS_REPORT.md), signed manual checklists (gates/manual/<version>/), tests/quarantine.yaml, gates/waivers.yaml, gates/mapping-reviews.yaml and the audit JSON; unknown fields are ignored and unknown major versions are rejected.
- **PS-143-10.R03** Rollback is a git revert of tools/gates; the release workflow then fails closed on a missing command.

## Specification

- **export:** reports/gates.json, reports/trace.json and reports/gates.md attached to each release.
- **import:** Inputs are JUnit XML, load report v1, PWA budget report v1, axe JSON, compat report v1, the spec completeness report, signed manual checklists, quarantine, waiver and mapping review files and audit JSON from the release commit, all downloaded into one reports/ directory by the release workflow; other inputs are ignored and unknown major versions rejected.
- **backup:** Release artifacts retain reports for 1 year; sources in git.
- **migration rollback:** Report schema versioned; revert tools/gates by git revert and the release workflow fails closed.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-143-09.T13 | unit | PS-143-10.R01, PS-143-10.R02, PS-143-10.R03 | feed unknown fields and unknown major versions; remove tools/gates in a branch | unknown fields ignored; unknown major rejected; release workflow fails closed |

## Dependencies

Module depends on: CTR-TST-001, CTR-OBS-001, CTR-SCH-001, F17.S01.M01, F17.S01.M04, F17.S02.M01, F17.S03.M03. Predecessor: [domain_schema.md](domain_schema.md).
