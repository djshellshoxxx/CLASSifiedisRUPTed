# PS-069-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/01_payments/mod_noncustodial (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-SCH-001, CTR-COM-001 (R01, R11). **Decisions:** D09 (PROVISIONAL default, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-069-04.R01 | Every state-changing command requires `idempotency_key` (UUID or ULID, 26–36 chars) and `expected_state_version` where an existing row is targeted. | MVP |
| PS-069-04.R02 | Command and event payloads are versioned `1.0.0` under CTR-SCH-001; unknown major version is rejected (`SCH.UNKNOWN_VERSION`). | MVP |
| PS-069-04.R03 | Queries return only fields the caller's capabilities allow (CTR-CAP-001 R10); absent fields are omitted, not null. | MVP |
| PS-069-04.R04 | `route.list` returns at most 20 routes per page; p95 ≤ 200 ms. | MVP |

## Data / schema
Command signatures (request body fields; `idempotency_key` and `actor` are implicit in every command):
- `route.declare(trx_id, party_ref, method, chain?, asset, destination?, contact_hint?) -> route_id, state_version`
- `route.replace(route_id, expected_state_version, <declare fields>) -> new_route_id, state_version`
- `route.withdraw(route_id, expected_state_version) -> state_version`
- `adapter.register(adapter_id, rail, chain, finality_confirmations, key_id) -> status` (dual control; two `ope_` approvers, ASSUMPTION)
- `adapter.suspend(adapter_id, reason_key)`, `adapter.restore(adapter_id)`
Queries: `route.list(trx_id)`, `adapter.list()` (public metadata only: adapter_id, rail, chain, status).

## Commands / queries / events
| Command | Event | Idempotency scope | Version | Error codes |
|---|---|---|---|---|
| `route.declare` | `route.declared` | (actor, command, key) | v1 | PS-069-02 table |
| `route.replace` | `route.superseded` + `route.declared` | (actor, command, key) | v1 | `SYS.CONFLICT`, PS-069-02 |
| `route.withdraw` | `route.withdrawn` | (actor, command, key) | v1 | `NONCUST.ROUTE_IN_USE`, `SYS.CONFLICT` |
| `adapter.register` | `adapter.registered` | (actor, command, key) | v1 | `SYS.FORBIDDEN`, `SYS.PRECONDITION_FAILED` (no signed key) |
| `adapter.suspend` / `restore` | `adapter.suspended` / `adapter.restored` | (actor, command, key) | v1 | `SYS.CONFLICT` |

Event envelope per CTR-EVT-001. Route events carry `max_data_class` = PSEUDONYMOUS, or PRIVATE_PERSONAL only if `contact_hint` is present in the payload; the payload never includes `contact_hint` (events reference `route_id` only).

## States & transitions
Transitions per PS-069-03; command-to-event mapping above is the only write path.

## Validation & errors
Shared codes from CTR-ERR-001 (`SYS.*`) and module codes from PS-069-02. No new error codes are introduced here.

## Authorization
Capability IDs used: `route.declare`, `route.replace`, `route.withdraw`, `route.read`, `adapter.register`, `adapter.suspend`, `adapter.restore`, `adapter.list` (PS-069-05).

## Failure, idempotency, concurrency, offline
Same key and same request digest returns the original result and emits no new event (CTR-EVT-001 R03). Same key with different digest returns `EVT.IDEMPOTENCY_KEY_REUSED`.

## Privacy, retention, abuse
Events are immutable (CTR-EVT-001 R08). Redaction replaces payload with digest only.

## Observability & budgets
Per-command counters and p95 latency: `route.declare` ≤ 300 ms server time; `route.withdraw` ≤ 200 ms.

## Tests
- TEST-PS-069-04-01 (contract): command and event fixtures validate against CTR-SCH-001 schema `1.0.0`.
- TEST-PS-069-04-02 (integration): replayed `route.declare` with same key returns the original `route_id`.
- TEST-PS-069-04-03 (contract): `route.declared` payload contains no `contact_hint` value (canary test).
- TEST-PS-069-04-04 (contract): `adapter.list` omits fields not PUBLIC.

## Acceptance criteria
1. All six commands and two queries are implemented exactly as signed above (later phase).
2. Idempotency replay returns identical bytes for the response.
3. No event payload contains `destination` for `cash` or `other_external` routes.

## Assumptions & open decisions
- PENDING CTR-ID-001: `rte` prefix for `route_id`.
- ASSUMPTION: adapter registration requires two `ope_` approvers (dual control per CTR-CAP-001 R07).
- D09 (PROVISIONAL default, unapproved).
