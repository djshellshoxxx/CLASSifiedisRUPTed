# PS-047-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/03_ranking/mod_relevance. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R02 ordering, forbidden classes), CTR-ERR-001, CTR-SCH-001.

**Decision labels:** Feature limits and candidate caps are ASSUMPTION.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-047-02.R01 | Weights sum to exactly 1.00 and each within [0.00, 1.00]; else `RELEV.WEIGHTS_INVALID` (422). | MVP |
| PS-047-02.R02 | Any feature input declared with class PRIVATE_PERSONAL or LOCATION_PRECISE, or any field named `lat`, `lon`, `email`, `phone`, `name`, `birth`, `address`, or a raw reputation score → `RELEV.FEATURE_FORBIDDEN` (422). | MVP |
| PS-047-02.R03 | `recency_tau_days` in [7, 90]; else `RELEV.WEIGHTS_INVALID` (422). | MVP |
| PS-047-02.R04 | Query inputs: page size ≤ 50; candidate pool ≤ 1000 per query (excess truncated by recency, logged as count only). | MVP |
| PS-047-02.R05 | Query with unknown `locale` or `category_group` → `RELEV.MODEL_NOT_ACTIVE` (503, retryable) when no ACTIVE model exists for scope. | MVP |
| PS-047-02.R06 | Activation requires two approvers → else `RELEV.APPROVAL_MISSING` (422). | MVP |
| PS-047-02.R07 | Explanations per result ≤ 3 reason codes from the fixed list (PS-047-04). | MVP |

## Data / schema
Check order: feature list (R02) → weights and ranges (R01, R03) → scope (R05) → query limits (R04). Forbidden-feature check runs at model draft, not only at query time.

## Commands / queries / events
Applies to `ranking_model.draft`, `ranking_model.activate`, and `search.rank` (query).

## States & transitions
Gates only.

## Validation & errors
`RELEV.*` non-retryable except `RELEV.MODEL_NOT_ACTIVE` (retryable, 503).

## Authorization
R06 approvals; others via PS-047-05.

## Failure, idempotency, concurrency, offline
Validation deterministic.

## Privacy, retention, abuse
Rejected feature names are logged as codes, not values.

## Observability & budgets
`relevance_validation_reject_total{code}`.

## Tests
- TEST-PS-047-02-01 (unit): one case per R01–R07 code.
- TEST-PS-047-02-02 (boundary): weights sum 1.00 passes; 1.01 fails; tau 7 and 90 pass; 6 and 91 fail.
- TEST-PS-047-02-03 (negative): feature named `lat` rejected at draft.
- TEST-PS-047-02-04 (property): random weight vectors summing to 1.00 pass exactly.

## Acceptance criteria
1. Every rule maps to a test and a code.
2. Forbidden features rejected at draft time.
3. Boundary tests pass.

## Assumptions & open decisions
- ASSUMPTION: ranges and caps above (OPEN, F06).
