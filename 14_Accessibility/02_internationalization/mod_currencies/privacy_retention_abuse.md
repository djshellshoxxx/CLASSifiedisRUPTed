# PS-112-07 — Privacy, retention and abuse: Currency display

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S02.M02 Currency display](SPEC.md) · **Scope:** MVP · **Code:** `packages/i18n/src/internationalization/currencies` · **Contracts:** [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-112-07.R01** The module stores and transmits nothing, and formatted prices are never logged with user identifiers.
- **PS-112-07.R02** Price display must not mislead, so an approximate value is rendered only with its full label (code, provenance wording, time and expired marker); without a source or time the converted amount is not rendered at all and callers show the original-currency price with 'conversion unavailable', and the UI never presents an approximate value as a payment amount.
- **PS-112-07.R03** Quote source display names come from catalog keys for known adapter IDs; other source strings and issuer pseudonyms are rendered as plain text through F14.S02.M01 t() parameters (bidi-isolated, directional controls removed), never as links or markup.
- **PS-112-07.R04** Quote wording reflects provenance, so a manual or unverified quote never borrows a provider's authority; manual quotes read 'manual rate by <issuer>', unverified quotes read 'unverified source', the bare 'quote from <name>' wording is reserved for verified catalog adapters, and 'pinned rate agreed by all parties' appears only when the caller passes pinned.consentCollected true (N16).

## Specification

**Data classification**
- Money values, CurrencyDef and quote metadata passed in: whatever class the owning record has; not stored here.

**Retention**
- None; the format cache holds Intl objects only and is discarded on reload.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Misleading price display through rounding or Number precision loss | exact string-based formatting, no rounding, property tests up to 38 digits |
| T02 | Approximate value shown as exact | V06 forbids rendering without marker, code, provenance and time; without them no converted amount is rendered; UI tests assert the label |
| T03 | Spoofed text through bidi control characters in quote source or issuer names | names are passed as F14.S02.M01 t() parameters, which isolate them with FSI and PDI and remove directional controls when rendered |
| T04 | Locale-based parsing mistakes causing wrong amounts (12.345 read as 12345) | V10 accepts group separators only with 3-digit groups and a decimal separator present; '12.345' in de is rejected with I18N_MONEY_AMBIGUOUS and a hint; excess fraction digits rejected by parseDecimal |
| T05 | A counterparty borrows provider authority by labelling a manual or unsigned quote 'ECB' | V08 provenance wording; bare 'quote from' only for verified catalog adapters; 'manual rate by <pseudonym>'; 'unverified source' |
| T06 | Expired or revoked quote shown as current, or a refresh offered on a pinned rate without fresh consent | expired marker from expiresAt and status; pinned quotes offer only 're-quote needs new consent from all parties' (N16, MNY-4) |

**Abuse controls**
- Input length is capped at 40 characters before parsing to avoid pathological regular expression cost; parsing uses a linear scan.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-112-09.T08 | unit | PS-112-02.R03, PS-112-07.R02, PS-112-07.R03 | formatApprox with a fresh verified quote, now ≥ expiresAt, status revoked, pinned with consentCollected true and false, pinned and expired, missing source, missing asOf, source with bidi characters | label has marker, code, provenance and time; 'expired quote' with action requote; 'revoked quote'; pinned wording only with consentCollected true; pinned and expired gives action requote_needs_consent and no refresh; missing source or time returns Err(I18N_QUOTE_LABEL_INVALID) with no converted amount and the chip shows the original price with 'conversion unavailable'; bidi isolated |
| TEST-PS-112-09.T10 | abuse | PS-112-07.R01, PS-112-07.R02 | capture logs and network during formatting and parsing | no amounts, identifiers or network calls; UI never labels an approximate value as a payment amount |
| TEST-PS-112-09.T11 | a11y | PS-112-07.R03, PS-112-02.R03 | axe and screen reader pass on the approximate chip and money input in en and ar-XB | zero serious findings; accessible name contains approximately, amount, provenance wording and time; targets ≥ 44 px |
| TEST-PS-112-09.T16 | unit | PS-112-07.R04 | counterparty manual quote with source 'ECB' and issuerDisplay river-otter-42; relay-served provider quote with signatureVerified false; verified ecb-daily quote; verified provider quote with an uncatalogued source | 'manual rate by river-otter-42', never 'quote from ECB'; 'unverified source'; 'quote from ECB' through money.source.ecb-daily; 'quote from <source>, signed by <issuer>'; V08 holds in every case |

## Dependencies

Module depends on: F14.S02.M01, F09.S03.M01, F09.S03.M02, F09.S03.M03, CTR-MNY-001, CTR-UX-001, CTR-COM-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
