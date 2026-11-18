# PS-046-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/01_search/mod_query. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R01, R04, R05, R09), CTR-ERR-001 (R06), CTR-FED-001 (R03); PENDING CTR-DSC-001.

**Decision labels:** Retention of query text is PROVISIONAL (D07 default: not stored, unapproved). Coarse-only queries are PROVISIONAL (D05 default, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-046-07.R01 | Query text is never persisted and never logged. | MVP |
| PS-046-07.R02 | Result pages expose LOCATION_COARSE only; no query returns a precise center or distance (see mod_proximity). | MVP |
| PS-046-07.R03 | Abuse controls: per-principal budget ≥ 300 text searches per hour (ASSUMPTION); guest budget 60 per hour per hashed client key. | MVP |
| PS-046-07.R04 | Scraping control: page depth ≤ 50; sustained paging > 20 pages in 5 min triggers SYS.RATE_LIMITED. | MVP |
| PS-046-07.R05 | Query-of-death control: text scan rejects inputs whose token expansion (stemming, synonyms) exceeds 512 terms. | MVP |

## Data / schema
Retained: rate counters (RET-EPH, 24 h), aggregate counters (RET-OPS, 30 days, K_MIN). Not retained: query text, cursors, per-request logs.

## Commands / queries / events
Aggregates per PS-046-04 only.

## States & transitions
Abuse-triggered `rate_limited` state per PS-046-03.

## Validation & errors
Token-expansion overflow returns `QUERY.TOO_MANY_TOKENS` (not a distinct code, to avoid oracle).

## Authorization
Privacy review by F10 for any change to stored fields (CTR-SCH-001 R10: data class change is at least MINOR and needs F10 review).

## Failure, idempotency, concurrency, offline
Privacy failures fail closed: if the classifier for result fields fails, the page is withheld.

## Privacy, retention, abuse
Inference risks: repeated searches with narrowing text can infer a user's interests; rate budgets and K_MIN aggregates reduce this but do not eliminate it (ASSUMPTION; threat-modeled in planning, not audited). Federated search results (Future) follow CTR-FED-001 R03: no federation of PRIVATE_PERSONAL or LOCATION_PRECISE.

## Observability & budgets
No text in logs (CTR-PRV-001 R09). Abuse dashboards show counts by principal_type only.

## Tests
- TEST-PS-046-07-01 (unit): log formatter rejects query text fields.
- TEST-PS-046-07-02 (abuse): 300+ searches per hour trigger rate limit at the correct count.
- TEST-PS-046-07-03 (abuse): 51-page chain rejected at page 51.

## Acceptance criteria
1. Static check: no table or log schema contains a query-text column.
2. Rate-limit thresholds enforced per fixtures.
3. Privacy review record exists for R03 and R04 values (PENDING F10).

## Assumptions & open decisions
- ASSUMPTION: budgets are design defaults, not validated against abuse data.
- D05 and D07 PROVISIONAL.
