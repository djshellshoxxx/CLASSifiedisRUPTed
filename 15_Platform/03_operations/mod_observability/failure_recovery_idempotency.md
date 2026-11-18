# PS-121-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/03_operations/mod_observability (F15.S03.M01). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-121-06.R01 | Emitters buffer up to 10,000 records or 10 MiB locally; oldest non-alert records are dropped first when full. | MVP |
| PS-121-06.R02 | Alert-type records are never dropped by the emitter buffer; they persist until acknowledged by ingest. | MVP |
| PS-121-06.R03 | Ingest outage: emitters retry with full-jitter backoff, base 1 s, cap 5 min (ASSUMPTION). | MVP |
| PS-121-06.R04 | Dropped records increment `telemetry_dropped_total{reason}` and never block the caller. | MVP |
| PS-121-06.R05 | Storage of the telemetry store is append-only per partition; partitions are sealed after 24 h. | MVP |

## Data / schema
Buffer record carries batch digest for R02 of PS-121-04.

## Commands / queries / events
`telemetry.ingest` idempotent on digest (PS-121-04).

## States & transitions
Alert instances follow PS-121-03 and survive restarts.

## Validation & errors
| Code | Retryable | Category / HTTP | When |
|---|---|---|---|
| SYS.UNAVAILABLE | true | unavailable / 503 | Ingest down; emitter retries. |
| OBSERV.REDACTION_FAILED | false | internal / 500 | Record dropped, not retried. |

## Authorization
Emitters use their `sys` principal.

## Failure, idempotency, concurrency, offline
Emitter crash: buffered records are flushed on restart when the file-backed buffer is intact; corrupt buffer is discarded with counter increment.

## Privacy, retention, abuse
Buffers hold the same redacted records as ingest; buffer files are excluded from crash-report uploads.

## Observability & budgets
Alert when telemetry dropped rate > 1% for 10 min (ASSUMPTION).

## Tests
- TEST-PS-121-06-01 (fault): ingest down for 30 min; no caller blocked; alert records retained.
- TEST-PS-121-06-02 (kill): emitter killed with 5,000 buffered records; restart delivers each once.
- TEST-PS-121-06-03 (property): drop order never drops alert records before log records.
- TEST-PS-121-06-04 (unit): corrupt buffer discarded and counted.

## Acceptance criteria
1. No caller blocked by telemetry outage (TEST-01).
2. TEST-PS-121-06-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: buffer sizes above.
