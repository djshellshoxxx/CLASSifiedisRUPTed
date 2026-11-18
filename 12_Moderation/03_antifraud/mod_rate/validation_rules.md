# PS-099-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/03_antifraud/mod_rate. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001 (R03, R04, R05), CTR-FED-001 (R11), CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-099-02.R01 | `class_id` must exist in the loaded policy. Unknown → `RATE.CLASS_UNKNOWN` (internal caller error, not exposed to end users). | MVP |
| PS-099-02.R02 | `subject_token` must be `acc_` or `fpr_` IDs (CTR-ID-001 format) or a keyed network token of 43 base64url characters. Other forms → `RATE.SUBJECT_INVALID`. | MVP |
| PS-099-02.R03 | `cost` (tokens consumed) is an integer 1–100. Outside range → `RATE.COST_INVALID`. | MVP |
| PS-099-02.R04 | Policy values: `emission_interval_ms` ≥ 10, `burst` 1–10 000, `window_ms` ≥ `emission_interval_ms`. Invalid policy is rejected at load, never partially applied. | MVP |
| PS-099-02.R05 | A rate-limited response includes `retry_after_ms` = time until the next conforming request (GCRA), capped at 3 600 000 ms (CTR-ERR-001). | MVP |

## Data / schema
Error registry (module prefix `RATE`):

| Code | Category | HTTP | Retryable | `details.rule` |
|---|---|---|---|---|
| `RATE.LIMITED` | rate_limited | 429 | true | `class_id` (+ `retry_after_ms`) |
| `RATE.CLASS_UNKNOWN` | internal | 500 | false | — (logged, not returned to users) |
| `RATE.SUBJECT_INVALID` | validation | 400 | false | `subject_token` |
| `RATE.COST_INVALID` | validation | 400 | false | `cost` |
| `RATE.STORE_UNAVAILABLE` | unavailable | 503 | true | — |

## Commands / queries / events
Validation runs before bucket access. Invalid requests do not consume tokens.

## States & transitions
No state machine beyond bucket time; see PS-099-03.

## Validation & errors
`RATE.LIMITED` never reveals the limit value or the current count (prevents calibration by attackers).

## Authorization
Rate checks apply to unauthenticated and authenticated callers alike; they are not authorization decisions (CTR-CAP-001 unaffected).

## Failure, idempotency, concurrency, offline
Validation errors are non-retryable; `RATE.STORE_UNAVAILABLE` follows the class fail mode (PS-099-06).

## Privacy, retention, abuse
Error bodies contain no subject token or network information.

## Observability & budgets
Counter `rate_validation_error_total{code}`; no subject labels.

## Tests
- `TEST-PS-099-02-01` unit: each code on exact condition only.
- `TEST-PS-099-02-02` negative: `cost` 101 → `RATE.COST_INVALID`, no token consumed (checked via subsequent allow).
- `TEST-PS-099-02-03` contract: `retry_after_ms` never exceeds 3 600 000.
- `TEST-PS-099-02-04` policy load: `burst` 0 rejects whole policy version.

## Acceptance criteria
1. Invalid input consumes no tokens.
2. Error bodies contain no limit values or subject data.
3. Partial policy never applied.

## Assumptions & open decisions
- ASSUMPTION: `cost` > 1 supports batched actions (for example, multi-item federation batches).
- D08 (PWA offline writes), PROVISIONAL default: clients honor `retry_after_ms` before re-queuing (unapproved).
