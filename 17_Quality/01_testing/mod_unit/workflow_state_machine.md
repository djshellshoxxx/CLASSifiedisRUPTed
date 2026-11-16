# PS-137-03 — Workflow state machine: Unit testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S01.M01 Unit testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/unit-conventions` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-137-03.R01** There is no entity lifecycle; a unit run is a stateless process with exit code 0 on pass and 1 on any failure.
- **PS-137-03.R02** A run never mutates the working tree outside coverage/ and .vitest-cache/.
- **PS-137-03.R03** Test isolation is per file (isolate: true, pool: forks) so no test observes state from another file.

## Specification

**Note:** Tooling module: no domain entity has a lifecycle. Runs are stateless processes that exit 0 (pass) or non-zero (fail).

### Timeouts and scheduled transitions

_None._

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-137-09.T03 | unit | PS-137-02.R02, PS-137-03.R03 | test calls Math.random, Date.now, new Date(), fetch | each throws QUALITY_UNIT_NONDETERMINISTIC and the run exits 1 |
| TEST-PS-137-09.T05 | integration | PS-137-01.R01, PS-137-03.R02 | run suite and check git status afterwards | only coverage/ and .vitest-cache/ changed |
| TEST-PS-137-09.T06 | integration | PS-137-03.R01, PS-137-06.R01 | run the suite twice with the same seed and clock | normalised JSON reports are byte-identical |
| TEST-PS-137-09.T07 | integration | PS-137-03.R03, PS-137-06.R02 | two test files mutate the same module-level fixture | isolation keeps both green and the shared state is not visible across files |

## Dependencies

Module depends on: CTR-TST-001, CTR-ID-001, CTR-MNY-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
