# PS-112-06 — Failure recovery and idempotency: Currency display

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S02.M02 Currency display](SPEC.md) · **Scope:** MVP · **Code:** `packages/i18n/src/internationalization/currencies` · **Contracts:** [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-112-06.R01** Formatting is deterministic and idempotent, and never returns a string for an invalid amount; invalid input yields an explicit error value shown as a localized message.
- **PS-112-06.R02** If the Intl implementation lacks exact decimal-string support, the BigInt part-substitution path produces identical output; a startup self-test verifies the two paths agree on 20 sample values, and on any disagreement the BigInt path is used for the rest of the session and a development warning is logged.
- **PS-112-06.R03** If Intl.NumberFormat cannot format a registered currency code (not in Intl's currency list, such as USDC), the decimal style plus isolated code is used so a price is never blank; a code missing from the registry returns COMMERCE_CURRENCY_UNKNOWN and callers render the explicit 'amount unavailable, unknown currency <code>' state.

## Specification

- **idempotency:** Pure functions; the same input and locale give the same output.
- **concurrency:** No shared mutable state except a bounded cache of at most 64 Intl.NumberFormat instances keyed by locale, currency and options, and the session flag set by the self-test.
- **retries:** Not applicable; no network or storage operations.
- **offline:** Fully offline; uses the browser's built-in Intl data and the bundled catalogs.
- **partial failure:** A quote label missing its source or time returns Err(I18N_QUOTE_LABEL_INVALID); no converted amount is rendered and callers show only the original-currency price with the catalog text 'conversion unavailable'.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-112-09.T02 | property | PS-112-01.R02, PS-112-03.R01, PS-112-06.R01, PS-112-09.R02 | random bigint amounts 1..38 digits, fiat decimals 0..18 and crypto decimals 0..36, all shipped locales (10 000 runs nightly) | digits extracted from formatToParts without group separators equal the input digits exactly |
| TEST-PS-112-09.T03 | unit | PS-112-01.R02, PS-112-06.R02, PS-112-02.R03 | amount 9007199254740993 compared with a Number-based formatter | module output exact; naive Number output differs (documented counter-example) |
| TEST-PS-112-09.T05 | unit | PS-112-06.R02, PS-112-03.R03 | force the BigInt part-substitution path by stubbing resolvedOptions; run the startup self-test; then make the decimal-string path disagree on one sample | identical output on 20 samples including negatives with zero whole part; on disagreement the BigInt path is used for the rest of the session and the dev warning i18n.money.selftest_disagreement is logged |
| TEST-PS-112-09.T06 | unit | PS-112-02.R03, PS-112-02.R05, PS-112-06.R03 | BTC 8, ETH 18, USDC 6, the 36-decimal asset and EUR with their CurrencyDefs; code XYZ with spec null | registered codes unknown to Intl use decimal style plus isolated code; currencyName returns CurrencyDef.name for crypto and the Intl plural name for fiat; XYZ returns Err(COMMERCE_CURRENCY_UNKNOWN) and the price component renders 'amount unavailable, unknown currency XYZ'; no RangeError; never blank |

## Dependencies

Module depends on: F14.S02.M01, F09.S03.M01, F09.S03.M02, F09.S03.M03, CTR-MNY-001, CTR-UX-001, CTR-COM-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
