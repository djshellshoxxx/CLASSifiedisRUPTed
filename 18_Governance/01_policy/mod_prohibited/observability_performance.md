# PS-146-08 — Observability and performance: Prohibited items

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S01.M02 Prohibited items](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/policy/prohibited` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-146-08.R01** No telemetry leaves the device (OBS-7); verdict counts are local diagnostics and contain no text.
- **PS-146-08.R02** Evaluation latency is budgeted because it runs on every publish and edit.
- **PS-146-08.R03** Relay evaluation follows OBS-1 to OBS-4.

## Specification

**Metrics**
- classrup_governance_rule_evaluations_total{verdict} (local)
- classrup_governance_rule_evaluate_duration_ms (local histogram)
- classrup_governance_rule_pack_applied_total{outcome} (local)

**Logs**
- info prohibited_rule.evaluated {verdict, matchedCount, packsDigest, correlationId} in local diagnostics; no text and no keywords.

**Budgets**
- evaluate p95 <= 20 ms for 8 000 code points against 2 000 rules, and <= 30 ms when 200 of them are sensitive (n-grams of 1 to 5 tokens hashed once per evaluation), on Moto G-class hardware.
- apply_pack of 2 000 rules p95 <= 800 ms; relay evaluate p95 <= 100 ms at 50 req/s.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-146-09.T13 | load | PS-146-08.R01, PS-146-08.R02, PS-146-08.R03 | 2 000 rules (and the 200-sensitive-rule pack), 8 000 code points on Moto G profile; relay at 50 req/s | evaluate p95 <= 20 ms (<= 30 ms with sensitive rules), apply p95 <= 800 ms, relay p95 <= 100 ms, no telemetry |

## Dependencies

Module depends on: F18.S01.M03, F18.S01.M01, F18.S02.M01, F16.S02.M03, F11.S01.M01, F07.S02.M01, F15.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
