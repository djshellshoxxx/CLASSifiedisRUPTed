# PS-075-02 — Validation rules: FX rates and quotes

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S03.M02 FX rates and quotes](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/valuation/rates` · **Contracts:** [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-075-02.R01** Quote requests validate currencies, source availability, source signature (for relay quotes) and rate sanity before issuing.
- **PS-075-02.R02** Provider values are parsed as decimal strings into exact rationals; floating point parse is forbidden.
- **PS-075-02.R03** Staleness and deviation checks run on every provider quote.
- **PS-075-02.R04** Quotes embedded in peer statements are verified before display - relay-signed quotes by the relay key, manual quotes by issuerRef, which must equal the embedding statement's signer unless the quote carries its own valid issuer signature - and unsigned provider quotes are labelled 'source asserted by <issuer pseudonym>, not verifiable' with sourceSigned false.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | base and quote are active currencies in the local registry and differ | COMMERCE_RATE_PAIR_INVALID |
| V02 | provider rate token is a decimal string with at most 18 fractional digits and positive value | VALIDATION_FAILED |
| V03 | provider asOf is within 96 h for fiat pairs and 5 min for crypto pairs | COMMERCE_RATE_STALE |
| V04 | provider rate deviates at most 50 percent from the last accepted quote of the pair within 24 h | COMMERCE_RATE_SUSPECT |
| V05 | requested validity is 1 to 60 min for provider quotes with purpose general, 1 min to 24 h (86 400 000 ms) for provider quotes with purpose barter_normalization, and 15 min to 24 h for manual quotes | VALIDATION_FAILED |
| V06 | manual quote has a reason of 1 to 200 characters | VALIDATION_FAILED |
| V07 | at least one RateSourcePort adapter or a live manual quote exists for the pair | COMMERCE_RATE_UNAVAILABLE |
| V08 | quote ID pinned by a consumer exists, is not revoked and its expiresAt is after the local clock of the checking vault | EXPIRED |
| V09 | relay-issued or relay-served quote carries a valid Ed25519 signature from a relay key the user trusts | COMMERCE_RATE_SIGNATURE_INVALID |
| V10 | purpose is general or barter_normalization and issuerRef is present; a direct-provider quote names the fetching principal's did | VALIDATION_FAILED |
| V11 | an embedded manual quote is signed by issuerRef's active key, and issuerRef equals the embedding statement's signer unless the quote carries that issuer's own valid signature | COMMERCE_RATE_SIGNATURE_INVALID |
| V12 | a fx_quote_revocation statement is signed by the issuerRef of a manual quote it names; statements from a blocked did are dropped silently | COMMERCE_RATE_SIGNATURE_INVALID |
| V13 | embedded crypto or non-snapshot currencies carry asset descriptors equal to the local CurrencyDef (F09.S03.M01) | COMMERCE_CURRENCY_MISMATCH |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-075-09.T01 | unit | PS-075-01.R01, PS-075-01.R03, PS-075-02.R02 | request EUR/USD with the fixture 1.0870 token | stored rate 1087/1000, no float used, source ecb-daily |
| TEST-PS-075-09.T02 | unit | PS-075-02.R01, PS-075-02.R03 | same currency pair, unknown currency, stale 6-day-old data, 60% deviation | documented error codes returned and nothing stored |
| TEST-PS-075-09.T03 | property | PS-075-01.R01, PS-075-02.R02 | random decimal strings up to 18 fractional digits | num and den coprime and num/den equals the decimal exactly |
| TEST-PS-075-09.T14 | abuse | PS-075-01.R04, PS-075-01.R05, PS-075-02.R04, PS-075-07.R05 | vault A embeds a forged {source ecb-daily} quote with an invented rate in a statement to vault B; B calls verify_embedded with reDerive | B shows 'source asserted by <A pseudonym>, not verifiable', sourceSigned false, stores receivedFrom and the ECB deviation; nothing reads as ECB-sourced |
| TEST-PS-075-09.T16 | unit | PS-075-03.R04, PS-075-02.R01 | barter_normalization requests of 86 400 000 ms and 86 400 001 ms, a general provider request of 3 600 001 ms, and a 24 h quote checked 23 h 29 min after issue against F02.S04.M02's 30-minute remaining-life requirement | first accepted and labelled 'pinned rate agreed by all parties'; second and third VALIDATION_FAILED; the 24 h quote still has 31 minutes of life and passes |
| TEST-PS-075-09.T18 | abuse | PS-075-02.R04, PS-075-07.R05 | manual quote attributed to pseudonym C embedded by A without C's signature; and with C's valid signature | first refused with COMMERCE_RATE_SIGNATURE_INVALID; second shown as 'manual rate by C' with issuerSigned true and sourceSigned false |

## Dependencies

Module depends on: F09.S03.M01, F09.S03.M03, F11.S01.M01, F11.S01.M03, F07.S02.M01, F07.S02.M02, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001, CTR-FED-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
