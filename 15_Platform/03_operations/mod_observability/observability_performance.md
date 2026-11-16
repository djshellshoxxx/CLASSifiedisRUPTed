# PS-121-08 — Observability and performance: Observability

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S03.M01 Observability](SPEC.md) · **Scope:** MVP · **Code:** `packages/kernel/src/observability` · **Contracts:** [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-121-08.R01** Child loggers carry module and correlationId bindings so one request can be traced across modules by correlation ID.
- **PS-121-08.R02** Observability overhead is small; 10 000 redacted log lines and 100 000 metric updates complete in under 1 s.
- **PS-121-08.R03** Histograms use default millisecond buckets aligned with the OBS-4 budgets (including 150 and 300 ms) so budget compliance is visible.

## Specification

**Metrics**
- classrup_metrics_dropped_series_total{module=<metric name>}
- Default histogram buckets: 5, 10, 25, 50, 100, 150, 250, 300, 500, 1000, 2500, 5000 ms

**Logs**
- Every line: {ts, level, msg, correlationId?, module?, code?, durationMs?, …redacted fields}.

**Budgets**
- 10 000 log lines plus 100 000 metric updates < 1 s on the reference relay.
- /metrics render for 50 families and 1 000 series ≤ 50 ms.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-121-09.T03 | unit | PS-121-01.R01, PS-121-04.R01, PS-121-08.R01, PS-121-10.R02 | child loggers with module and correlationId log one line | exact JSON with ts, level, msg, correlationId, module, code, durationMs first; note dropped |
| TEST-PS-121-09.T07 | unit | PS-121-06.R02, PS-121-08.R03, PS-121-09.R02 | counter with escaped labels, gauge, histogram with three observations | exact Prometheus text with cumulative buckets, sum and count; default buckets include 150 and 300 |
| TEST-PS-121-09.T12 | load | PS-121-08.R02 | 10 000 log lines and 50 000 counter plus 50 000 histogram updates | total under 1 s |

## Dependencies

Module depends on: CTR-OBS-001, CTR-PRV-001, CTR-CAP-001, CTR-ERR-001, CTR-TST-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
