# F06.S03 — 03_ranking

**Status:** SPECIFIED. **Parent:** [F06](../SPEC.md).

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Modules

| Module | Name | Status | Responsibility |
|---|---|---|---|
| F06.S03.M01 | [Relevance ranking](mod_relevance/SPEC.md) | SPECIFIED | Deterministic score: BM25 text, recency decay, distance bucket, promotion boost capped and labelled 'Promoted'. |
| F06.S03.M02 | [Ranking fairness](mod_fairness/SPEC.md) | SPECIFIED | Diversity re-ranking (max 3 per seller per page), new-seller exposure floor, promoted ≤ 20 % of a page, explainability string per result. |

## Aggregation

Modules in this subfeature share the feature package `packages/discovery` (or the app path in each module) and integrate only through the events and ports below; no module reads another module's tables.

### Event dependencies

_None._
