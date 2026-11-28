# PS-136-10 — Import, export, backup and rollback: Property testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S01.M02 Property testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/property` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-136-10.R01** Regression files are the only exported artifact; they are plain JSON and portable, open ones as CI artifacts and fixed ones in git.
- **PS-136-10.R02** Upgrading fast-check changes value generation, so the version is pinned at 4.10.2 and upgrades require a full nightly run with zero new counterexamples before merge.
- **PS-136-10.R03** Rollback is a git revert; regression files remain valid because they store concrete values, not seeds alone.

## Specification

- **export:** Reports in reports/property.json and tests/property/regressions/*.json; no user data.
- **import:** Fixed regression files are imported by replay at start of every run and must parse as schema classrup-regression/v1 with compatible generator and fast-check versions; unparsable or incompatible files fail the run with QUALITY_PROP_REGRESSION_STALE (exit 3).
- **backup:** Regression files are committed to git; CI artifacts retained 30 days.
- **migration rollback:** Pinned fast-check 4.10.2; upgrade only after a zero-counterexample nightly; rollback by git revert.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-136-09.T15 | unit | PS-136-10.R01 | confirm lint on hand-edited regression file | rejected without generator signature |
| TEST-PS-136-09.T16 | integration | PS-136-10.R02, PS-136-10.R03 | upgrade fast-check in a branch then revert | pinned 4.10.2 restored; regressions still replay |

## Dependencies

Module depends on: CTR-TST-001, CTR-MNY-001, CTR-IDM-001, CTR-ID-001, CTR-OBS-001, CTR-PRV-001, CTR-FED-001, CTR-CAP-001, F17.S01.M01, F09.S03.M03, F02.S02.M03, F06.S02.M01, F15.S02.M02, F11.S01.M01, F11.S01.M03, F11.S02.M03, F16.S01.M01. Predecessor: [domain_schema.md](domain_schema.md).
