# PS-075-08 — Observability and performance: FX rates and quotes

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S03.M02 FX rates and quotes](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/valuation/rates` · **Contracts:** [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-075-08.R01** Relay metrics follow CTR-OBS-001; the PWA sends no telemetry (OBS-7) and keeps counters in local diagnostics only.
- **PS-075-08.R02** Quote issue meets the local write budget and the relay budget at 50 req/s from cache.
- **PS-075-08.R03** Manual quote counts are visible in the vault's local diagnostics.

## Specification

**Metrics**
- Relay only: classrup_commerce_fx_quotes_total{sourceKind=provider|manual|derived,outcome=issued|stale|suspect|unavailable}
- classrup_commerce_fx_provider_latency_ms{adapter}
- classrup_commerce_fx_cache_age_ms{pair} (gauge)

**Logs**
- info fx_quote.issued {quoteId, base, quote, sourceKind, correlationId} — rate included, no actor identity beyond ID.

**Budgets**
- Vault request p95 ≤ 150 ms when cached, ≤ 1.5 s on provider miss; check p95 ≤ 30 ms (IndexedDB).
- Expiry sweep of 10 000 local quotes ≤ 1 s; relay sweep of 100 000 quotes ≤ 3 s.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-075-09.T11 | load | PS-075-08.R01, PS-075-08.R02, PS-075-08.R03 | 50 req/s for 5 minutes with cache | p95 ≤ 150 ms; sweep of 100 000 quotes ≤ 3 s |

## Dependencies

Module depends on: F09.S03.M01, F09.S03.M03, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
