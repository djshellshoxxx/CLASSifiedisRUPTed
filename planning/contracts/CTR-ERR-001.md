# CTR-ERR-001 — Error envelope

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** F15 Platform (named owner UNASSIGNED; S3-11). **Parent:** planning/CONTRACTS.md. **Canonical contracts:** CTR-ERR-001 (this file). **Depends on:** CTR-ID-001 (request IDs), CTR-PRV-001 (diagnostic data classes). **Consumed by:** every module API, the PWA client, federation acknowledgements (CTR-FED-001 per-event results use the same code registry).

**Decision label:** Category-to-HTTP mapping is PROVISIONAL (ASSUMPTION, unapproved). The envelope shape is a contract default and is not yet reviewed by F15.

## Scope

The shape, code registry, retry semantics and privacy rules for every error returned by any API, command, or federation acknowledgement.

## Requirements

| ID | Requirement (measurable) | Priority |
|---|---|---|
| CTR-ERR-001.R01 | Every error response uses the envelope in Data. No other error shape is permitted. | MVP |
| CTR-ERR-001.R02 | `code` = `<MODULE>.<CODE>`. `MODULE` matches `^[A-Z]{2,8}$`; `CODE` matches `^[A-Z][A-Z0-9_]{2,47}$`. Shared codes use module `SYS`. | MVP |
| CTR-ERR-001.R03 | `retryable` is fixed per code in the registry. Clients must not infer it. `true` means: the same unchanged request may succeed later without client-side change. | MVP |
| CTR-ERR-001.R04 | `category` determines the HTTP status (table below). A code's category is fixed. | MVP |
| CTR-ERR-001.R05 | `message_key` = `err.` + lowercase(`code`) with `.` kept. Clients render localized text from their catalog. The server never sends localized prose as a contract field. | MVP |
| CTR-ERR-001.R06 | Diagnostics are privacy-safe. Forbidden in any error response: personal data, names, emails, phone numbers, IP addresses, precise location, input values, stack traces, SQL, file paths, secret material. | MVP |
| CTR-ERR-001.R07 | `details[].field` is a JSON-pointer-like path. `details[].rule` is a registry enum. Input values are never echoed. | MVP |
| CTR-ERR-001.R08 | When the actor cannot read an object, responses are identical to those for a nonexistent object: `SYS.NOT_FOUND` (CTR-CAP-001). | MVP |
| CTR-ERR-001.R09 | Codes are never reused and never change meaning. Renaming issues a new code; the old code remains as an alias for 12 months (ASSUMPTION). | MVP |
| CTR-ERR-001.R10 | Server logs record `code`, `request_id`, module and timing. They never record request or response bodies. | MVP |

## Data / schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "urn:classrupt:contract:CTR-ERR-001:error:1.0.0",
  "type": "object",
  "required": ["error"],
  "additionalProperties": false,
  "properties": {
    "error": {
      "type": "object",
      "required": ["code","retryable","category","http_status","message_key","request_id"],
      "additionalProperties": false,
      "properties": {
        "code": {"type": "string", "pattern": "^[A-Z]{2,8}\\.[A-Z][A-Z0-9_]{2,47}$"},
        "retryable": {"type": "boolean"},
        "category": {"enum": ["validation","unauthenticated","forbidden","not_found","gone","conflict","precondition_failed","unprocessable_state","rate_limited","unavailable","internal","payload_too_large"]},
        "http_status": {"type": "integer", "enum": [400,401,403,404,409,410,412,413,422,429,500,503]},
        "message_key": {"type": "string", "pattern": "^err\\.[a-z0-9_]{2,8}\\.[a-z0-9_]{3,48}$"},
        "request_id": {"type": "string", "pattern": "^req_[0-9A-HJKMNP-TV-Z]{26}$"},
        "retry_after_ms": {"type": "integer", "minimum": 0, "maximum": 3600000},
        "details": {
          "type": "array", "maxItems": 20,
          "items": {
            "type": "object", "required": ["field","rule"], "additionalProperties": false,
            "properties": {
              "field": {"type": "string", "maxLength": 128},
              "rule": {"type": "string", "pattern": "^[a-z][a-z_]{2,47}$"}
            }
          }
        }
      }
    }
  }
}
```

`retry_after_ms` is permitted only for `rate_limited` and `unavailable`. `details` is optional.

**Category → HTTP status (fixed):**

| Category | HTTP | Typical use |
|---|---|---|
| validation | 400 | Format, pattern, range |
| unauthenticated | 401 | No or invalid session |
| forbidden | 403 | Visible object, action denied |
| not_found | 404 | Missing, or unreadable by actor (R08) |
| gone | 410 | Tombstoned object (CTR-FED-001, CTR-PRV-001) |
| conflict | 409 | Revision or idempotency conflict |
| precondition_failed | 412 | State not ready; retry later |
| unprocessable_state | 422 | Valid input, forbidden by domain state |
| payload_too_large | 413 | Size or depth limit |
| rate_limited | 429 | Quota (retryable with `retry_after_ms`) |
| unavailable | 503 | Dependency down (retryable) |
| internal | 500 | Unexpected (retryable only where the code says so) |

## Commands / queries / events

Not applicable. Errors are responses. Federation acknowledgements carry per-event `code` values from the same registry (CTR-FED-001). Events do not carry error envelopes.

## Versioning and compatibility

- Adding a code: MINOR. Clients must treat unknown codes as `internal` with `retryable: false` and show the generic `err.sys.internal` message.
- Changing a code's category, retryability or HTTP status: MAJOR (the code must be renamed instead).
- Message catalog keys are versioned with the code. A missing catalog key falls back to `err.sys.internal`.

## Examples

Valid:

```json
{
  "error": {
    "code": "COM.QUOTE_EXPIRED",
    "retryable": false,
    "category": "unprocessable_state",
    "http_status": 422,
    "message_key": "err.com.quote_expired",
    "request_id": "req_01HZX3N5K8Q2T6V9W1Y4B7C0DE",
    "details": [{"field": "quote_id", "rule": "valid_until_passed"}]
  }
}
```

Invalid (violates R02, R05, R06, R07):

```json
{
  "error": {
    "code": "com.quote expired",
    "retryable": "no",
    "category": "unprocessable_state",
    "message": "Quote for jane.doe@example.com expired at 14 Main St, Berlin",
    "request_id": "req_01HZX3N5K8Q2T6V9W1Y4B7C0DE",
    "details": [{"field": "quote_id", "rule": "valid_until_passed", "value": "qte_01HZX3"}]
  }
}
```

Violations: `code` format (R02); `retryable` not boolean (Data); `message_key` missing (R05); prose `message` with email and street address (R06); `details[].value` echoes an input value (R07); `http_status` missing.

## Validation and errors

Shared `SYS` codes (fixed for all modules):

| Code | Retryable | Category | HTTP |
|---|---|---|---|
| SYS.REQUEST_MALFORMED | false | validation | 400 |
| SYS.UNAUTHENTICATED | false | unauthenticated | 401 |
| SYS.FORBIDDEN | false | forbidden | 403 |
| SYS.NOT_FOUND | false | not_found | 404 |
| SYS.GONE | false | gone | 410 |
| SYS.CONFLICT | false | conflict | 409 |
| SYS.PRECONDITION_FAILED | true | precondition_failed | 412 |
| SYS.PAYLOAD_TOO_LARGE | false | payload_too_large | 413 |
| SYS.UNPROCESSABLE_STATE | false | unprocessable_state | 422 |
| SYS.RATE_LIMITED | true | rate_limited | 429 |
| SYS.UNAVAILABLE | true | unavailable | 503 |
| SYS.INTERNAL | false | internal | 500 |

`SYS.INTERNAL` is non-retryable by default. A module may register its own internal code with `retryable: true` when a retry is safe under CTR-EVT-001 idempotency rules.

**Retry guidance (client):** exponential backoff with full jitter, base 500 ms, cap 60 s (ASSUMPTION). Reuse the same `idempotency_key` on every retry of the same command. Honor `retry_after_ms` when present. Never retry non-retryable codes automatically.

## Authorization

Errors reveal no more than the actor is allowed to know. R08 applies to every object read. Authorization failures for visible objects return `SYS.FORBIDDEN`.

## Failure, idempotency, concurrency, offline

Offline queue entries that receive a non-retryable code are moved to a user-visible "not applied" state with the `message_key`. They are not silently discarded and not retried (D08).

## Privacy, retention, abuse

- Diagnostics follow CTR-PRV-001. Request IDs are the only correlation handle returned to clients.
- Error logs: RET-OPS (30 days maximum). Rate-limit responses do not reveal quota values beyond `retry_after_ms`.
- Enumeration defense: uniform `SYS.NOT_FOUND` (R08); uniform timing is not guaranteed (ASSUMPTION) and is tracked as a residual risk.

## Observability and budgets

- Metrics: `error_responses_total{code}`, `error_unknown_code_total` (clients reporting unknown codes), `error_privacy_lint_failures_total` (CI).
- Alert: a single code exceeding 5% of responses for 5 minutes (BT-01).
- Budget: error construction ≤ 1 ms p95 (ASSUMPTION).

## Tests

- TEST-CTR-ERR-001-01 (schema): valid example passes; invalid example fails on each listed violation.
- TEST-CTR-ERR-001-02 (registry lint): unique codes; `MODULE`/`CODE` patterns; `retryable` and `category` present; `message_key` derivable from `code`.
- TEST-CTR-ERR-001-03 (lint): category to HTTP mapping matches the table for every code.
- TEST-CTR-ERR-001-04 (privacy fixture scan): fuzzed inputs containing emails, phone numbers, addresses and coordinates produce error bodies with none of them (R06, R07).
- TEST-CTR-ERR-001-05 (negative integration): unreadable object and nonexistent object yield byte-identical bodies except `request_id` (R08).
- TEST-CTR-ERR-001-06 (client): unknown code falls back to `err.sys.internal` and is not retried.
- TEST-CTR-ERR-001-07 (retry): backoff schedule and `retry_after_ms` honored; same `idempotency_key` on retries.
- TEST-CTR-ERR-001-08 (logging): server logs contain no request or response bodies (R10), verified by log capture.

## Acceptance criteria

1. Every module error table references codes from this registry; lint TEST-02 passes.
2. TEST-CTR-ERR-001-01 through -08 pass in CI.
3. Privacy scan finds zero personal data in error bodies across the fuzz corpus.
4. Catalog contains a message key for every registered code in each supported locale (locale list owned by F14).

## Assumptions & open decisions

- ASSUMPTION: envelope shape and category mapping (PROVISIONAL, unapproved).
- ASSUMPTION: `SYS.INTERNAL` non-retryable default.
- ASSUMPTION: 12-month alias period for renamed codes.
- OPEN: supported locale list and fallback locale (F14).
- Related: CTR-CAP-001 (`SYS.NOT_FOUND` for hidden objects); CTR-PRV-001 (diagnostic data class).
