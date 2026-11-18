# PS-080-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/02_security_boundaries/mod_metadata (Privacy Lead, F10; review F16). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (classes, R09 log redaction), CTR-EVT-001 (R06 envelope actor rule), CTR-ID-001 (`req_` opaque, `cor_` ulid), CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-080-01.R01 | `metadata_policy` row per (`surface`, `version`); `surface` enum: `http_request`, `server_log`, `event_envelope`, `attachment_ingest`, `push_payload`, `federation_batch`, `error_response`. | MVP |
| PS-080-01.R02 | Each policy holds an allowlist of field names per surface; default deny (absent from list = not permitted). | MVP |
| PS-080-01.R03 | `attachment_metadata_report` row per upload: `attachment_id` (`att_`), `format`, counts of removed fields per category, `sanitizer_version`, `policy_version`. No removed values stored. | MVP |
| PS-080-01.R04 | IP addresses are stored only as truncated prefixes: IPv4 /24, IPv6 /48 (ASSUMPTION), in RET-OPS logs. | MVP |
| PS-080-01.R05 | Timestamp granularity per surface: `event_envelope.occurred_at` keeps producer value; outbound `meetup_*` timestamps coarsened to 15 min (ASSUMPTION). | MVP |

## Data / schema
```json
{
  "metadata_policy": {"surface": "server_log", "version": "1.0.0", "allowed_fields": ["req_", "route", "status", "duration_ms", "ip_prefix", "code"], "approved_by": ["acc_or_ope_ID", "sec_review_ID"], "effective_from": "timestamp"},
  "attachment_metadata_report": {"attachment_id": "att_<opaque>", "format": "jpeg|png|webp", "removed": {"gps": 0, "device": 0, "author": 0, "thumbnail": 0, "other": 0}, "sanitizer_version": "semver", "policy_version": "semver", "created_at": "timestamp"}
}
```

## Commands / queries / events
See PS-080-04.

## States & transitions
See PS-080-03.

## Validation & errors
See PS-080-02.

## Authorization
Policy approval requires F10 and F16 approvers (PS-080-05).

## Failure, idempotency, concurrency, offline
Policy row immutable after publish; report idempotent on `att_` + sanitizer version.

## Privacy, retention, abuse
Policy rows RET-AUD. Attachment reports RET-OPS (counts only). IP prefixes RET-OPS (30 days).

## Observability & budgets
Row write p95 ≤ 100 ms (ASSUMPTION).

## Tests
- TEST-PS-080-01-01 (schema): report contains no field value from the source file.
- TEST-PS-080-01-02 (policy): surface without an allowlist row rejects all fields.

## Acceptance criteria
1. Schema validates against CTR-SCH-001.
2. Report carries counts only (TEST-PS-080-01-01).
3. Every surface in R01 has a published policy.

## Assumptions & open decisions
- ASSUMPTION: IP truncation /24 and /48.
- ASSUMPTION: 15-minute outbound timestamp granularity.
- PROVISIONAL (D05 default, unapproved): coarse disclosure for location-adjacent timestamps.
