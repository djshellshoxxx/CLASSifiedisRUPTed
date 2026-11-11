# CTR-ERR-001 — Typed errors

**Status:** APPROVED. **Owner:** F15.S02.M02 (mod_api).

## Error object (compatible with RFC 9457 problem details; `application/problem+json`)
```json
{ "type": "urn:classrup:error:LISTING_NOT_FOUND", "code": "LISTING_NOT_FOUND", "status": 404,
  "retryable": false, "messageKey": "error.listing_not_found", "params": { },
  "fields": [ { "path": "price.amount", "code": "TOO_SMALL" } ], "correlationId": "<uuidv7>",
  "retryAfterMs": null }
```
## Rules
- **ERR-1** `code` is `UPPER_SNAKE`, prefixed by domain (`BAZAAR_`, `MUTINY_`, …) unless it is a common code below. Codes are stable forever; a removed code is never reused.
- **ERR-2** Messages are localized client-side from `messageKey` + `params` (CTR-UX-001). Server never returns stack traces, SQL, internal hostnames or another user's data; diagnostics go to logs keyed by `correlationId`.
- **ERR-3** Domain functions return `Result<T, AppError>`; throwing is reserved for programmer errors (mapped to `INTERNAL`).
- **ERR-4** Authorization failure on a resource the actor may not know exists returns `NOT_FOUND` (prevent enumeration).

## Common codes
| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| VALIDATION_FAILED | 422 | no | Input failed schema or rule; `fields` lists violations |
| UNAUTHENTICATED | 401 | no | Missing/expired session |
| FORBIDDEN | 403 | no | Capability denied (resource known to actor) |
| NOT_FOUND | 404 | no | Absent or not visible |
| CONFLICT_REVISION | 409 | no | `expectedRevision` stale; `params.currentRevision` |
| CONFLICT_STATE | 409 | no | Transition invalid from current state; `params.state` |
| IDEMPOTENCY_KEY_REUSED | 422 | no | Same key, different request hash |
| PRECONDITION_FAILED | 412 | no | Business precondition (e.g. lock held) |
| EXPIRED | 410 | no | Offer/quote/lock/session past expiry |
| RATE_LIMITED | 429 | yes | `retryAfterMs` set |
| FEATURE_DISABLED | 404 | no | Module flag off for tenant (CTR-FLG-001) |
| PAYLOAD_TOO_LARGE | 413 | no | Body/attachment exceeds limit |
| UNSUPPORTED_SCHEMA_VERSION | 400 | no | Unknown schema major |
| BLOCKED_PARTY | 403 | no | Actor blocked by or blocking counterparty |
| DEPENDENCY_UNAVAILABLE | 503 | yes | Downstream (chain RPC, push service) unavailable |
| INTERNAL | 500 | yes | Unexpected; logged with correlationId |
