# PS-005-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/02_listing_types/mod_giveaway. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-SCH-001, CTR-PRV-001, CTR-EVT-001, CTR-CAP-001. PENDING CTR-LST-001 (listing record, F01). PENDING CTR-ID-001 registry entry for prefix `gcl_`.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-005-01.R01 | Module owns one aggregate, `giveaway_claim` (ID prefix `gcl_`, class `opaque`). `lst_` listings are referenced by ID only; F01 owns the listing record. | MVP |
| PS-005-01.R02 | Giveaway listing sets `listing_type = "giveaway"` and `giveaway_policy = GIVER_SELECTS`. Only this value exists in MVP (ASSUMPTION). | MVP |
| PS-005-01.R03 | No consideration field (price, currency, reference_currency, quote_id, offer, trade item list) exists on the giveaway listing extension or on the claim. | MVP |
| PS-005-01.R04 | Claim record has no free-text, contact, device or coordinate field. | MVP |
| PS-005-01.R05 | `pickup_region` is a registered `LOCATION_COARSE` cell (CTR-PRV-001 R04) or null. Precise pickup point is never stored here. | MVP |
| PS-005-01.R06 | At most one claim per `listing_id` in state ACCEPTED, HANDOVER_RECORDED or RECEIPT_CONFIRMED (partial unique index). | MVP |
| PS-005-01.R07 | Record `max_data_class` = PRIVATE_PERSONAL (existence of an interest in an item). Every field has exactly one class (CTR-PRV-001 R01). | MVP |
| PS-005-01.R08 | `giveaway_policy = FIRST_VALID_CLAIM` (automatic first-come). Requires abuse review before enabling. | Future |

## Data / schema
Schema `giveaway_claim`, version 1.0.0, owner F01, format json-schema-2020-12 (CTR-SCH-001).

| Field | Type | Class | Constraint |
|---|---|---|---|
| claim_id | string `gcl_` + 26 Crockford | PRIVATE_PERSONAL | PK; opaque class (CTR-ID-001 R02) |
| listing_id | string `lst_` + 26 | PUBLIC | must reference an existing listing at submit |
| claimant_ref | string `acc_` + 26 | PSEUDONYMOUS | authorization subject; other parties see `prf_` view only |
| giver_ref | string `acc_` + 26 | PSEUDONYMOUS | copied from listing owner at submit |
| state | enum, closed (8 values, PS-005-03) | PRIVATE_PERSONAL | CTR-SCH R04 closed enum |
| reason_code | enum closed: LISTING_RESERVED, LISTING_ENDED, GIVER_RESCINDED, CLAIMANT_WITHDREW, TIMEOUT, FEATURE_DISABLED, null | PRIVATE_PERSONAL | required for REJECTED, WITHDRAWN, EXPIRED, CLOSED_UNCONFIRMED |
| pickup_region | string (registered cell ID) or null | LOCATION_COARSE | from registered set only |
| revision | integer ≥ 1 | PSEUDONYMOUS | per aggregate (CTR-EVT-001 R02) |
| submitted_at, state_changed_at, expires_at, handover_at, receipt_at | RFC 3339 UTC, ms, or null | PRIVATE_PERSONAL | `expires_at` = `submitted_at` + 7 d (ASSUMPTION) |

Provenance: `server_internal` or `client_offline_replay` (see PS-005-06). Deriving `giver_ref` server-side only.

**Assumptions and open decisions:** Consideration exclusion follows PROJECT_SPEC.md "No platform custody". Pickup region depends on D05 (PROVISIONAL default: coarse public regions, unapproved; see [DECISIONS.md](../../../DECISIONS.md)). `giveaway_policy` values and 7-day expiry have no Dxx; ASSUMPTION pending F01 review.
