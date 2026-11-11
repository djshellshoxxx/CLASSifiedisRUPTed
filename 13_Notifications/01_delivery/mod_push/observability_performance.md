# PS-104-08 — Observability and performance: Web push delivery

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S01.M01 Web push delivery](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/delivery/push` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-104-08.R01** Send outcomes, latencies and expirations are measured per CTR-OBS-001 with no endpoints, topics or payloads in logs.
- **PS-104-08.R02** Send p95 ≤ 500 ms to a healthy push service and the relay can send 200 pushes per second.
- **PS-104-08.R03** Alerts fire on multi-user VAPID rejection patterns, origin pauses and failure ratios.

## Specification

**Metrics**
- classrup_notify_push_sends_total{outcome=ok|gone|throttled|transient|rejected|endpoint_rejected|origin_paused|too_large}
- classrup_notify_push_subscriptions{status}
- classrup_notify_push_send_latency_ms (histogram)
- classrup_notify_push_origin_paused_total (alert at > 0)

**Logs**
- info push.sent {subscriptionIdHash, form, httpStatus, correlationId} — no endpoint, keys, topic, collapse tag or payload.

**Budgets**
- send p95 ≤ 500 ms; subscribe p95 ≤ 300 ms at 50 req/s.
- 200 pushes per second sustained for 5 minutes with p95 ≤ 500 ms.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-104-09.T12 | load | PS-104-08.R01, PS-104-08.R02, PS-104-08.R03 | 200 pushes per second for 5 minutes to the fake service with an injected multi-user rejection | p95 ≤ 500 ms, metrics exported, origin pause alert fires |

## Dependencies

Module depends on: F13.S02.M03, F16.S02.M02, F07.S02.M01, F15.S01.M01, F15.S02.M01, F12.S03.M03, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
