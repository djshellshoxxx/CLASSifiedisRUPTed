# PS-047-06 — Failure recovery and idempotency: Coarse location regions

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S02.M01 Coarse location regions](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/geoprivacy/coarse` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-047-06.R01** All functions are pure, so repeated calls and retries give identical results.
- **PS-047-06.R02** Invalid input returns an error and never a clamped or approximate value.
- **PS-047-06.R03** No function returns more than 512 cells, and the work of cellsForRadius is bounded linearly by the size of its result.

## Specification

- **idempotency:** Pure functions; the same input always returns the same output.
- **concurrency:** No shared state; safe from workers and multiple tabs.
- **retries:** Not applicable; there is no I/O.
- **offline:** Fully offline; there is no network or data dependency.
- **partial failure:** A call either returns a complete result or an error; there are no partial results.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-047-09.T04 | unit | PS-047-02.R01, PS-047-02.R03, PS-047-06.R02 | NaN, 91, -181, uppercase or invalid-letter cells, precision 7 | the documented error code each time and no clamped, rounded or partial result |
| TEST-PS-047-09.T08 | unit | PS-047-03.R03, PS-047-06.R03 | cellsForRadius for every allowed radius at the antimeridian, near a pole and at the equator, with 4- and 5-character centers | sorted unique cells, wrap handled, count at most 512, operation count grows linearly with result length |
| TEST-PS-047-09.T10 | property | PS-047-05.R01, PS-047-05.R03, PS-047-06.R01 | 200 runs of the same call sequence | byte-identical results, no I/O performed |

## Dependencies

Module depends on: CTR-ID-001, CTR-ERR-001, CTR-PRV-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
