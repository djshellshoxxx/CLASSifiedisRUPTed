# PS-141-08 — Observability and performance: Continuous integration

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S03.M01 Continuous integration](SPEC.md) · **Scope:** MVP · **Code:** `.github/workflows` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-141-08.R01** The fast gate completes in at most 10 min p95 on ubuntu-24.04 (2 vCPU) with a warm cache; install at most 60 s warm; PWA build at most 90 s.
- **PS-141-08.R02** Each workflow writes a job summary with per-job durations and the cache hit ratio; a cache hit ratio under 80 percent over 20 runs is flagged.
- **PS-141-08.R03** Initial JS size of the built PWA is reported (budget 150 KiB gzip) and fails the build job when exceeded.

## Specification

**Metrics**
- classrup_quality_ci_duration_ms{job}
- classrup_quality_ci_cache_hit_ratio
- classrup_quality_ci_runs_total{outcome}

**Logs**
- Job summary lines with job, duration, outcome; secrets masked by GitHub; no payloads.

**Budgets**
- Fast gate at most 10 min p95; install warm at most 60 s; PWA build at most 90 s; e2e smoke at most 90 s.
- Nightly workflow at most 60 min total.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-141-09.T10 | load | PS-141-08.R01, PS-141-08.R02 | timings of 20 recorded fast-gate runs | p95 at most 10 min; cache hit ratio reported |
| TEST-PS-141-09.T11 | unit | PS-141-08.R03 | build artifact exceeding 150 KiB gzip initial JS | build job fails |

## Dependencies

Module depends on: CTR-TST-001, CTR-OBS-001, F17.S01.M01, F17.S03.M02, F16.S01.M02. Predecessor: [domain_schema.md](domain_schema.md).
