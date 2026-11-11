# PS-050-04 — Commands, queries and events: Ranking fairness

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S03.M02 Ranking fairness](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/ranking/fairness` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-050-04.R01** The module exposes functions only and defines no commands, queries or events.
- **PS-050-04.R02** Callers apply capability checks and pagination, and call rerank exactly once per snapshot window.
- **PS-050-04.R03** Typed errors returned by rerank are mapped by callers to HTTP problems.

## Specification

### Commands

_None._

### Queries

_None._

### Events produced

_None._

### Events consumed

_None._

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| FAIRNESS_PROMOTION_NOT_ALLOWED | 422 | no | a promoted flag was supplied where promotion is not enabled |
| FAIRNESS_INPUT_UNSORTED | 422 | no | candidates are not sorted by descending score with the documented tie-break |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Library module - no commands or queries.

### Example

```
rerank(candidates[200], { pageSize: 20, windowPosition: 0 })
-> items[20]: at most 3 per author, at most 4 promoted (each flagged promoted: true), 2 reserved new-author slots at positions 5 and 12 when qualifying
-> items[0].explain = [{ key: "discovery.explain.text_match", params: { field: "title" } }, { key: "discovery.explain.distance_bucket", params: { bucket: "5_10" } }]
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-050-09.T06 | unit | PS-050-01.R01, PS-050-04.R01 | page with a single author and page size 7 | cap relaxed with only_seller explanation; promoted cap 1 and new-author slots 1 |
| TEST-PS-050-09.T07 | unit | PS-050-04.R01, PS-050-04.R02, PS-050-04.R03 | inspect exports | no commands, queries or events; typed errors only |
| TEST-PS-050-09.T14 | a11y | PS-050-04.R03, PS-050-01.R03 | render explanation keys in the search screen with axe-core | labels are text, localized and announced; zero serious or critical issues |

## Dependencies

Module depends on: F06.S03.M01, F06.S02.M01, CTR-ID-001, CTR-ERR-001, CTR-SCH-001, CTR-UX-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
