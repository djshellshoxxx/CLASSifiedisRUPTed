# PS-112-01 — Domain schema: Currency display

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S02.M02 Currency display](SPEC.md) · **Scope:** MVP · **Code:** `packages/i18n/src/internationalization/currencies` · **Contracts:** [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-112-01.R01** The module owns no stored entity; its types are Money (CTR-MNY-001, F09.S03.M03), the F09.S03.M01 CurrencyDef { code, kind fiat | crypto, decimals, name } supplied by callers from the registry, and QuoteLabel { source, sourceKind, issuerDisplay?, label?, signatureVerified, asOf, expiresAt, status, pinned? } built by callers from an F09.S03.M02 FxQuote.
- **PS-112-01.R02** Amounts are canonical F09.S03.M03 minor-unit strings (optional leading minus, 1 to 38 digits, no leading zeros, never '-0') or bigint in code, and are never converted to floating point.
- **PS-112-01.R03** Display output is derived data and is never stored or sent as the source of truth for an amount.

## Specification

**Note:** Pure formatting and parsing library; stores nothing and owns no catalog entity. QuoteLabel fields - source: FxQuote.source (adapter ID such as ecb-daily, or the source string of a manual or relay quote); sourceKind: provider | manual | derived; issuerDisplay: pseudonym of the manual issuer or display name of the signing relay, required for manual quotes and for sources that are not catalog adapter IDs; label: FxQuote.label (manual reason, shown in the info popover); signatureVerified: true only when the caller verified the source signature over the quote or this vault fetched it through its own direct provider adapter; asOf, expiresAt: RFC 3339; status: issued | expired | revoked; pinned: { consentCollected: boolean } when the quote is pinned into a signed proposal (N16). Adapter IDs map to display names through catalog keys money.source.<adapterId> (ecb-daily -> ECB).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-112-09.T01 | unit | PS-112-01.R01, PS-112-01.R02, PS-112-02.R01 | golden strings for the fixture amounts and CurrencyDefs in en, de, fr, es | Ok strings equal reviewed goldens; 5 minor units shows 0.05; -5 keeps sign |
| TEST-PS-112-09.T02 | property | PS-112-01.R02, PS-112-03.R01, PS-112-06.R01, PS-112-09.R02 | random bigint amounts 1..38 digits, fiat decimals 0..18 and crypto decimals 0..36, all shipped locales (10 000 runs nightly) | digits extracted from formatToParts without group separators equal the input digits exactly |
| TEST-PS-112-09.T03 | unit | PS-112-01.R02, PS-112-06.R02, PS-112-02.R03 | amount 9007199254740993 compared with a Number-based formatter | module output exact; naive Number output differs (documented counter-example) |
| TEST-PS-112-09.T15 | contract | PS-112-01.R03 | render prices in every shipped locale during the listing, offer and proposal fixture flows, then scan stored records, outbox payloads and signed statements | every amount field is a canonical minor-unit string with a currency code; no formatted text, separators or symbols are stored or sent |

## Dependencies

Module depends on: F14.S02.M01, F09.S03.M01, F09.S03.M02, F09.S03.M03, CTR-MNY-001, CTR-UX-001, CTR-COM-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [module SPEC](SPEC.md).
