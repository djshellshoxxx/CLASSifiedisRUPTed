# PS-137-07 — Privacy, retention and abuse: Unit testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S01.M01 Unit testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/unit-conventions` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-137-07.R01** Fixtures contain only synthetic data and the lint rule fails on strings matching real email or phone patterns outside the reserved example.com and 555-01xx ranges.
- **PS-137-07.R02** Coverage and JUnit artifacts are retained 14 days in CI and contain no secrets because tests run without environment secrets.
- **PS-137-07.R03** Tests run with an empty environment allow list so credentials in the developer shell never leak into snapshots.

## Specification

**Data classification**
- Fixtures: synthetic P0 data only.
- Reports: test names, durations, coverage percentages, no payloads.

**Retention**
- CI artifacts (junit, lcov) 14 days; local coverage/ directory is git-ignored and deleted by pnpm clean.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Real user data copied into a fixture | fixture lint blocks real-looking emails, phones and coordinates; code review checklist item |
| T02 | Secret leaked through snapshot or log | tests run with an empty env allow list; secret scanning (F16.S01.M02) runs on repository and artifacts |
| T03 | Test weakened to pass coverage gate | coverage counts only lines executed by assertions-bearing tests in a package; thresholds can be lowered only in a commit reviewed by a code owner of tests/unit-conventions |

**Abuse controls**
- Thresholds file is code-owned; pull requests that lower a threshold require a second reviewer.
- Skipped tests (it.skip and pending-test markers) in spec-covered packages fail the lint rule.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-137-09.T12 | abuse | PS-137-07.R01, PS-137-07.R03 | commit that lowers a threshold and a file with it.skip | code-owner check flags the threshold change; lint rejects it.skip |
| TEST-PS-137-09.T13 | abuse | PS-137-07.R02 | run with a canary secret in the shell environment | canary absent from every artifact and from test process env |

## Dependencies

Module depends on: CTR-TST-001, CTR-ID-001, CTR-MNY-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
