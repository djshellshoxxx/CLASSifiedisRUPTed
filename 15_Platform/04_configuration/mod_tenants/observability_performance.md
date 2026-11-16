# PS-125-08 — Observability and performance: Tenants

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S04.M03 Tenants](SPEC.md) · **Scope:** MVP · **Code:** `packages/platform/src/configuration/tenants` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-125-08.R01** Relay tenant operations are measured per CTR-OBS-001 with the tenant label limited to a hashed short id, never names.
- **PS-125-08.R02** Configuration reads are served from cache and meet the read budget; the vault sends no telemetry (OBS-7).
- **PS-125-08.R03** Event delivery lag for tenant events is observable so that consumers apply configuration promptly.

## Specification

**Metrics**
- classrup_platform_tenant_changes_total{outcome=ok|conflict|invalid}
- classrup_platform_tenant_config_read_duration_ms (relay histogram)
- classrup_platform_tenant_count{status=active|suspended|archived}

**Logs**
- info tenant.configured {tenantHash, changed[]}; info tenant.status_changed {tenantHash, from, to} — no display names, no operator keys.

**Budgets**
- platform.tenant.get p95 ≤ 20 ms cached and ≤ 150 ms cold (OBS-4); configure p95 ≤ 300 ms.
- Cache TTL 30 s; consumers apply platform.tenant.configured within 2 s p95 under the dispatcher budget.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-125-09.T12 | load | PS-125-08.R02, PS-125-08.R03 | 50 req/s tenant reads and 5 configure per second for 5 minutes | read p95 ≤ 20 ms cached, configure p95 ≤ 300 ms, consumers apply within 2 s |
| TEST-PS-125-09.T13 | unit | PS-125-08.R01 | metrics scrape | counters per CTR-OBS-001 naming, tenant label hashed, no names |

## Dependencies

Module depends on: F15.S02.M03, F15.S04.M01, CTR-ID-001, CTR-IDM-001, CTR-ERR-001, CTR-EVT-001, CTR-CAP-001, CTR-MNY-001, CTR-PRV-001, CTR-IOX-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
