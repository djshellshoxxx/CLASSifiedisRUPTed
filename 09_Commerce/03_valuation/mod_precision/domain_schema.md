# PS-074-01 — Domain schema: Money precision

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S03.M03 Money precision](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/valuation/precision` · **Contracts:** [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-074-01.R01** Money is { amount: decimal integer string of minor units with optional leading '-', currency: registry code } on the wire and a bigint plus currency code in memory (MNY-1).
- **PS-074-01.R02** The absolute value of any amount is limited to 38 decimal digits (fits an unsigned 128-bit integer) so storage in SQLite text columns and cross-language vectors stay unambiguous.
- **PS-074-01.R03** The library owns no persistent entity; it defines the value types Money, Rational, RoundingMode and AllocationResult only.
- **PS-074-01.R04** maxAmount(currencyDef) returns Money { amount: 10^(10 + decimals), currency: code } - 10^10 major units in minor units - from the caller-supplied F09.S03.M01 CurrencyDef { code, decimals }, because this library has no registry access and F09.S03.M01 depends on it; when decimals exceeds 27 the result is the 38-digit bound 10^38 - 1, and amounts are capped with amount <= maxAmount.

## Specification

**Note:** Library module. It owns no entity; value types are Money, Rational {num, den as positive bigint}, RoundingMode (HALF_EVEN or FLOOR) and AllocationResult {parts: Money[], remainderIndexes: int[]}.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-074-09.T01 | unit | PS-074-01.R01, PS-074-01.R02, PS-074-02.R01 | parse valid and invalid strings including '+1', '01', '1.0', '1e3', '-0' and a 39-digit value | valid values round-trip; each invalid input returns COMMERCE_MONEY_INVALID or COMMERCE_MONEY_OVERFLOW |
| TEST-PS-074-09.T02 | unit | PS-074-02.R02, PS-074-02.R03, PS-074-01.R03 | invalid rate, empty weights, all-zero weights, mixed currencies | documented error returned or programmer error thrown |
| TEST-PS-074-09.T14 | unit | PS-074-01.R01, PS-074-09.R02 | lint rule run on a file using parseFloat | lint fails the build |
| TEST-PS-074-09.T16 | property | PS-074-01.R04, PS-074-02.R01 | maxAmount for decimals 0 to 36 including EUR 2, JPY 0, BTC 8, ETH 18, USDC 6 and a 36-decimal asset, plus decimals -1, 37 and 2.5 | 10^(10 + decimals) for decimals up to 27 and 10^38 - 1 above, always a canonical amount of at most 38 digits that parseMinor accepts; out-of-range decimals return COMMERCE_MONEY_INVALID; identical results in the shared JSON vectors |

## Dependencies

Module depends on: CTR-MNY-001, CTR-ERR-001, CTR-TST-001. Predecessor: [module SPEC](SPEC.md).
