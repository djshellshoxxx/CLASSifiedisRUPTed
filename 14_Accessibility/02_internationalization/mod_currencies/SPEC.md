# F14.S02.M02 — currencies

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Accessibility Lead (F14); valuation owned by Commerce Lead (F09). **Parent:** F14.S02.

## Purpose and business behavior
Maintains the catalog of currency codes (ISO 4217 fiat, CAIP-19 assets), their minor-unit exponents, display names and locale formatting rules, and formats amounts for display from integer minor units. It does not compute values, convert currencies or hold quotes; valuation and pinned quotes belong to F09.S03.M01 (`qte_`).

## User stories
- As a participant, every amount I see shows its currency code and the correct number of decimals (JPY has none, BHD has three).
- As a participant, I can read an amount offline with the same formatting as online.
- As an operator, I publish a new currency entry with two approvers.
- As a participant, my currency choice is never guessed from my location.

## Scope
In: catalog, exponents, formatting, display names, currency preference field.
Out: valuation, FX quotes, rounding policy for exchanges (F09.S03.M01, D03); locale and message catalog (mod_languages).

## Public interfaces
Command `cur.catalog.publish`; query `cur.catalog.get`; client function `format`; event `currency_catalog.published`; error prefix `CUR.`.

## Relationships, dependencies and integration
Upstream: CTR-COM-001 (amount and code rules), CTR-ID-001. Downstream: all screens that display amounts (F01 through F05, F09). Consumes locale tags from mod_languages. Valuation consumer: F02.S04 through CTR-COM-001.

## Data ownership
Owns catalog and format rules. Owns no quote, rate, balance or payment record.

## Risk considerations
Wrong decimals misstate value (for example 1000 JPY shown as 10.00); a display code missing from an amount; floats in the formatting path; location-based currency guessing; catalog changes that alter historical display. No platform custody of money.

## Completion criteria
Ten process specifications at SPEC-DRAFT-COMPLETE; exponent source confirmed against ISO table at implementation; valuation boundary with F09 recorded.

## Required process specification inventory
