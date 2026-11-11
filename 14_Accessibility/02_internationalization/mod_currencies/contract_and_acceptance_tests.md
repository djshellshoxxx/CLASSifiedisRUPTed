# PS-112-09 — Contract and acceptance tests: Currency display

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S02.M02 Currency display](SPEC.md) · **Scope:** MVP · **Code:** `packages/i18n/src/internationalization/currencies` · **Contracts:** [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-112-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-112-09.R02** Property tests prove digit-exactness for random bigint amounts up to 38 digits in every shipped locale, for fiat decimals 0 to 18 and crypto decimals 0 to 36.
- **PS-112-09.R03** Golden strings are generated with a pinned Node ICU version and cross-checked in Chromium and WebKit, with CLDR differences reviewed.

## Specification

See the module test table below (all processes).

**Fixtures:** CurrencyDefs EUR 2, USD 2, JPY 0, KWD 3 (fiat) and BTC 8, ETH 18, USDC 6 and a registered test asset with 36 decimals (crypto); unregistered code XYZ; locales en, de, fr, es, ar-XB; amounts 0, 5, -5, 4500, -250, 9007199254740993, 12345678901234567890 and 38-digit values; QuoteLabels for a verified ecb-daily quote asOf 2026-11-04T10:15:00Z, a counterparty manual quote with source 'ECB', an unverified relay quote, pinned quotes with consentCollected true and false, an expired and a revoked quote; an allowlist of reviewed CLDR differences between Node, Chromium and WebKit with reviewer and date.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-112-09.T01 | unit | PS-112-01.R01, PS-112-01.R02, PS-112-02.R01 | golden strings for the fixture amounts and CurrencyDefs in en, de, fr, es | Ok strings equal reviewed goldens; 5 minor units shows 0.05; -5 keeps sign |
| TEST-PS-112-09.T02 | property | PS-112-01.R02, PS-112-03.R01, PS-112-06.R01, PS-112-09.R02 | random bigint amounts 1..38 digits, fiat decimals 0..18 and crypto decimals 0..36, all shipped locales (10 000 runs nightly) | digits extracted from formatToParts without group separators equal the input digits exactly |
| TEST-PS-112-09.T03 | unit | PS-112-01.R02, PS-112-06.R02, PS-112-02.R03 | amount 9007199254740993 compared with a Number-based formatter | module output exact; naive Number output differs (documented counter-example) |
| TEST-PS-112-09.T04 | unit | PS-112-02.R02, PS-112-02.R03, PS-112-02.R05, PS-112-03.R01, PS-112-04.R02 | each rule V01–V12 violated, including '-0', '01', a 39-digit amount, ETH with decimals 37, and a JPY amount with the EUR CurrencyDef | the F09.S03.M03, F09.S03.M01, common VALIDATION_FAILED (V02, ETH with decimals 37) or I18N_ code of the rule returned as Err; I18N_MONEY_SPEC_MISMATCH for JPY with EUR from formatMoney, formatApprox and parseMoneyInput; no string produced |
| TEST-PS-112-09.T05 | unit | PS-112-06.R02, PS-112-03.R03 | force the BigInt part-substitution path by stubbing resolvedOptions; run the startup self-test; then make the decimal-string path disagree on one sample | identical output on 20 samples including negatives with zero whole part; on disagreement the BigInt path is used for the rest of the session and the dev warning i18n.money.selftest_disagreement is logged |
| TEST-PS-112-09.T06 | unit | PS-112-02.R03, PS-112-02.R05, PS-112-06.R03 | BTC 8, ETH 18, USDC 6, the 36-decimal asset and EUR with their CurrencyDefs; code XYZ with spec null | registered codes unknown to Intl use decimal style plus isolated code; currencyName returns CurrencyDef.name for crypto and the Intl plural name for fiat; XYZ returns Err(COMMERCE_CURRENCY_UNKNOWN) and the price component renders 'amount unavailable, unknown currency XYZ'; no RangeError; never blank |
| TEST-PS-112-09.T07 | unit | PS-112-04.R01, PS-112-04.R02, PS-112-04.R03, PS-112-05.R01, PS-112-05.R02, PS-112-05.R03 | inspect exports, calls to vault, relay or network, and authorization hooks | pure typed functions returning Result; no events or commands; no I/O |
| TEST-PS-112-09.T08 | unit | PS-112-02.R03, PS-112-07.R02, PS-112-07.R03 | formatApprox with a fresh verified quote, now ≥ expiresAt, status revoked, pinned with consentCollected true and false, pinned and expired, missing source, missing asOf, source with bidi characters | label has marker, code, provenance and time; 'expired quote' with action requote; 'revoked quote'; pinned wording only with consentCollected true; pinned and expired gives action requote_needs_consent and no refresh; missing source or time returns Err(I18N_QUOTE_LABEL_INVALID) with no converted amount and the chip shows the original price with 'conversion unavailable'; bidi isolated |
| TEST-PS-112-09.T09 | unit | PS-112-02.R02, PS-112-02.R04, PS-112-03.R02 | parseMoneyInput for '12,50' (de), '12.50' (en), '12,345' (de), '1.234,50' (de), '12.345' (de), '12,345' (en), '1 234,50' (fr with NBSP), '12.5.0', 41 characters, 39 digits, above the caller maximum; then the same input twice | 1250, 1250, COMMERCE_MONEY_PRECISION_LOSS, 123450, I18N_MONEY_AMBIGUOUS, I18N_MONEY_AMBIGUOUS, 123450, I18N_MONEY_SEPARATOR, I18N_MONEY_INPUT_TOO_LONG, COMMERCE_MONEY_OVERFLOW, I18N_MONEY_TOO_LARGE; identical Results for identical input; amounts built through F09.S03.M03 parseDecimal |
| TEST-PS-112-09.T10 | abuse | PS-112-07.R01, PS-112-07.R02 | capture logs and network during formatting and parsing | no amounts, identifiers or network calls; UI never labels an approximate value as a payment amount |
| TEST-PS-112-09.T11 | a11y | PS-112-07.R03, PS-112-02.R03 | axe and screen reader pass on the approximate chip and money input in en and ar-XB | zero serious findings; accessible name contains approximately, amount, provenance wording and time; targets ≥ 44 px |
| TEST-PS-112-09.T12 | load | PS-112-08.R01, PS-112-08.R02, PS-112-08.R03 | 100 000 format calls warm and cold; bundle check | p95 ≤ 0.05 ms warm, ≤ 1 ms cold, ≤ 3 KiB gzip |
| TEST-PS-112-09.T13 | unit | PS-112-09.R01 | traceability tool run | every PS-112 requirement maps to a passing test |
| TEST-PS-112-09.T14 | unit | PS-112-10.R01, PS-112-10.R03 | upgrade ICU data and golden file; roll back | changed goldens require review; stored amounts unaffected; rollback restores previous goldens |
| TEST-PS-112-09.T15 | contract | PS-112-01.R03 | render prices in every shipped locale during the listing, offer and proposal fixture flows, then scan stored records, outbox payloads and signed statements | every amount field is a canonical minor-unit string with a currency code; no formatted text, separators or symbols are stored or sent |
| TEST-PS-112-09.T16 | unit | PS-112-07.R04 | counterparty manual quote with source 'ECB' and issuerDisplay river-otter-42; relay-served provider quote with signatureVerified false; verified ecb-daily quote; verified provider quote with an uncatalogued source | 'manual rate by river-otter-42', never 'quote from ECB'; 'unverified source'; 'quote from ECB' through money.source.ecb-daily; 'quote from <source>, signed by <issuer>'; V08 holds in every case |
| TEST-PS-112-09.T17 | integration | PS-112-10.R02 | export and import F15.S04.M03 LocalSettings with moneyDisplay symbol, code and name, then with the invalid value emoji | each valid value survives and the shell passes it to formatMoney; the invalid value falls back to symbol |
| TEST-PS-112-09.T18 | e2e | PS-112-09.R03 | run the golden suite through Playwright in Chromium and WebKit | every string equals the Node golden or matches an allowlisted CLDR difference with reviewer and date; any unlisted difference fails |

## Acceptance criteria

- All tests T01–T18 pass in CI.
- Formatting is digit-exact for any amount up to 38 digits in every shipped locale (property test).
- Every approximate value is shown with currency, provenance wording and quote time, or the converted amount is not shown at all.

## Dependencies

Module depends on: F14.S02.M01, F09.S03.M01, F09.S03.M02, F09.S03.M03, CTR-MNY-001, CTR-UX-001, CTR-COM-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
