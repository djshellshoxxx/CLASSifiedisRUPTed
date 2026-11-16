# PS-047-02 — Validation rules: Coarse location regions

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S02.M01 Coarse location regions](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/geoprivacy/coarse` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-047-02.R01** Coordinates, precisions, radii and cell strings are validated before any computation, and violations return typed errors.
- **PS-047-02.R02** Public-precision enforcement is a separate guard that every module producing public payloads must call.
- **PS-047-02.R03** Radius rules enforce the 5 km minimum and the 512 cell cap.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | latitude is a finite number in -90..90 and longitude in -180..180 | DISCOVERY_COORD_INVALID |
| V02 | precision is 4, 5 or 6 and a cell string uses only the 32 geohash characters in lowercase | VALIDATION_FAILED |
| V03 | assertPublicCell accepts only cells of length 0 (none), 4 or 5 | DISCOVERY_PRECISION_FORBIDDEN |
| V04 | radiusKm is one of 5, 10, 25, 50, 100 | DISCOVERY_RADIUS_TOO_SMALL |
| V05 | cellsForRadius result has at most 512 cells | DISCOVERY_RADIUS_TOO_LARGE |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-047-09.T04 | unit | PS-047-02.R01, PS-047-02.R03 | NaN, 91, -181, uppercase or invalid-letter cells, precision 7 | the documented error code each time and no result |
| TEST-PS-047-09.T05 | unit | PS-047-01.R03, PS-047-02.R02 | assertPublicCell with 4, 5, 6 and 11 characters and empty string | accepted for 0, 4, 5; DISCOVERY_PRECISION_FORBIDDEN for 6 and 11 |
| TEST-PS-047-09.T06 | unit | PS-047-02.R03 | radius 1, 3, 7, 100, 200 km | DISCOVERY_RADIUS_TOO_SMALL for 1, 3, 7 and 200; 100 accepted with at most 512 cells |

## Dependencies

Module depends on: CTR-ID-001, CTR-ERR-001, CTR-PRV-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
