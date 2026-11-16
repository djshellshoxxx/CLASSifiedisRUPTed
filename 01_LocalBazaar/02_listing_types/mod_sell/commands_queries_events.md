# PS-006-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/02_listing_types/mod_sell. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (envelope, idempotency R03), CTR-ERR-001, CTR-SCH-001, CTR-FED-001 (R02, R03, R08), CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-006-04.R01 | Every state-changing command requires `idempotency_key`, and `expected_revision` where a revision exists. Idempotency scope is (actor, command type, key) (CTR-EVT-001 R03). | MVP |
| PS-006-04.R02 | All commands are versioned `v1`. Breaking payload changes require `v2` (CTR-SCH-001 R03). | MVP |
| PS-006-04.R03 | Event types follow `listing.<past-tense verb>` (CTR-EVT-001 R10). Each committed event increments the listing revision by exactly 1. | MVP |
| PS-006-04.R04 | Request and sale events carry a buyer pseudonym and are never federated (CTR-FED-001 R03). | MVP |
| PS-006-04.R05 | `sell.record_sale` has no client entry point. It runs only on F09 claim events delivered by a `sys_` principal. | MVP |

## Data / schema
Commands (all `v1`):

| Command | Actor (capability) | Inputs | Error codes |
|---|---|---|---|
| sell.set_terms | owner (lst.update) | lst_id, expected_revision, price_minor, currency_kind, currency, quantity_total, condition, pickup_method | TERMS_INVALID, TERMS_LOCKED, SYS.CONFLICT, SYS.FORBIDDEN |
| sell.request_purchase | non-owner who sees the listing (lst.propose) | lst_id | SELF_REQUEST, REQUEST_EXISTS, SOLD_OUT, REQUEST_LIMIT, SYS.NOT_FOUND |
| sell.accept_request | owner (lst.accept) | prq_id, expected_revision | RESERVATION_ACTIVE, SOLD_OUT, REQUEST_CLOSED, SYS.CONFLICT, SYS.UNAVAILABLE |
| sell.decline_request | owner (lst.reject) | prq_id, expected_revision | REQUEST_CLOSED, SYS.CONFLICT |
| sell.withdraw_request | buyer (prq.withdraw) or owner for an active reservation | prq_id | REQUEST_CLOSED, SYS.NOT_FOUND |

Queries: `sell.get_status(lst_id)` returns sell_state, quantity_remaining, price_minor, currency (PUBLIC). `sell.list_requests(lst_id, cursor, limit ≤ 50)` is owner-only. `sell.get_request(prq_id)` is buyer or owner only.

Events (aggregate `listing`):

| event_type | Payload fields | max_data_class | Federable |
|---|---|---|---|
| listing.sell_terms_changed | price_minor, currency, quantity_total, condition, pickup_method | PUBLIC | only if listing federate = true and PUBLIC (CTR-FED-001 R02) |
| listing.purchase_requested | request_id, buyer_ref | PSEUDONYMOUS | no |
| listing.purchase_declined, listing.purchase_cancelled | request_id | PSEUDONYMOUS | no |
| listing.reserved | request_id, buyer_ref, trx_id, expires_at | PSEUDONYMOUS | no |
| listing.reservation_released | request_id, reason (cancelled, expired, no_sale) | PSEUDONYMOUS | no |
| listing.sale_recorded, listing.sale_reversed, listing.sale_held, listing.sale_resumed | trx_id, claim_state, quantity_remaining | PSEUDONYMOUS | no |

## Validation & errors
Codes per [PS-006-02](validation_rules.md). Any payload containing a SECRET field fails with `EVT.SECRET_IN_PAYLOAD` (CTR-EVT-001 R11); this module defines no SECRET fields.

## States & transitions
Event emission per transition in [PS-006-03](workflow_state_machine.md).

## Authorization
Capability per command above; see [PS-006-05](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Same key and same request digest returns the original result with no new event. Same key with a different digest returns `SYS.CONFLICT`. Idempotency records are kept 7 days (RET-OPS default).

## Privacy, retention, abuse
Payloads carry opaque IDs only. Price and currency are PUBLIC by design because they are listing content.

## Observability & budgets
One structured log line per command: command, error code, request_id, timing. No request or response bodies (CTR-ERR-001 R10).

## Tests
- TEST-PS-006-04-01 (contract): every event payload validates against its CTR-SCH-001 registry entry.
- TEST-PS-006-04-02 (integration): replaying `accept_request` with the same key returns the original result and writes no second event.
- TEST-PS-006-04-03 (unit): `sell.set_terms` with a stale `expected_revision` returns `SYS.CONFLICT`.
- TEST-PS-006-04-04 (unit): `sell.record_sale` rejects every caller that is not a `sys_` principal.

## Acceptance criteria
1. All five commands and three queries are versioned and listed with their error codes.
2. Each event type matches `listing.<past-tense verb>` and appears in the table.
3. No request or sale event is federable.
4. Replay with the same key never produces a second event.

## Assumptions & open decisions
- D01 PROVISIONAL (default: versioned signed envelopes, explicit opt-in). Only PUBLIC sell terms can federate.
- PENDING CTR-SCH-001 registry entries for the `sell` extension and the events above (added at implementation).
- ASSUMPTION: idempotency retention 7 days.
