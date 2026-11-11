# PS-112-07 — Privacy, retention and abuse: Currency display

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S02.M02 Currency display](SPEC.md) · **Scope:** MVP · **Code:** `packages/i18n/src/internationalization/currencies` · **Contracts:** [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-112-07.R01** The module stores and transmits nothing, and formatted prices are never logged with user identifiers.
- **PS-112-07.R02** Price display must not mislead, so approximate values are always labelled, the quote source is shown as plain text, and the UI never presents an approximate value as a payment amount.
- **PS-112-07.R03** Quote source names come from the quote record and are rendered as plain text, never as links or markup.

## Specification

**Data classification**
- Money values and quote metadata passed in: whatever class the owning record has; not stored here.

**Retention**
- None; the format cache holds Intl objects only and is discarded on reload.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Misleading price display through rounding or Number precision loss | exact string-based formatting, no rounding, property tests up to 78 digits |
| T02 | Approximate value shown as exact | V06 forbids rendering without marker, code, source and time; UI tests assert the label |
| T03 | Spoofed text through bidi control characters in quote source names | source is sanitized to plain text without bidi controls and isolated with FSI and PDI when rendered |
| T04 | Locale-based parsing mistakes causing wrong amounts (12.345 read as 12345) | parsing accepts only the locale decimal separator, rejects extra grouping ambiguity and excess digits |

**Abuse controls**
- Input length is capped at 40 characters before parsing to avoid pathological regular expression cost; parsing uses a linear scan.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-112-09.T08 | unit | PS-112-02.R03, PS-112-07.R02, PS-112-07.R03 | formatApprox with fresh quote, 25 h old quote, missing source, source with bidi characters | label has marker, code, source, time; old-quote text added; missing source shows details-unavailable text; bidi isolated |
| TEST-PS-112-09.T09 | unit | PS-112-02.R02, PS-112-07.R01, PS-112-07.R03 | parseMoneyInput for 12,50 (de), 12.50 (en), 12,345 (de), 1.234,50 (de), 12.5.0, 41 characters, 31 digits | 1250, 1250, I18N_MONEY_PRECISION, 123450, error, rejected by length, I18N_MONEY_TOO_LARGE |
| TEST-PS-112-09.T10 | abuse | PS-112-07.R01, PS-112-07.R02 | capture logs and network during formatting and parsing | no amounts, identifiers or network calls; UI never labels an approximate value as a payment amount |
| TEST-PS-112-09.T11 | a11y | PS-112-07.R03, PS-112-02.R03 | axe and screen reader pass on the approximate chip and money input in en and ar-XB | zero serious findings; accessible name contains approximately, amount, source and time; targets ≥ 44 px |

## Dependencies

Module depends on: F14.S02.M01, CTR-MNY-001, CTR-UX-001, CTR-COM-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
