# PS-112-04 — Commands, queries and events: Currency display

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S02.M02 Currency display](SPEC.md) · **Scope:** MVP · **Code:** `packages/i18n/src/internationalization/currencies` · **Contracts:** [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-112-04.R01** The module exposes library functions and no vault or relay commands, queries or events.
- **PS-112-04.R02** Functions are total for valid input and return Result values for parsing and validation.
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
| I18N_MONEY_INVALID | 422 | no | amount is not a decimal integer string of at most 78 digits |
| I18N_MONEY_EXPONENT_INVALID | 422 | no | currency exponent missing or outside 0 to 18 |
| I18N_MONEY_PRECISION | 422 | no | typed amount has more fraction digits than the currency allows or mixed separators |
| I18N_MONEY_TOO_LARGE | 422 | no | typed amount exceeds 30 digits or the caller maximum |
| I18N_QUOTE_LABEL_INVALID | 422 | no | quote source or time missing or malformed for an approximate value |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** API: formatMoney(money, spec, locale, { display: symbol|code|name, trimZeros? }) -> string; formatMoneyParts(...) -> Part[]; formatApprox(money, spec, quote, locale, { timeZone, now }) -> string; parseMoneyInput(text, spec, locale, { max }) -> Result<string>; currencyName(code, locale, count) -> string.

### Example

```
formatMoney({ amount: "4500", currency: "EUR" }, { code: "EUR", exponent: 2, kind: "iso" }, "de") // "45,00 €"
formatMoney({ amount: "4500", currency: "EUR" }, { code: "EUR", exponent: 2, kind: "iso" }, "en") // "€45.00"
formatMoney({ amount: "12345678901234567890", currency: "USD" }, usd, "en") // "$123,456,789,012,345,678.90"
formatMoney({ amount: "100000000", currency: "BTC" }, btc, "en") // "1.00000000 BTC"
formatApprox({ amount: "4210", currency: "EUR" }, eur, { source: "ECB", asOf: "2026-11-04T10:15:00Z" }, "en", { timeZone: "UTC" })
  // "≈ 42.10 EUR, quote from ECB at 10:15"
parseMoneyInput("12,50", eur, "de") // Ok("1250");  parseMoneyInput("12,345", eur, "de") // Err(I18N_MONEY_PRECISION)
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-112-09.T07 | unit | PS-112-04.R01, PS-112-04.R02, PS-112-04.R03, PS-112-05.R01, PS-112-05.R02, PS-112-05.R03 | inspect exports, calls to vault, relay or network, and authorization hooks | pure typed functions; no events or commands; no I/O |

## Dependencies

Module depends on: F14.S02.M01, CTR-MNY-001, CTR-UX-001, CTR-COM-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
