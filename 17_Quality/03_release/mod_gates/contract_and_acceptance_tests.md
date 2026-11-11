# PS-143-09 — Contract and acceptance tests: Release gates

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S03.M02 Release gates](SPEC.md) · **Scope:** MVP · **Code:** `tools/gates` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-143-09.R01** Every requirement of this module is covered by at least one automated test using the mapping in section 09.
- **PS-143-09.R02** Gate logic is tested with synthetic repositories: full coverage, one missing test, one skipped test, a duplicate ID, an expired waiver.
- **PS-143-09.R03** The audit gate is tested with recorded audit JSON for critical, high, moderate and unavailable cases.

## Specification

See the module test table below (all processes).

**Fixtures:** Synthetic repos: full coverage, one gap, one skipped test, a duplicate ID, an expired waiver, one undefined error code (spec NO-GO), a manual row with and without a signed checklist, an active and an expired quarantine entry, a waiver commit without code-owner approval; recorded audit JSON (critical, high, moderate, unavailable); reports/compat.json variants (clean, QUALITY_COMPAT_BREAKING_CHANGE, failed automated cell, missing manual cell); reports/pwa-budgets.json variants (INP 140 ms, INP 250 ms); a test row whose covers lists a requirement it shares no key term with, with no review, with an approved review and with a review whose text hash is stale; fixed commit SHA a1b2c3d.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-143-09.T01 | unit | PS-143-01.R01, PS-143-01.R03, PS-143-06.R01 | generate gates.json on the full-coverage repo | schema valid; no user data fields; verdict GO |
| TEST-PS-143-09.T02 | unit | PS-143-01.R02, PS-143-02.R01, PS-143-09.R02 | synthetic repos: gap, skipped test, duplicate ID | QUALITY_GATE_TRACE_GAP and QUALITY_GATE_TRACE_DUPLICATE; skipped test not counted |
| TEST-PS-143-09.T03 | unit | PS-143-02.R02, PS-143-09.R03 | recorded audit JSON: critical, high, moderate, unavailable | critical and high fail; moderate passes; unavailable fails closed |
| TEST-PS-143-09.T04 | unit | PS-143-02.R03, PS-143-06.R02 | a11y, load, pwa-budgets and compat reports - missing, 25 h old, other commit SHA, with violations (including INP 250 ms) | each fails with its code |
| TEST-PS-143-09.T05 | unit | PS-143-03.R01, PS-143-03.R02 | run all gates on a repo with two failures | all gates run; verdict fails; both failures listed |
| TEST-PS-143-09.T06 | unit | PS-143-03.R03, PS-143-05.R02 | waiver 15 days long, expired, valid | long and expired fail QUALITY_GATE_WAIVER_EXPIRED; valid passes and is reported as waived |
| TEST-PS-143-09.T07 | integration | PS-143-04.R01, PS-143-04.R02, PS-143-04.R03 | run each script and the release workflow dry-run | documented exit codes; gates.md attached |
| TEST-PS-143-09.T08 | abuse | PS-143-05.R01, PS-143-05.R03 | attempt to disable a gate by env var and inspect network calls | gate still runs; only registry audit endpoint is called |
| TEST-PS-143-09.T09 | integration | PS-143-06.R03 | crash one gate by injecting an exception | reported failed; others complete |
| TEST-PS-143-09.T10 | integration | PS-143-07.R01, PS-143-07.R02, PS-143-07.R03 | inspect reports for data and retention config | only package, advisory, test IDs; handles only in waivers; retention 1 year |
| TEST-PS-143-09.T11 | load | PS-143-08.R01, PS-143-08.R02, PS-143-08.R03 | trace 148 modules with 5 000 requirements | at most 10 s; whole run at most 60 s; coverage ratio per module printed |
| TEST-PS-143-09.T12 | integration | PS-143-09.R01 | traceability tool run on this module | every requirement of this module maps to a passing test |
| TEST-PS-143-09.T13 | unit | PS-143-10.R01, PS-143-10.R02, PS-143-10.R03 | feed unknown fields and unknown major versions; remove tools/gates in a branch | unknown fields ignored; unknown major rejected; release workflow fails closed |
| TEST-PS-143-09.T14 | unit | PS-143-06.R01 | same inputs run twice with a different clock | identical verdict and report body |
| TEST-PS-143-09.T15 | unit | PS-143-02.R04 | synthetic repo with one undefined error code, and a recorded SPEC_COMPLETENESS_REPORT.md saying NO-GO | spec gate fails with QUALITY_GATE_SPEC in both cases; the clean repo passes |
| TEST-PS-143-09.T16 | unit | PS-143-02.R04 | compat reports - QUALITY_COMPAT_BREAKING_CHANGE present, a failed automated cell, a missing manual Safari checklist cell, no compat.json at all | each fails with QUALITY_GATE_COMPAT; a clean report with a policy-unsupported cell passes |
| TEST-PS-143-09.T17 | unit | PS-143-02.R05 | a manual test row with a signed passing checklist for this commit, one with a checklist for another commit, and one without any | first counts as covered; the other two fail with QUALITY_GATE_MANUAL_MISSING |
| TEST-PS-143-09.T18 | abuse | PS-143-05.R02, PS-143-02.R05 | a waiver commit and a checklist commit without code-owner approval, then the same with approval | unapproved commits fail with QUALITY_GATE_WAIVER_UNAPPROVED naming the committer; approved ones pass and the report prints the approver from git metadata |
| TEST-PS-143-09.T19 | unit | PS-143-02.R01, PS-143-03.R03 | an active tests/quarantine.yaml entry for a failing test, then the same entry after its expiresAt | active entry listed as waived and the gate passes; expired entry fails with QUALITY_GATE_WAIVER_EXPIRED |
| TEST-PS-143-09.T20 | unit | PS-143-02.R06 | test rows covering a requirement with a shared key term, with no shared key term and no review, with no shared key term and an approved mapping review, and with a review whose text hash is stale after the requirement text changed | shared key term counts; no overlap without review and stale review fail with QUALITY_GATE_TRACE_MAPPING and do not count; approved matching review counts and is listed in the report |
| TEST-PS-143-09.T21 | unit | PS-143-02.R06 | key term extraction on texts with stopwords, short tokens, plural and ing forms, error codes and mixed case | only tokens of 4 or more characters outside tools/gates/stopwords.txt remain, case-folded and with the trailing s, es, ed or ing removed; error codes stay single tokens; same input gives the same terms |
| TEST-PS-143-09.T22 | abuse | PS-143-02.R06, PS-143-05.R02 | mapping review commit without code-owner approval, then the same review with approval | unapproved review fails with QUALITY_GATE_WAIVER_UNAPPROVED and the mapping is not counted; approved review counts and its approver is printed from git metadata |

## Acceptance criteria

- The release gate fails when any requirement lacks a passing test and passes at 100 percent traceability.
- A critical or high production vulnerability or an unavailable audit blocks the release.
- Any serious accessibility violation or exceeded budget blocks the release.
- The gate report is attached to every release and waivers expire within 14 days.
- A spec NO-GO, a compatibility failure, a missing compat report or a missing manual checklist blocks the release.
- A test-to-requirement mapping without a shared key term and without a valid approved mapping review does not count as coverage and blocks the release.

## Dependencies

Module depends on: CTR-TST-001, CTR-OBS-001, CTR-SCH-001, F17.S01.M01, F17.S01.M04, F17.S02.M01, F17.S03.M03. Predecessor: [domain_schema.md](domain_schema.md).
