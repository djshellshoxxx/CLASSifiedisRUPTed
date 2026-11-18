# PS-077-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/01_data_controls/mod_delete (Privacy Lead, F10). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001 (R07 tombstones), CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-077-04.R01 | Commands: `privacy.deletion.request`, `privacy.deletion.cancel`. Queries: `privacy.deletion.get`, `privacy.deletion.list_own`. Internal: `privacy.deletion.execute` (sys only). | MVP |
| PS-077-04.R02 | State-changing commands require `Idempotency-Key` (UUID v4); idempotency scope per CTR-EVT-001 R03 (7-day retention). | MVP |
| PS-077-04.R03 | Command responses return `dsr_` ID, `state`, `aggregate_revision`. Never returns target content. | MVP |
| PS-077-04.R04 | Owner-originated tombstones for federated content are issued as `<aggregate_type>.tombstoned` events (CTR-FED-001 R07) by the origin node only. | MVP |
| PS-077-04.R05 | Event payloads are IDs, counts, state and timestamps. `max_data_class` ≤ PSEUDONYMOUS. | MVP |

## Data / schema
Request body (`privacy.deletion.request`):
```json
{"scope": "content_item", "target_id": "lst_01HZ...", "expected_revision": null}
```
Response (201 new, 200 replay):
```json
{"id": "dsr_01HZ...", "state": "executing", "aggregate_revision": 2, "cooling_off_until": null}
```
Event envelope fields per CTR-EVT-001; `event_type` regex compliant (`deletion.completed`).

## Commands / queries / events
| Operation | Idempotency | Emits | Errors |
|---|---|---|---|
| request | key + digest | `deletion.requested` | DEL.SCOPE_INVALID, DEL.REAUTH_REQUIRED, DEL.FULLY_HELD, DEL.ALREADY_PENDING |
| cancel | key | `deletion.cancelled` | DEL.CANCEL_WINDOW_CLOSED, SYS.NOT_FOUND |
| execute (sys) | executor lease id | `record.deleted`, `deletion.completed`, `<type>.tombstoned` | SYS.UNAVAILABLE (retryable) |
| get / list_own | none | none | SYS.NOT_FOUND |

## States & transitions
Event emission follows PS-077-03. `record.deleted` is emitted per target with IDs and store class only.

## Validation & errors
Errors per PS-077-02 and PS-077-03. Command with same key and different digest → `EVT.IDEMPOTENCY_KEY_REUSED` (409).

## Authorization
Caller principal `acc_` for request, cancel, get, list_own. `sys_` for execute. Federation tombstone emission requires origin-node signing key (CTR-FED-001 R09).

## Failure, idempotency, concurrency, offline
Replay of an identical request returns the original response without a new event. Execute uses an executor lease (60 s, ASSUMPTION) to prevent double execution.

## Privacy, retention, abuse
Event bodies are kept under RET-AUD. Requests are rate-limited (PS-077-07).

## Observability & budgets
Command p95 ≤ 250 ms excluding executor work (ASSUMPTION).

## Tests
- TEST-PS-077-04-01 (contract): response and event schemas validate against registry.
- TEST-PS-077-04-02 (idempotency): same key, same body twice → one event; same key, changed body → 409.

## Acceptance criteria
1. Every command and query in the table exists in the API contract with error codes listed.
2. No event payload field contains content (TEST-PS-077-04-01 negative fixture).
3. Tombstone events are emitted only by the origin node key (TEST-PS-077-04-02 extension).

## Assumptions & open decisions
- PENDING: `dsr_` prefix in CTR-ID-001.
- ASSUMPTION: executor lease 60 s.
