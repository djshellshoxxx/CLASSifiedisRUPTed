# PS-108-08 — Observability and performance: Quiet-hours enforcement

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M01 Quiet-hours enforcement](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/quiet` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-108-08.R01** Relay gate decisions and release lag are measured per CTR-OBS-001; the PWA keeps local diagnostics only (OBS-7).
- **PS-108-08.R02** A gate decision completes in p95 ≤ 20 ms excluding the channel send, and release processes 10 000 items in ≤ 10 s.
- **PS-108-08.R03** Release lag after the window end is alerting when it exceeds 600 s.

## Specification

**Metrics**
- classrup_notify_gate_decisions_total{channel,decision=sent|deferred|dropped,reason} (relay)
- classrup_notify_deferred_depth (gauge, relay)
- classrup_notify_release_lag_ms (histogram, relay)
- classrup_notify_urgent_bypass_total (relay)

**Logs**
- relay info gate.decision {userHash, channel, decision, reason, correlationId} — no template keys beyond category.

**Budgets**
- decision p95 ≤ 20 ms; dispatch API p95 ≤ 300 ms at 100 req/s.
- release 10 000 items ≤ 10 s; jitter distribution uniform within 5 percent over 10 000 samples.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-108-09.T12 | load | PS-108-08.R01, PS-108-08.R02, PS-108-08.R03 | 2 000 users with deferred items released at one window end; 100 dispatch per second | decision p95 ≤ 20 ms, release lag ≤ 600 s, jitter uniform |

## Dependencies

Module depends on: F13.S02.M02, F13.S02.M03, F13.S02.M04, F13.S01.M01, F13.S01.M02, F13.S01.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
