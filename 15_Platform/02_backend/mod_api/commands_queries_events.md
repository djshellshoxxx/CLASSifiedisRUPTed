# PS-117-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/02_backend/mod_api. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-SCH-001, CTR-ERR-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-117-04.R01 | All HTTP routes are under `/v1/`. A MAJOR bump creates `/v2/`; both run in parallel for ≥ 6 months (ASSUMPTION). | MVP |
| PS-117-04.R02 | Reads are idempotent and cacheable only when `Cache-Control: private` is set. | MVP |
| PS-117-04.R03 | List endpoints use keyset pagination, `limit` ≤ 100 (default 25), opaque signed cursor. | MVP |
| PS-117-04.R04 | Every state-changing route declares its command type and its schema ID (CTR-SCH-001). | MVP |

## Data / schema
Routes (v1):

| Method | Path | Idempotency | Typical errors |
|---|---|---|---|
| POST | `/v1/commands/{command_type}` | required | 400, 401, 403, 409, 412, 422, 429, 503 |
| GET | `/v1/{resource}/{entity_id}` | n/a | 401, 403 (visible only), 404 |
| GET | `/v1/{resource}?cursor=&limit=` | n/a | 400, 401 |
| GET | `/v1/version` | n/a | 200 only |

Example request/response:
```
POST /v1/commands/listing.publish
Idempotency-Key: 01J9ZQ8K3V2M4X7B
{"type":"listing.publish","data":{"listing_id":"lst_01J9ZQ8K3V2M4X7BTQ5R0N6P1A"}}

202 Accepted
{"data":{"request_id":"req_01J9ZQ8K3V2M4X7BTQ5R0N6P1A"},"status":"succeeded"}
```

## Commands / queries / events
- Dispatch: `command_type` maps to exactly one owning-module handler through the platform registry. Unknown type → `API.UNKNOWN_COMMAND` (400, rule `unknown_type`).
- Events: api emits `api_version.deprecated` and `api_version.sunset` only (PS-117-01). Domain events are emitted by owning modules.

## States & transitions
Operator version commands: `api_version.deprecate`, `api_version.sunset` (ope, see PS-117-05). Lifecycle per PS-117-01.

## Validation & errors
Validation per PS-117-02. Handler errors pass through unchanged when they conform to CTR-ERR-001; non-conforming handler errors become `SYS.INTERNAL` (500 not in category table, mapped to `internal` category, HTTP 500) with no detail.

## Authorization
Dispatch checks that the route's declared capability (PS-117-05) exists before calling the handler. The handler performs the object-level decision.

## Failure, idempotency, concurrency, offline
Revision-based concurrency: updates send `If-Match: <revision>`; mismatch → 409 `API.REVISION_CONFLICT` (retryable false; client must reread). Offline replay uses the original idempotency key.

## Privacy, retention, abuse
Response bodies contain only fields the actor may read (CTR-CAP-001 R10). Cursors encode no PII: keyset values use IDs and revisions.

## Observability & budgets
Route label set is fixed (`route_template`, never raw path). p95 read ≤ 150 ms, command acknowledgment ≤ 300 ms, excluding downstream waits above 2 s (ASSUMPTION).

## Tests
- TEST-PS-117-04-01 (contract): responses conform to CTR-ERR-001 envelope for every error row.
- TEST-PS-117-04-02 (contract): route table matches the published OpenAPI document (generated, diffed in CI).
- TEST-PS-117-04-03 (integration): cursor tampering returns `API.CURSOR_INVALID` (400).

## Acceptance criteria
1. Every route in the table exists with the listed idempotency rule.
2. OpenAPI diff with the previous MINOR shows no removed field (CTR-SCH-001 R03).
3. Unknown command returns 400 with no handler invoked.

## Assumptions & open decisions
- ASSUMPTION: 202 for asynchronous commands; 200 for synchronous.
- D01 (PROVISIONAL default: versioned signed envelopes with explicit opt-in; unapproved): federation traffic uses CTR-FED-001 routes, not this API.
