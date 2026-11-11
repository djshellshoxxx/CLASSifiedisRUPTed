# PS-139-08 — Observability and performance: Load testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S02.M01 Load testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/load` · **Contracts:** [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-139-08.R01** The driver exports the metrics it measures: classrup_quality_load_latency_ms by scenario and percentile, error rate and achieved rate.
- **PS-139-08.R02** The relay's own metrics (CTR-OBS-001 OBS-2, operator-only /metrics) are scraped every 5 s during the run by the separate scraper with its per-run operator token for the test relay, never by the load driver, and stored in the report.
- **PS-139-08.R03** Smoke profile completes in at most 3 min including seeding; standard in at most 15 min including seeding of 100 000 listings.

## Specification

**Metrics**
- classrup_quality_load_latency_ms{scenario,percentile}
- classrup_quality_load_error_ratio{scenario}
- classrup_quality_load_achieved_rate{scenario}

**Logs**
- JSON line per scenario {ts, level, msg, module, scenario, p95Ms, errorRatio, code?} without payload data.

**Budgets**
- Reads p95 at most 150 ms and writes p95 at most 300 ms at 50 req/s (OBS-4).
- Search p95 at most 200 ms over 100 000 listings; cycle search p95 at most 250 ms on 5 000 edges, max length 5.
- Smoke at most 3 min, standard at most 15 min, soak at most 60 min plus seeding.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-139-09.T01 | unit | PS-139-01.R01, PS-139-01.R02, PS-139-08.R02 | generate a report from a recorded run | schema valid; environment fields and scraped metrics present |
| TEST-PS-139-09.T08 | load | PS-139-04.R01, PS-139-04.R02, PS-139-08.R03 | run all eight scenarios under smoke and standard | each scenario reports; durations within 3 and 15 min |
| TEST-PS-139-09.T13 | load | PS-139-08.R01, PS-139-09.R03 | planted 400 ms write slowdown at 50 req/s for 5 min | write_mailbox p95 above 300 ms and verdict red |

## Dependencies

Module depends on: CTR-OBS-001, CTR-TST-001, CTR-IDM-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, F17.S01.M01, F15.S02.M01, F15.S02.M03, F12.S03.M03, F11.S01.M02, F08.S01.M01, F04.S01.M02, F07.S01.M02. Predecessor: [domain_schema.md](domain_schema.md).
