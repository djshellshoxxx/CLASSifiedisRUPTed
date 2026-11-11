# PS-136-02 — Validation rules: Property testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S01.M02 Property testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/property` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-136-02.R01** Every property declares numRuns and a seed; the pr profile requires numRuns of at least 200 and the nightly profile exactly 10 000.
- **PS-136-02.R02** A property title must be a valid TEST-PS-NNN-PP.Tnn ID matching CTR-TST-001, plus a short human name after a space.
- **PS-136-02.R03** Each property must finish within 10 s per property in the pr profile and 120 s in nightly, otherwise it fails with a timeout code.
- **PS-136-02.R04** Geoprivacy properties generate raw L4 latitude and longitude and cells of precision 6 to 9, and assert for any input: every public, search or federated output is a cell of precision 5 or coarser equal to the F06.S02.M01 snap of the input (assertPublicCell, N8; CTR-PRV-001 PRV-1, PRV-3); every shown distance is one of the PRV-2 buckets computed cell to cell with a search radius of at least 5 km; and repeated queries from origins shifted inside one cell return identical results.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | Every property sets numRuns of at least 200 (pr) or exactly 10 000 (nightly) and records its seed | QUALITY_PROP_RUNS_TOO_LOW |
| V02 | Property title starts with a valid TEST-PS-NNN-PP.Tnn ID | QUALITY_PROP_TITLE_INVALID |
| V03 | Property finishes within 10 s (pr) or 120 s (nightly) | QUALITY_PROP_TIMEOUT |
| V04 | Arbitraries for Money generate integer strings only unless named invalid_money | QUALITY_PROP_ARBITRARY_INVALID |
| V05 | A regression file parses as classrup-regression/v1, its property ID exists, its generator and fast-check versions are compatible and its stored concrete value decodes against the current arbitrary; the replayed example must then pass, and a failure is an ordinary counterexample (exit 1) | QUALITY_PROP_REGRESSION_STALE |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-136-09.T02 | unit | PS-136-01.R03, PS-136-02.R01 | run an invalid_money arbitrary and a normal one | normal arbitrary yields integer strings only; floats rejected with QUALITY_PROP_ARBITRARY_INVALID |
| TEST-PS-136-09.T03 | unit | PS-136-02.R02 | load properties with valid and invalid titles | invalid titles rejected with QUALITY_PROP_TITLE_INVALID |
| TEST-PS-136-09.T04 | unit | PS-136-02.R03, PS-136-04.R03 | property sleeping 11 s in pr profile | aborted with QUALITY_PROP_TIMEOUT and exit 2 |
| TEST-PS-136-09.T21 | property | PS-136-02.R04 | geoprivacy - raw L4 points and precision 6 to 9 cells through publish, search and federation export builders and distance bucketing from shifted origins; planted leaks (precision-6 cell in a projection, raw km distance, radius 2 km accepted) | correct code holds for 200 runs; each planted leak is found within 200 runs and shrunk |

## Dependencies

Module depends on: CTR-TST-001, CTR-MNY-001, CTR-IDM-001, CTR-ID-001, CTR-OBS-001, CTR-PRV-001, CTR-FED-001, CTR-CAP-001, F17.S01.M01, F09.S03.M03, F02.S02.M03, F06.S02.M01, F15.S02.M02, F11.S01.M01, F11.S01.M03, F11.S02.M03, F16.S01.M01. Predecessor: [domain_schema.md](domain_schema.md).
