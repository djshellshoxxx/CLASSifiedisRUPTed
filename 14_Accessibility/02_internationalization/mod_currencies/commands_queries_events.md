# PS-112-04 — Commands, queries and events: Currency display

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S02.M02 Currency display](SPEC.md) · **Scope:** MVP · **Code:** `packages/i18n/src/internationalization/currencies` · **Contracts:** [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-112-04.R01** The module exposes library functions and no vault or relay commands, queries or events.
- **PS-112-04.R02** All public functions return Result values, Ok with the string, parts or minor-unit amount for valid input and an AppError otherwise, never a silently wrong string.
- **PS-112-04.R03** Formatting the same input twice returns identical output, so UI snapshots are stable.

## Specification

### Commands

_None._

### Queries

_None._

### Events produced

_None._

### Events consumed

_None._

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| I18N_MONEY_TOO_LARGE | 422 | no | typed amount exceeds the caller maximum |
| I18N_QUOTE_LABEL_INVALID | 422 | no | quote label malformed, missing source or time, or provenance fields inconsistent for an approximate value |
| I18N_MONEY_SPEC_MISMATCH | 422 | no | money.currency differs from the CurrencyDef code passed in |
| I18N_MONEY_SEPARATOR | 422 | no | typed amount uses mixed, repeated or misplaced separators for the locale |
| I18N_MONEY_AMBIGUOUS | 422 | no | typed amount has group separators but no decimal separator |
| I18N_MONEY_INPUT_TOO_LONG | 422 | no | typed text longer than 40 characters |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** API: formatMoney(money, spec: CurrencyDef | null, locale, { display: symbol|code|name, trimZeros? }) -> Result<string, AppError>; formatMoneyParts(...) -> Result<Part[], AppError>; formatApprox(money, spec, quote: QuoteLabel, locale, { timeZone, now }) -> Result<{ text, expired: boolean, action: requote | requote_needs_consent | none }, AppError>; parseMoneyInput(text, spec, locale, { max? }) -> Result<string, AppError>; currencyName(spec, locale, count) -> Result<string, AppError> (Intl plural currency name for fiat, CurrencyDef.name for crypto). The display option comes from F15.S04.M03 LocalSettings.moneyDisplay through the PWA shell; the default is symbol.

### Example

```
const eurDef = { code: "EUR", kind: "fiat", decimals: 2, name: "Euro" }, btcDef = { code: "BTC", kind: "crypto", decimals: 8, name: "Bitcoin" };
formatMoney({ amount: "4500", currency: "EUR" }, eurDef, "de") // Ok("45,00 €")
formatMoney({ amount: "4500", currency: "EUR" }, eurDef, "en") // Ok("€45.00")
formatMoney({ amount: "12345678901234567890", currency: "USD" }, usdDef, "en") // Ok("$123,456,789,012,345,678.90")
formatMoney({ amount: "100000000", currency: "BTC" }, btcDef, "en") // Ok("1.00000000 BTC")
formatMoney({ amount: "500", currency: "JPY" }, eurDef, "en") // Err(I18N_MONEY_SPEC_MISMATCH)
formatMoney({ amount: "500", currency: "XYZ" }, null, "en") // Err(COMMERCE_CURRENCY_UNKNOWN) -> "amount unavailable, unknown currency XYZ"
formatApprox({ amount: "4210", currency: "EUR" }, eurDef, { source: "ecb-daily", sourceKind: "provider", signatureVerified: true,
  asOf: "2026-11-04T10:15:00Z", expiresAt: "2026-11-04T10:30:00Z", status: "issued" }, "en", { timeZone: "UTC", now: "2026-11-04T10:20:00Z" })
  // Ok("≈ 42.10 EUR, quote from ECB at 10:15")
// same amount, manual quote from a counterparty claiming source "ECB": "≈ 42.10 EUR, manual rate by river-otter-42 at 10:15"
// relay-served quote whose signature did not verify: "≈ 42.10 EUR, unverified source relay-r7k3m at 10:15"
// pinned with consentCollected true: "≈ 42.10 EUR, pinned rate agreed by all parties, quote from ECB at 10:15"
// pinned and now ≥ expiresAt: "... expired quote", action requote_needs_consent ("re-quote needs new consent from all parties")
// source missing: Err(I18N_QUOTE_LABEL_INVALID) -> caller shows "€45.00, conversion unavailable"
parseMoneyInput("12,50", eurDef, "de") // Ok("1250");  parseMoneyInput("12,345", eurDef, "de") // Err(COMMERCE_MONEY_PRECISION_LOSS)
parseMoneyInput("12.345", eurDef, "de") // Err(I18N_MONEY_AMBIGUOUS, hint "use 12345 or 12,345")
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-112-09.T04 | unit | PS-112-02.R02, PS-112-02.R03, PS-112-02.R05, PS-112-03.R01, PS-112-04.R02 | each rule V01–V12 violated, including '-0', '01', a 39-digit amount, ETH with decimals 37, and a JPY amount with the EUR CurrencyDef | the F09.S03.M03, F09.S03.M01, common VALIDATION_FAILED (V02, ETH with decimals 37) or I18N_ code of the rule returned as Err; I18N_MONEY_SPEC_MISMATCH for JPY with EUR from formatMoney, formatApprox and parseMoneyInput; no string produced |
| TEST-PS-112-09.T07 | unit | PS-112-04.R01, PS-112-04.R02, PS-112-04.R03, PS-112-05.R01, PS-112-05.R02, PS-112-05.R03 | inspect exports, calls to vault, relay or network, and authorization hooks | pure typed functions returning Result; no events or commands; no I/O |

## Dependencies

Module depends on: F14.S02.M01, F09.S03.M01, F09.S03.M02, F09.S03.M03, CTR-MNY-001, CTR-UX-001, CTR-COM-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
