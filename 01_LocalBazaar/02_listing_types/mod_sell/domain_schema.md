# PS-006-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/02_listing_types/mod_sell. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-SCH-001, CTR-PRV-001, CTR-COM-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-006-01.R01 | A sell listing is an `lst_` aggregate with `listing_kind = "sell"`. All sell fields sit in one `sell` object on that aggregate. Core listing fields stay with F01.S01. | MVP |
| PS-006-01.R02 | `quantity_total` is an integer 1–20 (ASSUMPTION). `quantity_remaining` is server-owned and satisfies 0 ≤ remaining ≤ total. | MVP |
| PS-006-01.R03 | `price_minor` is a base-10 string of 1–15 digits, no leading zero, value > 0. CTR-COM-001 R02 permits 39 digits; the 15-digit cap is ASSUMPTION. Currency is one fiat ISO 4217 code or one CAIP-19 asset ID, fixed per listing. | MVP |
| PS-006-01.R04 | `region_cell` is a registered LOCATION_COARSE cell ID (CTR-PRV-001 R04). The schema has no coordinate, street or home-address field. | MVP |
| PS-006-01.R05 | A purchase request is a `prq_` record with ULID body. The `prq` prefix is PENDING CTR-ID-001 registration. | MVP |
| PS-006-01.R06 | Every field carries exactly one data class. An unclassified field fails CI with `PRV.UNCLASSIFIED_FIELD`. | MVP |

## Data / schema
```json
{"$id":"urn:classrupt:sell:listing-extension:1.0.0","type":"object","additionalProperties":false,
 "required":["listing_kind","price_minor","currency_kind","currency","quantity_total","quantity_remaining","condition","pickup_method","region_cell","sell_state","reservation","schema_version"],
 "properties":{
  "listing_kind":{"const":"sell"},
  "price_minor":{"type":"string","pattern":"^[1-9][0-9]{0,14}$"},
  "currency_kind":{"enum":["fiat","asset"]},
  "currency":{"type":"string","maxLength":128},
  "quantity_total":{"type":"integer","minimum":1,"maximum":20},
  "quantity_remaining":{"type":"integer","minimum":0,"maximum":20},
  "condition":{"enum":["new","like_new","good","fair","for_parts"]},
  "pickup_method":{"enum":["local_meetup","external_shipping"]},
  "region_cell":{"type":"string","maxLength":64},
  "sell_state":{"enum":["AVAILABLE","RESERVED","HELD","SOLD"]},
  "reservation":{"oneOf":[{"type":"null"},{"type":"object","required":["request_id","buyer_ref","trx_id","expires_at"],
     "properties":{"request_id":{"type":"string","pattern":"^prq_[0-9A-HJKMNP-TV-Z]{26}$"},
       "buyer_ref":{"type":"string","pattern":"^acc_[0-9A-HJKMNP-TV-Z]{26}$"},
       "trx_id":{"type":"string","pattern":"^trx_[0-9A-HJKMNP-TV-Z]{26}$"},
       "expires_at":{"type":"string","format":"date-time"}}}]},
  "schema_version":{"type":"string","pattern":"^1\\.[0-9]+\\.[0-9]+$"}}}
```
Purchase request record `prq_`: `request_id` (prq_), `listing_id` (lst_), `buyer_ref` (acc_), `status` in {pending, accepted, declined, cancelled, expired}, `created_at`, `expires_at`, `decided_at` (nullable), `revision` (integer ≥ 1), `schema_version`.

Data classes: `price_minor`, `currency_kind`, `currency`, quantity fields, `condition`, `pickup_method`, `sell_state`: PUBLIC. `region_cell`: LOCATION_COARSE. `buyer_ref`, `reservation.trx_id`, all `prq_` fields: PSEUDONYMOUS. No payment evidence is stored in this module; `trx_id` is a reference only.

## Commands / queries / events
Defined in [PS-006-04](commands_queries_events.md).

## States & transitions
Defined in [PS-006-03](workflow_state_machine.md).

## Validation & errors
Field rules and `SELL.*` codes in [PS-006-02](validation_rules.md).

## Authorization
Per-field visibility in [PS-006-05](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Not applicable to schema shape. Version-bump rules in [PS-006-10](import_export_backup_rollback.md).

## Privacy, retention, abuse
Retention classes and buyer-reference handling in [PS-006-07](privacy_retention_abuse.md).

## Observability & budgets
Not applicable to schema definition.

## Tests
- TEST-PS-006-01-01 (property): schema rejects leading-zero, float, zero and 16-digit `price_minor` strings.
- TEST-PS-006-01-02 (unit): a field with no data class fails CI with `PRV.UNCLASSIFIED_FIELD`.
- TEST-PS-006-01-03 (unit): `region_cell` values shaped like coordinates or street addresses are rejected.
- TEST-PS-006-01-04 (contract): `prq_` and `sell` objects round-trip through the CTR-SCH-001 registry fixtures.

## Acceptance criteria
1. Every sell field appears in the JSON schema above with one data class.
2. `quantity_remaining` cannot be set by any client-origin payload.
3. No schema field stores coordinates, street address or home address.
4. The `prq` prefix is registered in CTR-ID-001 before implementation starts.

## Assumptions & open decisions
- D03 PROVISIONAL (default: pinned quotes, integer minor units, expiry). Sell is single-currency; cross-currency pricing is deferred.
- D05 PROVISIONAL (default: coarse public regions). Only `region_cell` is stored.
- D07 PROVISIONAL (default: minimal per-category retention). Applies to `prq_` records.
- PENDING CTR-ID-001: `prq` prefix registration.
