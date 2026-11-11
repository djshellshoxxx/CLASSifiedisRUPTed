# PS-112-03 — Workflow state machine: Currency display

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S02.M02 Currency display](SPEC.md) · **Scope:** MVP · **Code:** `packages/i18n/src/internationalization/currencies` · **Contracts:** [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-112-03.R01** Formatting is a pure function from (Money, exponent, locale, options) to a string and parts.
- **PS-112-03.R02** Parsing is a pure function from (text, locale, exponent) to a Result of a minor-unit string.
- **PS-112-03.R03** There is no persisted lifecycle, so no entity state machine is declared.

## Specification

**Note:** Stateless library; the only time-dependent logic is the old-quote threshold of 24 h, computed from an injected clock.

### Timeouts and scheduled transitions

_None._

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-112-09.T02 | property | PS-112-01.R02, PS-112-03.R01, PS-112-06.R01, PS-112-09.R02 | random bigint amounts 1..78 digits, exponents 0..18, all shipped locales (10 000 runs nightly) | digits extracted from formatToParts without group separators equal the input digits exactly |
| TEST-PS-112-09.T04 | unit | PS-112-02.R02, PS-112-02.R03, PS-112-03.R01 | each rule V01–V06 violated | documented I18N_ code returned; no string produced for invalid amounts |
| TEST-PS-112-09.T05 | unit | PS-112-06.R02, PS-112-03.R02, PS-112-03.R03 | force the BigInt part-substitution path by stubbing resolvedOptions; run startup self-test | output identical to the decimal-string path on 20 samples including negatives with zero whole part |

## Dependencies

Module depends on: F14.S02.M01, CTR-MNY-001, CTR-UX-001, CTR-COM-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
