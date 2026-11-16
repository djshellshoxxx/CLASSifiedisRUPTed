# PS-003-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/01_listings/mod_edit. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ID-001 (`lst_`), CTR-SCH-001 (`listing.updated` 1.0.0), CTR-PRV-001 (data classes), CTR-COM-001 (minor-unit amounts).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-003-01.R01 | Module writes only the editable set of an existing `lst_`: `title`, `description`, `category_id`, `region_cell`, `price`, `currency`. No other listing field is writable here. | MVP |
| PS-003-01.R02 | `title`: 1–120 code points after NFC. PUBLIC. | MVP |
| PS-003-01.R03 | `description`: 0–4000 code points, plain text, no markup. PUBLIC. | MVP |
| PS-003-01.R04 | `category_id` must be active in the category registry. PUBLIC. | MVP |
| PS-003-01.R05 | `region_cell` must be a registry cell at LOCATION_COARSE (CTR-PRV-001 R04). Coordinates, street addresses and meetup points are never accepted or stored by this module. | MVP |
| PS-003-01.R06 | `price`: decimal string of integer minor units (CTR-COM-001 R02), nullable. `currency`: ISO 4217 alpha-3. Floats rejected. | MVP |
| PS-003-01.R07 | `revision` (int ≥ 1) and `updated_at` (RFC3339 UTC ms) are server-owned and read-only. | MVP |
| PS-003-01.R08 | `state` is read-only here. Values per [workflow_state_machine.md](workflow_state_machine.md). | MVP |

## Data / schema
| Field | Type | Class | Constraint | Provenance |
|---|---|---|---|---|
| `listing_id` | string `lst_` | PSEUDONYMOUS | 30 chars, ulid class (CTR-ID-001) | F01 listing aggregate |
| `title` | string | PUBLIC | R02 | owner edit (`acc_`) |
| `description` | string | PUBLIC | R03 | owner edit |
| `category_id` | string | PUBLIC | R04 | owner edit |
| `region_cell` | string | LOCATION_COARSE | R05 | owner edit |
| `price` | string or null | PUBLIC (ASSUMPTION) | `^(0\|[1-9][0-9]{0,14})$` | owner edit |
| `currency` | string | PUBLIC | ISO 4217 alpha-3 | owner edit |
| `revision` | integer | PSEUDONYMOUS | +1 per commit (CTR-EVT-001 R02) | server |
| `updated_at` | string | PSEUDONYMOUS | RFC3339 UTC ms | server |

Owned by this module: idempotency records for `listing.edit` only. The listing record stays owned by F01. Event `listing.updated` 1.0.0 is specified in [commands_queries_events.md](commands_queries_events.md).

## Commands / queries / events
Not a new record type. Commands, queries and events are specified in [commands_queries_events.md](commands_queries_events.md) (PS-003-04).

## States & transitions
Not applicable here. See [workflow_state_machine.md](workflow_state_machine.md) (PS-003-03).

## Validation & errors
Field rules and `EDIT.*` codes are in [validation_rules.md](validation_rules.md) (PS-003-02).

## Authorization
Owner-only relation rule; capability `lst.update`. See [authorization_capabilities.md](authorization_capabilities.md) (PS-003-05).

## Failure, idempotency, concurrency, offline
See [failure_recovery_idempotency.md](failure_recovery_idempotency.md) (PS-003-06).

## Privacy, retention, abuse
Field classes above drive disclosure. See [privacy_retention_abuse.md](privacy_retention_abuse.md) (PS-003-07).

## Observability & budgets
See [observability_performance.md](observability_performance.md) (PS-003-08).

## Tests
- TEST-PS-003-01-01 (unit): each field's class and constraint matches the table above.
- TEST-PS-003-01-02 (contract): `listing.updated` schema registered in CTR-SCH-001 with data-class annotations.
- TEST-PS-003-01-03 (lint): no field writable outside the six-field set (R01).

## Acceptance criteria
1. Six editable fields and read-only fields match the table; no other listing field is writable here.
2. Every field has exactly one CTR-PRV-001 class (CTR-PRV-001 R01).
3. No field stores coordinates, addresses or meetup points.

## Assumptions & open decisions
- ASSUMPTION: listing states `draft`, `published`, `archived`, `hidden` come from mod_publish, mod_archive and 12_Moderation. Canonical lifecycle contract PENDING CTR-LST-001.
- D03 (PROVISIONAL, Dxx default, unapproved): integer minor units, pinned quotes and expiry. Quote fields out of scope.
- D05 (PROVISIONAL, Dxx default, unapproved): coarse public regions only.
- Category and region registry owner and change process PENDING.
