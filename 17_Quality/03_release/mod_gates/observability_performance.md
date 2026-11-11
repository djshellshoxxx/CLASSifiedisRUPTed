# PS-143-08 — Observability and performance: Release gates

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S03.M02 Release gates](SPEC.md) · **Scope:** MVP · **Code:** `tools/gates` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-143-08.R01** The module records gate durations and the trace coverage ratio in reports/gates.json.
- **PS-143-08.R02** The complete gate run finishes in at most 60 s (excluding the audit network call, at most 30 s).
- **PS-143-08.R03** Trace coverage ratio is reported per module and in total; the release requires 1.0.

## Specification

**Metrics**
- classrup_quality_gates_verdict{gate,outcome}
- classrup_quality_trace_coverage_ratio{module}
- classrup_quality_gates_duration_ms

**Logs**
- JSON line per gate {ts, level, msg, module, gate, outcome, durationMs, code?} with counts only.

**Budgets**
- Full gate run at most 60 s excluding audit; audit at most 30 s.
- Trace over 148 modules and 5 000 requirements at most 10 s.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-143-09.T11 | load | PS-143-08.R01, PS-143-08.R02, PS-143-08.R03 | trace 148 modules with 5 000 requirements | at most 10 s; whole run at most 60 s; coverage ratio per module printed |

## Dependencies

Module depends on: CTR-TST-001, CTR-OBS-001, CTR-SCH-001, F17.S01.M01, F17.S01.M04, F17.S02.M01, F17.S03.M03. Predecessor: [domain_schema.md](domain_schema.md).
