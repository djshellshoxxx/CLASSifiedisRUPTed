# PS-029-07 — Privacy, retention and abuse: Service skills catalog

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S01.M01 Service skills catalog](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_catalog/skills` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-029-07.R01** Offerings never contain exact addresses; the service area is at most L2, and publishing warns that copies already fetched by other vaults cannot be recalled (PRV-6).
- **PS-029-07.R02** Credential evidence attachments are P2, travel only inside end-to-end encrypted envelopes to a client with an open QuoteRequest, and relays see ciphertext only.
- **PS-029-07.R03** Fake credentials and keyword stuffing are limited by self-attestation labels, local caps, receiver-side filtering and each relay's hosting policy.

## Specification

**Data classification**
- ServiceOffering: P3 draft in the vault; the signed projection is P0 and carries no evidence attachments.
- Credential evidence attachment: P2, shared by reference only.

**Retention**
- Withdrawn offerings: RET-STANDARD, purged 30 days after provider deletion.
- On local deletion of the vault the provider can publish tombstones first; relays honour signed tombstones and keep them 180 days (FED-4).

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Provider claims a licence they do not hold | credentials are rendered with a self-attested badge, the the reader can report or locally hide the offering, and no verified state exists |
| T02 | Keyword stuffing and 100 near-duplicate offerings to dominate search | local cap of 20 published offerings, 10 skills each, receiver-side spam filtering and relay hosting policy |
| T03 | Service area narrowed to expose a home address | area precision capped at geohash 5, finer values rejected, no address field exists |
| T04 | Scraping of provider contact data | projection carries no contact fields; contact happens in end-to-end encrypted F08 threads after a quote request |

**Abuse controls**
- Local rate limit of 30 offering writes per hour per vault to protect storage and relay quota.
- Relays apply their own upload quotas and hosting policy; receivers may hide a provider locally and subscribe to signed advisory feeds.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-029-09.T09 | abuse | PS-029-07.R01, PS-029-07.R02 | public read of published offering with credential evidence | no evidence reference and no cell finer than L2 in payload |
| TEST-PS-029-09.T10 | abuse | PS-029-07.R03 | 31 offering writes in one hour in one vault | 31st returns RATE_LIMITED |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M03, F18.S01.M03, F09.S03.M01, F06.S02.M01, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
