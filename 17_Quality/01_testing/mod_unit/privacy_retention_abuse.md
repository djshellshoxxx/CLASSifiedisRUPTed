# PS-137-07 — Privacy, retention and abuse: Unit testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S01.M01 Unit testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/unit-conventions` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-137-07.R01** Fixtures contain only synthetic data and the lint rule fails on strings matching real email or phone patterns outside the reserved example.com and 555-01xx ranges.
- **PS-137-07.R02** Coverage and JUnit artifacts are retained 14 days in CI and contain no secrets because tests run without environment secrets.
- **PS-137-07.R03** Tests run with an empty environment allow list so credentials in the developer shell never leak into snapshots.

## Specification

**Data classification**
- Fixtures: synthetic P0 data, plus synthetic P3-marked L3 cells and L4 points used only by leak tests and never by public fixtures.
- Reports: test names, durations, coverage percentages, no payloads.

**Retention**
- CI artifacts (junit, lcov) 14 days; local coverage/ directory is git-ignored and deleted by pnpm clean.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Real user data copied into a fixture | fixture lint blocks real-looking emails, phones and any coordinate outside the reserved synthetic P3 fixture set; code review checklist item |
| T02 | Secret leaked through snapshot or log | tests run with an empty env allow list; secret scanning (F16.S01.M02) runs on repository and artifacts |
| T03 | Test weakened to pass coverage gate | coverage counts only lines executed by assertions-bearing tests in a package; thresholds can be lowered only in a commit reviewed by a code owner of tests/unit-conventions |

**Abuse controls**
- Thresholds file is code-owned; pull requests that lower a threshold require a second reviewer.
- Skipped tests (it.skip and pending-test markers) in spec-covered packages fail the lint rule; the only way to take a test out of the blocking run is an unexpired tests/quarantine.yaml entry, which is code-owned and expires after at most 14 days.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-137-09.T01 | unit | PS-137-01.R02, PS-137-01.R03, PS-137-07.R01 | fixtures built from production schemas are inspected by a test that scans values, and the fixture lint runs on a file holding a real-looking email and phone outside example.com and 555-01xx | every fixture validates against its schema and matches no real email or phone pattern; the lint rejects the planted values |
| TEST-PS-137-09.T13 | abuse | PS-137-07.R02, PS-137-07.R03 | run with a canary secret in the shell environment and an env read outside the allow list | canary absent from every artifact, snapshot and from test process env; the read is refused |
| TEST-PS-137-09.T19 | integration | PS-137-06.R03, PS-137-07.R01 | flake detector over a recorded history of 100 runs with 1 failure of one test; then a quarantine entry with expiresAt in the past and one 15 days long | the detector opens one issue with the proposed entry; the listed test runs in the non-blocking quarantine project; the expired entry fails the gate as an expired waiver and the 15-day entry fails with QUALITY_UNIT_QUARANTINE_INVALID |

## Dependencies

Module depends on: CTR-TST-001, CTR-ID-001, CTR-MNY-001, CTR-OBS-001, CTR-PRV-001, CTR-FED-001, CTR-CAP-001, F15.S02.M03, F15.S02.M02, F16.S01.M01, F16.S02.M01, F11.S01.M03, F09.S03.M03, F06.S02.M01. Predecessor: [domain_schema.md](domain_schema.md).
