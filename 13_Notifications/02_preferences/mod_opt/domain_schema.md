# PS-107-01 — Domain schema: Channel opt-in/opt-out

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M03 Channel opt-in/opt-out](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/opt` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-107-01.R01** A vault ChannelConsent stores user DID, relay (canonical self-certifying relayId with the hostname as display hint), channel (push or email), status, the required linked F10 privacy consent ID and purpose, the signed statement CID, grant and withdrawal claims, the withdrawal path and the expiry, with tenant and revision per CTR-ID-001.
- **PS-107-01.R02** The consent is P2 evidence held in the vault and registered at the sending relay as a relay registration record, retained under RET-EVIDENCE, and a new grant after withdrawal or expiry creates a new record instead of reviving the old one.
- **PS-107-01.R03** One-click unsubscribe tokens are derived as base64url(HMAC-SHA256(relayUnsubscribeKey, consentId || channel)), recomputed for each email and verified in constant time without being stored, and a redeemed marker is kept for 365 days after withdrawal.
- **PS-107-01.R04** The statements have their own schemas distinct from the record schemas - classrup.notify.channel_consent_statement/v1 and classrup.notify.channel_withdrawal/v1 signed by a device key of the principal and addressed to one relay, and classrup.notify.channel_withdrawal_receipt/v1 signed by the relay key for withdrawals made at the relay (CTR-SCH-001 SCH-1).
- **PS-107-01.R05** The vault record classrup.notify.channel_consent/v1, its statement classrup.notify.channel_consent_statement/v1 and the relay registration all carry the mandatory privacyConsentId and privacyPurpose (the F10 purpose, notify_email or notify_push), so the channel consent statement is the single relay-facing artifact for notification consent and F10.S01.M01 sends no statement of its own for these purposes.

## Specification

### ChannelConsent

Schema `classrup.notify.channel_consent/v1` · storage **device** · privacy **P2** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — consentId, primary key |
| vaultId | uuidv7 — local vault scope (CTR-ID-001 tenant slot) |
| userDid | did:key — principal who consents |
| relayId | string — canonical self-certifying relayId (F15.S02.M01) derived from the relay's genesis key |
| relayHost | string — hostname display hint, never used for matching |
| relayKeyId | string — relay key ('<relayId>#k<seq>') pinned when the consent was granted |
| channel | enum — push \| email |
| status | enum — granted \| withdrawn \| expired |
| privacyConsentId | uuidv7 — mandatory; F10.S01.M01 PrivacyConsent of the matching purpose for relayId; re-linked on supersession |
| privacyPurpose | enum — mandatory F10 purpose notify_push \| notify_email; push requires notify_push and email requires notify_email |
| grantedAtClaim | timestamp — user clock, a claim |
| withdrawnAtClaim? | timestamp — claim set on withdrawal |
| via? | enum — settings \| unsubscribe_link \| privacy_withdrawal \| account_deletion \| relay_policy \| expired |
| expiresAt | timestamp — grantedAtClaim + 365 days |
| statementCid | string — cid of the signed classrup.notify.channel_consent_statement/v1 |
| withdrawalCid? | string — cid of the signed classrup.notify.channel_withdrawal/v1 |
| receiptCid? | string — cid of an applied classrup.notify.channel_withdrawal_receipt/v1 |
| syncState | enum — local_committed \| prepared \| transport_acknowledged \| peer_accepted |
| acceptanceSig? | bytes — relay signature over statementCid after verification, evidence for peer_accepted |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- At most one granted record per (userDid, relayId, channel).
- privacyPurpose matches channel and privacyConsentId refers to a consent of that purpose whose scope.relayId equals relayId.
- syncState peer_accepted implies acceptanceSig verifies against relayKeyId or its successor in the relay key chain.

### ChannelConsent

Schema `classrup.notify.channel_consent_registration/v1` · storage **relay** · privacy **P2** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — relay tenant scope |
| consentId | uuidv7 — from the statement |
| userDid | did:key — statement author |
| signerKeyId | string — device key that signed the statement |
| channel | enum — push \| email |
| status | enum — granted \| withdrawn \| expired |
| privacyConsentId | uuidv7 — mandatory F10 consent ID as stated; opaque to the relay, which never interprets it |
| privacyPurpose | enum — mandatory F10 purpose notify_push \| notify_email, as stated |
| statementCid | string — verified consent statement cid |
| expiresAt | timestamp — from the statement, at most 365 days after grant |
| relayRegisteredAt | timestamp — relay clock, evidence of that relay clock only |
| withdrawalCid? | string — principal withdrawal statement cid |
| receiptCid? | string — relay-signed withdrawal receipt cid |
| via? | enum — settings \| unsubscribe_link \| privacy_withdrawal \| account_deletion \| relay_policy \| expired |
| changeSeq? | int — position of the receipt in the user's change feed at this relay |
| unsubscribeRedeemedAt? | timestamp — marker kept 365 days after withdrawal |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- At most one granted registration per (userDid, channel) at this relay.
- status granted implies the statement verified against a device key of userDid active per F16.S02.M02 and expiresAt is in the future.
- A relay never sends on a channel unless it holds a granted, unexpired registration for that user and channel.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-107-09.T01 | unit | PS-107-01.R01, PS-107-01.R02, PS-107-02.R01 | opt in to push on R, withdraw, then re-grant | first record withdrawn terminal; re-grant creates a new record; statement signed and carries privacyConsentId, privacyPurpose and relayKeyId |
| TEST-PS-107-09.T02 | unit | PS-107-02.R03, PS-107-02.R02, PS-107-01.R03 | each rule V01 to V09 violated in turn including email on R2, a token that does not verify, and a reused valid token | documented error code returned; the reused token returns 200 withdrawn unchanged; state unchanged otherwise |
| TEST-PS-107-09.T04 | contract | PS-107-04.R01, PS-107-04.R02, PS-107-09.R02, PS-107-01.R04 | each command and query executes in its environment | outputs, statements, receipts and event payloads validate against registry schemas; statement schemas differ from the record schemas; relay events in the SQLite transaction of the change |
| TEST-PS-107-09.T19 | contract | PS-107-01.R05, PS-107-04.R04 | opt in to email at R; register a statement lacking privacyConsentId, one lacking privacyPurpose and a valid one; capture all relay-bound traffic | record, statement and registration carry privacyConsentId and privacyPurpose notify_email; incomplete statements refused at the relay; the only relay-facing consent artifact is classrup.notify.channel_consent_statement/v1 and no F10 statement is sent |

## Dependencies

Module depends on: F10.S01.M01, F07.S01.M01, F07.S02.M01, F11.S01.M01, F11.S03.M01, F15.S01.M01, F15.S02.M01, F16.S02.M02, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [module SPEC](SPEC.md).
