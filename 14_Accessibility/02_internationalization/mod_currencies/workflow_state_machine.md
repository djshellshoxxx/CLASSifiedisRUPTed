# PS-112-03 — Workflow state machine: Currency display

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S02.M02 Currency display](SPEC.md) · **Scope:** MVP · **Code:** `packages/i18n/src/internationalization/currencies` · **Contracts:** [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-112-03.R01** Formatting is a pure function from (Money, CurrencyDef, locale, options) to a Result of a string and parts.
- **PS-112-03.R02** Parsing is a pure function from (text, locale, CurrencyDef) to a Result of a minor-unit string, normalized to a neutral decimal string and built with F09.S03.M03 parseDecimal.
- **PS-112-03.R03** There is no persisted lifecycle, so no entity state machine is declared.

## Specification

**Note:** Stateless library; the only time-dependent logic is the expired-quote check now ≥ expiresAt, computed from an injected clock; status revoked or expired from the QuoteLabel also marks the quote.

### Timeouts and scheduled transitions

_None._

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-112-09.T02 | property | PS-112-01.R02, PS-112-03.R01, PS-112-06.R01, PS-112-09.R02 | random bigint amounts 1..38 digits, fiat decimals 0..18 and crypto decimals 0..36, all shipped locales (10 000 runs nightly) | digits extracted from formatToParts without group separators equal the input digits exactly |
| TEST-PS-112-09.T04 | unit | PS-112-02.R02, PS-112-02.R03, PS-112-02.R05, PS-112-03.R01, PS-112-04.R02 | each rule V01–V12 violated, including '-0', '01', a 39-digit amount, ETH with decimals 37, and a JPY amount with the EUR CurrencyDef | the F09.S03.M03, F09.S03.M01, common VALIDATION_FAILED (V02, ETH with decimals 37) or I18N_ code of the rule returned as Err; I18N_MONEY_SPEC_MISMATCH for JPY with EUR from formatMoney, formatApprox and parseMoneyInput; no string produced |
| TEST-PS-112-09.T05 | unit | PS-112-06.R02, PS-112-03.R03 | force the BigInt part-substitution path by stubbing resolvedOptions; run the startup self-test; then make the decimal-string path disagree on one sample | identical output on 20 samples including negatives with zero whole part; on disagreement the BigInt path is used for the rest of the session and the dev warning i18n.money.selftest_disagreement is logged |
| TEST-PS-112-09.T09 | unit | PS-112-02.R02, PS-112-02.R04, PS-112-03.R02 | parseMoneyInput for '12,50' (de), '12.50' (en), '12,345' (de), '1.234,50' (de), '12.345' (de), '12,345' (en), '1 234,50' (fr with NBSP), '12.5.0', 41 characters, 39 digits, above the caller maximum; then the same input twice | 1250, 1250, COMMERCE_MONEY_PRECISION_LOSS, 123450, I18N_MONEY_AMBIGUOUS, I18N_MONEY_AMBIGUOUS, 123450, I18N_MONEY_SEPARATOR, I18N_MONEY_INPUT_TOO_LONG, COMMERCE_MONEY_OVERFLOW, I18N_MONEY_TOO_LARGE; identical Results for identical input; amounts built through F09.S03.M03 parseDecimal |

## Dependencies

Module depends on: F14.S02.M01, F09.S03.M01, F09.S03.M02, F09.S03.M03, CTR-MNY-001, CTR-UX-001, CTR-COM-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
