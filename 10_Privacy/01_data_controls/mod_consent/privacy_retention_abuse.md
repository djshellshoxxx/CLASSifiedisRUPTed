# PS-076-07 — Privacy, retention and abuse: Privacy consent

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S01.M01 Privacy consent](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/data_controls/consent` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-076-07.R01** Consent records are P3 and never leave the vault except as the signed federation statements to the named relay and the user's own export.
- **PS-076-07.R02** Consent is never pre-ticked, bundled or inferred, and each purpose is a separate decision with its own text.
- **PS-076-07.R03** The UI states the limits of withdrawal, namely that future processing stops, copies already fetched by other vaults and relays cannot be recalled.

## Specification

**Data classification**
- PrivacyConsent: P3 in the vault. classrup.privacy.consent_statement/v1 and classrup.privacy.consent_withdrawal/v1: P2 for the named relay only, fields exactly as listed in the note, did only as envelope author, sealed to that relay. Relay copy of verified statements: kept while the grant is active and RET-EVIDENCE after withdrawal.
- chain_lookup consents: P3 in the vault like every other consent; the endpoint origin is never sent anywhere by this module, and the lookups the grant permits are made by F09.S01.M03 without DID, signature or relay access token.

**Retention**
- RET-EVIDENCE (2 years after withdrawal) as proof of consent; deletable earlier on account deletion; relay legal holds (F10.S01.M02) apply only to the signed consent statements that relay holds, never to vault records.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Dark pattern obtains consent by default | all purposes off by default, no pre-ticked controls, separate text per purpose, tested by a UI test |
| T02 | Module processes without checking consent | single check function, lint rule requiring a check call in code paths tagged with a purpose, integration tests per consumer |
| T03 | Relay keeps indexing after withdrawal | signed withdrawal statement naming the grant cid, relay federation consults privacy.consent.relay_check, relay obligation to honour tombstones (PRV-6), UI states copies cannot be recalled |
| T04 | Consent replay, forgery or cross-relay reuse toward a relay | statements signed over JCS with Ed25519 by a registered, non-revoked key, audience relayId bound in the payload, per-author seq and prev, relays dedupe by cid and refuse a grant whose cid already has a withdrawal (V08 to V10) |
| T05 | Withdrawal blocked during an unsubscribe or deletion burst | withdrawal is never rate limited and always commits locally; outgoing statements are coalesced per relay instead of limited |
| T06 | Two notification consent mechanisms disagree | one relay-facing artifact per purpose: F13 channel consent for notify_email and notify_push, the F10 statement for federation_publish |
| T07 | A chain verifier learns the user's addresses and txids without an informed choice, or a consent for one endpoint is reused for another | chain_lookup is off by default, scoped to one exact HTTPS origin, checked fail closed before every lookup, and refused with PRIVACY_CONSENT_REQUIRED for any other origin |
| T08 | A consent for one relay is applied to another relay that reuses its hostname | relay scopes use the canonical self-certifying relayId of F15.S02.M01, so a new relay identity behind the same hostname has a different relayId and is not granted |

**Abuse controls**
- Grants limited to 30 per hour per vault; withdrawals are never limited; a relay accepts at most 20 grant statements per hour per did and always accepts withdrawals, which arrive coalesced per relay.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-076-09.T12 | abuse | PS-076-07.R02, PS-076-07.R03 | 31 grants in an hour; UI inspection of the grant sheet | 31st grant RATE_LIMITED; no pre-ticked control; limits of withdrawal stated |
| TEST-PS-076-09.T14 | a11y | PS-076-07.R02 | privacy settings and grant sheet | axe zero serious issues; keyboard-only completion; switches announced |
| TEST-PS-076-09.T17 | contract | PS-076-01.R03, PS-076-01.R04, PS-076-07.R01 | capture every byte leaving the vault through network and relay doubles during grant, withdraw, lapse, deletion step and export | the only consent data leaving the vault are consent_statement and consent_withdrawal envelopes whose payload has exactly the allowlisted fields with the did only as envelope author, plus the user's export; no PrivacyConsent row leaves the vault |

## Dependencies

Module depends on: F07.S01.M01, F11.S01.M01, F15.S01.M01, F15.S02.M01, F16.S02.M02, F12.S03.M03, F10.S02.M02, F10.S01.M02, F10.S01.M03, F10.S01.M04, CTR-PRV-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
