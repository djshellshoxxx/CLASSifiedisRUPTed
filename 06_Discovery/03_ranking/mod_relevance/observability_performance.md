# PS-051-08 — Observability and performance: Relevance ranking

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S03.M01 Relevance ranking](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/ranking/relevance` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-051-08.R01** Scoring cost is measured as part of query latency on relays and in vault diagnostics.
- **PS-051-08.R02** Scoring 1 000 candidates takes at most 20 ms p95 on a Moto G-class device.
- **PS-051-08.R03** Config changes are visible in metrics and logs.

## Specification

**Metrics**
- classrup_discovery_ranking_config_version (gauge, relay)
- classrup_discovery_ranking_score_duration_ms (histogram)
- classrup_discovery_ranking_promoted_applied_total (relay)

**Logs**
- info ranking.config_published {version, correlationId} - no parameters beyond the version.

**Budgets**
- score for 1 000 candidates p95 <= 20 ms on the vault device and <= 10 ms on the relay; publish p95 <= 300 ms.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-051-09.T11 | load | PS-051-08.R01, PS-051-08.R02, PS-051-08.R03 | score 1 000 candidates on emulated device and relay | p95 <= 20 ms and <= 10 ms; metrics exported |

## Dependencies

Module depends on: F06.S02.M01, F06.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
