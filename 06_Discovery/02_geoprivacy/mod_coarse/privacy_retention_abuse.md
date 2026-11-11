# PS-047-07 — Privacy, retention and abuse: Coarse location regions

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S02.M01 Coarse location regions](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/geoprivacy/coarse` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-047-07.R01** Snapping discards sub-cell information irreversibly; the library never returns the input coordinates and never adds noise that could be averaged out.
- **PS-047-07.R02** The public guard is the single enforcement point for the L2 maximum in every public, search and federated payload.
- **PS-047-07.R03** The library never logs coordinates.

## Specification

**Data classification**
- Input latitude and longitude are P3 at the caller and are never retained here; output cells at L1 and L2 are P0 when the owner chooses to publish them, L3 cells are P2.

**Retention**
- None; the library keeps no state.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Repeated queries with jittered points average out to the true position | cell snapping instead of jitter - every point in a cell yields the same cell, so repetition reveals nothing finer than the cell (PRV-1) |
| T02 | A module accidentally publishes a 6-character cell | assertPublicCell is required by contract tests of every publishing module and fails the build if missing |
| T03 | Distance values leak finer position through arithmetic on bucket edges | distances are cell-center to cell-center and only the bucket is returned, never the number |

**Abuse controls**
- Hard caps - 512 cells per radius, radius set {5, 10, 25, 50, 100}, precision set {4, 5, 6}.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-047-09.T05 | unit | PS-047-02.R02, PS-047-07.R02 | assertPublicCell with 4, 5, 6 and 11 characters and empty string | accepted for 0, 4, 5; DISCOVERY_PRECISION_FORBIDDEN for 6 and 11 |
| TEST-PS-047-09.T11 | abuse | PS-047-05.R02, PS-047-07.R01, PS-047-07.R02, PS-047-07.R03 | scan the public API for functions returning coordinates or cells longer than 5 characters | none found; contract helper fails a fake publisher that skips the guard |

## Dependencies

Module depends on: CTR-ID-001, CTR-ERR-001, CTR-PRV-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
