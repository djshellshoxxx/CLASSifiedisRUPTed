# PS-009-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/03_inventory/mod_variants. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-SCH-001, CTR-PRV-001, CTR-EVT-001. Variant prefix PENDING CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-009-01.R01 | A listing holds 0–25 variants (ASSUMPTION cap). A 26th active variant is rejected with `VARIANT.LIMIT_EXCEEDED`. | MVP |
| PS-009-01.R02 | Each variant has 1–3 attributes. Keys come from a closed registry of 12 keys (PROVISIONAL: size, colour, pack_size, material, and similar). Free-text keys are rejected. | MVP |
| PS-009-01.R03 | Attribute value: Unicode NFC, trimmed, 1–40 code points, no control characters. | MVP |
| PS-009-01.R04 | Active variants of one listing have unique attribute sets (case-folded, order-independent). | MVP |
| PS-009-01.R05 | `status` is `active` or `archived`. Archived rows are kept for history; this module never hard-deletes them. | MVP |
| PS-009-01.R06 | Optional `price_minor` is a base-10 decimal string (CTR-COM-001 R02). Currency and exponent come from the listing and F09.S03.M03. | Future |
| PS-009-01.R07 | All fields are class PUBLIC. No variant field holds PSEUDONYMOUS, PRIVATE_PERSONAL or location data. | MVP |

## Data / schema
```json
{
  "variant_id": "var_<26 Crockford chars> (PENDING prefix; class ulid)",
  "listing_id": "lst_<26 chars>",
  "ordinal": "integer 1..25, unique per listing",
  "attributes": "[{ \"key\": enum(12 values), \"value\": string(1..40) }] length 1..3",
  "status": "enum(active | archived)",
  "price_minor": "string | null (Future)",
  "created_revision": "integer >= 1 (listing revision, CTR-EVT-001 R02)",
  "archived_revision": "integer | null",
  "schema_version": "1.0.0"
}
```
Provenance: the creating `acc_` is written to the `aud_` record only, not to the variant row. Variant rows are sub-entities of the listing aggregate, so their revision is the listing revision. The owning listing (`lst_`) is owned by F01.S01.M02.

## Commands / queries / events
Field shapes for requests and events are in PS-009-04. Schema ID: `listing.variant` (CTR-SCH-001 registry entry PENDING; changes follow CTR-SCH-001 R03).

## Validation & errors
Rules and error codes are in PS-009-02.

## Authorization
Owner-only writes; field visibility is defined in PS-009-05.

## Failure, idempotency, concurrency, offline
Revision and duplicate handling in PS-009-06.

## Privacy, retention, abuse
Class and retention per PS-009-07.

## Observability & budgets
Storage budget: at most 25 × 3 values, each ≤ 40 code points, so ≤ 8 KB of variant payload per listing (ASSUMPTION).

## Tests
- TEST-PS-009-01-01 (unit): 25th variant accepted, 26th rejected.
- TEST-PS-009-01-02 (property): NFC and case-fold equivalence yields duplicate rejection.
- TEST-PS-009-01-03 (contract): serialised record validates against the 1.0.0 schema.

## Acceptance criteria
1. Schema validates for 0, 1, 25 and 26 variants per listing.
2. Attribute keys outside the registry are rejected in 100% of fixtures.
3. No field outside class PUBLIC appears in the schema (PRV lint passes).

## Assumptions & open decisions
- ASSUMPTION: cap of 25 variants and 3 attributes per variant.
- PROVISIONAL (D07 default, unapproved): variant history kept with the listing under minimal retention.
- PENDING CTR-ID-001: `var` prefix. PENDING CTR-SCH-001 registry entry `listing.variant`.
