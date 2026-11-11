# PS-112-06 — Failure recovery and idempotency: Currency display

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S02.M02 Currency display](SPEC.md) · **Scope:** MVP · **Code:** `packages/i18n/src/internationalization/currencies` · **Contracts:** [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-112-06.R01** Formatting is deterministic and idempotent, and never returns a string for an invalid amount; invalid input yields an explicit error value shown as a localized message.
- **PS-112-06.R02** If the Intl implementation lacks exact decimal-string support, the BigInt part-substitution path produces identical output, and a startup self-test verifies the two paths agree on 20 sample values.
- **PS-112-06.R03** If Intl.NumberFormat cannot format a currency code, the decimal style plus isolated code is used so a price is never blank.

## Specification

- **idempotency:** Pure functions; the same input and locale give the same output.
- **concurrency:** No shared mutable state except a bounded cache of at most 64 Intl.NumberFormat instances keyed by locale, currency and options.
- **retries:** Not applicable; no network or storage operations.
- **offline:** Fully offline; uses the browser's built-in Intl data and the bundled catalogs.
- **partial failure:** A failing quote label (missing source) renders the amount with the approximate marker and the text 'quote details unavailable' from the catalog rather than hiding the approximation.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-112-09.T02 | property | PS-112-01.R02, PS-112-03.R01, PS-112-06.R01, PS-112-09.R02 | random bigint amounts 1..78 digits, exponents 0..18, all shipped locales (10 000 runs nightly) | digits extracted from formatToParts without group separators equal the input digits exactly |
| TEST-PS-112-09.T03 | unit | PS-112-01.R02, PS-112-06.R02, PS-112-02.R03 | amount 9007199254740993 compared with a Number-based formatter | module output exact; naive Number output differs (documented counter-example) |
| TEST-PS-112-09.T05 | unit | PS-112-06.R02, PS-112-03.R02, PS-112-03.R03 | force the BigInt part-substitution path by stubbing resolvedOptions; run startup self-test | output identical to the decimal-string path on 20 samples including negatives with zero whole part |
| TEST-PS-112-09.T06 | unit | PS-112-02.R03, PS-112-06.R03 | BTC, ETH, USDC and an unknown code | decimal style plus isolated code; no RangeError; never blank |

## Dependencies

Module depends on: F14.S02.M01, CTR-MNY-001, CTR-UX-001, CTR-COM-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
