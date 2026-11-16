# PS-004-04 — commands, queries and events
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/01_listings/mod_publish. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (envelope), CTR-SCH-001 (payload schemas, `schema_version` 1.0.0), CTR-ERR-001, CTR-ID-001, CTR-FED-001 (federated `listing.published`). **Pending:** PENDING CTR-MOD-001 (consumed `cas.cleared`, `cas.rejected`), PENDING CTR-LST-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-004-04.R01 | `lst.publish` is the only state-changing command in this module. It requires `idempotency_key` (16–128 chars, CTR-EVT R03) and `expected_revision`. | MVP |
| PS-004-04.R02 | Each transition emits exactly one event from the table below. Replays emit none. | MVP |
| PS-004-04.R03 | Queries return owner fields only to the owner. Public readers get published listings only, with `owner_ref` as a `prf_` view. | MVP |
| PS-004-04.R04 | Payloads carry no contact field, coordinates or hold text. | MVP |

## Command: `lst.publish` (v1.0.0)
Signature: `lst.publish(listing_id, expected_revision, duration_days, idempotency_key) → PublishResult`.

Request:
```json
{"command": "lst.publish", "listing_id": "lst_01HZX3M0J4R8S2A6C9E3F5G7H1", "expected_revision": 2, "duration_days": 30, "idempotency_key": "pub-7c1e0a9b-2d4f-4a6e-8b1c-3f5d7e9a1b2c"}
```

Response 200 (T1):
```json
{"listing_id": "lst_01HZX3M0J4R8S2A6C9E3F5G7H1", "state": "published", "revision": 3, "published_at": "2026-11-16T09:12:04.317Z", "expires_at": "2026-12-16T09:12:04.317Z", "event_id": "evt_01HZX3K9Q7M2V8T4W6Y0B5N1CD"}
```

Response 200 (T2): `state = held_review`, `hold.reason_code` set, no `published_at`. The owner sees the hold reason but not the case.

Error 422 example:
```json
{"error": {"code": "PUB.LISTING_INCOMPLETE", "retryable": false, "category": "unprocessable_state", "http_status": 422, "message_key": "err.pub.listing_incomplete", "request_id": "req_01HZX3N5K8Q2T6V9W1Y4B7C0DE", "details": [{"field": "/price", "rule": "price_required"}]}}
```

Error codes: see [validation_rules.md](validation_rules.md) (PUB registry) and CTR-ERR-001 shared codes.

## Query: `lst.get_publish_state(listing_id)`
Returns `{listing_id, state, revision, published_at, expires_at, duration_days, hold: {reason_code, placed_at} | null}`. Owner only for non-published states. No history array.

## Events
| event_type | Emitted by | max_data_class | Federable | Payload keys |
|---|---|---|---|---|
| `listing.published` | T1, T3 | LOCATION_COARSE | Only if `federate = true` and CTR-FED-001 R02/R04 pass; `region_cell` subject to K_MIN (CTR-PRV-001 R04) | listing_id, listing_kind, title, price, region_cell, published_at, expires_at |
| `listing.publish_held` | T2 | PSEUDONYMOUS | No (local only) | listing_id, reason_code, placed_at |
| `listing.publish_rejected` | T4 | PSEUDONYMOUS | No (local only) | listing_id, reason_code |

Envelope example (`listing.published`): `event_type = listing.published`, `aggregate_type = listing`, `actor_ref` = `acc_` (T1) or `mod_` (T3), `provenance.source_kind` = `client_direct`, `client_offline_replay` or `server_internal`, `max_data_class = LOCATION_COARSE`.

## Versioning and compatibility
- Adding an optional payload field: MINOR. Changing `listing_kind` open enum: MINOR (open).
- `listing.published` 2.0.0 requires upcast hook (CTR-SCH-001 R07).

## Assumptions & open decisions
- ASSUMPTION: `lst.update` is the capability for publish (no `publish` verb in CTR-CAP-001 R03); see PS-004-05.
- PROVISIONAL (D01 default, unapproved): signed envelope with explicit federation fields for `listing.published`.
- PROVISIONAL (D08 default, unapproved): offline `lst.publish` is pending until acknowledged.

## Tests
- TEST-PS-004-04-01 (schema): request, response, error and three event fixtures validate; one invalid fixture per listed violation fails.
- TEST-PS-004-04-02 (negative): `event_type` and `aggregate_type` mismatch rejected (CTR-EVT R10).
- TEST-PS-004-04-03 (federation): `listing.publish_held` never appears in a federated batch (CTR-FED R02/R03).
- TEST-PS-004-04-04 (query): public read of held listing returns SYS.NOT_FOUND; owner read returns hold reason only.

## Acceptance criteria
1. Fixtures in TEST-PS-004-04-01 pass in CI; no event carries contact data or coordinates.
2. `listing.publish_held` and `listing.publish_rejected` are excluded from all federation exports.
3. Query responses omit `hold` for non-owners.
