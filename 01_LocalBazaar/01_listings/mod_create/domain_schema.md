# PS-002-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/01_listings/mod_create. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001 (lst_ ID), CTR-EVT-001 (envelope, revision), CTR-SCH-001 (record registry), CTR-PRV-001 (field classes), CTR-COM-001 (amount encoding).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-002-01.R01 | Create persists one `listing.draft` record with exactly the fields in Data / schema. No other field is written by this module. | MVP |
| PS-002-01.R02 | `listing_id` has prefix `lst` and class `ulid` (CTR-ID-001 registry, owner F01). 100% of stored IDs match the CTR-ID-001 entity-id pattern. | MVP |
| PS-002-01.R03 | `owner_ref` is set from the authenticated `acc_` principal. The request body cannot set it. A `prf_` ID is never stored as owner. | MVP |
| PS-002-01.R04 | Every created record has `state = draft`, `revision = 1`, `published_at = null`. | MVP |
| PS-002-01.R05 | Every field has exactly one data class (table below). Unclassified field fails CI with `PRV.UNCLASSIFIED_FIELD`. | MVP |
| PS-002-01.R06 | No field stores exact coordinates, street address or home address. `region_cell` is the only location field. | MVP |
| PS-002-01.R07 | Record write, `listing.created` event and idempotency record commit in one transaction or not at all. | MVP |

## Data / schema
Record `listing.draft`, `schema_version` 1.0.0, owner F01, registered under CTR-SCH-001 R01 at implementation.

| Field | Type | Data class | Constraint / source |
|---|---|---|---|
| listing_id | string `lst_` + 26 chars | PSEUDONYMOUS (draft); PUBLIC after publish | CTR-ID-001; server-generated, or client-generated for offline replay (PS-002-06) |
| owner_ref | string `acc_` + 26 chars | PSEUDONYMOUS | Authenticated principal only (R03) |
| listing_type | enum, closed: `sell`, `giveaway`, `wanted` | PUBLIC | Values mirror `02_listing_types`; adding a value is MAJOR (CTR-SCH-001 R04) |
| state | enum: `draft` | PUBLIC | Only `draft` is written here |
| revision | integer, always 1 | PUBLIC | CTR-EVT-001 R02 |
| title | string, 3–120 code points | PUBLIC | PS-002-02 R05 |
| description | string, 0–4000 code points, nullable | PUBLIC (residual risk, PS-002-07) | PS-002-02 R06 |
| category_code | string, `^[a-z][a-z0-9_]{1,31}$` | PUBLIC | Active taxonomy version |
| asking_price | object or null | PUBLIC | `{amount_minor, currency:{kind,code,exponent}}` per CTR-COM-001 R02–R03; null for giveaway |
| region_cell | string, registered cell ID | LOCATION_COARSE | CTR-PRV-001 R04 |
| created_source | enum: `client_direct`, `client_offline_replay` | PUBLIC | Copy of envelope `provenance.source_kind` |
| created_at | timestamp UTC, ms | PSEUDONYMOUS | Server `recorded_at` |
| updated_at | timestamp UTC, ms | PSEUDONYMOUS | Equals `created_at` at create |
| published_at | null | PUBLIC | Written only by mod_publish |

Ownership: `listing.draft` belongs to F01 (prefix registry). Other modules reference `listing_id` and `owner_ref` by ID only. Account and region definitions stay with F07 and F10.

## Commands / queries / events
Not defined here. See PS-002-04.

## States & transitions
Not defined here. See PS-002-03.

## Validation & errors
Not defined here. See PS-002-02.

## Authorization
Not defined here. See PS-002-05.

## Failure, idempotency, concurrency, offline
Not defined here. See PS-002-06.

## Privacy, retention, abuse
Field classes above feed PS-002-07 (retention and disclosure).

## Observability & budgets
Record count per day by `listing_type` is reported only as aggregates with K_MIN = 5 (CTR-PRV-001 R04). See PS-002-08.

## Tests
- TEST-PS-002-01-01 (unit): created record equals the field list above; fixture diff shows no extra or missing field.
- TEST-PS-002-01-02 (lint): every field has one class; an unclassified fixture fails with `PRV.UNCLASSIFIED_FIELD`.
- TEST-PS-002-01-03 (property): 100,000 generated `lst_` IDs match the CTR-ID-001 pattern and contain no duplicates.
- TEST-PS-002-01-04 (integration): fault injected after record write and before event append leaves no record, event or idempotency row.

## Acceptance criteria
1. Record fields match the table exactly; no field is classed as SECRET.
2. `owner_ref` equals the authenticated `acc_` in 100% of fixtures, including ones with a body `owner_ref`.
3. `state`, `revision`, `published_at` match R04 in 100% of creates.
4. TEST-PS-002-01-01 to -04 pass in CI.

## Assumptions & open decisions
- PROVISIONAL (D07 default, unapproved): draft retention, see PS-002-07.
- OPEN: owner of the category taxonomy (not named in any registry). Needed before `category_code` is final.
- OPEN (D05): region-cell scheme. `region_cell` format depends on it.
- ASSUMPTION: `lst_` ulid class is accepted for drafts; CTR-ID-001 fixes class per prefix, so drafts cannot use `opaque`.
