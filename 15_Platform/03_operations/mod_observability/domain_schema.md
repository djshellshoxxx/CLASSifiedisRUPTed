# PS-121-01 — Domain schema: Observability

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S03.M01 Observability](SPEC.md) · **Scope:** MVP · **Code:** `packages/kernel/src/observability` · **Contracts:** [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-121-01.R01** A log line is one JSON object with ts, level and msg first, then correlationId, module, code and durationMs when present, then the remaining redacted fields.
- **PS-121-01.R02** Metrics are counters, gauges and histograms named classrup_<slug>_<name>_<unit> with labels limited to tenant, module, code and outcome.
- **PS-121-01.R03** A readiness report contains booleans for storage, migrations and outboxLag plus lagMs, and ready is true only when all three hold.

## Specification

**Note:** No persisted entities. Log lines go to an injected sink (relay stdout pipeline or the vault ring buffer); metrics live in process memory and are rendered on demand; readiness is computed per request.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-121-09.T03 | unit | PS-121-01.R01, PS-121-04.R01, PS-121-08.R01, PS-121-10.R02 | child loggers with module and correlationId log one line | exact JSON with ts, level, msg, correlationId, module, code, durationMs first; note dropped |
| TEST-PS-121-09.T05 | unit | PS-121-01.R02, PS-121-02.R01, PS-121-05.R03, PS-121-10.R03 | bad names, reserved suffixes, userId label, duplicate and conflicting registration | registration throws; identical re-registration shares the series; conflicting one throws |
| TEST-PS-121-09.T08 | integration | PS-121-01.R03, PS-121-03.R02, PS-121-06.R03 | pending migration, lag 60 s, throwing lag probe, failing ping, closed storage | unready with the failing check false; ready only when all pass |

## Dependencies

Module depends on: CTR-OBS-001, CTR-PRV-001, CTR-CAP-001, CTR-ERR-001, CTR-TST-001, CTR-SCH-001. Predecessor: [module SPEC](SPEC.md).
