# PS-143-02 — Validation rules: Release gates

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S03.M02 Release gates](SPEC.md) · **Scope:** MVP · **Code:** `tools/gates` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-143-02.R01** Traceability is 100 percent: every requirement PS-NNN-PP.Rnn is covered by at least one passing test whose title starts with TEST-PS-NNN-PP.Tnn and whose spec row lists the requirement, or has a documented untested reason (CTR-TST-001 TST-4).
- **PS-143-02.R02** The audit gate fails on any critical or high production vulnerability reported by pnpm audit --prod and fails closed when the audit cannot run.
- **PS-143-02.R03** The a11y and budget gates fail when any report is missing, older than 24 hours, or shows a violation or exceeded budget.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | Every requirement has a passing test with a matching title and covers entry, or a documented untested reason | QUALITY_GATE_TRACE_GAP |
| V02 | No test ID is used twice and every test title refers to an existing requirement | QUALITY_GATE_TRACE_DUPLICATE |
| V03 | pnpm audit --prod reports zero critical and zero high findings | QUALITY_GATE_VULNERABLE |
| V04 | Audit can run and returns a result | QUALITY_GATE_AUDIT_UNAVAILABLE |
| V05 | Accessibility report shows zero serious and zero critical violations and is under 24 h old for this commit | QUALITY_GATE_A11Y |
| V06 | Load and PWA budgets from OBS-4 and OBS-5 are met in reports for this commit | QUALITY_GATE_BUDGET |
| V07 | CHANGELOG.md has a non-empty section for the release version | QUALITY_GATE_CHANGELOG |
| V08 | Waivers are unexpired and at most 14 days long | QUALITY_GATE_WAIVER_EXPIRED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-143-09.T02 | unit | PS-143-01.R02, PS-143-02.R01, PS-143-09.R02 | synthetic repos: gap, skipped test, duplicate ID | QUALITY_GATE_TRACE_GAP and QUALITY_GATE_TRACE_DUPLICATE; skipped test not counted |
| TEST-PS-143-09.T03 | unit | PS-143-02.R02, PS-143-09.R03 | recorded audit JSON: critical, high, moderate, unavailable | critical and high fail; moderate passes; unavailable fails closed |
| TEST-PS-143-09.T04 | unit | PS-143-02.R03, PS-143-06.R02 | a11y and load reports: missing, 25 h old, other commit SHA, with violations | each fails with its code |

## Dependencies

Module depends on: CTR-TST-001, CTR-OBS-001, F17.S01.M01. Predecessor: [domain_schema.md](domain_schema.md).
