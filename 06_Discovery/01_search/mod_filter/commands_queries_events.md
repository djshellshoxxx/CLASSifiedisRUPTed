# PS-044-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/01_search/mod_filter. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-CAP-001.

**Decision labels:** D08 PROVISIONAL (offline saved-search edits).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-044-04.R01 | `filter.evaluate` is a query; it writes no event and no record. | MVP |
| PS-044-04.R02 | `filter.evaluate` p95 ≤ 150 ms for ≤ 10 000 candidate postings (ASSUMPTION). | MVP |
| PS-044-04.R03 | Saved-search commands require `idempotency_key`; state changes require `expected_revision`. | MVP |
| PS-044-04.R04 | One `saved_search.*` event per saved-search command (`aggregate_type = saved_search`). | MVP |

## Data / schema
`filter.evaluate` request: `filter`, `page` (≤ 50, cursor), `sort`. Response: result IDs, `filter_hash`, `ranking_model` reference (`rmv_` PENDING). Events carry IDs, status and state version only.

## Commands / queries / events
| Command or query | Caller | Event | Error codes |
|---|---|---|---|
| `filter.evaluate` (query) | any (pseudonym view ok) | none | FACET_UNKNOWN, TOO_MANY_FACETS, PRICE_CURRENCY_MIXED, REGION_UNKNOWN, PRECISE_LOCATION_REJECTED |
| `filter.save` | owner | saved_search.saved | SAVED_LIMIT, plus validation codes |
| `filter.pause` | owner | saved_search.paused | INVALID_TRANSITION |
| `filter.resume` | owner | saved_search.resumed | INVALID_TRANSITION |
| `filter.delete` | owner | saved_search.deleted | INVALID_TRANSITION |
| `filter.list` (query) | owner | none | none |

## States & transitions
Event mapping in PS-044-03.

## Validation & errors
PS-044-02 gates before execution.

## Authorization
Saved-search commands: owner only. Evaluation: unauthenticated allowed for PUBLIC listings only (CTR-CAP-001 R04 `public` visibility, ASSUMPTION).

## Failure, idempotency, concurrency, offline
Same key with different digest → `EVT.IDEMPOTENCY_KEY_REUSED`. Offline saved-search edits queue as pending (D08).

## Privacy, retention, abuse
Evaluation logs carry `filter_hash` and counts only, never keywords. Events omit the filter body.

## Observability & budgets
`filter_evaluate_latency_ms` histogram; `filter_evaluate_total{outcome}`.

## Tests
- TEST-PS-044-04-01 (contract): command and query schemas validate.
- TEST-PS-044-04-02 (query purity): evaluate writes no event or record.
- TEST-PS-044-04-03 (idempotency): duplicate save → one saved search.
- TEST-PS-044-04-04 (budget): 10 000-posting fixture meets p95 ≤ 150 ms.

## Acceptance criteria
1. Evaluation is side-effect free (TEST-PS-044-04-02).
2. Each saved-search command maps to one event.
3. Latency budget met under fixture.

## Assumptions & open decisions
- ASSUMPTION: 150 ms p95 budget.
- PENDING CTR-ID-001 `sfl` prefix and CTR-SCH-001 registration.
