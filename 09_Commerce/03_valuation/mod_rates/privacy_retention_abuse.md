# PS-075-07 — Privacy, retention and abuse: FX rates and quotes

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S03.M02 FX rates and quotes](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/valuation/rates` · **Contracts:** [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-075-07.R01** Quote requests carry no location or identity to providers; providers only receive the pair, and the UI states that a direct provider sees the device IP while a relay proxy hides it from the provider but not from the relay.
- **PS-075-07.R02** Manual rate abuse is controlled by the mandatory label, reason and pseudonym attached to the quote, and by counterparties consenting to the exact pinned quote.
- **PS-075-07.R03** Quotes are kept as evidence for 2 years because proposals pin them.
- **PS-075-07.R04** The module registers ExportSectionPort (section commerce.fx_quotes), DeletionPort (pseudonymization of issuerRef and receivedFrom) and RetentionPurgePort (RET-EVIDENCE, unreferenced quotes after 30 days) with F10 (N6), annotates every FxQuote field with its F10.S02.M02 class, and consumes privacy.deletion.completed.
- **PS-075-07.R05** Forged source attribution is never shown as verified - unsigned provider quotes read 'source asserted by <sender>, not verifiable', manual quotes need issuerRef's signature, revocations from blocked dids are dropped (N7), and the revocation ingest uses a bounded quarantine of 100 entries with oldest-first eviction.

## Specification

**Data classification**
- FxQuote: P1 reference data in the vault; issuerRef and receivedFrom are dids or a relay key id; field classes annotated per F10.S02.M02.
- Direct provider calls expose the device IP to that provider; users choose between direct and relay-proxied sources in settings.

**Retention**
- RET-EVIDENCE (2 years after last related activity); unreferenced quotes older than 30 days are purged through the RetentionPurgePort.
- On deletion: issuerRef and receivedFrom replaced by the per-deletion pseudonym; copies embedded in other parties' statements cannot be recalled.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | A counterparty proposes a manipulated manual rate to disadvantage barter participants | rate shown with Manual label, issuer pseudonym and reason; each participant consents to the exact pinned quote; deviation versus last provider quote shown when over 20 percent |
| T02 | Quote request flooding exhausts provider or relay quotas | local limit 30 fetches per hour, relay limit 30 per hour per device key and 600 per hour per relay, response cache 60 s per pair |
| T03 | Stale or poisoned provider data | staleness limit, 50 percent deviation guard, adapters pinned to HTTPS and a fixed hostname allowlist |
| T04 | Proposer embeds a forged ecb-daily rate or attributes a manual rate to another pseudonym | unsigned provider quotes labelled asserted_unverified with optional ECB re-derivation; manual quotes need issuerRef's signature and issuerRef must equal the embedding signer unless independently signed |
| T05 | A relay with a skewed or dishonest clock tries to keep a quote alive or expire it early | expiry is evaluated only on the checking vault's local clock; relay times are labelled as that relay's claim |

**Abuse controls**
- Relay rate limits apply per relay policy; repeated COMMERCE_RATE_SUSPECT results show a local warning and, on a relay, an operator alert.
- Revocation ingest limited to 20 statements per hour per known issuer; bounded quarantine of 100 entries with oldest-first eviction; blocked senders dropped silently.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-075-09.T08 | abuse | PS-075-05.R01, PS-075-05.R02, PS-075-07.R02 | relay_issue by an unregistered device key; 31 relay requests in one hour; tampered relay quote | relay denies, 31st returns RATE_LIMITED, vault rejects tampered quote with COMMERCE_RATE_SIGNATURE_INVALID |
| TEST-PS-075-09.T10 | integration | PS-075-07.R01, PS-075-01.R02 | inspect outbound provider request and a statement embedding a relay-signed and a direct-provider quote | request contains only the pair and no client identifiers; the relay-signed quote is carried with its relay signature; the direct-provider quote is carried in full with sourceSigned false |
| TEST-PS-075-09.T14 | abuse | PS-075-01.R04, PS-075-01.R05, PS-075-02.R04, PS-075-07.R05 | vault A embeds a forged {source ecb-daily} quote with an invented rate in a statement to vault B; B calls verify_embedded with reDerive | B shows 'source asserted by <A pseudonym>, not verifiable', sourceSigned false, stores receivedFrom and the ECB deviation; nothing reads as ECB-sourced |
| TEST-PS-075-09.T18 | abuse | PS-075-02.R04, PS-075-07.R05 | manual quote attributed to pseudonym C embedded by A without C's signature; and with C's valid signature | first refused with COMMERCE_RATE_SIGNATURE_INVALID; second shown as 'manual rate by C' with issuerSigned true and sourceSigned false |
| TEST-PS-075-09.T19 | integration | PS-075-07.R04 | export, deletion and retention purge driven by F10 | section commerce.fx_quotes exported; privacy.deletion.completed pseudonymizes issuerRef; RetentionPurgePort purges unreferenced quotes after 30 days; every field carries an F10.S02.M02 class |
| TEST-PS-075-09.T22 | integration | PS-075-07.R03 | a quote pinned by a proposal and an unreferenced quote, clock advanced 31 days and then 2 years | unreferenced quote purged at 31 days; pinned quote retained until 2 years after the proposal's last activity |

## Dependencies

Module depends on: F09.S03.M01, F09.S03.M03, F11.S01.M01, F11.S01.M03, F07.S02.M01, F07.S02.M02, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001, CTR-FED-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
