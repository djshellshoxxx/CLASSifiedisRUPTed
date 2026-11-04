# PS-047-09 — Contract and acceptance tests: Coarse location regions

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S02.M01 Coarse location regions](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/geoprivacy/coarse` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-047-09.R01** Every requirement is covered by at least one automated test, including published geohash test vectors.
- **PS-047-09.R02** Property tests prove snapping idempotence, containment and neighbor symmetry.
- **PS-047-09.R03** A privacy test proves that no public-facing function can output a cell longer than 5 characters.

## Specification

See the module test table below (all processes).

**Fixtures:** Vectors - encode(42.6, -5.6, 5) = ezs42; encode(57.64911, 10.40744, 11) = u4pruydqqvj; encode(0, 0, 5) = s0000; encode(-90, -180, 4) = 0000; encode(90, 180, 4) = zzzz.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-047-09.T01 | unit | PS-047-01.R01, PS-047-01.R02 | known geohash vectors for encode and decode at precisions 4, 5, 6 | exact strings above and decode centers within cell bounds |
| TEST-PS-047-09.T02 | property | PS-047-01.R02, PS-047-03.R01 | 10 000 random valid points | snap is idempotent, decode(snap(p)) bounds contain p, and all points in one cell snap to the same cell |
| TEST-PS-047-09.T03 | property | PS-047-01.R02 | neighbors of random cells | symmetric relation, 8 distinct neighbors except at poles, wrap across longitude 180 |
| TEST-PS-047-09.T04 | unit | PS-047-02.R01, PS-047-02.R03 | NaN, 91, -181, uppercase or invalid-letter cells, precision 7 | the documented error code each time and no result |
| TEST-PS-047-09.T05 | unit | PS-047-01.R03, PS-047-02.R02 | assertPublicCell with 4, 5, 6 and 11 characters and empty string | accepted for 0, 4, 5; DISCOVERY_PRECISION_FORBIDDEN for 6 and 11 |
| TEST-PS-047-09.T06 | unit | PS-047-02.R03 | radius 1, 3, 7, 100, 200 km | DISCOVERY_RADIUS_TOO_SMALL for 1, 3, 7 and 200; 100 accepted with at most 512 cells |
| TEST-PS-047-09.T07 | property | PS-047-01.R03, PS-047-03.R02 | random center pairs | bucketBetween is symmetric, monotone in true distance, and a number is never returned |
| TEST-PS-047-09.T08 | unit | PS-047-03.R03 | cellsForRadius at the antimeridian, near a pole and at the equator | sorted unique cells, wrap handled, count within 512 |
| TEST-PS-047-09.T09 | unit | PS-047-04.R01, PS-047-04.R02, PS-047-04.R03 | inspect exports | no command, query, event or capability exists; errors map to documented codes |
| TEST-PS-047-09.T10 | property | PS-047-05.R01, PS-047-05.R03, PS-047-06.R01 | 200 runs of the same call sequence | byte-identical results, no I/O performed |
| TEST-PS-047-09.T11 | abuse | PS-047-05.R02, PS-047-07.R01, PS-047-07.R02, PS-047-07.R03 | scan the public API for functions returning coordinates or cells longer than 5 characters | none found; contract helper fails a fake publisher that skips the guard |
| TEST-PS-047-09.T12 | load | PS-047-08.R01, PS-047-08.R02, PS-047-08.R03 | benchmark encode, snap, cellsForRadius(100) 100 000 times | within budgets |
| TEST-PS-047-09.T13 | unit | PS-047-09.R01, PS-047-09.R02, PS-047-09.R03, PS-047-06.R02, PS-047-06.R03 | traceability run over PS-047 | every requirement maps to a passing test; vectors file unchanged |
| TEST-PS-047-09.T14 | unit | PS-047-10.R01, PS-047-10.R02, PS-047-10.R03 | check that the package exports no persistence | no export section; vectors compatible across library versions |

## Acceptance criteria

- All tests T01-T14 pass in CI with the published geohash vectors.
- No public function can emit a cell longer than 5 characters or a numeric distance.
- Property tests run 200 times per PR and 10 000 nightly with recorded seeds.

## Dependencies

Module depends on: CTR-ID-001, CTR-ERR-001, CTR-PRV-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
