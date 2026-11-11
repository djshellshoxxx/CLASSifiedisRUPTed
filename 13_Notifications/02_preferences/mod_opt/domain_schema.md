# PS-107-01 — Domain schema: Channel opt-in/opt-out

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M03 Channel opt-in/opt-out](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/opt` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-107-01.R01** A ChannelConsent stores user DID, relay, channel (push or email), status, the linked F10 privacy consent ID, the signed statement CID, grant and withdrawal claims and the expiry, with tenant and revision per CTR-ID-001.
- **PS-107-01.R02** The consent is P2 evidence held in the vault and mirrored at the sending relay, retained under RET-EVIDENCE, and a new grant after withdrawal or expiry creates a new record instead of reviving the old one.
- **PS-107-01.R03** Unsubscribe tokens are 256-bit random values stored only as SHA-256 hashes at the relay and are scoped to one user, relay and channel.

## Specification

### ChannelConsent

Schema `classrup.notify.channel_consent/v1` · storage **relay+device** · privacy **P2** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — tenant scope |
| userDid | did:key — principal who consents |
| relayId | string — hostname identity of the relay that will send |
| channel | enum — push \| email |
| status | enum — granted \| withdrawn \| expired |
| privacyConsentId? | uuidv7 — ref F10.S01.M01 PrivacyConsent for the notifications purpose |
| grantedAtClaim | timestamp — user clock, a claim |
| relayRegisteredAt? | timestamp — relay clock when it accepted the statement, evidence of that relay clock only |
| withdrawnAtClaim? | timestamp — claim set on withdrawal |
| withdrawnVia? | enum — settings \| unsubscribe_link \| privacy_withdrawal \| account_deletion \| relay_policy |
| expiresAt | timestamp — grantedAtClaim + 365 days |
| statementCid | string — sha256 cid of the signed consent statement |
| unsubscribeTokenHash? | bytes — relay only, SHA-256 of the 256-bit token |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- At most one granted record per (userDid, relayId, channel).
- status granted implies the statement signature verified against a device key of userDid and expiresAt is in the future.
- A relay never sends on a channel unless it holds a granted, unexpired record whose statementCid it verified.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-107-09.T01 | unit | PS-107-01.R01, PS-107-01.R02, PS-107-02.R01 | opt in to push on R and withdraw then re-grant | first record withdrawn terminal; re-grant creates a new record; statement signed |
| TEST-PS-107-09.T02 | unit | PS-107-01.R03, PS-107-02.R02, PS-107-02.R03 | each rule V01 to V07 violated in turn including email on R2 and token reuse | documented error code returned and state unchanged |

## Dependencies

Module depends on: F10.S01.M01, F07.S01.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [module SPEC](SPEC.md).
