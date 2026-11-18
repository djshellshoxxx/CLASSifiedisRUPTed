# PS-044-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/01_search/mod_filter. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-COM-001 (amount format), CTR-PRV-001 (cells), CTR-ERR-001.

**Decision labels:** Limits in R02, R05 and R07 are ASSUMPTION (OPEN, F06).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-044-02.R01 | Enum facets accept only declared values; unknown → `FILTER.FACET_UNKNOWN` (400). | MVP |
| PS-044-02.R02 | Facet count ≤ 12 and keyword tokens ≤ 8 → `FILTER.TOO_MANY_FACETS` (400). | MVP |
| PS-044-02.R03 | Price bounds match `^(0\|[1-9][0-9]{0,38})$`; `min ≤ max`; mixed currencies → `FILTER.PRICE_CURRENCY_MIXED` (422); malformed → `COM.AMOUNT_INVALID` (400). | MVP |
| PS-044-02.R04 | `region_cells` each registered; unknown → `FILTER.REGION_UNKNOWN` (400); more than 5 → `FILTER.REGION_TOO_MANY` (400). | MVP |
| PS-044-02.R05 | Date span `available_to − available_from` ≤ 365 days → else `FILTER.DATE_SPAN_EXCEEDED` (400). | MVP |
| PS-044-02.R06 | Keywords ≤ 100 characters after NFKC normalization → else `FILTER.KEYWORDS_TOO_LONG` (400). | MVP |
| PS-044-02.R07 | Saved searches per `acc_` ≤ 20 → `FILTER.SAVED_LIMIT` (422). | MVP |
| PS-044-02.R08 | Any coordinate-like key (`lat`, `lon`, `lng`, `address`, `center`) → `FILTER.PRECISE_LOCATION_REJECTED` (400). | MVP |

## Data / schema
Check order: unknown keys (R01, R08) → shape → counts (R02, R04, R06) → ranges (R03, R05) → quota (R07).

## Commands / queries / events
Applies to `filter.evaluate`, `filter.save`.

## States & transitions
Gates only.

## Validation & errors
All `FILTER.*` codes non-retryable. Error bodies name the facet, not the submitted value.

## Authorization
None beyond ownership for saved-search commands.

## Failure, idempotency, concurrency, offline
Validation is deterministic. Offline filter edits are revalidated on sync.

## Privacy, retention, abuse
Rejected keyword text not logged or echoed.

## Observability & budgets
`filter_validation_reject_total{code}`. Validation p95 ≤ 5 ms (ASSUMPTION).

## Tests
- TEST-PS-044-02-01 (unit): one case per R01–R08 code.
- TEST-PS-044-02-02 (boundary): 12 facets and 13 facets; 365-day and 366-day spans.
- TEST-PS-044-02-03 (negative): latitude key rejected with no coordinate echoed.
- TEST-PS-044-02-04 (property): random facet sets never bypass limits.

## Acceptance criteria
1. Each rule maps to a test and a code.
2. No coordinate values appear in logs (TEST-PS-044-02-03).
3. Boundary tests pass.

## Assumptions & open decisions
- ASSUMPTION: limits above (OPEN, F06).
