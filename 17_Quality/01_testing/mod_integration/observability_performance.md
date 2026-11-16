# PS-135-08 — Observability and performance: Integration testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S01.M03 Integration testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/integration` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-135-08.R01** The harness reports per-flow duration and event counts in reports/integration.json.
- **PS-135-08.R02** Each flow completes in at most 5 s and the whole integration suite in at most 120 s on 2 vCPU.
- **PS-135-08.R03** Relay startup in the harness takes at most 2 s per test file.

## Specification

**Metrics**
- classrup_quality_integration_flows_total{outcome=pass|fail}
- classrup_quality_integration_duration_ms{flow}
- classrup_quality_integration_contract_checks_total{outcome}

**Logs**
- JSON line per flow {ts, level, msg, module, flow, durationMs, code?} without payload data (CTR-OBS-001 OBS-1).

**Budgets**
- Each flow at most 5 s; entire suite at most 120 s on 2 vCPU.
- Contract validation of all registered schemas at most 20 s.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-135-09.T12 | integration | PS-135-08.R01, PS-135-08.R02 | run full suite with timing report | each flow at most 5 s, whole suite at most 120 s, report lists durations |
| TEST-PS-135-09.T13 | integration | PS-135-08.R03 | boot relay harness 50 times | startup at most 2 s each |

## Dependencies

Module depends on: CTR-TST-001, CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-IDM-001, CTR-COM-001, CTR-FED-001, CTR-ID-001, F17.S01.M01, F15.S02.M02, F15.S02.M03. Predecessor: [domain_schema.md](domain_schema.md).
