# PS-137-06 — Failure recovery and idempotency: Unit testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S01.M01 Unit testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/unit-conventions` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-137-06.R01** Re-running a unit suite with the same seed and FakeClock start time produces byte-identical JSON reports apart from durations.
- **PS-137-06.R02** Failures print the seed, fixed clock start time and sequence ID generator offset so any failure replays locally with one command.
- **PS-137-06.R03** Retries are disabled (retry: 0) so intermittent failures are never masked; a test that fails once in 100 CI runs is quarantined within 24 h with an issue link.

## Specification

- **idempotency:** A unit run has no side effects, so re-running is always safe; reports are overwritten atomically (write to temp file, rename).
- **concurrency:** Workers run test files in parallel forks; fixtures never share mutable state across files and the shared FakeClock is created per test file.
- **retries:** Test retries are disabled. CI re-runs a failed job once only for infrastructure failures (cache restore, runner loss), never for assertion failures.
- **offline:** Unit tests need no network and pass on an air-gapped machine after pnpm install; the guard fails any test that tries to open a socket.
- **partial failure:** If a worker crashes, the run exits 1 with the crashed file named; partial coverage is discarded rather than merged so thresholds never pass on incomplete data.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-137-09.T06 | integration | PS-137-03.R01, PS-137-06.R01 | run the suite twice with the same seed and clock | normalised JSON reports are byte-identical |
| TEST-PS-137-09.T07 | integration | PS-137-03.R03, PS-137-06.R02 | two test files mutate the same module-level fixture | isolation keeps both green and the shared state is not visible across files |
| TEST-PS-137-09.T11 | unit | PS-137-06.R03 | configure retry and run an intermittent test | retry is 0 and the intermittent test fails the run |

## Dependencies

Module depends on: CTR-TST-001, CTR-ID-001, CTR-MNY-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
