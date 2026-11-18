# PS-047-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/03_ranking/mod_relevance. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-CAP-001.

**Decision labels:** Latency and candidate budgets ASSUMPTION.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-047-04.R01 | Model commands require `idempotency_key` and `expected_revision`. | MVP |
| PS-047-04.R02 | Each model command emits one `ranking_model.*` event (`aggregate_type = ranking_model`). | MVP |
| PS-047-04.R03 | `search.rank` p95 ≤ 50 ms for 1000 candidates, top-50 page (ASSUMPTION). | MVP |
| PS-047-04.R04 | Every served result carries `model_id` and up to 3 reason codes. | MVP |

## Data / schema
`search.rank` input: `filter_hash`, candidate set (listing ID, text score from index, recency timestamp, cell hop distance, quality score, reputation band), page params. Output: ordered `listing_id`s with `score` (2 decimals), `reasons[≤3]`, `model_id`, `fairness_status` from PS-046.
Reason codes (fixed): `TEXT_MATCH`, `RECENT`, `NEARBY_CELL`, `COMPLETE_LISTING`, `REPUTATION_BAND`.

## Commands / queries / events
| Command or query | Caller | Event | Error codes |
|---|---|---|---|
| `ranking_model.draft` | F06 operator | ranking_model.drafted | WEIGHTS_INVALID, FEATURE_FORBIDDEN |
| `ranking_model.activate` | two approvers | ranking_model.activated | APPROVAL_MISSING, INVALID_TRANSITION |
| `search.rank` (query) | search service | none | MODEL_NOT_ACTIVE, FEATURE_FORBIDDEN (should not occur at query) |

## States & transitions
Per PS-047-03.

## Validation & errors
PS-047-02.

## Authorization
PS-047-05.

## Failure, idempotency, concurrency, offline
`search.rank` is pure given inputs and model version. Offline clients show the last 24 h of cached results marked stale; they never re-rank locally.

## Privacy, retention, abuse
Events carry model IDs and state only. Ranking logs carry model ID and reason codes, not scores per person.

## Observability & budgets
`search_rank_latency_ms`; `search_rank_reason_total{code}`.

## Tests
- TEST-PS-047-04-01 (contract): command and event schemas; output schema.
- TEST-PS-047-04-02 (determinism): identical inputs → identical order and reasons.
- TEST-PS-047-04-03 (explanations): no result has more than 3 reasons; codes from fixed list only.
- TEST-PS-047-04-04 (latency): 1000 candidates p95 ≤ 50 ms on fixture.

## Acceptance criteria
1. Ranking is deterministic (TEST-PS-047-04-02).
2. Every result carries model ID and ≤ 3 codes.
3. Latency budget met.

## Assumptions & open decisions
- ASSUMPTION: 50 ms p95 budget; 2-decimal scores.
- PENDING CTR-SCH-001 registration of ranking output schema.
