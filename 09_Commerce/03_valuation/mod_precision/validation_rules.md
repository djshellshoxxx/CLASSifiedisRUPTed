# PS-074-02 — Validation rules: Money precision

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S03.M03 Money precision](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/valuation/precision` · **Contracts:** [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-074-02.R01** Parsing accepts only the canonical grammar and rejects everything else with COMMERCE_MONEY_INVALID, including whitespace, plus signs, leading zeros, decimal points and exponents.
- **PS-074-02.R02** Conversion and allocation validate their rational and weight inputs before computing.
- **PS-074-02.R03** Mixed-currency arithmetic is a programmer error that throws (MNY-6) rather than returning a Result.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | amount string is an optional '-' then 1 to 38 digits without leading zeros (a lone 0 is allowed) and is not '-0' | COMMERCE_MONEY_INVALID |
| V02 | rate num and den are positive integers of at most 40 digits each | COMMERCE_MONEY_INVALID |
| V03 | allocation weights are non-negative integers, at most 1000 entries, with sum greater than 0 | COMMERCE_MONEY_ALLOCATION_INVALID |
| V04 | decimal-string parse has at most the currency decimals fractional digits unless an explicit rounding mode is given | COMMERCE_MONEY_PRECISION_LOSS |
| V05 | result magnitude is at most 38 digits | COMMERCE_MONEY_OVERFLOW |
| V06 | rounding mode is HALF_EVEN, or FLOOR only for fee-cap operations | COMMERCE_MONEY_INVALID |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-074-09.T01 | unit | PS-074-01.R01, PS-074-01.R02, PS-074-02.R01 | parse valid and invalid strings including '+1', '01', '1.0', '1e3', '-0' and a 39-digit value | valid values round-trip; each invalid input returns COMMERCE_MONEY_INVALID or COMMERCE_MONEY_OVERFLOW |
| TEST-PS-074-09.T02 | unit | PS-074-02.R02, PS-074-02.R03, PS-074-01.R03 | invalid rate, empty weights, all-zero weights, mixed currencies | documented error returned or programmer error thrown |

## Dependencies

Module depends on: CTR-MNY-001, CTR-ERR-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
