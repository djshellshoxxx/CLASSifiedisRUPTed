# PS-045-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/02_geoprivacy/mod_proximity. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R03, R04, R05), CTR-ERR-001, CTR-SCH-001.

**Decision labels:** Ring ≤ 2, budget 30 per 24 h, and cell refresh interval are ASSUMPTION (CTR-PRV-001 R05 sets the budget; F10 validates).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-045-02.R01 | Query input is `cell_id` (registered) and `ring` ∈ {0, 1, 2}. Other ring values → `PROXIM.RING_TOO_LARGE` (400) for > 2, `SYS.REQUEST_MALFORMED` otherwise. | MVP |
| PS-045-02.R02 | Any `lat`, `lon`, `lng`, `center`, `address` or `postcode` key → `PROXIM.PRECISE_CENTER_REJECTED` (400). The request is not logged with values. | MVP |
| PS-045-02.R03 | Unknown `cell_id` → `PROXIM.CELL_UNKNOWN` (400). | MVP |
| PS-045-02.R04 | Budget: ≤ 30 region queries per `acc_` per 24 h (CTR-PRV-001 R05). Over → `PRV.QUERY_BUDGET_EXCEEDED` (429, retryable with `retry_after_ms`). | MVP |
| PS-045-02.R05 | Repeated narrowing pattern (≥ 20 distinct cells queried in 1 h by one `acc_`) raises alert CR-13 and returns `PRV.QUERY_BUDGET_EXCEEDED` for the rest of the hour (ASSUMPTION). | MVP |
| PS-045-02.R06 | Responses never include cell counts below K_MIN (5); merged or suppressed cells return bucket `null`. | MVP |

## Data / schema
Check order: precise-field check (R02) → cell and ring (R01, R03) → budget (R04, R05) → output filter (R06).

## Commands / queries / events
Applies to `proximity.query`.

## States & transitions
Gates only.

## Validation & errors
All `PROXIM.*` non-retryable. `PRV.QUERY_BUDGET_EXCEEDED` retryable per CTR-ERR-001.

## Authorization
Anonymous queries allowed for PUBLISHED cells; budget keyed by client identity or session (ASSUMPTION).

## Failure, idempotency, concurrency, offline
Queries are read-only and idempotent; budget increments occur once per request ID.

## Privacy, retention, abuse
Rejected coordinate input is never stored or logged.

## Observability & budgets
`proximity_validation_reject_total{code}`; `prv_location_query_budget_hits_total` (CTR-PRV-001).

## Tests
- TEST-PS-045-02-01 (unit): one case per R01–R06 code.
- TEST-PS-045-02-02 (boundary): 30th query passes; 31st → 429.
- TEST-PS-045-02-03 (negative): latitude key rejected; log scan shows no value.
- TEST-PS-045-02-04 (abuse): 200 queries with shifting centers → alert and throttle (CTR-PRV-001 TEST-05).

## Acceptance criteria
1. No precise input accepted or logged.
2. Budget enforced at 30 per 24 h.
3. No count below K_MIN in any response.

## Assumptions & open decisions
- ASSUMPTION: ring limit 2; narrowing threshold 20 cells per hour.
- OPEN (F10): budget value validated.
