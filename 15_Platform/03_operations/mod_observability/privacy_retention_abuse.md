# PS-121-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/03_operations/mod_observability (F15.S03.M01). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-ERR-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-121-07.R01 | Logs and telemetry carry pseudonymous IDs only (`actor_hash`); raw `acc_` IDs are not stored in logs (CTR-PRV-001 R09). | MVP |
| PS-121-07.R02 | IP addresses stored only as truncated prefix (IPv4 /24, IPv6 /48). | MVP |
| PS-121-07.R03 | Operational logs RET-OPS 30 days; aggregated metrics without identifiers 400 days; alert records RET-AUD 12 months. | MVP |
| PS-121-07.R04 | Redaction tests run on application logs, reverse-proxy logs, analytics, crash reports and support exports (CTR-PRV-001 BT-08). | MVP |
| PS-121-07.R05 | Telemetry is not sent to third-party vendors unless the vendor is listed in the disclosure matrix as an approved processor (OPEN, F10). | MVP |
| PS-121-07.R06 | Support exports contain aggregates and redacted logs only. | MVP |

## Data / schema
Retention classes from CTR-PRV-001: RET-OPS, RET-AUD. Aggregated metrics: class PSEUDONYMOUS-free aggregate (ASSUMPTION).

## Commands / queries / events
Retention sweep runs as a sys job; it emits no events for expired log records.

## States & transitions
Records expire; partition seal then drop (PS-121-06 R05).

## Validation & errors
`PRV.PRECISE_LOCATION_FORBIDDEN` if a precise-location pattern reaches ingest (rejected and alerted).

## Authorization
See PS-121-05.

## Failure, idempotency, concurrency, offline
Not applicable to clients.

## Privacy, retention, abuse
Abuse: log injection (control characters stripped at ingest); enumeration through error logs (codes only). Legal hold applies by case to telemetry records only when a case ID is present (CTR-PRV-001 R07).

## Observability & budgets
Alert on any redaction failure in production (zero tolerance).

## Tests
- TEST-PS-121-07-01 (privacy zero tolerance): fixtures with coordinates, addresses and emails produce no stored occurrence across all sinks.
- TEST-PS-121-07-02 (retention): log record removed at 30 days in staging clock test.
- TEST-PS-121-07-03 (injection): newline and control-character payloads stored escaped.
- TEST-PS-121-07-04 (export): support export fixture contains no `actor_hash` values.

## Acceptance criteria
1. Zero identifiers in sinks across the fixture corpus (TEST-01).
2. TEST-PS-121-07-01 through -04 pass.

## Assumptions & open decisions
- PROVISIONAL (D07 default).
- OPEN (F10): approved processor list for telemetry.
