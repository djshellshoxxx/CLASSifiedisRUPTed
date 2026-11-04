# PS-087-03 — Workflow state machine: Federated dedup

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S02.M02 Federated dedup](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/relay_sync/dedup` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-087-03.R01** The library has no state of its own; the lifecycle of a buffered envelope is the FederatedRecord machine of F11.S01.M02.
- **PS-087-03.R02** Decision precedence is fixed as duplicate, then reject, then fork, then next, then buffer.
- **PS-087-03.R03** The decision for a given input never depends on arrival order of unrelated authors.

## Specification

**Note:** Stateless; the 24 h buffer timeout is enforced by the sweep in F11.S01.M02 using expired() from this module.

### Timeouts and scheduled transitions

_None._

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-087-09.T02 | property | PS-087-01.R02, PS-087-03.R01, PS-087-03.R02, PS-087-09.R03 | random permutations and duplicates of a 50-envelope chain through decide and drain | final accepted order equals seq order; every arrival yields at most one next per seq |
| TEST-PS-087-09.T05 | unit | PS-087-02.R01, PS-087-03.R03, PS-087-04.R01 | order of unrelated authors permuted | each author's decision identical regardless of order |
| TEST-PS-087-09.T07 | unit | PS-087-03.R01, PS-087-06.R01, PS-087-06.R02 | expired() with buffer rows at 23 h 59 min and 24 h 00 min; backwards clock jump | only the 24 h row expires; jump does not extend the window |

## Dependencies

Module depends on: F11.S01.M03, CTR-FED-001, CTR-ERR-001, CTR-OBS-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
