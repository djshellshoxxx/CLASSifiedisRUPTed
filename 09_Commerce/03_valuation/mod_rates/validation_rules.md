# PS-075-02 — Validation rules: FX rates and quotes

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S03.M02 FX rates and quotes](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/valuation/rates` · **Contracts:** [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-075-02.R01** Quote requests validate currencies, source availability, source signature (for relay quotes) and rate sanity before issuing.
- **PS-075-02.R02** Provider values are parsed as decimal strings into exact rationals; floating point parse is forbidden.
- **PS-075-02.R03** Staleness and deviation checks run on every provider quote.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | base and quote are active currencies in the local registry and differ | COMMERCE_RATE_PAIR_INVALID |
| V02 | provider rate token is a decimal string with at most 18 fractional digits and positive value | VALIDATION_FAILED |
| V03 | provider asOf is within 96 h for fiat pairs and 5 min for crypto pairs | COMMERCE_RATE_STALE |
| V04 | provider rate deviates at most 50 percent from the last accepted quote of the pair within 24 h | COMMERCE_RATE_SUSPECT |
| V05 | requested validity is within 1 to 60 min (provider) or 15 min to 24 h (manual) | VALIDATION_FAILED |
| V06 | manual quote has a reason of 1 to 200 characters | VALIDATION_FAILED |
| V07 | at least one RateSourcePort adapter or a live manual quote exists for the pair | COMMERCE_RATE_UNAVAILABLE |
| V08 | quote ID pinned by a consumer exists and is not expired or revoked | EXPIRED |
| V09 | relay-issued or relay-served quote carries a valid Ed25519 signature from a relay key the user trusts | COMMERCE_RATE_SIGNATURE_INVALID |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-075-09.T01 | unit | PS-075-01.R01, PS-075-01.R03, PS-075-02.R02 | request EUR/USD with the fixture 1.0870 token | stored rate 1087/1000, no float used, source ecb-daily |
| TEST-PS-075-09.T02 | unit | PS-075-02.R01, PS-075-02.R03 | same currency pair, unknown currency, stale 6-day-old data, 60% deviation | documented error codes returned and nothing stored |
| TEST-PS-075-09.T03 | property | PS-075-01.R01, PS-075-02.R02 | random decimal strings up to 18 fractional digits | num and den coprime and num/den equals the decimal exactly |

## Dependencies

Module depends on: F09.S03.M01, F09.S03.M03, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
