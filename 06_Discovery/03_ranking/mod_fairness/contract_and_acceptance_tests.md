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
| TEST-PS-050-09.T04 | unit | PS-050-02.R03, PS-050-03.R02 | invalid inputs - NaN score, duplicate ids, limit 51, unsorted, promoted flag where not enabled | VALIDATION_FAILED, FAIRNESS_INPUT_UNSORTED or FAIRNESS_PROMOTION_NOT_ALLOWED |
| TEST-PS-050-09.T05 | property | PS-050-03.R01, PS-050-03.R02, PS-050-03.R03 | 200 runs of same input and paging through all pages | identical output, same order on repeated runs, windowed paging never repeats or drops |
| TEST-PS-050-09.T06 | unit | PS-050-01.R01, PS-050-04.R01 | page with a single author and page size 7 | cap relaxed with only_seller explanation; promoted cap 1 and new-author slots 1 |
| TEST-PS-050-09.T07 | unit | PS-050-04.R01, PS-050-04.R02, PS-050-04.R03 | inspect exports | no commands, queries or events; typed errors only |
| TEST-PS-050-09.T08 | abuse | PS-050-05.R01, PS-050-05.R02, PS-050-05.R03, PS-050-07.R01 | candidate objects with extra fields such as userId, reputation, bio | extra fields rejected by schema; ranking identical with and without them |
| TEST-PS-050-09.T09 | abuse | PS-050-07.R02, PS-050-07.R03 | 50 new authors created in a burst with equal scores | only 2 slots per page are filled and the 50 percent ratio is enforced |
| TEST-PS-050-09.T10 | unit | PS-050-06.R01, PS-050-06.R02, PS-050-06.R03 | repeat call after thrown error and during concurrent calls | no shared state; same result |
| TEST-PS-050-09.T11 | load | PS-050-08.R01, PS-050-08.R02, PS-050-08.R03 | rerank 200 candidates 10 000 times on emulated device | p95 <= 5 ms |
| TEST-PS-050-09.T12 | unit | PS-050-09.R01, PS-050-09.R02, PS-050-09.R03 | traceability run over PS-050 | every requirement maps to a passing test |
| TEST-PS-050-09.T13 | unit | PS-050-10.R01, PS-050-10.R02, PS-050-10.R03 | check package exports persistence | none; constants version file hashed in the golden test |
| TEST-PS-050-09.T14 | a11y | PS-050-04.R03, PS-050-01.R03 | render explanation keys in the search screen with axe-core | labels are text, localized and announced; zero serious or critical issues |

## Acceptance criteria

- All tests T01-T14 pass in CI.
- Constraint properties hold on 10 000 random corpora (nightly).
- Explanation keys exist in every shipped locale catalog (i18n coverage test).

## Dependencies

Module depends on: F06.S03.M01, F06.S02.M01, CTR-ID-001, CTR-ERR-001, CTR-SCH-001, CTR-UX-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
