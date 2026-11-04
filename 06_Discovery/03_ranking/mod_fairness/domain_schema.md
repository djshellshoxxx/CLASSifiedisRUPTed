# PS-050-01 — Domain schema: Ranking fairness

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S03.M02 Ranking fairness](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/ranking/fairness` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-050-01.R01** Input is a list of scored candidates with documentId, authorDid, score, promoted flag, authorFirstSeenAt and a score component breakdown; output is a re-ordered page list with explanation keys.
- **PS-050-01.R02** The library has no persisted state; the only parameters are constants per CTR-UX-001 and this spec.
- **PS-050-01.R03** Explanation entries are message keys with parameters so every locale can render them.

## Specification

**Note:** Library module with no persisted entity. Constants - windowSize 200, defaultPageSize 20, maxPerAuthorPerPage 3, newAuthorWindowDays 30, newAuthorSlotsPer20 2, newAuthorMinScoreRatio 0.5, promotedMaxShare 0.20. Explanation keys - discovery.explain.text_match, discovery.explain.recent, discovery.explain.distance_bucket, discovery.explain.promoted, discovery.explain.new_author_slot, discovery.explain.only_seller, discovery.explain.default_ranking.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-050-09.T01 | property | PS-050-01.R01, PS-050-02.R01 | 200 random corpora | no page has more than 3 results from one author; no duplicates; no result dropped across pages |
| TEST-PS-050-09.T02 | property | PS-050-01.R03, PS-050-03.R01 | random promoted flags | promoted count per page at most floor(0.2 times page size); every promoted item has a promoted explanation key |
| TEST-PS-050-09.T03 | unit | PS-050-01.R02, PS-050-02.R02 | corpus with qualifying new authors and corpus without | 2 slots filled with qualifying items at positions 5 and 12; none filled when no candidate reaches 50 percent of the top score |
| TEST-PS-050-09.T06 | unit | PS-050-01.R01, PS-050-04.R01 | page with a single author and page size 7 | cap relaxed with only_seller explanation; promoted cap 1 and new-author slots 1 |
| TEST-PS-050-09.T14 | a11y | PS-050-04.R03, PS-050-01.R03 | render explanation keys in the search screen with axe-core | labels are text, localized and announced; zero serious or critical issues |

## Dependencies

Module depends on: F06.S03.M01, F06.S02.M01, CTR-ID-001, CTR-ERR-001, CTR-SCH-001, CTR-UX-001, CTR-TST-001. Predecessor: [module SPEC](SPEC.md).
