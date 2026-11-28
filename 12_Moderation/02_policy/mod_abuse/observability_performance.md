# PS-095-08 — Observability and performance: Abuse policy

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S02.M03 Abuse policy](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/policy/abuse` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-095-08.R01** Publish and read latency and outcomes are measured per CTR-OBS-001.
- **PS-095-08.R02** Public reads meet the read budget (p95 ≤ 150 ms) and are cache friendly.
- **PS-095-08.R03** In-force index freshness is observable.

## Specification

**Metrics**
- classrup_moderation_policy_versions_total{outcome=published|retired,changeType}
- classrup_moderation_policy_in_force (gauge: number of rules in force)
- classrup_moderation_policy_index_age_ms (gauge)
- classrup_moderation_policy_governance_events_total{outcome=drafted|ignored|discarded|flagged}

**Logs**
- relay info policy.published {ruleId, version, changeType, correlationId}.

**Budgets**
- list_public p95 ≤ 150 ms for 100 rules; publish p95 ≤ 300 ms; check_citable p95 ≤ 2 ms in-process.
- In-force index refresh ≤ 1 s after effectiveAt.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-095-09.T11 | load | PS-095-08.R01, PS-095-08.R02, PS-095-08.R03 | 200 req/s public reads for 5 minutes | p95 ≤ 150 ms; index refresh ≤ 1 s after effective time |

## Dependencies

Module depends on: F18.S01.M02, F18.S02.M01, F16.S02.M02, F16.S01.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
