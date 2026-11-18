# PS-117-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/02_backend/mod_api. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-EVT-001 (R12), CTR-COM-001 (R02), CTR-SCH-001 (R05).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-117-02.R01 | Command bodies ≤ 64 KiB (ASSUMPTION); larger → `API.BODY_TOO_LARGE`, 413, before parsing. | MVP |
| PS-117-02.R02 | JSON depth ≤ 8; duplicate object keys rejected. | MVP |
| PS-117-02.R03 | Unknown fields in command bodies are rejected (strict mode). Response fields may be extended by MINOR versions. | MVP |
| PS-117-02.R04 | Money fields are decimal strings (CTR-COM-001 R02). JSON numbers with a fraction on those fields are rejected. | MVP |
| PS-117-02.R05 | `Idempotency-Key` is required on every `POST /v1/commands/*`; absence → `API.IDEMPOTENCY_KEY_REQUIRED`. | MVP |
| PS-117-02.R06 | Entity IDs in path or body validated with CTR-ID-001 R01–R04, R09 before any lookup; failure → `ID.MALFORMED`. | MVP |

## Data / schema
Request envelope (command):
```json
{ "type": "listing.publish", "data": { "...": "..." }, "client_schema_version": "1.0.0" }
```
Headers: `Content-Type: application/json; charset=utf-8` (other values rejected); `Idempotency-Key` (16–64 chars, `^[A-Za-z0-9_-]+$`); `If-Match: <revision>` optional for updates.

## Commands / queries / events
Validation runs in this order: transport size → media type → JSON parse → depth/duplicate keys → envelope schema → payload schema (CTR-SCH-001 for `schema_id` = `command_type`) → ID format → idempotency header.

## States & transitions
Not applicable: validation is stateless. Each rejection is terminal for that request; the client may resubmit a corrected request with the same key only if the digest changes before commit (see PS-117-03).

## Validation & errors
| Rule | HTTP | Code | Category | Retryable | message_key | details.rule |
|---|---|---|---|---|---|---|
| Body too large | 413 | API.BODY_TOO_LARGE | payload_too_large | false | err.api.body_too_large | size |
| Bad media type | 400 | API.MEDIA_TYPE_UNSUPPORTED | validation | false | err.api.media_type | media_type |
| Malformed JSON / depth / duplicate key | 400 | API.MALFORMED_JSON | validation | false | err.api.malformed_json | depth or duplicate_key |
| Unknown field | 400 | API.UNKNOWN_FIELD | validation | false | err.api.unknown_field | unknown_field |
| Float in money field | 400 | API.FLOAT_FORBIDDEN | validation | false | err.api.float_forbidden | float_forbidden |
| Missing idempotency key | 400 | API.IDEMPOTENCY_KEY_REQUIRED | validation | false | err.api.idempotency_key_required | required |
| Sunset version | 410 | API.VERSION_SUNSET | gone | false | err.api.version_sunset | version |

Diagnostics contain no input values (CTR-ERR-001 R07). Errors are logged by code only.

## Authorization
Validation precedes authorization for shape checks only. Existence checks never precede authorization: an unreadable object yields `SYS.NOT_FOUND` (CTR-ERR-001 R08).

## Failure, idempotency, concurrency, offline
Validation is pure and deterministic: identical bytes always yield identical results. Offline clients queue only validated envelopes (D08 PROVISIONAL default); queued envelopes that later fail schema checks are marked `client upgrade required` per CTR-SCH-001 R06.

## Privacy, retention, abuse
Rejected bodies are discarded after parsing. Body bytes are never written to logs or error responses. Size checks run before parse to limit memory abuse.

## Observability & budgets
Counter `api_validation_rejections_total{code}`. Validation overhead p95 ≤ 2 ms for a 64 KiB body (ASSUMPTION).

## Tests
- TEST-PS-117-02-01 (unit): each row of the error table with a minimal failing input.
- TEST-PS-117-02-02 (property): random JSON within limits parses identically under strict and lenient readers for known fields.
- TEST-PS-117-02-03 (fuzz): depth-9 and duplicate-key inputs never reach handlers.

## Acceptance criteria
1. Each rule in the table returns exactly one code with the stated HTTP status and retryable flag.
2. No validation error response echoes a submitted value.
3. A 64 KiB + 1 byte body is rejected before JSON parse (asserted by memory counter).

## Assumptions & open decisions
- ASSUMPTION: 64 KiB command limit, depth 8.
- D03 (PROVISIONAL default: integer minor units with pinned quotes, unapproved): drives R04 money format.
- D08 (PROVISIONAL default, unapproved): offline queue validation policy above.
