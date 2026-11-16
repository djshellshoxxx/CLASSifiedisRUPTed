# PS-007-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/02_listing_types/mod_wanted. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-ID-001, CTR-SCH-001, CTR-FED-001 (federated events), PENDING CTR-LST-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-007-04.R01 | Every command is `v1`, JSON, and carries `idempotency_key` (opaque 128-bit or ULID). Mutations carry `expected_revision`; `create` does not. | MVP |
| PS-007-04.R02 | Idempotency scope = (actor, command, key). Same key and digest → original result, no new event. Retained 7 days (RET-OPS). | MVP |
| PS-007-04.R03 | Server p95 ≤ 250 ms for create and update; ≤ 400 ms for publish (ASSUMPTION). | MVP |
| PS-007-04.R04 | Event payloads use fragment `listing.wanted_fields` 1.0.0 inside the CTR-EVT-001 envelope. | MVP |
| PS-007-04.R05 | One user command emits ≤ 1 aggregate event and carries one `correlation_id`. | MVP |
| PS-007-04.R06 | Lists are cursor-paginated, `limit` ≤ 50. No offsets (CTR-ID R06). | MVP |

## Data / schema
Request example (publish):
```json
{"command":"wanted.publish","version":"v1","id":"lst_01HZX3M0J4R8S2A6C9E3F5G7H1",
 "expected_revision":1,"idempotency_key":"01HZX4A2B3C4D5E6F7G8H9J0KM"}
```

## Commands / queries / events
| Command | Signature | Actor / capability | Error codes (beyond shared) |
|---|---|---|---|
| `wanted.create` | `(fields, idempotency_key) → view` | user / `cap.wanted.create` | validation codes (PS-007-02) |
| `wanted.update` | `(id, expected_revision, patch, key)` | owner / `cap.wanted.update` | validation; `SUSPENDED_READ_ONLY` |
| `wanted.publish` | `(id, expected_revision, key)` | owner / `cap.wanted.update` | `DUPLICATE_ACTIVE`, `ACTIVE_LIMIT_REACHED`, `INVALID_TRANSITION` |
| `wanted.pause` / `resume` / `fulfill` / `close` | `(id, expected_revision, key)` | owner / `cap.wanted.withdraw` or `update` | `INVALID_TRANSITION` |
| `wanted.renew` | `(id, expires_at, expected_revision, key)` | owner / `cap.wanted.update` | `EXPIRY_OUT_OF_RANGE`, `ACTIVE_LIMIT_REACHED` |
| `wanted.delete` | `(id, expected_revision, key)` | owner / `cap.wanted.delete` | `SUSPENDED_READ_ONLY` |
| `wanted.suspend` / `reinstate` / `remove` | `(id, case_id, expected_revision, key)` | moderator / `cap.wanted.moderate` | `INVALID_TRANSITION` |
| `sys.expire` | `(id, expected_revision)` | sys_ scheduler / `cap.wanted.execute` | none; no-op on mismatch |

Queries: `wanted.get(id) → view` (owner: full view; others: public projection). `wanted.list_mine(cursor, limit, status?)` (owner only). `wanted.projection_stream(cursor)` (sys_ indexer; PUBLIC fields and `region_cell` only).

Events: `listing.created|published|updated|paused|resumed|fulfilled|closed|expired|renewed|suspended|reinstated|tombstoned`. `event_type` regex per CTR-EVT R10. `published` and `updated` carry the public content fields (the index needs them). Other events carry status and reason only. No event carries `owner_account_id`.

## States & transitions
Command-to-transition mapping is in PS-007-03.

## Validation & errors
Order: envelope and schema check (`SCH.UNKNOWN_VERSION` for unknown major), authorization, then field validation, then guards. Error shape per CTR-ERR-001.

## Authorization
Each command names one capability (PS-007-05). Authorization is checked on every call, including retries.

## Failure, idempotency, concurrency, offline
Idempotency per R02. Same key with different digest → `WANTED.IDEMPOTENCY_KEY_REUSED`. Stale revision → `SYS.CONFLICT`. Offline queueing and replay in PS-007-06.

## Privacy, retention, abuse
Payloads contain only the listing fields. Idempotency records follow RET-OPS (7 days). Rate limits in PS-007-07.

## Observability & budgets
Counters `wanted_command_total{command,result}`; histogram `wanted_command_latency_seconds{command}`. Each request logs `request_id`, `correlation_id`, command, result code.

## Tests
- TEST-PS-007-04-01 (contract): request and response schemas validate for every command.
- TEST-PS-007-04-02 (integration): replay with same key and digest returns the original result; one event only.
- TEST-PS-007-04-03 (integration): same key, different digest → `IDEMPOTENCY_KEY_REUSED`.
- TEST-PS-007-04-04 (contract): event envelope validates; `owner_account_id` absent from every payload.
- TEST-PS-007-04-05 (e2e): one user command produces events sharing one `correlation_id`.

## Acceptance criteria
1. Each command in the table has signature, actor, capability and error set.
2. No mutating command is accepted without `idempotency_key`.
3. `owner_account_id` absent from all event and projection payloads.
4. Latency budgets in R03 measured in the load test (PS-007-08).

## Assumptions & open decisions
- PENDING CTR-LST-001: common `listing.*` envelope and event catalog.
- D01 PROVISIONAL (Dxx default, unapproved): versioned signed envelopes for federated events.
- D08 PROVISIONAL (Dxx default, unapproved): offline queue sends these commands after relay acknowledgment.
