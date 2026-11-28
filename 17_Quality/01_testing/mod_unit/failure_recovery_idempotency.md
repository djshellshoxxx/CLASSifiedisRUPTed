# PS-137-06 — Failure recovery and idempotency: Unit testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S01.M01 Unit testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/unit-conventions` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-137-06.R01** Re-running a unit suite with the same seed and FakeClock start time produces byte-identical JSON reports apart from durations.
- **PS-137-06.R02** Failures print the seed, fixed clock start time and sequence ID generator offset so any failure replays locally with one command.
- **PS-137-06.R03** Retries are disabled (retry: 0) so intermittent failures are never masked. A test that fails at least once in 100 CI runs is quarantined within 24 h by an entry in the code-owned tests/quarantine.yaml {testId, issueUrl, owner, createdAt, expiresAt at most 14 days later}; the runner moves listed tests into a non-blocking quarantine project that still runs and reports them, F17.S03.M02 treats an active entry as a waiver under its V08 rules, an expired entry fails the release gate, and the lint allows skips only through that file.

## Specification

- **idempotency:** A unit run has no side effects, so re-running is always safe; reports are overwritten atomically (write to temp file, rename).
- **concurrency:** Workers run test files in parallel forks; fixtures never share mutable state across files and the shared FakeClock is created per test file.
- **retries:** Test retries are disabled. CI re-runs a failed job once only for infrastructure failures (cache restore, runner loss), never for assertion failures. The nightly flake detector reads the stored JUnit history of the last 100 CI runs, and for a test with at least one failure opens an issue carrying the proposed tests/quarantine.yaml entry; a code owner commits the entry within 24 h. Nothing writes to the default branch automatically.
- **offline:** Unit tests need no network and pass on an air-gapped machine after pnpm install; the guard fails any test that tries to open a socket.
- **partial failure:** If a worker crashes, the run exits 1 with the crashed file named; partial coverage is discarded rather than merged so thresholds never pass on incomplete data.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-137-09.T06 | integration | PS-137-03.R01, PS-137-06.R01 | run the suite twice with the same seed and clock | normalised JSON reports are byte-identical |
| TEST-PS-137-09.T11 | unit | PS-137-06.R03 | configure retry and run an intermittent test | retry is 0 and the intermittent test fails the run |
| TEST-PS-137-09.T12 | abuse | PS-137-02.R03, PS-137-06.R03 | commit that lowers a threshold and a file with it.skip outside tests/quarantine.yaml | code-owner check flags the threshold change; lint rejects it.skip with QUALITY_UNIT_QUARANTINE_INVALID |
| TEST-PS-137-09.T18 | unit | PS-137-06.R02 | force a failing test that uses FakeClock, SeqIdGenerator and the seeded PRNG, then run the printed replay command | the failure output prints the seed, the FakeClock start time and the SeqIdGenerator offset; the replay command reproduces the same failure |
| TEST-PS-137-09.T19 | integration | PS-137-06.R03, PS-137-07.R01 | flake detector over a recorded history of 100 runs with 1 failure of one test; then a quarantine entry with expiresAt in the past and one 15 days long | the detector opens one issue with the proposed entry; the listed test runs in the non-blocking quarantine project; the expired entry fails the gate as an expired waiver and the 15-day entry fails with QUALITY_UNIT_QUARANTINE_INVALID |

## Dependencies

Module depends on: CTR-TST-001, CTR-ID-001, CTR-MNY-001, CTR-OBS-001, CTR-PRV-001, CTR-FED-001, CTR-CAP-001, F15.S02.M03, F15.S02.M02, F16.S01.M01, F16.S02.M01, F11.S01.M03, F09.S03.M03, F06.S02.M01. Predecessor: [domain_schema.md](domain_schema.md).
