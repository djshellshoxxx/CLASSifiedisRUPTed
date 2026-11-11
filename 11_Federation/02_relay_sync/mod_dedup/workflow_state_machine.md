# PS-087-03 — Workflow state machine: Federated dedup

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S02.M02 Federated dedup](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/relay_sync/dedup` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-087-03.R01** The library has no state of its own; the lifecycle of a buffered or held envelope is the FederatedRecord machine of F11.S01.M02.
- **PS-087-03.R02** Decision precedence is fixed as duplicate, then held_on_fork, then fork, then anchor, then next, then backfill, then reanchor, then buffer.
- **PS-087-03.R03** The decision for a given input never depends on arrival order of unrelated authors.

## Specification

**Note:** Stateless; the 24 h buffer window is enforced by the sweep in F11.S01.M02 using expired() from this module, which releases expired rows with chainGap instead of dropping them; held_on_fork rows have no time limit and follow the conflict resolution.

### Timeouts and scheduled transitions

_None._

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-087-09.T02 | property | PS-087-03.R01, PS-087-03.R02, PS-087-09.R02 | random permutations and duplicates of a 50-envelope chain arriving at a fresh receiver | anchor at the first arrival; final accepted set equals the chain in seq order; every arrival yields at most one placement per seq; nothing lost |
| TEST-PS-087-09.T05 | unit | PS-087-03.R03, PS-087-04.R01 | order of unrelated authors permuted | each author's decision identical regardless of order |
| TEST-PS-087-09.T16 | unit | PS-087-03.R02 | open conflict at (X, k1, pub, 7) with candidates A and B; envelope seq 8 with prev = A | held_on_fork, not buffered and not released at 24 h; after resolution keeping A it drains as next |

## Dependencies

Module depends on: F11.S01.M03, CTR-FED-001, CTR-ERR-001, CTR-OBS-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
