# PS-136-06 — Failure recovery and idempotency: Property testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S01.M02 Property testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/property` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-136-06.R01** Replaying the same seed and path reproduces the same counterexample deterministically on the pinned fast-check and Node 22 versions.
- **PS-136-06.R02** Property runs are pure, write only to reports/ and tests/property/regressions/, and are safe to re-run any number of times.
- **PS-136-06.R03** A property that mutates shared state in a test double resets it in a beforeEach hook; the lint rule forbids module-level mutable state in property files.

## Specification

- **idempotency:** Property runs have no side effects other than report files and optional regression pull requests, which are opened at most once per distinct counterexample hash.
- **concurrency:** Each property runs in its own worker with its own PRNG derived from the base seed plus property index so parallelism does not change results.
- **retries:** No automatic retries of failed properties. The nightly workflow reruns infrastructure failures once.
- **offline:** Fully offline; no network access is permitted and the unit guard from F17.S01.M01 applies.
- **partial failure:** If one property crashes the worker, remaining properties still run and the final exit code is 1 with all failures listed; partial reports are written even on crash.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-136-09.T01 | unit | PS-136-01.R01, PS-136-01.R02, PS-136-06.R01 | write a counterexample, reload it and replay | the JSON round-trips and replay reproduces the same failure |
| TEST-PS-136-09.T09 | property | PS-136-06.R01, PS-136-06.R02 | run the same seed twice | identical counterexamples and identical reports |
| TEST-PS-136-09.T10 | unit | PS-136-06.R03 | two properties mutate one test double | reset hook isolates them; lint rejects module-level mutable state |

## Dependencies

Module depends on: CTR-TST-001, CTR-MNY-001, CTR-IDM-001, CTR-ID-001, CTR-OBS-001, F17.S01.M01. Predecessor: [domain_schema.md](domain_schema.md).
