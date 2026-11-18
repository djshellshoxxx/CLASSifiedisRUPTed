# PS-139-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/02_performance/mod_load. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-FED-001, CTR-PRV-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-139-06.R01 | Load clients honour `retry_after_ms` on `SYS.RATE_LIMITED` and `SYS.UNAVAILABLE` (CTR-ERR-001 R03); the harness records rate-limited ratio separately. | MVP |
| PS-139-06.R02 | Load clients do not retry non-retryable errors. | MVP |
| PS-139-06.R03 | Generator crash ends run as `failed`; partial metrics are retained. | MVP |
| PS-139-06.R04 | Load generators cap concurrent connections per target at 1,000 (ASSUMPTION). | MVP |
| PS-139-06.R05 | Rate-limited responses do not count toward error-rate SLO but are reported. | MVP |

## Data / schema
Per-run counters: `requests`, `ok`, `rate_limited`, `error_by_code`.

## Commands / queries / events
N/A beyond run commands.

## States & transitions
Per [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
| Code | Category | Retryable | message_key |
|---|---|---|---|
| LOAD.GENERATOR_CRASHED | internal (500) | false | err.load.generator_crashed |

## Authorization
N/A.

## Failure, idempotency, concurrency, offline
- Retry storms: harness backoff uses jitter; retries count toward the rate cap.
- Relay batching under load honours CTR-FED-001 R10 limits.
- Geo queries under load honour the per-principal budget of 30 per 24 h (CTR-PRV-001 R05) through synthetic principal rotation within the budget.

## Privacy, retention, abuse
Counters contain no request bodies.

## Observability & budgets
Metric `load_generator_crash_total`.

## Tests
- TEST-PS-139-06-01: integration, rate-limit headers honoured.
- TEST-PS-139-06-02: generator kill mid-run yields `failed` with partial metrics.

## Acceptance criteria
1. Zero non-retryable retries in fixtures.
2. Partial metrics retained in 100% of crash drills.

## Assumptions & open decisions
- ASSUMPTION: 1,000 connections per target.
- D05 (geo query budget under load): PROVISIONAL (D05 default, unapproved).
