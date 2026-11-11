# PS-142-08 — Observability and performance: Compatibility

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S03.M03 Compatibility](SPEC.md) · **Scope:** MVP · **Code:** `tests/compat` · **Contracts:** [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-142-08.R01** The runner records pass or fail per cell, durations and the browser version tested.
- **PS-142-08.R02** N-1 data tests finish in at most 60 s; schema and OpenAPI diff in at most 20 s; browser matrix in at most 25 min nightly.
- **PS-142-08.R03** Automated runs only feature-detect Web Push and check the content-free push payload format (reference and template key only) on the WebKit engine build; real push delivery to an installed iOS 16.4+ PWA is a manual checklist cell recorded with device, iOS version and approver.

## Specification

**Metrics**
- classrup_quality_compat_checks_total{kind,outcome}
- classrup_quality_compat_matrix_cells{browser,outcome}
- classrup_quality_compat_records_upgraded_total

**Logs**
- JSON line per check {ts, level, msg, module, kind, outcome, durationMs, code?} with counts only.

**Budgets**
- N-1 data tests at most 60 s; schema and OpenAPI diff at most 20 s.
- Browser matrix at most 25 min nightly with 6 workers.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-142-09.T12 | load | PS-142-08.R01, PS-142-08.R02 | run N-1 data, diff and matrix suites | 60 s, 20 s and 25 min budgets met; versions recorded |
| TEST-PS-142-09.T13 | e2e | PS-142-08.R03 | WebKit engine build - Web Push feature detection and the content-free push payload | payload holds reference and template key only; the fallback message is shown when push is unsupported; the real iOS 16.4+ installed-PWA push cell stays pending until its manual checklist is signed |

## Dependencies

Module depends on: CTR-SCH-001, CTR-ERR-001, CTR-FED-001, CTR-IOX-001, CTR-TST-001, CTR-OBS-001, F17.S01.M01, F15.S02.M03, F11.S01.M02, F11.S01.M03, F10.S01.M03. Predecessor: [domain_schema.md](domain_schema.md).
