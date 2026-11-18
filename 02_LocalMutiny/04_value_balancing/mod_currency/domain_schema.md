# PS-025-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/04_value_balancing/mod_currency. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (R02–R04, R15), CTR-SCH-001, CTR-PRV-001. Quote owner: F09.S03.M01.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-025-01.R01 | The binding stores a `qte_` reference and `quote_hash` copied from F09.S03.M01; it stores no rate computed here. | MVP |
| PS-025-01.R02 | Currency is `fiat` (ISO 4217 alpha-3) or `asset` (CAIP-19), per CTR-COM-001 R03. | MVP |
| PS-025-01.R03 | Amounts are decimal strings in minor units, max 39 digits, exponent from the registry (F09.S03.M03). | MVP |
| PS-025-01.R04 | Presentation record carries `valid_until` copied from the quote; no value is shown after expiry. | MVP |
| PS-025-01.R05 | Each side's value and the reference currency are shown; reference currency is a valuation only. | MVP |

## Data / schema
```json
{
  "binding_id": "bnd_<26> (PENDING prefix)",
  "cycle_id": "cyc_<26>",
  "cycle_version": "integer >= 1",
  "quote_ref": "qte_<26>",
  "quote_hash": "sha256 hex (64)",
  "reference_currency": "fiat:EUR | asset:<CAIP-19>",
  "sides": "[{slot_index, amount_minor: decimal string, currency}]",
  "valid_until": "timestamp",
  "status": "enum(unbound, bound, expired, refreshed)",
  "schema_version": "1.0.0"
}
```
Classes: amounts and quote_ref FINANCIAL_EVIDENCE; slot_index PUBLIC; no location.

## Commands / queries / events
PS-025-04.

## Validation & errors
PS-025-02.

## Authorization
PS-025-05.

## Failure, idempotency, concurrency, offline
Binding is immutable per cycle version (PS-025-06).

## Privacy, retention, abuse
PS-025-07.

## Observability & budgets
Record ≤ 2 KB (ASSUMPTION).

## Tests
- TEST-PS-025-01-01 (unit): no float appears in serialised output.
- TEST-PS-025-01-02 (contract): fiat and asset codes validate against CTR-COM-001 R03.
- TEST-PS-025-01-03 (lint): no rate field exists in this schema.

## Acceptance criteria
1. Serialised amounts match the decimal-string pattern in 100% of fixtures.
2. No rate or computed price field exists.
3. quote_hash equals the quote owner's hash in 100% of fixtures.

## Assumptions & open decisions
- PROVISIONAL (D03 default, unapproved): pinned quotes, integer minor units, expiry.
