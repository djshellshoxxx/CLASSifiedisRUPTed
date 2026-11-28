# PS-050-02 — Validation rules: Ranking fairness

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S03.M02 Ranking fairness](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/ranking/fairness` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-050-02.R01** Inputs are validated for finite scores, unique document ids and consistent page parameters before any re-ranking.
- **PS-050-02.R02** Violations return typed errors instead of producing a partial or reordered page.
- **PS-050-02.R03** Parameters outside documented bounds are rejected, never clamped.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | every candidate has a finite non-negative score and a unique documentId | VALIDATION_FAILED |
| V02 | page limit is 1..50, the window start is 0, 200 or 400, the page position lies inside that window, and the carry is a bitmap of at most 200 positions of the previous window | VALIDATION_FAILED |
| V03 | a candidate with promoted true is supplied only when pageParams.promotionEnabled is true (always false in a vault's own ranking); otherwise rerank returns this error and no page | FAIRNESS_PROMOTION_NOT_ALLOWED |
| V04 | candidate list is already sorted by descending score, then newer recency anchor, then ascending projectionCid | FAIRNESS_INPUT_UNSORTED |
| V05 | every candidate has exactly the documented fields (documentId, projectionCid, sourceId, authorDid, score, recencyAnchor, promoted, authorFirstSeenAt, components) and no others | VALIDATION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-050-09.T01 | property | PS-050-01.R01, PS-050-02.R01 | 200 random corpora | no page has more than 3 results from one author; no duplicates; no result dropped across pages |
| TEST-PS-050-09.T03 | unit | PS-050-01.R02, PS-050-02.R02 | corpus with qualifying new authors and corpus without | 2 slots filled with qualifying items at positions 5 and 12; none filled when no candidate reaches 50 percent of the top score |
| TEST-PS-050-09.T04 | unit | PS-050-02.R02, PS-050-02.R03, PS-050-03.R02 | invalid inputs - NaN score, duplicate ids, limit 51, window start 300, unsorted, a promoted flag with promotionEnabled false | VALIDATION_FAILED, VALIDATION_FAILED, VALIDATION_FAILED, VALIDATION_FAILED, FAIRNESS_INPUT_UNSORTED, FAIRNESS_PROMOTION_NOT_ALLOWED; never a partial or reordered page |

## Dependencies

Module depends on: F06.S03.M01, F06.S02.M01, CTR-ID-001, CTR-ERR-001, CTR-SCH-001, CTR-UX-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
