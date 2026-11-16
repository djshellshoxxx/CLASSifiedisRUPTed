# PS-050-03 — Workflow state machine: Ranking fairness

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S03.M02 Ranking fairness](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/ranking/fairness` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-050-03.R01** The library is a pure function over its input; there is no lifecycle.
- **PS-050-03.R02** The same input always yields the same output order and explanations.
- **PS-050-03.R03** Paging over the same snapshot never repeats or drops a result.

## Specification

**Note:** Pure function, no entity lifecycle. rerank(candidates, pageParams, constants) returns { items, nextWindowPosition }.

### Timeouts and scheduled transitions

_None._

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-050-09.T02 | property | PS-050-01.R03, PS-050-03.R01 | random promoted flags | promoted count per page at most floor(0.2 times page size); every promoted item has a promoted explanation key |
| TEST-PS-050-09.T04 | unit | PS-050-02.R03, PS-050-03.R02 | invalid inputs - NaN score, duplicate ids, limit 51, unsorted, promoted flag where not enabled | VALIDATION_FAILED, FAIRNESS_INPUT_UNSORTED or FAIRNESS_PROMOTION_NOT_ALLOWED |
| TEST-PS-050-09.T05 | property | PS-050-03.R01, PS-050-03.R02, PS-050-03.R03 | 200 runs of same input and paging through all pages | identical output, same order on repeated runs, windowed paging never repeats or drops |

## Dependencies

Module depends on: F06.S03.M01, F06.S02.M01, CTR-ID-001, CTR-ERR-001, CTR-SCH-001, CTR-UX-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
