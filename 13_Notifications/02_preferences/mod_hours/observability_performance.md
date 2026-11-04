# PS-105-08 — Observability and performance: Quiet-hours schedule

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M02 Quiet-hours schedule](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/hours` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-105-08.R01** Relay mirror calls are measured per CTR-OBS-001; the PWA keeps local diagnostics only (OBS-7), including tzdata version.
- **PS-105-08.R02** The evaluate function completes in under 1 ms and the relay can evaluate 100 000 users in under 5 s.
- **PS-105-08.R03** Mirror lag and evaluation errors are observable.

## Specification

**Metrics**
- classrup_notify_quiet_mirror_total{outcome=ok|stale|rejected} (relay)
- classrup_notify_quiet_evaluate_ms (histogram)
- classrup_notify_quiet_tzdata_version (info gauge)

**Logs**
- relay info quiet_hours.mirrored {userHash, seq, correlationId} — no time zone and no windows.

**Budgets**
- evaluate p99 ≤ 1 ms per call; 100 000 evaluations ≤ 5 s on a relay core.
- set p95 ≤ 50 ms in the vault; relay mirror p95 ≤ 300 ms at 50 req/s.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-105-09.T12 | load | PS-105-08.R01, PS-105-08.R02, PS-105-08.R03 | 100 000 evaluations and 50 mirror calls per second for 2 minutes | budgets met |

## Dependencies

Module depends on: F13.S02.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
