# PS-071-08 — observability and performance budgets

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/02_settlement/mod_receipts (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-PRV-001 (R09), CTR-ERR-001 (R10). **Decisions:** D07 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-071-08.R01 | Metrics: `receipt_claims_total{status,method}`, `evidence_uploads_total{result}`, `evidence_stripped_total`. No labels from IDs. | MVP |
| PS-071-08.R02 | Finalize p95 ≤ 500 ms server side (ASSUMPTION). | MVP |
| PS-071-08.R03 | Logs: `evd_` ID, event type, code, byte-size class. No file names, content or EXIF. | MVP |
| PS-071-08.R04 | Alert when `RECEIPT.EVIDENCE_TYPE` exceeds 10% of uploads in an hour. | MVP |

## Data / schema
Byte-size class enum: `<100KB`, `<1MB`, `<5MB`.

## Commands / queries / events
Event counts by type.

## States & transitions
Gauge of evidence by state.

## Validation & errors
Counter by code.

## Authorization
Aggregates only.

## Failure, idempotency, concurrency, offline
Expired upload sessions counted per day.

## Privacy, retention, abuse
Metrics 90 days; logs 14 days (ASSUMPTION).

## Observability & budgets
Digest mismatch alert above 1% of finalizes.

## Tests
- TEST-PS-071-08-01 (contract): metric label lint.
- TEST-PS-071-08-02 (unit): log redaction removes file name and EXIF fields.
- TEST-PS-071-08-03 (integration): synthetic digest mismatch triggers alert.

## Acceptance criteria
1. Budgets measured in staging.
2. No content in logs or metrics.
3. Alerts tested.

## Assumptions & open decisions
- ASSUMPTION: retention of metrics and logs.
- D07 (PROVISIONAL default, unapproved).
