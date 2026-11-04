# PS-117-08 — Observability and performance: API and command bus

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S02.M02 API and command bus](SPEC.md) · **Scope:** MVP · **Code:** `packages/kernel/src/bus` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-117-08.R01** Every command records classrup_command_duration_ms and classrup_command_total{module, outcome, code} and every query records classrup_query_total and classrup_query_duration_ms when a metrics registry is wired (OBS-3).
- **PS-117-08.R02** Bus overhead keeps relay writes within OBS-4; 500 sequential sample commands on SQLite WAL complete with p95 at or below 50 ms.
- **PS-117-08.R03** Each command and query logs exactly one line with correlationId, module, code, durationMs and operation and no input or output values.

## Specification

**Metrics**
- classrup_command_total{module, outcome=ok|replayed|rejected|failed, code}
- classrup_command_duration_ms{module, outcome} histogram, buckets 5..5000 ms
- classrup_query_total{module, outcome, code} and classrup_query_duration_ms{module, outcome}
- classrup_http_requests_total{outcome, code} on the relay HTTP adapter

**Logs**
- info command.completed {correlationId, module, code, durationMs, operation, outcome} — no input or output values.
- error command.failed {correlationId, module, code: INTERNAL, error name and stack} — exception message redacted by the logger.
- info http.request {correlationId, code, durationMs, method, status, ip truncated to /24 or /48}.

**Budgets**
- Bus overhead for one command on SQLite WAL: p95 ≤ 50 ms (relay write budget p95 ≤ 300 ms, OBS-4).
- Vault dispatch with the IndexedDB adapter adds one IndexedDB readwrite transaction per committed command.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-117-09.T20 | unit | PS-117-08.R01 | ok, replayed and rejected commands | counters per outcome and a duration histogram series rendered |
| TEST-PS-117-09.T21 | unit | PS-117-08.R03 | one command with a private title | one log line with ts, level, msg, correlationId, module, code, durationMs first; title absent from logs |
| TEST-PS-117-09.T22 | load | PS-117-08.R02 | 500 sequential idempotent commands on a SQLite WAL file | p95 ≤ 50 ms |

## Dependencies

Module depends on: F15.S02.M03, F15.S03.M01, CTR-ID-001, CTR-ERR-001, CTR-EVT-001, CTR-IDM-001, CTR-CAP-001, CTR-FLG-001, CTR-SCH-001, CTR-OBS-001, CTR-PRV-001, CTR-TST-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
