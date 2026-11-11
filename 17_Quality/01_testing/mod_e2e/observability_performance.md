# PS-134-08 — Observability and performance: E2E testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S01.M04 E2E testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/e2e` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-134-08.R01** The suite records per-test duration and Web Vitals measured in Chromium (LCP, INP, CLS) on the 4G Moto G-class profile for the home and listing pages, and writes them with the initial JS size and commit SHA to reports/pwa-budgets.json for the release gates.
- **PS-134-08.R02** Smoke subset (5 tests) finishes in at most 90 s; full suite in at most 8 min on 2 vCPU.
- **PS-134-08.R03** PWA budgets from CTR-OBS-001 OBS-5 are asserted: LCP at most 2.5 s, INP at most 200 ms measured over a scripted interaction (open a listing, tap Make offer), CLS at most 0.1, initial JS at most 150 KiB gzip.

## Specification

**Metrics**
- classrup_quality_e2e_tests_total{outcome=pass|fail|flaky}
- classrup_quality_e2e_axe_violations_total{impact}
- classrup_quality_e2e_duration_ms{project}

**Logs**
- JSON line per test {ts, level, msg, module, testId, project, durationMs, code?} with no request or response bodies.

**Budgets**
- Smoke subset at most 90 s and full suite at most 8 min on 2 vCPU.
- Each test at most 30 s; relay start at most 2 s; browser context creation at most 1 s.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-134-09.T12 | e2e | PS-134-08.R01, PS-134-08.R03 | load home and listing on 4G profile with 4x CPU throttle, then open a listing and tap Make offer | LCP at most 2.5 s, INP at most 200 ms, CLS at most 0.1, initial JS at most 150 KiB gzip; reports/pwa-budgets.json written with commitSha and profile |
| TEST-PS-134-09.T13 | load | PS-134-08.R02 | run smoke and full suites on 2 vCPU | 90 s and 8 min budgets met |

## Dependencies

Module depends on: CTR-TST-001, CTR-UX-001, CTR-OBS-001, CTR-IDM-001, CTR-CAP-001, CTR-PRV-001, F17.S01.M01, F15.S01.M01, F15.S01.M02, F14.S01.M03, F07.S01.M01, F07.S01.M02, F07.S01.M03, F11.S01.M02, F01.S04.M01. Predecessor: [domain_schema.md](domain_schema.md).
