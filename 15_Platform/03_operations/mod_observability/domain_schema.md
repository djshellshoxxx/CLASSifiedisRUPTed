# PS-121-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/03_operations/mod_observability (F15.S03.M01). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-PRV-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-121-01.R01 | Telemetry record types are closed: `log`, `metric_sample`, `trace_span`, `alert_instance`, `alert_rule`. Any other type is rejected at ingest. | MVP |
| PS-121-01.R02 | Log record fields are the allow-list in Data; unknown fields are dropped at ingest and counted. | MVP |
| PS-121-01.R03 | `alert_rule` records are versioned; a change creates a new version and keeps the previous one for 12 months (RET-AUD). | MVP |
| PS-121-01.R04 | `alert_instance` links to the rule version and the CTR-ERR-001 code or metric that triggered it. | MVP |
| PS-121-01.R05 | No record type holds payload content, names, emails, phone numbers, IP addresses in clear, coordinates, or key material. | MVP |

## Data / schema
```json
{
  "log": {"ts": "RFC 3339 UTC ms", "level": "debug|info|warn|error", "module": "F-code (e.g. F15.S03.M01)", "code": "CTR-ERR-001 code or null", "request_id": "req_ or null", "actor_hash": "HMAC-SHA-256 keyed, 32 hex, or null", "ip_prefix": "IPv4 /24 or IPv6 /48, or null", "event_type": "CTR-EVT-001 or null", "message_key": "err.* or null", "duration_ms": "integer"},
  "metric_sample": {"name": "snake_case", "labels": "closed enum labels only", "value": "number", "ts": "RFC 3339 UTC ms"},
  "alert_instance": {"alert_id": "aud_ or null (PENDING registry review; see Assumptions)", "rule_id": "string", "rule_version": "SemVer", "state": "pending|firing|resolved|acknowledged", "started_at": "ms", "resolved_at": "ms or null"}
}
```
Constraints: `actor_hash` uses a key rotated daily (ASSUMPTION); `ip_prefix` is the only IP form; `label` cardinality max 10,000 series per metric.

## Commands / queries / events
See PS-121-04.

## States & transitions
See PS-121-03 for alert instances.

## Validation & errors
See PS-121-02.

## Authorization
See PS-121-05.

## Failure, idempotency, concurrency, offline
Ingest is idempotent on (`source`, `ts`, `name`, `sequence`) for log and metric records.

## Privacy, retention, abuse
`actor_hash` and `ip_prefix` follow CTR-PRV-001 R09. Retention per PS-121-07.

## Observability & budgets
This module is the telemetry store; its own health metrics are in PS-121-08.

## Tests
- TEST-PS-121-01-01 (schema): log fixture with email in `message_key` rejected.
- TEST-PS-121-01-02 (unit): unknown field dropped and counted.
- TEST-PS-121-01-03 (unit): alert rule change creates new version; old version readable.
- TEST-PS-121-01-04 (property): 10,000 random inputs; no output field contains a raw IPv4 host address.

## Acceptance criteria
1. Schema validates fixtures; invalid fixtures refused with codes in PS-121-02.
2. TEST-PS-121-01-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: `alert_id` uses `aud_` prefix (CTR-ID-001 registry, F16 owner) only if F16 accepts alert records as audit records; otherwise PENDING registration.
- ASSUMPTION: daily key rotation for `actor_hash`.
- PROVISIONAL (D07 default).
