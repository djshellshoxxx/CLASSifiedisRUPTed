# PS-121-05 — Authorization and capabilities: Observability

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S03.M01 Observability](SPEC.md) · **Scope:** MVP · **Code:** `packages/kernel/src/observability` · **Contracts:** [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-121-05.R01** GET /metrics requires a relay access token whose actor is granted platform.metrics.read by relay policy; others get UNAUTHENTICATED without a token or NOT_FOUND with one.
- **PS-121-05.R02** /healthz and /readyz are unauthenticated and reveal only status booleans and lag, never versions, hostnames or per-tenant counts.
- **PS-121-05.R03** Metric labels never contain actor, user or device identifiers; tenant is the only identity-bearing label and is relay-local.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| platform.metrics.read | relay operator (relay policy, CAP-9) | actor authenticated with a relay access token; no vault capability exists because the PWA exports no metrics |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-121-09.T05 | unit | PS-121-01.R02, PS-121-02.R01, PS-121-05.R03, PS-121-10.R03 | bad names, reserved suffixes, userId label, duplicate and conflicting registration | registration throws; identical re-registration shares the series; conflicting one throws |
| TEST-PS-121-09.T09 | integration | PS-121-03.R01, PS-121-03.R03, PS-121-05.R02 | GET /healthz and /readyz on a relay, then draining, then lag 61 s, then closed server | 200 ok; 200 ready with booleans; 503 draining; 503 outboxLag false; connection refused after close |
| TEST-PS-121-09.T10 | abuse | PS-121-04.R02, PS-121-05.R01 | GET /metrics without token, with a member token and with an operator token | 401, 404, 200 text/plain 0.0.4 without principal IDs |

## Dependencies

Module depends on: CTR-OBS-001, CTR-PRV-001, CTR-CAP-001, CTR-ERR-001, CTR-TST-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
