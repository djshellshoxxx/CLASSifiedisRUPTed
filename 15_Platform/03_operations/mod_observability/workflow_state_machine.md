# PS-121-03 — Workflow state machine: Observability

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S03.M01 Observability](SPEC.md) · **Scope:** MVP · **Code:** `packages/kernel/src/observability` · **Contracts:** [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-121-03.R01** GET /healthz returns 200 with status ok while the process serves requests and performs no dependency checks.
- **PS-121-03.R02** GET /readyz returns 200 only when storage is writable, migrations are current and outbox lag is below 60 s, otherwise 503 with the per-check booleans.
- **PS-121-03.R03** During graceful shutdown readiness turns unready before connections close so load balancers drain traffic.

## Specification

**Note:** No lifecycle entities. Readiness is a pure function of the current probes; the only stateful switch is the HTTP adapter's draining flag set by graceful close (F15.S02.M01 shutdown sequence).

### Timeouts and scheduled transitions

- Readiness outbox-lag threshold: 60 s (OBS-6).
- Graceful close waits up to the configured grace period (default 10 s) for in-flight requests while /readyz reports draining.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-121-09.T08 | integration | PS-121-01.R03, PS-121-03.R02, PS-121-06.R03 | pending migration, lag 60 s, throwing lag probe, failing ping, closed storage | unready with the failing check false; ready only when all pass |
| TEST-PS-121-09.T09 | integration | PS-121-03.R01, PS-121-03.R03, PS-121-05.R02 | GET /healthz and /readyz on a relay, then draining, then lag 61 s, then closed server | 200 ok; 200 ready with booleans; 503 draining; 503 outboxLag false; connection refused after close |

## Dependencies

Module depends on: CTR-OBS-001, CTR-PRV-001, CTR-CAP-001, CTR-ERR-001, CTR-TST-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
