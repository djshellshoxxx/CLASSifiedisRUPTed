# PS-124-08 — Observability and performance: Feature flags

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S04.M02 Feature flags](SPEC.md) · **Scope:** MVP · **Code:** `packages/platform/src/configuration/flags` · **Contracts:** [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-124-08.R01** Relay-scope evaluation and change outcomes are measured per CTR-OBS-001; the vault sends no telemetry and keeps local counters only (OBS-7).
- **PS-124-08.R02** Evaluation is fast enough to run on every command and render without measurable cost.
- **PS-124-08.R03** Cache hit ratio and stale reads are observable on the relay.

## Specification

**Metrics**
- classrup_platform_flag_changes_total{outcome=ok|dependency|locked|conflict|forbidden}
- classrup_platform_flag_eval_duration_ms (relay histogram)
- classrup_platform_flag_cache_total{outcome=hit|miss}
- classrup_platform_flag_eval_source_total{source=committed|last_committed|fail_closed}

**Logs**
- info flag.changed {scope, key, value, tenantHash} on the relay; warn flag.settings_unreadable {scope, source}; local diagnostic line in the vault; no reasons or personal data.

**Budgets**
- Evaluation p95 ≤ 1 ms from cache and ≤ 10 ms cold for the full catalog.
- platform.flag.set_relay and reset_relay p95 ≤ 300 ms (OBS-4); cascade of 50 keys ≤ 500 ms.
- Settings > Features renders the full catalog's toggles in ≤ 100 ms and adds ≤ 8 KiB gzip to the deferred chunk.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-124-09.T05 | unit | PS-124-03.R03, PS-124-08.R02 | write then evaluate in the same process and in a second process | same process sees new value immediately; second within 30 s |
| TEST-PS-124-09.T13 | load | PS-124-08.R02, PS-124-08.R03 | 50 req/s evaluations plus 5 changes per second on relay for 5 minutes | eval p95 ≤ 1 ms cached, change p95 ≤ 300 ms, metrics exported |
| TEST-PS-124-09.T14 | unit | PS-124-08.R01 | metrics scrape after mixed outcomes | counters per CTR-OBS-001 naming, no user ids as labels |

## Dependencies

Module depends on: F15.S04.M01, F15.S04.M03, F15.S02.M03, F16.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FLG-001, CTR-ID-001, CTR-IDM-001, CTR-ERR-001, CTR-EVT-001, CTR-CAP-001, CTR-OBS-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
