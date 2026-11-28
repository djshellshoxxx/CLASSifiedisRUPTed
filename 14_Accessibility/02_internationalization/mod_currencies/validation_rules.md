# PS-112-02 — Validation rules: Currency display

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S02.M02 Currency display](SPEC.md) · **Scope:** MVP · **Code:** `packages/i18n/src/internationalization/currencies` · **Contracts:** [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-112-02.R01** Inputs are validated before formatting so the output is either exact or an explicit error, never a silently wrong number.
- **PS-112-02.R02** Parsing refuses ambiguous or lossy input instead of rounding.
- **PS-112-02.R03** Each failure has one stable error code usable in forms and tests; Money and currency errors reuse the F09.S03.M03 and F09.S03.M01 codes (N1) and only input and label errors specific to display or a locale use I18N_ codes.
- **PS-112-02.R04** Group separators in typed text are accepted only when every group after the first has exactly 3 digits and the text also contains the locale decimal separator; text with group separators but no decimal separator is rejected with I18N_MONEY_AMBIGUOUS and the hint 'use 12345 or 12,345' written with the locale's separators.
- **PS-112-02.R05** formatMoney, formatMoneyParts, formatApprox and parseMoneyInput return Err(I18N_MONEY_SPEC_MISMATCH), never a string, when money.currency differs from the CurrencyDef code, and Err(COMMERCE_CURRENCY_UNKNOWN) when the caller found no CurrencyDef for the code.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | amount is canonical per F09.S03.M03 parseMinor and matches ^0$ or ^-?[1-9][0-9]{0,37}$ (1 to 38 digits, no leading zeros, no '-0') | COMMERCE_MONEY_INVALID |
| V02 | spec is an F09.S03.M01 CurrencyDef with kind fiat and decimals 0 to 18 or kind crypto and decimals 0 to 36 (the range rule of F09.S03.M01 V03, same common code) | VALIDATION_FAILED |
| V03 | parsed text has no more fraction digits than spec.decimals (F09.S03.M03 parseDecimal) | COMMERCE_MONEY_PRECISION_LOSS |
| V04 | parsed minor-unit value has at most 38 digits (F09.S03.M03 bound) | COMMERCE_MONEY_OVERFLOW |
| V05 | quote label has a source of 1 to 80 plain-text characters, sourceKind provider, manual or derived, valid RFC 3339 asOf and expiresAt with asOf not after expiresAt, status issued, expired or revoked, and issuerDisplay when sourceKind is manual or the source is not a catalog adapter ID | I18N_QUOTE_LABEL_INVALID |
| V06 | an approximate value is never rendered without the currency code, the provenance wording and the time; when source or time is missing formatApprox returns an error and no converted amount is rendered | I18N_QUOTE_LABEL_INVALID |
| V07 | money.currency === spec.code | I18N_MONEY_SPEC_MISMATCH |
| V08 | the bare 'quote from <name>' wording is used only for a provider or derived quote with signatureVerified true whose source is a catalog adapter ID; manual quotes read 'manual rate by <issuer>', unverified quotes read 'unverified source', other verified sources add 'signed by <issuer>', and 'pinned rate agreed by all parties' appears only with pinned.consentCollected true | I18N_QUOTE_LABEL_INVALID |
| V09 | typed text uses the locale decimal separator at most once and no separator other than the locale decimal and group separators (NBSP and narrow NBSP count as the fr group separator) | I18N_MONEY_SEPARATOR |
| V10 | group separators appear only with 1 to 3 digits before the first and exactly 3 digits in every later group, and only when the locale decimal separator is also present | I18N_MONEY_AMBIGUOUS |
| V11 | parsed value does not exceed the caller's maximum opts.max | I18N_MONEY_TOO_LARGE |
| V12 | typed text is at most 40 characters before parsing | I18N_MONEY_INPUT_TOO_LONG |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-112-09.T01 | unit | PS-112-01.R01, PS-112-01.R02, PS-112-02.R01 | golden strings for the fixture amounts and CurrencyDefs in en, de, fr, es | Ok strings equal reviewed goldens; 5 minor units shows 0.05; -5 keeps sign |
| TEST-PS-112-09.T03 | unit | PS-112-01.R02, PS-112-06.R02, PS-112-02.R03 | amount 9007199254740993 compared with a Number-based formatter | module output exact; naive Number output differs (documented counter-example) |
| TEST-PS-112-09.T04 | unit | PS-112-02.R02, PS-112-02.R03, PS-112-02.R05, PS-112-03.R01, PS-112-04.R02 | each rule V01–V12 violated, including '-0', '01', a 39-digit amount, ETH with decimals 37, and a JPY amount with the EUR CurrencyDef | the F09.S03.M03, F09.S03.M01, common VALIDATION_FAILED (V02, ETH with decimals 37) or I18N_ code of the rule returned as Err; I18N_MONEY_SPEC_MISMATCH for JPY with EUR from formatMoney, formatApprox and parseMoneyInput; no string produced |
| TEST-PS-112-09.T06 | unit | PS-112-02.R03, PS-112-02.R05, PS-112-06.R03 | BTC 8, ETH 18, USDC 6, the 36-decimal asset and EUR with their CurrencyDefs; code XYZ with spec null | registered codes unknown to Intl use decimal style plus isolated code; currencyName returns CurrencyDef.name for crypto and the Intl plural name for fiat; XYZ returns Err(COMMERCE_CURRENCY_UNKNOWN) and the price component renders 'amount unavailable, unknown currency XYZ'; no RangeError; never blank |
| TEST-PS-112-09.T08 | unit | PS-112-02.R03, PS-112-07.R02, PS-112-07.R03 | formatApprox with a fresh verified quote, now ≥ expiresAt, status revoked, pinned with consentCollected true and false, pinned and expired, missing source, missing asOf, source with bidi characters | label has marker, code, provenance and time; 'expired quote' with action requote; 'revoked quote'; pinned wording only with consentCollected true; pinned and expired gives action requote_needs_consent and no refresh; missing source or time returns Err(I18N_QUOTE_LABEL_INVALID) with no converted amount and the chip shows the original price with 'conversion unavailable'; bidi isolated |
| TEST-PS-112-09.T09 | unit | PS-112-02.R02, PS-112-02.R04, PS-112-03.R02 | parseMoneyInput for '12,50' (de), '12.50' (en), '12,345' (de), '1.234,50' (de), '12.345' (de), '12,345' (en), '1 234,50' (fr with NBSP), '12.5.0', 41 characters, 39 digits, above the caller maximum; then the same input twice | 1250, 1250, COMMERCE_MONEY_PRECISION_LOSS, 123450, I18N_MONEY_AMBIGUOUS, I18N_MONEY_AMBIGUOUS, 123450, I18N_MONEY_SEPARATOR, I18N_MONEY_INPUT_TOO_LONG, COMMERCE_MONEY_OVERFLOW, I18N_MONEY_TOO_LARGE; identical Results for identical input; amounts built through F09.S03.M03 parseDecimal |
| TEST-PS-112-09.T11 | a11y | PS-112-07.R03, PS-112-02.R03 | axe and screen reader pass on the approximate chip and money input in en and ar-XB | zero serious findings; accessible name contains approximately, amount, provenance wording and time; targets ≥ 44 px |

## Dependencies

Module depends on: F14.S02.M01, F09.S03.M01, F09.S03.M02, F09.S03.M03, CTR-MNY-001, CTR-UX-001, CTR-COM-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
