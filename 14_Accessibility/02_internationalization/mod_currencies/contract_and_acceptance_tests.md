# PS-112-09 — Contract and acceptance tests: Currency display

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S02.M02 Currency display](SPEC.md) · **Scope:** MVP · **Code:** `packages/i18n/src/internationalization/currencies` · **Contracts:** [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-112-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-112-09.R02** Property tests prove digit-exactness for random bigint amounts up to 78 digits in every shipped locale and exponent 0 to 18.
- **PS-112-09.R03** Golden strings are generated with a pinned Node ICU version and cross-checked in Chromium and WebKit, with CLDR differences reviewed.

## Specification

See the module test table below (all processes).

**Fixtures:** Specs EUR 2, USD 2, JPY 0, KWD 3, BTC 8, ETH 18, USDC 6; locales en, de, fr, es, ar-XB; amounts 0, 5, -5, 4500, -250, 9007199254740993, 12345678901234567890 and 78-digit values; quote ECB asOf 2026-11-04T10:15:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-112-09.T01 | unit | PS-112-01.R01, PS-112-01.R02, PS-112-01.R03, PS-112-02.R01 | golden strings for the fixture amounts and specs in en, de, fr, es | strings equal reviewed goldens; 5 minor units shows 0.05; -5 keeps sign |
| TEST-PS-112-09.T02 | property | PS-112-01.R02, PS-112-03.R01, PS-112-06.R01, PS-112-09.R02 | random bigint amounts 1..78 digits, exponents 0..18, all shipped locales (10 000 runs nightly) | digits extracted from formatToParts without group separators equal the input digits exactly |
| TEST-PS-112-09.T03 | unit | PS-112-01.R02, PS-112-06.R02, PS-112-02.R03 | amount 9007199254740993 compared with a Number-based formatter | module output exact; naive Number output differs (documented counter-example) |
| TEST-PS-112-09.T04 | unit | PS-112-02.R02, PS-112-02.R03, PS-112-03.R01 | each rule V01–V06 violated | documented I18N_ code returned; no string produced for invalid amounts |
| TEST-PS-112-09.T05 | unit | PS-112-06.R02, PS-112-03.R02, PS-112-03.R03 | force the BigInt part-substitution path by stubbing resolvedOptions; run startup self-test | output identical to the decimal-string path on 20 samples including negatives with zero whole part |
| TEST-PS-112-09.T06 | unit | PS-112-02.R03, PS-112-06.R03 | BTC, ETH, USDC and an unknown code | decimal style plus isolated code; no RangeError; never blank |
| TEST-PS-112-09.T07 | unit | PS-112-04.R01, PS-112-04.R02, PS-112-04.R03, PS-112-05.R01, PS-112-05.R02, PS-112-05.R03 | inspect exports, calls to vault, relay or network, and authorization hooks | pure typed functions; no events or commands; no I/O |
| TEST-PS-112-09.T08 | unit | PS-112-02.R03, PS-112-07.R02, PS-112-07.R03 | formatApprox with fresh quote, 25 h old quote, missing source, source with bidi characters | label has marker, code, source, time; old-quote text added; missing source shows details-unavailable text; bidi isolated |
| TEST-PS-112-09.T09 | unit | PS-112-02.R02, PS-112-07.R01, PS-112-07.R03 | parseMoneyInput for 12,50 (de), 12.50 (en), 12,345 (de), 1.234,50 (de), 12.5.0, 41 characters, 31 digits | 1250, 1250, I18N_MONEY_PRECISION, 123450, error, rejected by length, I18N_MONEY_TOO_LARGE |
| TEST-PS-112-09.T10 | abuse | PS-112-07.R01, PS-112-07.R02 | capture logs and network during formatting and parsing | no amounts, identifiers or network calls; UI never labels an approximate value as a payment amount |
| TEST-PS-112-09.T11 | a11y | PS-112-07.R03, PS-112-02.R03 | axe and screen reader pass on the approximate chip and money input in en and ar-XB | zero serious findings; accessible name contains approximately, amount, source and time; targets ≥ 44 px |
| TEST-PS-112-09.T12 | load | PS-112-08.R01, PS-112-08.R02, PS-112-08.R03 | 100 000 format calls warm and cold; bundle check | p95 ≤ 0.05 ms warm, ≤ 1 ms cold, ≤ 3 KiB gzip |
| TEST-PS-112-09.T13 | unit | PS-112-09.R01, PS-112-09.R03 | traceability tool run | every PS-112 requirement maps to a passing test |
| TEST-PS-112-09.T14 | unit | PS-112-10.R01, PS-112-10.R02, PS-112-10.R03 | upgrade ICU data and golden file; roll back | changed goldens require review; stored amounts unaffected; rollback restores previous goldens |

## Acceptance criteria

- All tests T01–T14 pass in CI.
- Formatting is digit-exact for any amount up to 78 digits in every shipped locale (property test).
- Every approximate value is shown with currency, quote source and quote time.

## Dependencies

Module depends on: F14.S02.M01, CTR-MNY-001, CTR-UX-001, CTR-COM-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
