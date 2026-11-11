# PS-134-10 — Import, export, backup and rollback: E2E testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S01.M04 E2E testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/e2e` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-134-10.R01** The HTML report and JUnit XML are exportable CI artifacts; no user data is included.
- **PS-134-10.R02** Playwright and axe versions are pinned in the lockfile (1.63.0, 4.14.0); upgrades are separate reviewed pull requests.
- **PS-134-10.R03** Rollback is a git revert; there is no persistent state.

## Specification

- **export:** Playwright HTML report, JUnit XML, reports/e2e-axe.json, reports/pwa-budgets.json (classrup-pwa-budget-report/v1) and reports/e2e-history.json as CI artifacts; no user data.
- **import:** The suite imports the built PWA from PWA_DIST and seed data through public commands; no external data is imported.
- **backup:** Test code in git; artifacts 14 days.
- **migration rollback:** Pinned Playwright 1.63.0 and axe 4.14.0; upgrades are separate pull requests and rolled back by git revert.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-134-09.T17 | e2e | PS-134-10.R01, PS-134-10.R02, PS-134-10.R03 | export report, upgrade Playwright in a branch, revert | report contains no user data; versions pinned 1.63.0 and 4.14.0 after revert |

## Dependencies

Module depends on: CTR-TST-001, CTR-UX-001, CTR-OBS-001, CTR-IDM-001, CTR-CAP-001, CTR-PRV-001, F17.S01.M01, F15.S01.M01, F15.S01.M02, F14.S01.M03, F07.S01.M01, F07.S01.M02, F07.S01.M03, F11.S01.M02, F01.S04.M01. Predecessor: [domain_schema.md](domain_schema.md).
