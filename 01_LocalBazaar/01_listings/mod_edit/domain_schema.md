# PS-003-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/01_listings/mod_edit. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ID-001 (`lst_`), CTR-SCH-001 (`listing.updated` 1.0.0), CTR-PRV-001 (data classes), CTR-COM-001 (minor-unit amounts).

**Decision labels:** Price and currency rules PROVISIONAL (D03 default, unapproved). Region precision rules PROVISIONAL (D05 default, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-003-01.R01 | This module writes only the editable field set of an existing `lst_`: `title`, `description`, `category_id`, `region_cell`, `price`, `currency`. No other listing field is writable here. | MVP |
| PS-003-01.R02 | `title`: 1–120 Unicode code points after NFC normalization. PUBLIC. | MVP |
| PS-003-01.R03 | `description`: 0–4000 code points, plain text, no markup. PUBLIC. | MVP |
| PS-003-01.R04 | `category_id` must exist and be active in the category registry. PUBLIC. | MVP |
| PS-003-01.R05 | `region_cell` must be a registry cell at LOCATION_COARSE precision (CTR-PRV-001 R04). Coordinates, street addresses and meetup points are never accepted or stored here. | MVP |
| PS-003-01.R06 | `price` = decimal string of integer minor units (CTR-COM-001 R02), nullable. `currency` = ISO 4217 alpha-3 from the registry. Floats are rejected. | MVP |
| PS-003-01.R07 | `revision` (int ≥ 1) and `updated_at` (RFC3339 UTC, milliseconds) are server-owned and read-only. | MVP |
| PS-003-01.R08 | `state` is read-only in this module. Allowed values per [workflow_state_machine.md](workflow_state_machine.md). | MVP |

## Data / schema
| Field | Type | Class | Constraint | Provenance |
|---|---|---|---|---|
| `listing_id` | string `lst_` | PSEUDONYMOUS | 30 chars, ulid class (CTR-ID-001) | Owned by F01 listing aggregate |
| `title` | string | PUBLIC | R02 | Owner edit (`acc_`) |
| `description` | string | PUBLIC | R03 | Owner edit |
| `category_id` | string | PUBLIC | R04 | Owner edit |
| `region_cell` | string | LOCATION_COARSE | R05 | Owner edit |
| `price` | string or null | PUBLIC (ASSUMPTION) | `^(0|[1-9][0-9]{0,14})$` | Owner edit |
| `currency` | string | PUBLIC | ISO 4217 alpha-3 | Owner edit |
| `revision` | integer | PSEUDONYMOUS | ≥ 1, +1 per commit (CTR-EVT-001 R02) | Server |
| `updated_at` | string | PSEUDONYMOUS | RFC3339 UTC ms | Server |

Records owned by this module: idempotency records for `listing.edit` (see [failure_recovery_idempotency.md](failure_recovery_idempotency.md)). The listing record itself stays owned by F01. Event `listing.updated` 1.0.0 is registered per [commands_queries_events.md](commands_queries_events.md).

## Assumptions & open decisions
- ASSUMPTION: listing states `draft`, `published`, `archived`, `hidden` come from mod_publish, mod_archive and 12_Moderation. Canonical lifecycle contract PENDING CTR-LST-001.
- D03 (PROVISIONAL): integer minor units, pinned quotes and expiry. Pinned-quote fields are out of scope here.
- D05 (PROVISIONAL): coarse public regions only. Precision disclosure is handled elsewhere.
- Category and region registries: owner and change process PENDING.
