# PS-047-03 — Workflow state machine: Coarse location regions

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S02.M01 Coarse location regions](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/geoprivacy/coarse` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-047-03.R01** The library is stateless and deterministic; there is no lifecycle.
- **PS-047-03.R02** Every function is pure and independent of locale, time and platform floating-point mode beyond IEEE 754 doubles.
- **PS-047-03.R03** Results are returned in a stable sorted order so callers can hash them.

## Specification

**Note:** Stateless pure functions; no entity lifecycle.

### Timeouts and scheduled transitions

_None._

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-047-09.T02 | property | PS-047-01.R02, PS-047-03.R01 | 10 000 random valid points | snap is idempotent, decode(snap(p)) bounds contain p, and all points in one cell snap to the same cell |
| TEST-PS-047-09.T07 | property | PS-047-01.R03, PS-047-03.R02 | random center pairs of 4, 5 and 6 characters | bucketBetween is symmetric, monotone in true distance, uses cell centers only, and a number is never returned |
| TEST-PS-047-09.T08 | unit | PS-047-03.R03, PS-047-06.R03 | cellsForRadius for every allowed radius at the antimeridian, near a pole and at the equator, with 4- and 5-character centers | sorted unique cells, wrap handled, count at most 512, operation count grows linearly with result length |

## Dependencies

Module depends on: CTR-ID-001, CTR-ERR-001, CTR-PRV-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
