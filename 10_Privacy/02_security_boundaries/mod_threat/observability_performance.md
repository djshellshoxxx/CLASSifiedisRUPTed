# PS-082-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/02_security_boundaries/mod_threat. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001 (R10), CTR-PRV-001 (R09).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-082-08.R01 | Count of threats with no passing mitigation test; target 0 for `mitigated`. | MVP |
| PS-082-08.R02 | Count of overdue reviews (`next_review_on` passed); target 0. | MVP |
| PS-082-08.R03 | Register query p95 ≤ 200 ms for ≤ 500 threats (ASSUMPTION). | MVP |
| PS-082-08.R04 | Logs carry `threat_id` and codes only. | MVP |

## Data / schema
Labels: `category`, `state`, `code`.

## Commands / queries / events
Consumes `threat.*` events.

## States & transitions
Not applicable.

## Validation & errors
Telemetry failure never blocks register writes.

## Authorization
Dashboard visible to reviewers; metrics contain no exploit text.

## Failure, idempotency, concurrency, offline
Metrics loss tolerated; overdue check also runs in timer job (PS-082-06).

## Privacy, retention, abuse
Logs retained 30 days (ASSUMPTION).

## Observability & budgets
| Metric | Target |
|---|---|
| threat_unmitigated_tested_total | 0 |
| threat_overdue_review_total | 0 |
| threat_query_latency_ms p95 | ≤ 200 |

## Tests
- TEST-PS-082-08-01 (metric): seeded overdue review increments metric.
- TEST-PS-082-08-02 (redaction): log output omits titles.
- TEST-PS-082-08-03 (performance): 500-threat fixture meets p95.

## Acceptance criteria
1. Metrics exported.
2. Redaction passes.
3. Performance target met on fixture.

## Assumptions & open decisions
- ASSUMPTION: targets above pending F16 validation.
