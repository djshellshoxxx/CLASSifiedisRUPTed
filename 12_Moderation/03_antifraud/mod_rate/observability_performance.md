# PS-099-08 — Observability and performance: Rate limiting

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M03 Rate limiting](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/rate` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-099-08.R01** Consume outcomes and latency are measured per CTR-OBS-001 with labels limited to tenant, module, code and outcome.
- **PS-099-08.R02** Consume adds at most 1 ms p95 per request on a relay and at most 0.2 ms in a vault.
- **PS-099-08.R03** Persisted snapshots and denial rates are alerting metrics.

## Specification

**Metrics**
- classrup_moderation_rate_decisions_total{outcome=allowed|denied}
- classrup_moderation_rate_denied_total{code=RATE_LIMITED,class}
- classrup_moderation_rate_consume_us (histogram)
- classrup_moderation_rate_snapshot_age_ms (gauge)

**Logs**
- relay warn rate.exceeded {capabilityClass, scope, prefix (/24 or /48), count, correlationId} — no actor key.

**Budgets**
- consume p95 ≤ 1 ms on a relay at 5 000 consumes per second; ≤ 0.2 ms in a vault.
- 100 000 live buckets use at most 64 MiB of memory; snapshot of 100 000 buckets completes in ≤ 500 ms.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-099-09.T12 | load | PS-099-08.R01, PS-099-08.R02, PS-099-08.R03 | 5 000 consumes per second for 5 minutes with 100 000 live buckets | p95 ≤ 1 ms, memory ≤ 64 MiB, snapshot ≤ 500 ms |

## Dependencies

Module depends on: F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
