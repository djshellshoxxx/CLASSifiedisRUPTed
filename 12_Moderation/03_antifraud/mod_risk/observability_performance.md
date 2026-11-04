# PS-100-08 — Observability and performance: Risk scoring

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M01 Risk scoring](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/risk` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-100-08.R01** Relay recompute outcomes and level distribution are measured per CTR-OBS-001 without keys; the vault keeps local diagnostics only.
- **PS-100-08.R02** Recompute meets p95 ≤ 50 ms for subjects with up to 5 000 signals.
- **PS-100-08.R03** Level changes per hour are observable to detect model anomalies.

## Specification

**Metrics**
- classrup_moderation_risk_assessments_total{level,outcome=created|unchanged}
- classrup_moderation_risk_elevations_total{from,to}
- classrup_moderation_risk_recompute_ms (histogram)

**Logs**
- relay info risk.elevated {assessmentId, previousLevel, level, correlationId} — no subject key, no factors.

**Budgets**
- recompute p95 ≤ 50 ms; get p95 ≤ 100 ms; daily sweep of 10 000 elevated subjects ≤ 60 s.
- Vault recompute on Moto G profile ≤ 150 ms.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-100-09.T11 | load | PS-100-08.R01, PS-100-08.R02, PS-100-08.R03 | 200 recomputes per second for 5 minutes; sweep 10 000 subjects | p95 ≤ 50 ms, sweep ≤ 60 s |

## Dependencies

Module depends on: F12.S03.M02, F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
