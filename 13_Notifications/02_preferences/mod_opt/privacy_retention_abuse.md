# PS-107-07 — Privacy, retention and abuse: Channel opt-in/opt-out

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M03 Channel opt-in/opt-out](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/opt` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-107-07.R01** Consent records contain DID, relay and channel only; no address, endpoint or content is part of the consent.
- **PS-107-07.R02** Consent evidence is retained under RET-EVIDENCE, unsubscribe tokens are never stored or logged, and redeemed markers are kept 365 days after withdrawal.
- **PS-107-07.R03** Dark patterns are prevented by defaults of not enabled, plain wording, one-click withdrawal and no re-prompt for 30 days after a refusal.
- **PS-107-07.R04** Consent statements name the relay by its self-certifying key-derived relayId and pinned key, so whoever controls the hostname later cannot inherit consents, and relay acceptances and withdrawal receipts are verified against that relay's key chain.

## Specification

**Data classification**
- ChannelConsent vault record: P2 evidence in the vault.
- ChannelConsent relay registration: P2 for the named relay only (statements sealed to that relay); kept as evidence.
- Unsubscribe token: derived on demand, never stored; redeemed marker only.

**Retention**
- Consent records and registrations: RET-EVIDENCE; withdrawn and expired records remain as evidence and are pseudonymized at deletion when kept.
- Redeemed unsubscribe markers: 365 days after withdrawal.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Third party unsubscribes someone by guessing tokens | 256-bit HMAC tokens bound to consentId and channel, constant-time compare, 10 calls per minute per IP prefix, detail-free NOTIFY_UNSUBSCRIBE_TOKEN_INVALID |
| T02 | Relay sends without consent | the send path requires a granted registered consent; tests assert refusal and the relay operator is told by the specification that sending without consent breaches the hosting policy |
| T03 | Forged opt-in for another user or by a revoked key | statement signature must verify against an active device key of that user per F16.S02.M02 |
| T04 | Consent fatigue and coercion | not enabled by default, 30-day quiet period after refusal, annual reconfirmation, no feature gated on consent |
| T05 | Unsubscribe link leaked in a forwarded email | token only withdraws, never grants; Undo requires the app |
| T06 | Domain transfer lets a new operator inherit consents | relayId derived from the relay genesis key and audience key checked; a hostname match is never enough |
| T07 | Signer-role confusion - relay B signs a withdrawal receipt for a consent at relay A, or a device key signs a receipt | V08 accepts receipts only from the key chain of the registering relay; F11.S01.M01 role check rejects user keys for relay roles |

**Abuse controls**
- Through RateLimitPort (F12.S03.M03): 20 grants per day per user and relay, 10 unsubscribe calls per minute per IP prefix, 60 list_changes calls per hour per user; withdrawals are never limited.
- Relay operators can block abusive registrants on that relay only.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-107-09.T08 | abuse | PS-107-07.R01, PS-107-07.R02 | 11th unsubscribe in a minute; token guessing run of 10 000 attempts; inspect logs and the relay database | RATE_LIMITED, no success, no tokens stored or logged; only redeemed markers, which a fake clock shows purged 365 days after withdrawal |
| TEST-PS-107-09.T14 | abuse | PS-107-04.R04, PS-107-02.R01, PS-107-07.R04 | withdrawal receipt signed by relay B for a consent at R; receipt signed by a user device key; consent statement whose audience key is not R's key; R rotated to k2 and signs with k2 within 7 days and with k1 after 8 days | B's and the device-signed receipts refused NOTIFY_CHANNEL_RECEIPT_INVALID; wrong audience refused VALIDATION_FAILED; k2 accepted; stale k1 refused |
| TEST-PS-107-09.T18 | e2e | PS-107-07.R03, PS-107-07.R01 | fresh vault opens Channels settings and the opt-in sheet, refuses, reopens after 1 and 31 days; inspect the consent record | both channels not enabled by default; sheet text names the relay and what it learns; no re-prompt before 30 days; record holds no address or endpoint |

## Dependencies

Module depends on: F10.S01.M01, F07.S01.M01, F07.S02.M01, F11.S01.M01, F11.S03.M01, F15.S01.M01, F15.S02.M01, F16.S02.M02, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
