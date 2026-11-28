# PS-050-09 — Contract and acceptance tests: Ranking fairness

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S03.M02 Ranking fairness](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/ranking/fairness` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-050-09.R01** Every requirement is covered by at least one automated test, including property tests for the constraints.
- **PS-050-09.R02** Golden fixtures pin exact output orders for small candidate sets.
- **PS-050-09.R03** A fairness regression test checks constraints on a 10 000-candidate synthetic corpus.

## Specification

See the module test table below (all processes).

**Fixtures:** Synthetic corpora - 200 candidates from 12 authors (3 prolific, 4 new), 30 promoted, deterministic scores; fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-050-09.T01 | property | PS-050-01.R01, PS-050-02.R01 | 200 random corpora | no page has more than 3 results from one author; no duplicates; no result dropped across pages |
| TEST-PS-050-09.T02 | property | PS-050-01.R03, PS-050-03.R01 | random promoted flags | promoted count per page at most floor(0.2 times page size); every promoted item has a promoted explanation key |
| TEST-PS-050-09.T03 | unit | PS-050-01.R02, PS-050-02.R02 | corpus with qualifying new authors and corpus without | 2 slots filled with qualifying items at positions 5 and 12; none filled when no candidate reaches 50 percent of the top score |
| TEST-PS-050-09.T04 | unit | PS-050-02.R02, PS-050-02.R03, PS-050-03.R02 | invalid inputs - NaN score, duplicate ids, limit 51, window start 300, unsorted, a promoted flag with promotionEnabled false | VALIDATION_FAILED, VALIDATION_FAILED, VALIDATION_FAILED, VALIDATION_FAILED, FAIRNESS_INPUT_UNSORTED, FAIRNESS_PROMOTION_NOT_ALLOWED; never a partial or reordered page |
| TEST-PS-050-09.T05 | property | PS-050-03.R01, PS-050-03.R02, PS-050-03.R03 | 200 runs of the same 500-candidate input, paging through all 25 pages across windows 0, 200 and 400 with the carry passed through the cursor | identical output on repeated runs; all 500 results appear exactly once; caps hold on every page including carried results |
| TEST-PS-050-09.T06 | unit | PS-050-01.R01, PS-050-04.R01 | page with a single author and page size 7 | cap relaxed with only_seller explanation; promoted cap 1 and new-author slots 1 |
| TEST-PS-050-09.T07 | unit | PS-050-04.R01, PS-050-04.R02, PS-050-04.R03 | inspect exports and map each rerank error through a caller harness | no commands, queries or events; only rerank and auditPage exported; typed errors map to the documented HTTP problems |
| TEST-PS-050-09.T08 | abuse | PS-050-05.R01, PS-050-05.R02, PS-050-05.R03, PS-050-07.R01, PS-050-07.R02 | candidate objects with extra fields such as userId, reputation, bio | extra fields rejected by schema (V05); ranking identical with and without them |
| TEST-PS-050-09.T09 | abuse | PS-050-01.R02 | 50 new authors created in a burst with equal scores | only 2 slots per page are filled and the 50 percent ratio is enforced |
| TEST-PS-050-09.T10 | unit | PS-050-06.R01, PS-050-06.R02, PS-050-06.R03 | repeat call after thrown error and during concurrent calls | no shared state; same result |
| TEST-PS-050-09.T11 | load | PS-050-08.R01, PS-050-08.R02, PS-050-08.R03 | rerank 200 candidates 10 000 times on emulated device | p95 <= 5 ms |
| TEST-PS-050-09.T12 | unit | PS-050-09.R01, PS-050-09.R02, PS-050-09.R03 | traceability run over PS-050 | every requirement maps to a passing test |
| TEST-PS-050-09.T13 | unit | PS-050-10.R01, PS-050-10.R02, PS-050-10.R03 | check package exports persistence | none; constants version file hashed in the golden test |
| TEST-PS-050-09.T14 | a11y | PS-050-01.R03 | render explanation keys in the search screen with axe-core | labels are text, localized and announced; zero serious or critical issues |
| TEST-PS-050-09.T15 | manual | PS-050-07.R03 | review the product help page against the constants file | the page lists 3 per author, 2 new-author slots per 20, the 50 percent ratio, the 30-day window, promoted at most 20 percent and the stated Sybil limit, matching the constants |
| TEST-PS-050-09.T16 | unit | PS-050-04.R04 | auditPage on relay pages with 4 results of one author, 5 promoted of 20, an unlabelled promoted item, and a compliant page | violations max_per_author, promoted_share, promoted_unlabelled, and followed true for the compliant page |

## Acceptance criteria

- All tests T01-T16 pass in CI (T15 is a release checklist item).
- Constraint properties hold on 10 000 random corpora (nightly).
- Explanation keys exist in every shipped locale catalog (i18n coverage test).

## Dependencies

Module depends on: F06.S03.M01, F06.S02.M01, CTR-ID-001, CTR-ERR-001, CTR-SCH-001, CTR-UX-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
