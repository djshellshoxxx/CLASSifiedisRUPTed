# PS-138-08 — Observability and performance: Chaos testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S02.M02 Chaos testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/chaos` · **Contracts:** [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-138-08.R01** The harness records classrup_quality_chaos_* metrics and scrapes the relay's own outbox lag gauge (classrup_outbox_lag_ms).
- **PS-138-08.R02** Smoke profile finishes in at most 2 min; nightly profile with 30 seeds per scenario in at most 30 min.
- **PS-138-08.R03** Recovery time per scenario is measured; a trend regression above 2x the baseline is flagged.

## Specification

**Metrics**
- classrup_quality_chaos_scenarios_total{scenario,outcome}
- classrup_quality_chaos_recovery_ms{scenario}
- classrup_quality_chaos_invariant_violations_total{invariant}

**Logs**
- JSON line per scenario {ts, level, msg, module, scenario, seed, recoveryMs, code?} without payload data.

**Budgets**
- Smoke profile at most 2 min; nightly at most 30 min.
- Recovery within 60 s of fault removal; outbox lag back under 60 s (OBS-6 readiness).

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-138-09.T11 | chaos | PS-138-07.R01, PS-138-08.R01, PS-138-08.R03 | run all scenarios and read the report | metrics present, recovery times recorded, seeds listed |
| TEST-PS-138-09.T12 | load | PS-138-08.R02 | smoke and nightly timing | 2 min and 30 min budgets met |

## Dependencies

Module depends on: CTR-EVT-001, CTR-IDM-001, CTR-ERR-001, CTR-FED-001, CTR-TST-001, CTR-OBS-001, F17.S01.M01, F17.S01.M03, F15.S02.M03. Predecessor: [domain_schema.md](domain_schema.md).
