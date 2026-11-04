# PS-073-08 — Observability and performance: Currency registry

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S03.M01 Currency registry](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/valuation/currency` · **Contracts:** [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-073-08.R01** Lookups are cached and meet a very low latency budget.
- **PS-073-08.R02** The PWA sends no telemetry (OBS-7); counters stay in local diagnostics and relay metrics follow CTR-OBS-001 where a relay hosts the list.
- **PS-073-08.R03** Cache staleness is observable.

## Specification

**Metrics**
- Local diagnostics: classrup_commerce_currency_lookups_total{result=hit|miss|unknown}
- classrup_commerce_currency_cache_age_ms (gauge)

**Logs**
- info currency.status_changed {currencyId, code, from, to, correlationId}

**Budgets**
- get/list p95 ≤ 20 ms on IndexedDB; in-process cached resolve p99 ≤ 0.1 ms.
- Vault seed of 190 rows completes within 500 ms.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-073-09.T11 | load | PS-073-08.R01, PS-073-08.R02, PS-073-08.R03 | 1 000 lookups per second for 2 minutes | p95 ≤ 20 ms and metrics exported |

## Dependencies

Module depends on: F09.S03.M03, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
