# PS-107-08 — Observability and performance: Channel opt-in/opt-out

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M03 Channel opt-in/opt-out](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/opt` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-107-08.R01** Relay registration and unsubscribe calls are measured per CTR-OBS-001 without logging tokens; the PWA keeps local diagnostics only (OBS-7).
- **PS-107-08.R02** Register and unsubscribe meet p95 ≤ 300 ms at 50 req/s and vault commands p95 ≤ 50 ms.
- **PS-107-08.R03** Expiry sweep lag is observable.

## Specification

**Metrics**
- classrup_notify_channel_consents_total{channel,status} (relay)
- classrup_notify_unsubscribe_total{outcome=ok|invalid|rate_limited} (relay)
- classrup_notify_consent_sweep_lag_ms (gauge, relay)

**Logs**
- relay info channel.registered {consentIdHash, channel, correlationId} — no token and no DID.

**Budgets**
- register and unsubscribe p95 ≤ 300 ms at 50 req/s; vault opt_in/opt_out p95 ≤ 50 ms.
- Sweep expires 100 000 consents in ≤ 30 s.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-107-09.T10 | load | PS-107-08.R01, PS-107-08.R02, PS-107-08.R03 | 50 register and unsubscribe per second for 2 minutes and sweep 100 000 | budgets met |

## Dependencies

Module depends on: F10.S01.M01, F07.S01.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
