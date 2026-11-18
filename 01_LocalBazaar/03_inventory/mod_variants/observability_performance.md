# PS-009-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/03_inventory/mod_variants. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R06), CTR-ERR-001 (R10), CTR-PRV-001 (R09).

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-009-08.R01 | Metrics: `variant_write_total{op,result}`, `variant_rejection_total{code}`, `variant_revision_conflict_total`. No account, listing or label values as labels. | MVP |
| PS-009-08.R02 | Server p95 targets: add/update/archive ≤ 200 ms; `listing.variants_get` (25 items) ≤ 100 ms (ASSUMPTION). | MVP |
| PS-009-08.R03 | Event lag from commit to availability/feasibility subscriber ≤ 5 s p95 (ASSUMPTION). | MVP |
| PS-009-08.R04 | Alert when rejections exceed 5% of writes over 15 min for one code (ASSUMPTION). | MVP |
| PS-009-08.R05 | Logs carry `code`, `request_id`, module and timing only (CTR-ERR-001 R10). | MVP |

## Data / schema
Metric schema: counters and histograms only; cardinality per metric ≤ 20 label values.

## Commands / queries / events
Each command emits one latency sample and one result counter.

## States & transitions
Not applicable.

## Validation & errors
Rejection counters use the registry codes in PS-009-02.

## Authorization
Dashboards are restricted to operators with `ope_` read on aggregate metrics; no per-listing view.

## Failure, idempotency, concurrency, offline
Metric loss is tolerated; event loss is not (handled in PS-009-06).

## Privacy, retention, abuse
Metrics retained 30 days (RET-OPS). Logs redact any value that matches the PII pattern.

## Observability & budgets
Budget: ≤ 2 KB log volume per write request; ≤ 20 metric series per op.

## Tests
- TEST-PS-009-08-01 (unit): counters increment once per request.
- TEST-PS-009-08-02 (load): 25-variant listing read meets 100 ms p95 in staging-scale run (targets not yet measured).
- TEST-PS-009-08-03 (negative): log scan finds no label values.

## Acceptance criteria
1. Metric names and labels match the list above; no extra label keys.
2. Latency targets are stated as ASSUMPTION until measured; each is listed for F15 review.
3. Log scan finds zero user-supplied values in a fixture run.

## Assumptions & open decisions
- ASSUMPTION: p95 budgets above, pending F15 review.
- PENDING: alert routing owner (F15 Platform Lead).
- No Dxx decision changes this process; the values above are ASSUMPTION until F15/F16 review.
