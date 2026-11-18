# PS-047-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/03_ranking/mod_relevance. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001.

**Decision labels:** D08 PROVISIONAL (offline cached results). No ranking quality guarantee.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-047-06.R01 | If no ACTIVE model exists for scope, serve the last retired-but-recent ACTIVE model for up to 24 h, flagged `model_status = FALLBACK`; otherwise `RELEV.MODEL_NOT_ACTIVE` (503). | MVP |
| PS-047-06.R02 | Index or candidate-source failure → search returns `SYS.UNAVAILABLE` or partial results with `coverage < 1.0`; never silent empty results. | MVP |
| PS-047-06.R03 | Model activation idempotent per `(model_id, version)`. | MVP |
| PS-047-06.R04 | Shadow job retries are no-ops per `(model_id, day)`. | MVP |
| PS-047-06.R05 | Offline clients show cached results for ≤ 24 h, flagged stale, and never re-rank locally (D08). | MVP |

## Data / schema
Served ranking stores `model_id`, `model_status`, `coverage`. No per-user record kept.

## Commands / queries / events
Retry-safe per PS-047-04.

## States & transitions
No new states.

## Validation & errors
Retryable: `SYS.UNAVAILABLE`, `RELEV.MODEL_NOT_ACTIVE`. Non-retryable: `RELEV.*` validation codes.

## Authorization
Ranking service identity only for `search.rank`.

## Failure, idempotency, concurrency, offline
- Shard down: partial results with coverage flag.
- Shadow comparison job fails midway: rerun from checkpoint; no duplicate comparison rows.
- Fallback past 24 h: `RELEV.MODEL_NOT_ACTIVE`.

## Privacy, retention, abuse
Failure logs contain model IDs and codes only.

## Observability & budgets
`search_rank_fallback_total`, `search_rank_partial_total`, `search_rank_unavailable_total`.

## Tests
- TEST-PS-047-06-01 (failure): no ACTIVE model → fallback flagged; after 24 h → 503.
- TEST-PS-047-06-02 (partial): shard failure yields coverage flag, not silent empty results.
- TEST-PS-047-06-03 (idempotency): duplicate activation → one ACTIVE.
- TEST-PS-047-06-04 (offline): client cache older than 24 h is not shown.

## Acceptance criteria
1. No silent empty result on failure (TEST-PS-047-06-02).
2. Fallback never exceeds 24 h.
3. Shadow reruns create no duplicate rows.

## Assumptions & open decisions
- ASSUMPTION: 24-hour fallback and offline cache limits.
- PROVISIONAL (D08 default, unapproved).
