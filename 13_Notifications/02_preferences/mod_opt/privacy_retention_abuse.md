# PS-107-07 — Privacy, retention and abuse: Channel opt-in/opt-out

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M03 Channel opt-in/opt-out](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/opt` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-107-07.R01** Consent records contain DID, relay and channel only; no address, endpoint or content is part of the consent.
- **PS-107-07.R02** Consent evidence is retained under RET-EVIDENCE and unsubscribe tokens are stored only as hashes and never logged.
- **PS-107-07.R03** Dark patterns are prevented by defaults of not enabled, plain wording, one-click withdrawal and no re-prompt for 30 days after a refusal.

## Specification

**Data classification**
- ChannelConsent: P2 evidence in the vault and at the sending relay.
- Unsubscribe token: P3 secret, stored as SHA-256 hash at the relay.

**Retention**
- Consent records: RET-EVIDENCE; withdrawn and expired records remain as evidence.
- Unsubscribe token hashes: deleted when the consent ends.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Third party unsubscribes someone by guessing tokens | 256-bit random tokens, constant-time compare, 10 calls per minute per IP, NOT_FOUND detail-free |
| T02 | Relay sends without consent | the send path requires a verified granted statement; tests assert refusal and the relay operator is told by the specification that sending without consent breaches the hosting policy |
| T03 | Forged opt-in for another user | statement signature must verify against that user's device keys |
| T04 | Consent fatigue and coercion | not enabled by default, 30-day quiet period after refusal, annual reconfirmation, no feature gated on consent |
| T05 | Unsubscribe link leaked in a forwarded email | token only withdraws, never grants; Undo requires the app |

**Abuse controls**
- Rate limits of 20 changes per day per user and relay and 10 unsubscribe calls per minute per IP.
- Relay operators can block abusive registrants on that relay only.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-107-09.T08 | abuse | PS-107-07.R01, PS-107-07.R03 | 11th unsubscribe in a minute; token guessing run of 10 000 attempts; inspect logs | RATE_LIMITED, no success, no tokens in logs |
| TEST-PS-107-09.T09 | integration | PS-107-07.R02, PS-107-06.R01 | dispatch with no consent, with withdrawn consent and with expired consent | relay sends nothing in each case |

## Dependencies

Module depends on: F10.S01.M01, F07.S01.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
