# PS-075-07 — Privacy, retention and abuse: FX rates and quotes

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S03.M02 FX rates and quotes](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/valuation/rates` · **Contracts:** [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-075-07.R01** Quote requests carry no location or identity to providers; providers only receive the pair, and the UI states that a direct provider sees the device IP while a relay proxy hides it from the provider but not from the relay.
- **PS-075-07.R02** Manual rate abuse is controlled by the mandatory label, reason and pseudonym attached to the quote, and by counterparties consenting to the exact pinned quote.
- **PS-075-07.R03** Quotes are kept as evidence for 2 years because proposals pin them.

## Specification

**Data classification**
- FxQuote: P1 reference data in the vault; issuerRef is a did or relay key id.
- Direct provider calls expose the device IP to that provider; users choose between direct and relay-proxied sources in settings.

**Retention**
- RET-EVIDENCE (2 years after last related activity); unreferenced quotes older than 30 days may be purged.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | A counterparty proposes a manipulated manual rate to disadvantage barter participants | rate shown with Manual label, issuer pseudonym and reason; each participant consents to the exact pinned quote; deviation versus last provider quote shown when over 20 percent |
| T02 | Quote request flooding exhausts provider or relay quotas | local limit 30 fetches per hour, relay limit 30 per hour per device key and 600 per hour per relay, response cache 60 s per pair |
| T03 | Stale or poisoned provider data | staleness limit, 50 percent deviation guard, adapters pinned to HTTPS and a fixed hostname allowlist |

**Abuse controls**
- Relay rate limits apply per relay policy; repeated COMMERCE_RATE_SUSPECT results show a local warning and, on a relay, an operator alert.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-075-09.T08 | abuse | PS-075-05.R01, PS-075-05.R02, PS-075-07.R02 | relay_issue by an unregistered device key; 31 relay requests in one hour; tampered relay quote | relay denies, 31st returns RATE_LIMITED, vault rejects tampered quote with COMMERCE_RATE_SIGNATURE_INVALID |
| TEST-PS-075-09.T10 | integration | PS-075-07.R01, PS-075-07.R03, PS-075-01.R02 | inspect outbound provider request and a statement embedding a quote | request contains only the pair and no client identifiers; embedded quote carries its source signature |

## Dependencies

Module depends on: F09.S03.M01, F09.S03.M03, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
