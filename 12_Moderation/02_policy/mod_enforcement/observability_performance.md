# PS-096-08 — Observability and performance: Enforcement actions

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S02.M01 Enforcement actions](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/policy/enforcement` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-096-08.R01** Relay command latency and outcomes are measured per CTR-OBS-001; logs never contain facts summaries or keys.
- **PS-096-08.R02** Apply meets the write budget (p95 ≤ 300 ms) at 50 req/s.
- **PS-096-08.R03** Queue age and pending-notice counts are alerting metrics.

## Specification

**Metrics**
- classrup_moderation_cases_total{outcome=opened|actioned|no_action|duplicate}
- classrup_moderation_actions_total{kind,outcome=applied|reverted|expired}
- classrup_moderation_case_queue_age_ms (gauge: oldest open case)
- classrup_moderation_pending_notice (gauge)

**Logs**
- relay info action.applied {actionId, caseId, kind, correlationId} — no keys, no facts.

**Budgets**
- apply and close p95 ≤ 300 ms; list p95 ≤ 150 ms for 50 items.
- Expiry sweep processes 10 000 expiring actions in ≤ 5 s.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-096-09.T14 | load | PS-096-08.R01, PS-096-08.R02, PS-096-08.R03 | 50 req/s mixed apply and list for 5 minutes; 10 000 expiring actions | p95 ≤ 300 ms, sweep ≤ 5 s, no keys in logs |

## Dependencies

Module depends on: F12.S02.M03, F12.S01.M02, F16.S01.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
