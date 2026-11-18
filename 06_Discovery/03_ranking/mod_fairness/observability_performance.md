# PS-046-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/03_ranking/mod_fairness. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-ERR-001.

**Decision labels:** Budgets ASSUMPTION.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-046-08.R01 | `fairness_apply_latency_ms` p95 ≤ 20 ms (N ≤ 200). | MVP |
| PS-046-08.R02 | Served-page constraint pass rate reported per policy version. | MVP |
| PS-046-08.R03 | Promoted share and same-seller run distributions as histograms, no seller labels. | MVP |
| PS-046-08.R04 | No labels with seller bucket or listing IDs. | MVP |

## Data / schema
Metrics: `fairness_apply_latency_ms`, `fairness_constraint_pass_total{policy_version,status}`, `fairness_promoted_share`, `fairness_same_seller_run`, `fairness_unchecked_pages_total`.

## Commands / queries / events
Not applicable.

## States & transitions
Not applicable.

## Validation & errors
`fairness_validation_reject_total{code}`.

## Authorization
Aggregated only.

## Failure, idempotency, concurrency, offline
Queue depth alert.

## Privacy, retention, abuse
Metrics RET-OPS (30 days).

## Observability & budgets
Alerts: any served page with `VIOLATED_AUTO_REPAIRED` above 0.5% over 1 h (ASSUMPTION); promoted share above cap in any served page (must be 0); unchecked pages above 1% (ASSUMPTION).

## Tests
- TEST-PS-046-08-01 (lint): no seller labels.
- TEST-PS-046-08-02 (load): N = 200 p95 ≤ 20 ms.
- TEST-PS-046-08-03 (alert): seeded over-cap page fires alert.
- TEST-PS-046-08-04 (alert): unchecked-page rate fires alert.

## Acceptance criteria
1. Metrics present with specified labels.
2. Load budget met.
3. Alerts fire within 5 minutes.

## Assumptions & open decisions
- ASSUMPTION: thresholds above.
