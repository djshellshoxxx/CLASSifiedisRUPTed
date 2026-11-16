# PS-102-08 — Observability and performance: Email delivery

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S01.M02 Email delivery](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/delivery/email` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-102-08.R01** Sends, bounces and queue depth are measured per CTR-OBS-001 with no addresses in logs.
- **PS-102-08.R02** Send submission p95 ≤ 500 ms to the transport and the relay can submit 50 emails per second.
- **PS-102-08.R03** Bounce rate above 5 percent over 1 hour raises an operator alert.

## Specification

**Metrics**
- classrup_notify_email_deliveries_total{status=sent|settled|bounced|failed}
- classrup_notify_email_bounce_ratio (gauge, alert > 0.05 over 1 h)
- classrup_notify_email_queue_depth (gauge)
- classrup_notify_email_verify_total{outcome=ok|expired|invalid}

**Logs**
- info email.sent {deliveryIdHash, templateKey, correlationId} — no address, no subject beyond key.

**Budgets**
- submission p95 ≤ 500 ms; add/verify/remove p95 ≤ 300 ms at 20 req/s.
- 50 emails per second sustained for 5 minutes on the log adapter.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-102-09.T11 | load | PS-102-08.R01, PS-102-08.R02, PS-102-08.R03 | 50 emails per second for 5 minutes with 6 percent injected bounces | latency within budget and bounce alert fires |

## Dependencies

Module depends on: F13.S02.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
