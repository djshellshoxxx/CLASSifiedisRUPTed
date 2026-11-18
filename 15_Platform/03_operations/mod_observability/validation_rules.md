# PS-121-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/03_operations/mod_observability (F15.S03.M01). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-ERR-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-121-02.R01 | Ingest rejects any record whose serialized size exceeds 16 KiB. | MVP |
| PS-121-02.R02 | Free-text fields (`message`, `details`) are refused at ingest; only enum or code fields are accepted. | MVP |
| PS-121-02.R03 | Redaction scan runs on every log record: email, phone, coordinate and IPv4/IPv6 host patterns trigger drop and `OBSERV.REDACTION_FAILED`. | MVP |
| PS-121-02.R04 | A metric whose new label value would exceed 10,000 series is refused with `OBSERV.CARDINALITY_EXCEEDED`. | MVP |
| PS-121-02.R05 | Alert rule expressions must reference metrics in the registry; unknown metrics are refused. | MVP |
| PS-121-02.R06 | Sampling configuration: head sample 1% default, 100% for error and for any record with a CTR-ERR-001 code; out-of-range config refused with `OBSERV.SAMPLE_CONFIG_INVALID`. | MVP |

## Data / schema
Validation rules map to the record types in PS-121-01.

## Commands / queries / events
Applied in `telemetry.ingest` and `alert_rule.create` (PS-121-04).

## States & transitions
Refused records are not stored; drop counters are updated.

## Validation & errors
| Code | Retryable | Category / HTTP | When |
|---|---|---|---|
| OBSERV.REDACTION_FAILED | false | internal / 500 | Redaction pattern matched; record dropped. |
| OBSERV.CARDINALITY_EXCEEDED | false | validation / 400 | R04. |
| OBSERV.SAMPLE_CONFIG_INVALID | false | validation / 400 | R06. |
| SYS.PAYLOAD_TOO_LARGE | false | payload_too_large / 413 | R01. |

## Authorization
Ingest accepts only `sys` principals (service emitters). Rule changes need PS-121-05 capability.

## Failure, idempotency, concurrency, offline
Refused records are not retried by the emitter. Redaction is pure and deterministic.

## Privacy, retention, abuse
Error responses to emitters echo no record content (CTR-ERR-001 R07).

## Observability & budgets
Budget: redaction scan <= 0.2 ms p95 per log record (ASSUMPTION).

## Tests
- TEST-PS-121-02-01 (unit): each rule R01–R06 pass and fail fixture.
- TEST-PS-121-02-02 (negative): log lines with an email, a phone number and a precise coordinate are all dropped.
- TEST-PS-121-02-03 (property): label explosion stops at 10,000 series.
- TEST-PS-121-02-04 (integration): ingest by a non-`sys` principal refused with `SYS.FORBIDDEN`.

## Acceptance criteria
1. Zero identifier fixtures reach storage (TEST-02).
2. TEST-PS-121-02-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: regex-based redaction is a second line of defense; code-level field allow-lists are primary.
- PROVISIONAL (D07 default).
