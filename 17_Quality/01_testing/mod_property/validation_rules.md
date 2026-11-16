# PS-136-02 — Validation rules: Property testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S01.M02 Property testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/property` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-136-02.R01** Every property declares numRuns and a seed; the pr profile requires numRuns of at least 200 and the nightly profile exactly 10 000.
- **PS-136-02.R02** A property title must be a valid TEST-PS-NNN-PP.Tnn ID matching CTR-TST-001, plus a short human name after a space.
- **PS-136-02.R03** Each property must finish within 10 s per property in the pr profile and 120 s in nightly, otherwise it fails with a timeout code.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | Every property sets numRuns of at least 200 (pr) or exactly 10 000 (nightly) and records its seed | QUALITY_PROP_RUNS_TOO_LOW |
| V02 | Property title starts with a valid TEST-PS-NNN-PP.Tnn ID | QUALITY_PROP_TITLE_INVALID |
| V03 | Property finishes within 10 s (pr) or 120 s (nightly) | QUALITY_PROP_TIMEOUT |
| V04 | Arbitraries for Money generate integer strings only unless named invalid_money | QUALITY_PROP_ARBITRARY_INVALID |
| V05 | A regression file parses and replays to the recorded failure before the fix and passes after | QUALITY_PROP_REGRESSION_STALE |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-136-09.T02 | unit | PS-136-01.R03, PS-136-02.R01 | run an invalid_money arbitrary and a normal one | normal arbitrary yields integer strings only; floats rejected with QUALITY_PROP_ARBITRARY_INVALID |
| TEST-PS-136-09.T03 | unit | PS-136-02.R02 | load properties with valid and invalid titles | invalid titles rejected with QUALITY_PROP_TITLE_INVALID |
| TEST-PS-136-09.T04 | unit | PS-136-02.R03, PS-136-04.R03 | property sleeping 11 s in pr profile | aborted with QUALITY_PROP_TIMEOUT and exit 2 |

## Dependencies

Module depends on: CTR-TST-001, CTR-MNY-001, CTR-IDM-001, CTR-ID-001, CTR-OBS-001, F17.S01.M01. Predecessor: [domain_schema.md](domain_schema.md).
