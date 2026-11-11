# F06.S03.M02 Ranking fairness (PS-050)

Pure library: no commands, queries, events, repos or stored state.

## Implemented
- `rerank(candidates, { pageSize?, windowPosition? }, { now, promotionEnabled })` returns `Result<{ items, nextWindowPosition, stats }>`.
- Constants `FAIRNESS_CONSTANTS` (frozen, version 1; hashed in the golden test), `EXPLAIN_KEYS`, `newAuthorSlotPositions(pageSize)`, `fairnessCandidateSchema` (strict), `fairnessErrors` (`FAIRNESS_PROMOTION_NOT_ALLOWED`, `FAIRNESS_INPUT_UNSORTED`).
- Rules: window of the first 200 candidates; max 3 per author per page; new-author slots (2 per 20, at least 1 for pages of 5 or more) for non-promoted authors first seen less than 30 days ago with score >= 50 percent of the page's top score; promoted cap floor(page size / 5), excess promoted items move to following pages; cap relaxation with `only_seller` only when nobody else is left to fill the page; explanation keys with parameters.
- Errors: schema/range/duplicate violations are `VALIDATION_FAILED`; unsorted input `FAIRNESS_INPUT_UNSORTED`; a promoted flag while `promotionEnabled` is false `FAIRNESS_PROMOTION_NOT_ALLOWED`. Nothing is returned partially.

## Ports
None. The caller supplies the clock value (`now`) and whether the index sells promotion. `stats` (`authorCapped`, `newAuthorSlotsFilled`, `promotedDemoted`) are for the caller to feed the three fairness counters; the library records no metrics.

## Interpretations and deviations
- Paging: the whole window is laid out deterministically on every call and the page starting at `windowPosition` is returned; `nextWindowPosition` is the start of the next page or null. `windowPosition` must be a page start (0 or a previous `nextWindowPosition`), otherwise `VALIDATION_FAILED`. Pages can be shorter than the page size when constraints demand it (for example remaining items are promoted beyond the cap).
- Candidates carry an extra required `firstSeenAt` (document first seen) beyond the spec's input list, needed for the documented tie-break check (V04). Candidates beyond the 200 window are validated but never returned.
- Slot positions are 0-based: 5 and 12 for 20 results; other sizes use base floor(n/4) with step 7n/20, limited to fit. A new author who ranks above its slot position keeps its natural position (the slot is not used to demote it).
- The "page's top score" is the score of the first remaining candidate when the page is built.
- Pages smaller than 5 have promoted cap 0: promoted flags are then not shown as promoted (no label, no promoted key) so no result is dropped.
- When the cap is relaxed, every item of an author exceeding 3 on that page carries `only_seller`.
- V03: the spec says the flag is "ignored and recorded" and also lists the error; the error is returned (per test row T04).
- Explanation keys are derived from the supplied `components` (optional `matchField`, `distanceBucket`, `ageDays`, `defaultRanking`); `recent` is added when `recency >= 0.5`.

## Test rows not covered
- T11 (load on emulated device), T12 (traceability tool), T14 (a11y/i18n coverage needs the PWA). The 10 000 candidate regression corpus and nightly 10 000-corpus property runs are not implemented (window is capped at 200; property tests run 200 corpora).

## Limits
Sybil gaming of new-author slots cannot be detected here; only the 2-per-page limit, the 50 percent ratio and the 30 day window bound it (as stated in the spec).

## Status at pause (2026-11-11)

Implemented and self-validated by the implementing agent. **Not independently reviewed:** the owner paused the project before the review, fix and verification stages ran. Re-run on the implementation commit by the integration lane: `typecheck`, `deps:check` and `spec:check` pass (0 errors); this lane's tests: 34 passed, 0 failed, 0 skipped. The module is not yet exported from the package entry point and is not wired into the PWA.
