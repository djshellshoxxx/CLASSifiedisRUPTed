# PS-136-08 — Observability and performance: Property testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S01.M02 Property testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/property` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-136-08.R01** The runner records numRuns, duration and shrink count per property in reports/property.json.
- **PS-136-08.R02** PR profile completes the whole property suite in at most 60 s on 2 vCPU; nightly in at most 20 min.
- **PS-136-08.R03** A property that takes more than 5 s in the pr profile is flagged in the CI summary.

## Specification

**Metrics**
- classrup_quality_property_runs_total{outcome=pass|fail}
- classrup_quality_property_duration_ms{profile}
- classrup_quality_property_counterexamples_total

**Logs**
- JSON line per failed property {ts, level:error, msg, module, code, testId, seed, path} without generated payloads beyond the minimal counterexample.

**Budgets**
- pr profile whole suite at most 60 s on 2 vCPU; nightly at most 20 min.
- Shrinking is capped at 500 steps or 10 s per failing property.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-136-09.T12 | load | PS-136-08.R01, PS-136-08.R02, PS-136-08.R03 | run all property suites in pr profile on 2 vCPU | finishes in at most 60 s and slow properties are flagged |

## Dependencies

Module depends on: CTR-TST-001, CTR-MNY-001, CTR-IDM-001, CTR-ID-001, CTR-OBS-001, CTR-PRV-001, CTR-FED-001, CTR-CAP-001, F17.S01.M01, F09.S03.M03, F02.S02.M03, F06.S02.M01, F15.S02.M02, F11.S01.M01, F11.S01.M03, F11.S02.M03, F16.S01.M01. Predecessor: [domain_schema.md](domain_schema.md).
