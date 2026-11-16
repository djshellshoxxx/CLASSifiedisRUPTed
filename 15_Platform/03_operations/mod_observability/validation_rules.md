# PS-121-02 — Validation rules: Observability

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S03.M01 Observability](SPEC.md) · **Scope:** MVP · **Code:** `packages/kernel/src/observability` · **Contracts:** [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-121-02.R01** Metric names must match classrup_<slug>_<name>_<unit> without reserved suffixes and label names must be in the allowlist; violations throw at registration as programmer errors.
- **PS-121-02.R02** Series per metric are capped (default 1 000); extra label combinations are dropped and counted in classrup_metrics_dropped_series_total.
- **PS-121-02.R03** Log levels below the configured level are discarded and unknown levels are rejected when the logger is created.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | metric name matches ^classrup_<slug>(_<part>)+$ and does not end in _bucket, _count or _sum | INTERNAL |
| V02 | metric label names ⊆ {tenant, module, code, outcome} and samples use only declared labels | INTERNAL |
| V03 | histogram buckets are finite and strictly increasing | INTERNAL |
| V04 | /metrics caller presents a relay access token | UNAUTHENTICATED |
| V05 | /metrics caller holds platform.metrics.read under relay policy | NOT_FOUND |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-121-09.T04 | unit | PS-121-02.R03, PS-121-06.R01 | warn level logger, invalid level, throwing sink | debug and info discarded; creation throws; no exception to the caller and dropped count 2 |
| TEST-PS-121-09.T05 | unit | PS-121-01.R02, PS-121-02.R01, PS-121-05.R03, PS-121-10.R03 | bad names, reserved suffixes, userId label, duplicate and conflicting registration | registration throws; identical re-registration shares the series; conflicting one throws |
| TEST-PS-121-09.T06 | unit | PS-121-02.R02 | four tenants into a metric capped at two series | two series kept; dropped counter 2 |

## Dependencies

Module depends on: CTR-OBS-001, CTR-PRV-001, CTR-CAP-001, CTR-ERR-001, CTR-TST-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
