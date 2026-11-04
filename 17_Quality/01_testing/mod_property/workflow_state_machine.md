# PS-136-03 — Workflow state machine: Property testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S01.M02 Property testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/property` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-136-03.R01** There is no entity lifecycle; a property run is a stateless process with exit code 0 or 1.
- **PS-136-03.R02** A failing property is shrunk by fast-check to a minimal counterexample and the run always exits 1, never retries with a different seed to turn red green.
- **PS-136-03.R03** Regression cases are promoted automatically: a counterexample from nightly is written to tests/property/regressions/ in a pull request opened by the nightly workflow.

## Specification

**Note:** Tooling module: no domain entity has a lifecycle. Runs are stateless processes that exit 0 (pass) or non-zero (fail).

### Timeouts and scheduled transitions

_None._

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-136-09.T05 | property | PS-136-03.R01, PS-136-03.R02 | planted bug: money allocation drops 1 minor unit | found within 200 runs, shrunk, exit 1, no retry |
| TEST-PS-136-09.T06 | integration | PS-136-03.R03, PS-136-07.R01 | nightly workflow dry run with a planted counterexample | a regression file and pull request body are generated with the seed |

## Dependencies

Module depends on: CTR-TST-001, CTR-MNY-001, CTR-IDM-001, CTR-ID-001, CTR-OBS-001, F17.S01.M01. Predecessor: [domain_schema.md](domain_schema.md).
