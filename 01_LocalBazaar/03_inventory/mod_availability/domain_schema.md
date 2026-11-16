# PS-008-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** [01_LocalBazaar/03_inventory/mod_availability](SPEC.md) (F01.S03.M01; accountable role: Marketplace Lead). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-EVT-001, CTR-SCH-001, CTR-PRV-001, CTR-CAP-001.

**Decisions:** Quantity-only unit model is PROVISIONAL (ASSUMPTION; D04 default, unapproved). Prefixes `avl` and `hld` are PENDING CTR-ID-001 registry entries. `variant_ref` (owner F01.S03.M02) and `offer_ref` (owner F01.S04.M01) are PENDING prefixes.

**Canonical owner (B-06, PROVISIONAL):** record class "listing unit availability" is owned by F01.S03.M01 (full ID). Not yet listed in planning/CONTRACTS.md. Time-slot availability (F03.S01.M02) and rental date-range availability (F05.S01.M01) are different record classes and are not stored here.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-008-01.R01 | One `availability` record per (`listing_ref`, `variant_ref`). Creation allowed only for listing kinds `sell` and `giveaway`. `wanted` listings have no record. | MVP |
| PS-008-01.R02 | Counters are integers: `total_units` 0–10000, `held_units` ≥ 0, `committed_units` ≥ 0. Invariant `held_units + committed_units ≤ total_units` holds at every committed revision. | MVP |
| PS-008-01.R03 | `available_units` = `total_units − held_units − committed_units`. Derived, never writable. | MVP |
| PS-008-01.R04 | A `hold` binds exactly one availability record and one `offer_ref`. `units` is 1 to available units at placement. | MVP |
| PS-008-01.R05 | `expires_at` = `created_at` + TTL. TTL default 72 h, range 1 h to 7 d (ASSUMPTION). | MVP |
| PS-008-01.R06 | `commit_source` ∈ {`seller_attested`, `hold_executed`}. No field records payment, handover or delivery. | MVP |
| PS-008-01.R07 | No geolocation field. Place comes from the listing's `region_cell` at read time and is never copied here. | MVP |

## Data / schema
`availability.record` (schema_version 1.0.0; owner F01):

| Field | Type and constraint | Class |
|---|---|---|
| `availability_id` | `^avl_[0-9A-HJKMNP-TV-Z]{26}$` (ulid) | PUBLIC |
| `listing_ref` | `^lst_[0-9A-HJKMNP-TV-Z]{26}$` | PUBLIC |
| `variant_ref` | `^PENDING$` or null | PUBLIC |
| `status` | enum ACTIVE, PAUSED, SOLD_OUT, ARCHIVED | PUBLIC |
| `total_units`, `held_units`, `committed_units` | integer, R02 | PUBLIC (counts) |
| `revision` | integer ≥ 1 (CTR-EVT-001 R02) | PUBLIC |

`hold.record` (schema_version 1.0.0; owner F01):

| Field | Type and constraint | Class |
|---|---|---|
| `hold_id` | `^hld_[0-9A-HJKMNP-TV-Z]{26}$` (opaque) | PSEUDONYMOUS |
| `availability_id` | `avl_` ref | PUBLIC |
| `offer_ref` | PENDING prefix, owner F01.S04.M01 | PSEUDONYMOUS |
| `holder_ref` | `^acc_[0-9A-HJKMNP-TV-Z]{26}$`, proposing party | PSEUDONYMOUS |
| `units` | integer ≥ 1 | PUBLIC (count) |
| `state` | enum PLACED, EXECUTED, WITHDRAWN, EXPIRED | PSEUDONYMOUS |
| `created_at`, `expires_at` | RFC 3339 UTC, milliseconds | PSEUDONYMOUS |

Integers only; no floats (CTR-EVT-001 R12). Unique key: (`availability_id`, `offer_ref`) for open holds.

## Commands / queries / events
Signatures in PS-008-04. Events: `availability.created`, `availability.configured`, `availability.committed`, `availability.status_changed`, `hold.placed`, `hold.withdrawn`, `hold.executed`, `hold.expired`.

## States & transitions
See PS-008-03.

## Validation & errors
Rules and codes in PS-008-02.

## Authorization
See PS-008-05.

## Failure, idempotency, concurrency, offline
See PS-008-06.

## Privacy, retention, abuse
Classes above. Retention in PS-008-07.

## Observability & budgets
See PS-008-08.

## Tests
- TEST-PS-008-01-01 (schema): valid examples pass; `wanted` kind rejected at create.
- TEST-PS-008-01-02 (property): 10,000 random operation sequences keep R02 invariant.
- TEST-PS-008-01-03 (negative): writes to `available_units` rejected.
- TEST-PS-008-01-04 (lint): no field of type coordinate, address or region finer than `region_cell`.

## Acceptance criteria
1. Both schemas validate fixtures and reject every listed violation.
2. TEST-PS-008-01-01 to -04 pass in CI.
3. Every field has exactly one class (CTR-PRV-001 R01).

## Assumptions & open decisions
- PROVISIONAL (D04 default, unapproved): quantity-only, self-attested counts; no atomic handover.
- ASSUMPTION: 10000-unit ceiling; 72 h default TTL.
- PENDING: `avl`, `hld` registration (CTR-ID-001); `variant_ref`, `offer_ref` prefixes; B-06 owner entry in CONTRACTS.md.
