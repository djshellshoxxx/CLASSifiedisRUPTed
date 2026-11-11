# PS-074-04 — Commands, queries and events: Money precision

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S03.M03 Money precision](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/valuation/precision` · **Contracts:** [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-074-04.R01** The public API is the TypeScript package surface listed in the note; there are no relay commands, queries or events.
- **PS-074-04.R02** Error codes returned by Result-style functions are stable and listed in the errors table; mismatched currencies throw.
- **PS-074-04.R03** The package exposes language-neutral test vectors (JSON) so non-TypeScript clients can verify identical results.

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
| COMMERCE_MONEY_INVALID | 422 | no | amount, rate or rounding input is malformed |
| COMMERCE_MONEY_ALLOCATION_INVALID | 422 | no | weights are empty, negative, oversize or sum to zero |
| COMMERCE_MONEY_PRECISION_LOSS | 422 | no | decimal input has more fractional digits than the currency allows |
| COMMERCE_MONEY_OVERFLOW | 422 | no | result exceeds 38 digits |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Library module. Package surface (packages/commerce/src/valuation/precision): money(amount, currency), parseMinor(str), parseDecimal(str, decimals, mode?), formatDecimal(money, decimals), add, sub, neg, cmp, sum, convert(money, quote, dbExp, dqExp, mode?), percentBps(money, bps, mode?), capFee(money, capMoney) (FLOOR), allocate(money, weights), splitEven(money, n), maxAmount(currencyDef: {code, decimals}) -> Result<Money> (10^(10 + decimals) minor units, at most 10^38 - 1; callers pass the F09.S03.M01 CurrencyDef and cap with amount <= maxAmount). No relay commands, queries or events exist for this module.

### Example

```
convert({ amount: "12345", currency: "EUR" }, { base: "EUR", quote: "JPY", rate: { num: "16312", den: "100" } }, 2, 0)
=> { amount: "20137", currency: "JPY" }   // 12345 * 16312 * 10^0 / (100 * 10^2) = 20137.164, HALF_EVEN once
allocate({ amount: "100", currency: "EUR" }, [1, 1, 1]) => parts ["34", "33", "33"]
maxAmount({ code: "EUR", decimals: 2 }) => { amount: "1000000000000", currency: "EUR" }   // 10^12 minor units = 10^10 EUR
maxAmount({ code: "ETH", decimals: 18 }) => { amount: "10000000000000000000000000000", currency: "ETH" }   // 10^28
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-074-09.T03 | property | PS-074-03.R02, PS-074-04.R02 | 10 000 random (amount, rate, exponents) conversions compared with an independent oracle using exact fractions | results identical and rounding applied exactly once |
| TEST-PS-074-09.T08 | contract | PS-074-04.R01, PS-074-04.R03, PS-074-09.R03 | run the 300 JSON vectors in TypeScript and in the reference Python checker | all outputs identical |
| TEST-PS-074-09.T09 | unit | PS-074-04.R02 | trigger each error path | code and HTTP mapping match the errors table |

## Dependencies

Module depends on: CTR-MNY-001, CTR-ERR-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
