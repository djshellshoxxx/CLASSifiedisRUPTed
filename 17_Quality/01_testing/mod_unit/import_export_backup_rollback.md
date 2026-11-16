# PS-137-10 — Import, export, backup and rollback: Unit testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S01.M01 Unit testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/unit-conventions` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-137-10.R01** Configuration is plain TypeScript in the repository; there is no user data to export or import.
- **PS-137-10.R02** Fixture factories are versioned with the production schemas; upgrading vitest or fast-check versions is a reviewed change to the pinned lockfile.
- **PS-137-10.R03** Rollback is a git revert of the configuration commit; thresholds are only ever raised in a separate commit from feature work.

## Specification

- **export:** Not applicable to user data. Test results are exported as reports/unit.xml (JUnit), reports/unit.json and coverage/lcov.info.
- **import:** Not applicable: tests import no user data; fixtures are generated from code.
- **backup:** Configuration lives in git; CI keeps artifacts 14 days.
- **migration rollback:** Revert the configuration commit; thresholds are only raised, never lowered, outside reviewed commits.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-137-09.T16 | integration | PS-137-10.R01, PS-137-10.R02, PS-137-10.R03 | upgrade vitest in a branch with a lockfile change, then revert it | suite results identical before and after revert; no stored data is involved |

## Dependencies

Module depends on: CTR-TST-001, CTR-ID-001, CTR-MNY-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
