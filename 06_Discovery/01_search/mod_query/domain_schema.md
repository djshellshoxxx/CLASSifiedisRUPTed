# PS-046-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/01_search/mod_query. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ID-001 (`req_`), CTR-PRV-001, CTR-ERR-001, CTR-SCH-001; PENDING CTR-DSC-001 (search request and page schema).

**Decision labels:** Query text is not persisted (PROVISIONAL, D07 default, unapproved). Boolean operators are out of MVP scope (ASSUMPTION).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-046-01.R01 | Search request is a non-persisted value object; the only stored artifact is an aggregate counter with K_MIN. | MVP |
| PS-046-01.R02 | Every request has `region_scope` of 1–5 registered cells; a request without a cell is rejected. | MVP |
| PS-046-01.R03 | `text` ≤ 200 code points after NFC, ≤ 16 tokens, each token ≤ 32 code points. | MVP |
| PS-046-01.R04 | `page_size` 1–50 (default 20). Cursor depth ≤ 50 pages per request chain. | MVP |
| PS-046-01.R05 | Request carries `request_id` (`req_`, CTR-ID-001) used for error correlation only. | MVP |

## Data / schema
```json
{
  "text": "string, 0-200 chars, NFC, optional",
  "region_scope": ["DE-BE-C1"],
  "listing_type": "sell|giveaway|wanted|service|auction|rental|barter|null",
  "category_path": ["string"],
  "sort": "relevance|newest",
  "page_size": 20,
  "cursor": "opaque string or null",
  "request_id": "req_<26 chars>"
}
```
Filter predicates (price, condition, type detail) are delegated to [filter](../mod_filter/SPEC.md) (F06.S01.M03). Ranking is delegated to F06.S03. Proximity expansion is delegated to mod_proximity (F06.S02.M03). `sort: price_*` is not in MVP (Future).

Response page: `items[]` (index-doc subset, PUBLIC and LOCATION_COARSE fields only), `next_cursor`, `result_count_bucket` (rounded to 10 above 50; ASSUMPTION).

## Commands / queries / events
Query `discovery.search` (read-only). See [commands_queries_events.md](commands_queries_events.md) (PS-046-04).

## States & transitions
Stateless. Request lifecycle: `received → validated → executed → returned | rejected | rate_limited` (PS-046-03).

## Validation & errors
See [validation_rules.md](validation_rules.md) (PS-046-02).

## Authorization
See [authorization_capabilities.md](authorization_capabilities.md) (PS-046-05).

## Failure, idempotency, concurrency, offline
Reads are idempotent by definition. See PS-046-06.

## Privacy, retention, abuse
Query text is treated as PRIVATE_PERSONAL when attributed to an `acc_`. See PS-046-07.

## Observability & budgets
See PS-046-08. Search p95 ≤ 150 ms server-side (ASSUMPTION).

## Tests
- TEST-PS-046-01-01 (unit): request without `region_scope` rejected.
- TEST-PS-046-01-02 (unit): 200-code-point boundary accepted, 201 rejected.
- TEST-PS-046-01-03 (unit): `result_count_bucket` rounding at 49, 50, 51, 60.

## Acceptance criteria
1. Schema validates with `additionalProperties: false`.
2. No stored table contains a column for query text.
3. `items[]` schema contains no field above LOCATION_COARSE.

## Assumptions & open decisions
- ASSUMPTION: `result_count_bucket` rounding prevents small-cell counting.
- D05 PROVISIONAL (cell scope only; no precise center).
