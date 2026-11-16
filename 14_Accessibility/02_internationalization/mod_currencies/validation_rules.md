# PS-112-02 — Validation rules: Currency display

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S02.M02 Currency display](SPEC.md) · **Scope:** MVP · **Code:** `packages/i18n/src/internationalization/currencies` · **Contracts:** [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-112-02.R01** Inputs are validated before formatting so the output is either exact or an explicit error, never a silently wrong number.
- **PS-112-02.R02** Parsing refuses ambiguous or lossy input instead of rounding.
- **PS-112-02.R03** Each failure has one stable error code usable in forms and tests.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | amount matches ^-?[0-9]{1,78}$ with no leading zeros except a single 0 | I18N_MONEY_INVALID |
| V02 | exponent is an integer from 0 to 18 supplied by the registry | I18N_MONEY_EXPONENT_INVALID |
| V03 | parsed text has no more fraction digits than the exponent and uses only the locale decimal separator once | I18N_MONEY_PRECISION |
| V04 | parsed value has at most 30 digits and does not exceed the caller's maximum | I18N_MONEY_TOO_LARGE |
| V05 | quote label has a source of 1 to 80 plain-text characters and asOf is a valid RFC 3339 instant | I18N_QUOTE_LABEL_INVALID |
| V06 | an approximate value is never rendered without the currency symbol or code, the source and the time | I18N_QUOTE_LABEL_INVALID |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-112-09.T01 | unit | PS-112-01.R01, PS-112-01.R02, PS-112-01.R03, PS-112-02.R01 | golden strings for the fixture amounts and specs in en, de, fr, es | strings equal reviewed goldens; 5 minor units shows 0.05; -5 keeps sign |
| TEST-PS-112-09.T03 | unit | PS-112-01.R02, PS-112-06.R02, PS-112-02.R03 | amount 9007199254740993 compared with a Number-based formatter | module output exact; naive Number output differs (documented counter-example) |
| TEST-PS-112-09.T04 | unit | PS-112-02.R02, PS-112-02.R03, PS-112-03.R01 | each rule V01–V06 violated | documented I18N_ code returned; no string produced for invalid amounts |
| TEST-PS-112-09.T06 | unit | PS-112-02.R03, PS-112-06.R03 | BTC, ETH, USDC and an unknown code | decimal style plus isolated code; no RangeError; never blank |
| TEST-PS-112-09.T08 | unit | PS-112-02.R03, PS-112-07.R02, PS-112-07.R03 | formatApprox with fresh quote, 25 h old quote, missing source, source with bidi characters | label has marker, code, source, time; old-quote text added; missing source shows details-unavailable text; bidi isolated |
| TEST-PS-112-09.T09 | unit | PS-112-02.R02, PS-112-07.R01, PS-112-07.R03 | parseMoneyInput for 12,50 (de), 12.50 (en), 12,345 (de), 1.234,50 (de), 12.5.0, 41 characters, 31 digits | 1250, 1250, I18N_MONEY_PRECISION, 123450, error, rejected by length, I18N_MONEY_TOO_LARGE |
| TEST-PS-112-09.T11 | a11y | PS-112-07.R03, PS-112-02.R03 | axe and screen reader pass on the approximate chip and money input in en and ar-XB | zero serious findings; accessible name contains approximately, amount, source and time; targets ≥ 44 px |

## Dependencies

Module depends on: F14.S02.M01, CTR-MNY-001, CTR-UX-001, CTR-COM-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
