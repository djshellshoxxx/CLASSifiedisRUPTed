# PS-143-02 — Validation rules: Release gates

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S03.M02 Release gates](SPEC.md) · **Scope:** MVP · **Code:** `tools/gates` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-143-02.R01** Traceability is 100 percent: every requirement PS-NNN-PP.Rnn is covered by at least one passing test whose title starts with TEST-PS-NNN-PP.Tnn and whose spec row lists the requirement (for level manual rows, a signed checklist entry instead of a JUnit result), or by an active waiver or quarantine entry, or has a documented untested reason (CTR-TST-001 TST-4).
- **PS-143-02.R02** The audit gate fails on any critical or high production vulnerability reported by pnpm audit --prod and fails closed when the audit cannot run.
- **PS-143-02.R03** The a11y, budget and compat gates fail when any report is missing, older than 24 hours, from another commit SHA, or shows a violation, exceeded budget or compatibility failure.
- **PS-143-02.R04** The spec gate runs node tools/specgen/specgen.mjs check --strict --report for this commit and passes only with 0 errors and GO; the compat gate reads reports/compat.json for this commit and passes only when no QUALITY_COMPAT_* failure is present and every browser cell passes or is policy-unsupported, including the manual Safari and iOS checklist cells.
- **PS-143-02.R05** Manual tests count only through a signed checklist file gates/manual/<version>/<testId>.yaml with result pass, approver handle, date, device, OS and engine version, and the release commit SHA, committed with code-owner approval; it replaces JUnit only for rows with level manual, and waiver and checklist commits print their approver from git metadata.

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
| V08 | Waivers (gates/waivers.yaml and tests/quarantine.yaml entries) are unexpired and at most 14 days long | QUALITY_GATE_WAIVER_EXPIRED |
| V09 | node tools/specgen/specgen.mjs check --strict --report reports GO with 0 errors for this commit | QUALITY_GATE_SPEC |
| V10 | reports/compat.json for this commit shows no QUALITY_COMPAT_* failure and every browser cell passes or is policy-unsupported | QUALITY_GATE_COMPAT |
| V11 | Every waiver, quarantine and manual checklist commit is approved by a code owner and its approver is printed from git metadata | QUALITY_GATE_WAIVER_UNAPPROVED |
| V12 | Every level manual test row has a signed checklist entry with result pass, approver and this release commit SHA under gates/manual/<version>/ | QUALITY_GATE_MANUAL_MISSING |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-143-09.T02 | unit | PS-143-01.R02, PS-143-02.R01, PS-143-09.R02 | synthetic repos: gap, skipped test, duplicate ID | QUALITY_GATE_TRACE_GAP and QUALITY_GATE_TRACE_DUPLICATE; skipped test not counted |
| TEST-PS-143-09.T03 | unit | PS-143-02.R02, PS-143-09.R03 | recorded audit JSON: critical, high, moderate, unavailable | critical and high fail; moderate passes; unavailable fails closed |
| TEST-PS-143-09.T04 | unit | PS-143-02.R03, PS-143-06.R02 | a11y, load, pwa-budgets and compat reports - missing, 25 h old, other commit SHA, with violations (including INP 250 ms) | each fails with its code |
| TEST-PS-143-09.T15 | unit | PS-143-02.R04 | synthetic repo with one undefined error code, and a recorded SPEC_COMPLETENESS_REPORT.md saying NO-GO | spec gate fails with QUALITY_GATE_SPEC in both cases; the clean repo passes |
| TEST-PS-143-09.T16 | unit | PS-143-02.R04 | compat reports - QUALITY_COMPAT_BREAKING_CHANGE present, a failed automated cell, a missing manual Safari checklist cell, no compat.json at all | each fails with QUALITY_GATE_COMPAT; a clean report with a policy-unsupported cell passes |
| TEST-PS-143-09.T17 | unit | PS-143-02.R05 | a manual test row with a signed passing checklist for this commit, one with a checklist for another commit, and one without any | first counts as covered; the other two fail with QUALITY_GATE_MANUAL_MISSING |
| TEST-PS-143-09.T18 | abuse | PS-143-05.R02, PS-143-02.R05 | a waiver commit and a checklist commit without code-owner approval, then the same with approval | unapproved commits fail with QUALITY_GATE_WAIVER_UNAPPROVED naming the committer; approved ones pass and the report prints the approver from git metadata |
| TEST-PS-143-09.T19 | unit | PS-143-02.R01, PS-143-03.R03 | an active tests/quarantine.yaml entry for a failing test, then the same entry after its expiresAt | active entry listed as waived and the gate passes; expired entry fails with QUALITY_GATE_WAIVER_EXPIRED |

## Dependencies

Module depends on: CTR-TST-001, CTR-OBS-001, CTR-SCH-001, F17.S01.M01, F17.S01.M04, F17.S02.M01, F17.S03.M03. Predecessor: [domain_schema.md](domain_schema.md).
