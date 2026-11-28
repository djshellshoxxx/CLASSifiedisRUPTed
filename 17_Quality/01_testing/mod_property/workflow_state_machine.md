# PS-136-03 — Workflow state machine: Property testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S01.M02 Property testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/property` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-136-03.R01** There is no entity lifecycle; a property run is a stateless process with exit code 0 or 1.
- **PS-136-03.R02** A failing property is shrunk by fast-check to a minimal counterexample and the run always exits 1, never retries with a different seed to turn red green.
- **PS-136-03.R03** A nightly counterexample is never committed automatically: the nightly report job uploads it as a classrup-regression/v1 file with status open as an artifact and opens or updates one issue per counterexample hash (issues: write on that schedule-only job, F17.S03.M01). The fix pull request adds the file with status fixed, and CI in that pull request runs the case once on the parent commit, where it must fail, to prove the fail-before-fix condition.

## Specification

**Note:** Tooling module: no domain entity has a lifecycle. Runs are stateless processes that exit 0 (pass) or non-zero (fail).

### Timeouts and scheduled transitions

_None._

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-136-09.T05 | property | PS-136-03.R01, PS-136-03.R02 | planted bug: money allocation drops 1 minor unit | found within 200 runs, shrunk, exit 1, no retry |
| TEST-PS-136-09.T06 | integration | PS-136-03.R03 | nightly workflow dry run with a planted counterexample | a classrup-regression/v1 file with status open is uploaded as an artifact and one issue is opened with the seed; nothing is committed and no pull request is opened |
| TEST-PS-136-09.T23 | integration | PS-136-01.R02, PS-136-03.R03 | regression files - unparsable, unknown property ID, incompatible fast-check major, valid fixed case; a fix pull request run on the parent commit | first three fail with QUALITY_PROP_REGRESSION_STALE and exit 3; fixed case passes; parent-commit run of the new case fails as required |

## Dependencies

Module depends on: CTR-TST-001, CTR-MNY-001, CTR-IDM-001, CTR-ID-001, CTR-OBS-001, CTR-PRV-001, CTR-FED-001, CTR-CAP-001, F17.S01.M01, F09.S03.M03, F02.S02.M03, F06.S02.M01, F15.S02.M02, F11.S01.M01, F11.S01.M03, F11.S02.M03, F16.S01.M01. Predecessor: [domain_schema.md](domain_schema.md).
