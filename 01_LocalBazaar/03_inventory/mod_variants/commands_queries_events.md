# PS-009-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/03_inventory/mod_variants. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-ID-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-009-04.R01 | Every state-changing command carries `idempotency_key` (26-char opaque, client-generated) and `expected_revision` (listing revision). | MVP |
| PS-009-04.R02 | Each command returns the new variant state and the listing revision after commit, in under 200 ms p95 server-side (ASSUMPTION). | MVP |
| PS-009-04.R03 | Queries are read-only and paginated; `listing.variants_get` returns at most 25 items. | MVP |
| PS-009-04.R04 | Event `aggregate_type` is `listing`; event types match `^[a-z][a-z_]{1,31}\.[a-z][a-z_]{1,31}$`. | MVP |

## Data / schema
Request bodies:
- `listing.variant_add`: `{listing_id, expected_revision, idempotency_key, attributes: [{key, value}]}`
- `listing.variant_update`: `{variant_id, expected_revision, idempotency_key, attributes}`
- `listing.variant_archive`: `{variant_id, expected_revision, idempotency_key}`

Events: `listing.variant_added`, `listing.variant_updated`, `listing.variant_archived`. Payload = variant record (PS-009-01); `max_data_class` = PUBLIC.

## Commands / queries / events
| Operation | Signature | Idempotency key | Expected revision | Errors |
|---|---|---|---|---|
| listing.variant_add | (listing_id, attributes) | required | listing revision | VARIANT.LIMIT_EXCEEDED, VARIANT.KEY_UNKNOWN, VARIANT.VALUE_INVALID, VARIANT.DUPLICATE_COMBINATION, EVT.REVISION_CONFLICT |
| listing.variant_update | (variant_id, attributes) | required | listing revision | VARIANT.VALUE_INVALID, VARIANT.DUPLICATE_COMBINATION, VARIANT.IN_USE, VARIANT.ARCHIVED, EVT.REVISION_CONFLICT |
| listing.variant_archive | (variant_id) | required | listing revision | VARIANT.ARCHIVED (on repeat with new key), EVT.REVISION_CONFLICT |
| listing.variants_get | (listing_id, cursor) | n/a | n/a | SYS.NOT_FOUND |

Versioning: request and event schema 1.0.0. A breaking change needs a new MAJOR (CTR-SCH-001 R03). Repeat archive with the same key returns the original result and writes no event (CTR-EVT-001 R03).

## States & transitions
Command-to-transition mapping is in PS-009-03.

## Validation & errors
Field rules are in PS-009-02.

## Authorization
Capabilities are in PS-009-05.

## Failure, idempotency, concurrency, offline
Idempotency scope is (actor, command type, key), retained 7 days (CTR-EVT-001 R03). Concurrency rules are in PS-009-06.

## Privacy, retention, abuse
Events carry no account names; `actor_ref` is the opaque `acc_` ID only (CTR-EVT-001 R06).

## Observability & budgets
Command latency and event lag metrics in PS-009-08.

## Tests
- TEST-PS-009-04-01 (contract): each event validates against the 1.0.0 envelope and payload schema.
- TEST-PS-009-04-02 (unit): replay of the same key with same digest returns the original result, no new event.
- TEST-PS-009-04-03 (unit): same key with a different body returns EVT.IDEMPOTENCY_KEY_REUSED.

## Acceptance criteria
1. Every command in the table has a schema, an idempotency rule and listed errors.
2. Events are emitted once per committed transition, with contiguous listing revisions.
3. `listing.variants_get` never returns more than 25 items.

## Assumptions & open decisions
- ASSUMPTION: 200 ms p95 server-side command budget.
- PENDING CTR-EVT-001 subscriber map: F02.S02.M05 and F01.S03.M01 subscriptions to be confirmed.
- No Dxx decision changes this process; the values above are ASSUMPTION until F15/F16 review.
