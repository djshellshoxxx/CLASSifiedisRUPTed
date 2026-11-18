# PS-044-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/01_search/mod_filter. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (classes, retention, query budget), CTR-FED-001 (R03), CTR-CAP-001.

**Decision labels:** D05 PROVISIONAL. D07 PROVISIONAL.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-044-07.R01 | Saved searches PRIVATE_PERSONAL, RET-PRIV (365 days after last access). | MVP |
| PS-044-07.R02 | Ad-hoc filters cached only in RET-EPH (24 h) on the device or server cache. | MVP |
| PS-044-07.R03 | Never federated (CTR-FED-001 R03). Saved searches never exported to peers. | MVP |
| PS-044-07.R04 | Logs carry `filter_hash`, counts and codes; never keywords or cell IDs per person. | MVP |
| PS-044-07.R05 | Evaluations per `acc_` count against the location query budget when a region facet is used (30 per 24 h, CTR-PRV-001 R05). | MVP |

## Data / schema
Retention metadata on saved searches.

## Commands / queries / events
`record.deleted` IDs and counts only.

## States & transitions
Deleted saved search purged within 24 h.

## Validation & errors
`PRV.QUERY_BUDGET_EXCEEDED` (429) when R05 budget spent.

## Authorization
Per PS-044-05.

## Failure, idempotency, concurrency, offline
Deletion propagates to caches and digests (CTR-PRV-001 R06).

## Privacy, retention, abuse
Abuse controls:
- Scraping by repeated evaluations: rate limit per client (ASSUMPTION) with `SYS.RATE_LIMITED`.
- Triangulation via narrowing facets: region query budget and CR-13 alert.
- Keyword profiling: saved-search keywords never used outside the owner's digest.

## Observability & budgets
`filter_privacy_log_violations_total` must be 0.

## Tests
- TEST-PS-044-07-01 (log scan): seeded keywords absent from logs.
- TEST-PS-044-07-02 (retention): saved search purged 24 h after deletion.
- TEST-PS-044-07-03 (budget): 31st region-faceted query in 24 h → 429.
- TEST-PS-044-07-04 (federation): export and federation paths exclude saved searches.

## Acceptance criteria
1. Zero keyword values in logs.
2. Budget enforced for region facets.
3. No saved-search data in any export or federation payload.

## Assumptions & open decisions
- OPEN (F10): PRIVATE_PERSONAL class for saved searches.
- ASSUMPTION: client rate limit value.
