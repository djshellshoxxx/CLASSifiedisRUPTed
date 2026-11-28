# PS-108-08 — Observability and performance: Quiet-hours enforcement

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M01 Quiet-hours enforcement](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/quiet` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-108-08.R01** Relay gate decisions and release lag are measured per CTR-OBS-001; the PWA keeps local diagnostics only (OBS-7).
- **PS-108-08.R02** A gate decision completes in p95 ≤ 20 ms excluding the channel send, and each release sweep loops over batches of 500 until no item with releaseAt ≤ now remains, bounded by the push send budget of 200 per second.
- **PS-108-08.R03** The expected release lag is at most 300 s jitter + 30 s sweep granularity + due items ÷ 200 s, and an alert fires when the observed lag exceeds that bound by more than 60 s.

## Specification

**Metrics**
- classrup_notify_gate_decisions_total{channel,decision=sent|deferred|dropped,reason} (relay)
- classrup_notify_deferred_depth (gauge, relay)
- classrup_notify_release_lag_ms (histogram, relay) and classrup_notify_release_lag_bound_ms (gauge, relay)
- classrup_notify_urgent_bypass_total and classrup_notify_urgent_downgraded_total (relay)

**Logs**
- relay info gate.decision {userHash, channel, origin, decision, reason, correlationId} — no template keys, references, collapse keys or tags.

**Budgets**
- decision p95 ≤ 20 ms; dispatch API p95 ≤ 300 ms at 100 req/s.
- 10 000 due items drain in ≤ 60 s at 200 sends per second; jitter distribution uniform within 5 percent over 10 000 samples.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-108-09.T12 | load | PS-108-08.R01, PS-108-08.R02, PS-108-08.R03 | 2 000 users with deferred items released at one window end; 10 000 due items; 100 dispatch per second | decision p95 ≤ 20 ms; 10 000 items drain in ≤ 60 s; lag ≤ 300 s + 30 s + backlog ÷ 200 s; jitter uniform; lag alert fires only when the bound is exceeded by 60 s |

## Dependencies

Module depends on: F13.S02.M02, F13.S02.M03, F13.S02.M04, F13.S01.M01, F13.S01.M02, F13.S01.M03, F16.S02.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F16.S02.M02, F07.S02.M01, F15.S01.M01, F12.S03.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
