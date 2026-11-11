# PS-137-08 — Observability and performance: Unit testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S01.M01 Unit testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/unit-conventions` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-137-08.R01** The module records suite duration, test count and coverage per package as run metrics in the JSON report.
- **PS-137-08.R02** Unit suite wall time on the 2 vCPU CI runner stays under 60 s for the whole workspace and under 5 s per package.
- **PS-137-08.R03** Slowest 10 tests are listed in each CI summary and any test over 500 ms is flagged for review.

## Specification

**Metrics**
- classrup_quality_unit_tests_total{outcome=pass|fail|skip} (CI summary)
- classrup_quality_unit_duration_ms (whole suite)
- classrup_quality_unit_coverage_ratio{module} (lines)

**Logs**
- JSON line per failed test {ts, level:error, msg, module, code, testId, seed} with no payload values (CTR-OBS-001 OBS-1).

**Budgets**
- Whole-workspace unit run at most 60 s on 2 vCPU; per package at most 5 s.
- Coverage report generation at most 10 s.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-137-09.T14 | load | PS-137-08.R01, PS-137-08.R02, PS-137-08.R03 | run the full workspace unit suite on the 2 vCPU CI profile | wall time at most 60 s, per package at most 5 s, slowest list printed |

## Dependencies

Module depends on: CTR-TST-001, CTR-ID-001, CTR-MNY-001, CTR-OBS-001, CTR-PRV-001, CTR-FED-001, CTR-CAP-001, F15.S02.M03, F15.S02.M02, F16.S01.M01, F16.S02.M01, F11.S01.M03, F09.S03.M03, F06.S02.M01. Predecessor: [domain_schema.md](domain_schema.md).
