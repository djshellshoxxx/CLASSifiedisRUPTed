# PS-050-03 — Workflow state machine: Ranking fairness

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S03.M02 Ranking fairness](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/ranking/fairness` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-050-03.R01** The library is a pure function over its input; there is no lifecycle.
- **PS-050-03.R02** The same input always yields the same output order and explanations.
- **PS-050-03.R03** Paging over the same snapshot never repeats or drops a result.

## Specification

**Note:** Pure function, no entity lifecycle. rerank(candidates, pageParams { pageSize, windowStart, position, carry, promotionEnabled }, constants) returns { items, nextPosition, nextWindowStart, carry }. Carry rule - results deferred by the author cap or the promoted cap at the end of window n are placed first in the candidate order of window n+1 (in their original score order); in the last window (400..499) deferred results fill the remaining pages in score order, with pages shortened rather than breaking a cap, so every candidate up to depth 500 appears exactly once. auditPage(page, constants) returns { followed, violations: max_per_author|promoted_share|promoted_unlabelled }.

### Timeouts and scheduled transitions

_None._

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-050-09.T02 | property | PS-050-01.R03, PS-050-03.R01 | random promoted flags | promoted count per page at most floor(0.2 times page size); every promoted item has a promoted explanation key |
| TEST-PS-050-09.T04 | unit | PS-050-02.R02, PS-050-02.R03, PS-050-03.R02 | invalid inputs - NaN score, duplicate ids, limit 51, window start 300, unsorted, a promoted flag with promotionEnabled false | VALIDATION_FAILED, VALIDATION_FAILED, VALIDATION_FAILED, VALIDATION_FAILED, FAIRNESS_INPUT_UNSORTED, FAIRNESS_PROMOTION_NOT_ALLOWED; never a partial or reordered page |
| TEST-PS-050-09.T05 | property | PS-050-03.R01, PS-050-03.R02, PS-050-03.R03 | 200 runs of the same 500-candidate input, paging through all 25 pages across windows 0, 200 and 400 with the carry passed through the cursor | identical output on repeated runs; all 500 results appear exactly once; caps hold on every page including carried results |

## Dependencies

Module depends on: F06.S03.M01, F06.S02.M01, CTR-ID-001, CTR-ERR-001, CTR-SCH-001, CTR-UX-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
