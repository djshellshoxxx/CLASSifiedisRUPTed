# PS-112-01 — domain schema
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 14_Accessibility/02_internationalization/mod_currencies. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001, CTR-ID-001, CTR-SCH-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-112-01.R01 | Each catalog entry has exactly one code: ISO 4217 alpha-3 (fiat) or CAIP-19 asset ID (asset) as defined in CTR-COM-001 R03. | MVP |
| PS-112-01.R02 | `minor_exponent` is an integer 0–8 for fiat (matches ISO 4217 table at publish) and 0–18 for asset (ASSUMPTION). | MVP |
| PS-112-01.R03 | This module stores no valuation, rate or quote; those are owned by F09.S03.M01 (`qte_`, CTR-COM-001). | MVP |

## Data / schema
Currency catalog entry (data class PUBLIC):
```json
{"code":"JPY","kind":"fiat|asset","minor_exponent":0,"symbol_key":"cur.symbol.JPY",
 "name_key":"cur.name.JPY","status":"active|deprecated","catalog_version":"1.0.0"}
```
Format pattern (`cfm`, key = locale tag + code): grouping separator, decimal separator, symbol position. Formatting consumes decimal strings only (CTR-COM-001 R02); no float input.

Ownership: this module owns catalog and display formats. F09.S03.M01 owns quotes and valuation. F02.S04 consumes valuation through CTR-COM-001 only.

## Commands / queries / events
See [PS-112-04](commands_queries_events.md).

## States & transitions
See [PS-112-03](workflow_state_machine.md).

## Validation & errors
See [PS-112-02](validation_rules.md). Prefix `CUR.`

## Authorization
See [PS-112-05](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
See [PS-112-06](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Catalog is PUBLIC. See [PS-112-07](privacy_retention_abuse.md).

## Observability & budgets
See [PS-112-08](observability_performance.md).

## Tests
- TEST-PS-112-01-01 unit: every code matches its kind's pattern.
- TEST-PS-112-01-02 contract: schema contains no field storing a rate or quote.

## Acceptance criteria
1. Catalog exponents equal the ISO 4217 table for all fiat entries.
2. No catalog record holds a numeric rate.

## Assumptions & open decisions
- ASSUMPTION: asset decimals are declared per asset in the catalog and verified against CAIP-19 reference data at publish.
- D03 (mixed currency valuation): PROVISIONAL (D03 default, unapproved). Applies to F09, not to this catalog.
