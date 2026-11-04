# PS-140-08 — Observability and performance: Offline testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S02.M03 Offline testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/offline` · **Contracts:** [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-140-08.R01** The suite records replay latency after reconnect: first command delivered at most 2 s after connectivity returns on the fake network.
- **PS-140-08.R02** OBS-5 offline budget is asserted: the app shell loads offline after the first visit in at most 2.5 s on the 4G profile.
- **PS-140-08.R03** Fake network tests finish in at most 30 s; browser tests in at most 3 min on 2 vCPU.

## Specification

**Metrics**
- classrup_quality_offline_tests_total{outcome}
- classrup_quality_offline_replay_latency_ms
- classrup_quality_offline_duplicate_effects_total

**Logs**
- JSON line per scenario {ts, level, msg, module, scenario, durationMs, code?} with no payloads.

**Budgets**
- Fake network suite at most 30 s; browser suite at most 3 min on 2 vCPU.
- First replayed command delivered at most 2 s after reconnect; app shell offline load at most 2.5 s.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-140-09.T12 | e2e | PS-140-08.R01, PS-140-08.R02, PS-140-08.R03 | reconnect on Pixel 7 4G profile and load shell offline | first replay within 2 s, shell within 2.5 s, browser suite within 3 min |

## Dependencies

Module depends on: CTR-IDM-001, CTR-ERR-001, CTR-UX-001, CTR-TST-001, CTR-OBS-001, F17.S01.M01, F17.S01.M04, F15.S01.M01, F15.S01.M02. Predecessor: [domain_schema.md](domain_schema.md).
