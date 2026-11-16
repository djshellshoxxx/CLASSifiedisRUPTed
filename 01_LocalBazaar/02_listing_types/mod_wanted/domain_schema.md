# PS-007-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/02_listing_types/mod_wanted. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001 (`lst_`), CTR-SCH-001, CTR-PRV-001, CTR-COM-001 (amount encoding only), PENDING CTR-LST-001 (listing core aggregate).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-007-01.R01 | A wanted post is a `listing` aggregate with `id` prefix `lst_` and `listing_type = "wanted"`. No new ID prefix. | MVP |
| PS-007-01.R02 | Only the fields in the table below are accepted. Any other field, including contact or location fields, is rejected with `WANTED.FIELD_NOT_ALLOWED`. | MVP |
| PS-007-01.R03 | Every field has exactly one CTR-PRV class. CI fails on an unclassified field. | MVP |
| PS-007-01.R04 | No field stores precise location, contact details, payment account, balance or secret. | MVP |
| PS-007-01.R05 | `budget_max` is a stated expectation. It has no settlement semantics and creates no claim. | MVP |
| PS-007-01.R06 | Multi-currency budget ranges. | Future |

## Data / schema
JSON, `schema_id` `listing.wanted_fields`, version `1.0.0`.

| Field | Type and constraint | Class |
|---|---|---|
| `id` | string, `^lst_[0-7][0-9A-HJKMNP-TV-Z]{25}$` | PUBLIC |
| `listing_type` | const `"wanted"` (closed) | PUBLIC |
| `owner_account_id` | `acc_` ID; never in public or federated output | PSEUDONYMOUS |
| `owner_pseudonym_id` | `prf_` ID; public author label | PSEUDONYMOUS |
| `title` | string, 3–80 chars after NFC | PUBLIC |
| `description` | string, 0–2000 chars, plain text | PUBLIC |
| `category_id` | string, active registry entry | PUBLIC |
| `quantity` | integer, 1–99 | PUBLIC |
| `condition_preference` | enum closed: `any`, `new`, `like_new`, `used`, `for_parts` | PUBLIC |
| `budget_max` | optional `{amount_minor: decimal string ≤12 digits, currency: {kind: fiat\|asset, code}}` (CTR-COM-001 R02–R03) | PUBLIC (ASSUMPTION, F10 review) |
| `region_cell` | string, registered cell (CTR-PRV R04) | LOCATION_COARSE |
| `status` | enum (PS-007-03) | PUBLIC |
| `prior_state` | enum `draft`/`published`/`paused`; set only while `suspended` | PUBLIC |
| `revision` | integer ≥ 1 (CTR-EVT R02) | PUBLIC |
| `published_at`, `expires_at`, `created_at`, `updated_at` | RFC3339 UTC, milliseconds | PUBLIC |
| `provenance` | `{source_kind: local\|federated_import, origin_node?: nod_}` | PUBLIC |

Constraints: `expires_at − published_at ≤ 90 days`; `owner_account_id` immutable after create; `revision` increments by exactly 1 per committed event.

## Commands / queries / events
Signatures in PS-007-04. Event type family `listing.*` is owned by PENDING CTR-LST-001. This file defines only the `listing.wanted_fields` payload fragment.

## States & transitions
`status` enum and transitions in PS-007-03.

## Validation & errors
Field rules and error registry in PS-007-02.

## Authorization
`owner_account_id` is visible to owner and case-scoped moderators only (CTR-CAP-001 R10). Matrix in PS-007-05.

## Failure, idempotency, concurrency, offline
Field write and `revision` increment commit in one transaction (PS-007-06). Offline clients may propose a `lst_` ID; the server accepts it only if prefix and class match (CTR-ID-001 R04, D08 PROVISIONAL).

## Privacy, retention, abuse
Public author is the pseudonym only. Location is the registered cell only; free-text location is blocked by PS-007-02. Retention in PS-007-07.

## Observability & budgets
Schema validation failures counted by rule enum, never by value. Schema lookup p95 ≤ 1 ms (ASSUMPTION).

## Tests
- TEST-PS-007-01-01 (unit): minimal valid post (title, category, quantity, condition, region_cell) accepted.
- TEST-PS-007-01-02 (unit): field `phone` rejected with `WANTED.FIELD_NOT_ALLOWED`.
- TEST-PS-007-01-03 (lint): every field has one CTR-PRV class; unclassified field fails CI.
- TEST-PS-007-01-04 (property): `amount_minor` round-trips canonically; no float accepted.
- TEST-PS-007-01-05 (contract): payload validates against the published schema digest (CTR-SCH R02).

## Acceptance criteria
1. Schema file and SHA-256 digest registered under CTR-SCH-001; TEST-PS-007-01-03 passes.
2. No field of class LOCATION_PRECISE, FINANCIAL_EVIDENCE or SECRET exists.
3. `id` pattern accepts only `lst_` with ULID body whose first character is 0–7.
4. Each field in the table has type, constraint, class and one valid example.

## Assumptions & open decisions
- PENDING CTR-LST-001: common listing aggregate and envelope. Wanted fragment only here.
- ASSUMPTION: `budget_max` is PUBLIC, matching sell-listing price fields. Needs F10 review under CTR-SCH R10.
- D05 PROVISIONAL (Dxx default, unapproved): `region_cell` is a coarse registered cell.
- ASSUMPTION: default expiry 30 days, maximum 90 days.
