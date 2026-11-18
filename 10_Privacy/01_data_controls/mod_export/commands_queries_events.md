# PS-078-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/01_data_controls/mod_export (Privacy Lead, F10). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001 (R11), CTR-FED-001 (R08 pseudonym rule, analogue only).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-078-04.R01 | Commands: `privacy.export.request`, `privacy.export.download`. Queries: `privacy.export.get`. Internal: `privacy.export.generate` (sys). | MVP |
| PS-078-04.R02 | State-changing commands require `Idempotency-Key`; scope per CTR-EVT-001 R03. | MVP |
| PS-078-04.R03 | Download returns `application/octet-stream` with `Content-Disposition: attachment`, `Cache-Control: no-store`, and `X-Content-Type-Options: nosniff`. | MVP |
| PS-078-04.R04 | Events carry IDs, state, counts and bytes only; `max_data_class` ≤ PSEUDONYMOUS. | MVP |
| PS-078-04.R05 | Request body is ≤ 1 KiB; larger → `SYS.PAYLOAD_TOO_LARGE` (413). | MVP |

## Data / schema
Request: `{"scope": "full", "include_precise_location": false}`.
Response (202): `{"id": "dsr_01HZ...", "state": "requested", "aggregate_revision": 1}`.
Download: `GET /privacy/exports/{dsr_id}/download` with header `X-Export-Token`.

## Commands / queries / events
| Operation | Idempotency | Emits | Errors |
|---|---|---|---|
| request | key + digest | `export.requested` | EXPORT.SCOPE_INVALID, EXPORT.REAUTH_REQUIRED, EXPORT.PRECISE_LOCATION_NOT_CONFIRMED, EXPORT.ALREADY_GENERATING |
| download | none (single-use token) | `export.downloaded` | EXPORT.TOKEN_CONSUMED, EXPORT.PACKAGE_EXPIRED, SYS.NOT_FOUND |
| generate (sys) | lease id | `export.generating`, `export.ready`, `export.failed` | SYS.UNAVAILABLE |
| get | none | none | SYS.NOT_FOUND |

## States & transitions
Emission per PS-078-03.

## Validation & errors
Per PS-078-02. Unknown major schema on stored manifest → `SCH.UNKNOWN_VERSION` (internal to ops, not returned to subject).

## Authorization
Subject `acc_` for request, download, get. `sys_` for generate with purpose `subject_export`.

## Failure, idempotency, concurrency, offline
Download is not idempotent by design: a second valid-token request after the first full download returns `EXPORT.TOKEN_CONSUMED` unless the client requests resume (range support, PS-078-06).

## Privacy, retention, abuse
Events never contain manifest contents. Download logs record `dsr_` ID and bytes only.

## Observability & budgets
Download first-byte p95 ≤ 500 ms (ASSUMPTION).

## Tests
- TEST-PS-078-04-01 (contract): response headers R03 asserted.
- TEST-PS-078-04-02 (idempotency): repeated request with same key returns original `dsr_`.

## Acceptance criteria
1. All operations and error codes match PS-078-02 and PS-078-03.
2. Download response headers match R03 in a contract test.
3. No event contains a manifest path or file name.

## Assumptions & open decisions
- PENDING: CTR-PORT-001 for manifest envelope.
- ASSUMPTION: 1 KiB request limit.
