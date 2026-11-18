# PS-047-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/03_ranking/mod_relevance. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R02, R03, R04), CTR-FED-001 (R02), CTR-CAP-001.

**Decision labels:** D05 PROVISIONAL (cell-hop distance only). OPEN (F10): whether reputation bands alone are acceptable input.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-047-07.R01 | Distance uses registered cell hops only (PS-047-01 R05); no coordinates, no precise center. | MVP |
| PS-047-07.R02 | Reputation enters as band 0–3 only (PS-047-01 R06). | MVP |
| PS-047-07.R03 | Ranking logs and explanations contain model ID and reason codes only; no per-user score history. | MVP |
| PS-047-07.R04 | Ranking outputs never federated. | MVP |
| PS-047-07.R05 | Config retention RET-ACC; logs RET-OPS (30 days). | MVP |

## Data / schema
Model config: no personal data. Logs: pseudonymous request IDs only.

## Commands / queries / events
No personal data in events.

## States & transitions
Not applicable.

## Validation & errors
`RELEV.FEATURE_FORBIDDEN` (PS-047-02 R02).

## Authorization
Per PS-047-05.

## Failure, idempotency, concurrency, offline
Cached offline results are purged on logout (CTR-PRV-001 cache rule).

## Privacy, retention, abuse
Abuse controls:
- Keyword stuffing to game text score: text feature capped and normalized; seller text quality flagged by F12 (ASSUMPTION).
- Reputation farming: band changes require F07 thresholds; band cannot exceed weight 0.20 (ASSUMPTION).
- Location inference from ordering: only cell hops used; hop bands coarse.
- Model tampering: activation requires two approvers and shadow comparison.

## Observability & budgets
`relevance_privacy_log_violations_total` must be 0.

## Tests
- TEST-PS-047-07-01 (lint): no coordinate or identity feature.
- TEST-PS-047-07-02 (log scan): no per-user score in logs.
- TEST-PS-047-07-03 (cap): reputation weight above 0.20 rejected.
- TEST-PS-047-07-04 (federation): ranking outputs absent from federation batches.

## Acceptance criteria
1. Zero forbidden features in any model.
2. Zero per-user scores in logs.
3. Reputation weight capped at 0.20.

## Assumptions & open decisions
- ASSUMPTION: reputation weight cap 0.20.
- OPEN (F10): reputation band input acceptability.
