# PS-112-01 — Domain schema: Currency display

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S02.M02 Currency display](SPEC.md) · **Scope:** MVP · **Code:** `packages/i18n/src/internationalization/currencies` · **Contracts:** [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-112-01.R01** The module owns no stored entity; its types are Money (CTR-MNY-001), CurrencySpec { code, exponent, kind } supplied by callers from the registry, and Quote label data { source, asOf, expiresAt }.
- **PS-112-01.R02** Amounts are decimal strings of minor units or bigint in code, with an optional leading minus sign and at most 78 digits, and are never converted to floating point.
- **PS-112-01.R03** Display output is derived data and is never stored or sent as the source of truth for an amount.

## Specification

**Note:** Pure formatting and parsing library; stores nothing and owns no catalog entity.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-112-09.T01 | unit | PS-112-01.R01, PS-112-01.R02, PS-112-01.R03, PS-112-02.R01 | golden strings for the fixture amounts and specs in en, de, fr, es | strings equal reviewed goldens; 5 minor units shows 0.05; -5 keeps sign |
| TEST-PS-112-09.T02 | property | PS-112-01.R02, PS-112-03.R01, PS-112-06.R01, PS-112-09.R02 | random bigint amounts 1..78 digits, exponents 0..18, all shipped locales (10 000 runs nightly) | digits extracted from formatToParts without group separators equal the input digits exactly |
| TEST-PS-112-09.T03 | unit | PS-112-01.R02, PS-112-06.R02, PS-112-02.R03 | amount 9007199254740993 compared with a Number-based formatter | module output exact; naive Number output differs (documented counter-example) |

## Dependencies

Module depends on: F14.S02.M01, CTR-MNY-001, CTR-UX-001, CTR-COM-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [module SPEC](SPEC.md).
