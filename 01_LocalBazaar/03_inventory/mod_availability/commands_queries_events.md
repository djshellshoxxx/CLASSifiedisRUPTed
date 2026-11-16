# PS-008-04 — commands queries events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** [01_LocalBazaar/03_inventory/mod_availability](SPEC.md) (F01.S03.M01; accountable role: Marketplace Lead). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-CAP-001.

**Decisions:** Command surface is PROVISIONAL (ASSUMPTION, unapproved). Idempotency scope and retention follow CTR-EVT-001 R03 (7 days). Offline queueing per D08 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-008-04.R01 | Every state-changing command carries `idempotency_key` (16–128 chars) and `expected_revision` (null only for create). | MVP |
| PS-008-04.R02 | Every command emits at most one event per aggregate, plus its `correlation_id`. | MVP |
| PS-008-04.R03 | Command names are `<resource>.<verb>`, versioned `v1` in the path. Signatures are fixed per schema version. | MVP |
| PS-008-04.R04 | Queries return only fields the actor may see (CTR-CAP-001 R10). List page size ≤ 50. | MVP |

## Commands
| Command | Principal | Signature (key fields) | Event(s) | Errors |
|---|---|---|---|---|
| `availability.create` | owner `acc_` | `listing_ref, variant_ref?, total_units` | `availability.created` | V01, V02, SYS.FORBIDDEN |
| `availability.configure` | owner | `availability_id, total_units, expected_revision` | `availability.configured` | V02, V05, EVT.REVISION_CONFLICT |
| `availability.commit_units` | owner | `availability_id, units, expected_revision` | `availability.committed` | V04, EVT.REVISION_CONFLICT |
| `availability.pause` / `.resume` | owner or moderation case | `availability_id, expected_revision` | `availability.status_changed` | AVAIL.RECORD_ARCHIVED |
| `hold.place` | sys (F01.S04.M01) | `availability_id, offer_ref, units, ttl_hours` | `hold.placed` | V03–V07, V11, V12 |
| `hold.withdraw` | holder, owner, or sys | `hold_id` | `hold.withdrawn` | V08 |
| `hold.execute` | sys (offer accepted) | `hold_id` | `hold.executed` | V08, V09 |
| `hold.expire` | sys scheduler | `hold_id` (batch ≤ 500) | `hold.expired` | none (no-op if not PLACED) |

Example: `hold.place` request body `{"availability_id":"avl_…","offer_ref":"<PENDING>_…","units":2,"ttl_hours":72}` with header `Idempotency-Key`.

## Queries
| Query | Returns | Notes |
|---|---|---|
| `availability.get(availability_id)` | record (visible fields) | Hidden or missing → SYS.NOT_FOUND |
| `availability.list_by_listing(listing_ref, page_token, limit)` | page of records | `limit` ≤ 50 |
| `hold.list(availability_id)` | holds the actor may see | Owner sees counts and expiry; `holder_ref` only for participants |

## Events
Envelope per CTR-EVT-001; `aggregate_type` `availability` or `hold`; `event_type` values:

| Event | Payload (IDs, counts, enums only) | max_data_class |
|---|---|---|
| `availability.created` / `.configured` / `.committed` | ids, counts, `revision`, `commit_source` | PUBLIC |
| `availability.status_changed` | id, from, to | PUBLIC |
| `hold.placed` | hold_id, availability_id, offer_ref, units, expires_at, holder_ref | PSEUDONYMOUS |
| `hold.withdrawn` / `hold.executed` / `hold.expired` | hold_id, reason enum | PSEUDONYMOUS |

Schema IDs equal event types (CTR-SCH-001 R01), owner `F01`. No event carries a name, email or location.

## Tests
- TEST-PS-008-04-01 (schema): every command and event fixture validates against CTR-EVT-001 and CTR-SCH-001.
- TEST-PS-008-04-02 (contract): `hold.place` from a non-sys principal → SYS.FORBIDDEN.
- TEST-PS-008-04-03 (integration): list page of 51 requested → rejected or capped at 50.
- TEST-PS-008-04-04 (privacy lint): event payloads contain no `holder_ref` except `hold.placed`.

## Acceptance criteria
1. All commands and events in the tables exist with matching schemas.
2. TEST-PS-008-04-01 to -04 pass in CI.
3. Consumers reference event types by ID only.

## Assumptions & open decisions
- ASSUMPTION: `v1` path prefix; batch expiry size 500.
- PENDING: `offer_ref` prefix (F01.S04.M01) and CTR-SCH registry entries for each event.
