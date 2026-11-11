# PS-107-02 — Validation rules: Channel opt-in/opt-out

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M03 Channel opt-in/opt-out](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/opt` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-107-02.R01** Opt-in statements are validated for signer key status, channel, audience relay key, linked privacy consent and expiry before the relay registers them.
- **PS-107-02.R02** Unsubscribe tokens are validated by recomputing the HMAC and comparing in constant time; an unknown token returns NOTIFY_UNSUBSCRIBE_TOKEN_INVALID and a reused token returns the unchanged result.
- **PS-107-02.R03** Every violation maps to one stable error code.
- **PS-107-02.R04** The linked privacy consent is required - privacyPurpose must match the channel (push to notify_push, email to notify_email), relayId must equal the consent scope, and opt_in calls privacy.consent.check for that purpose and relay, while the relay relies only on the registered channel consent because privacy.consent.check is vault in-process only.
- **PS-107-02.R05** The opt-in order is fixed as opt_in, then register at the relay with its acceptance, then notify.push.enable or notify.email.enable, which refuse without a registered granted consent.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | channel is push or email and the relay advertises that channel in its capability list | NOTIFY_CHANNEL_UNSUPPORTED |
| V02 | the statement signature verifies against a device key of userDid that F16.S02.M02 reports active at receipt time, payload relayId equals the receiving relay's canonical relayId, the audience relay key is the relay's current key or its previous key within the 7-day rotation overlap, and seq and prev extend the author's chain at this relay | VALIDATION_FAILED |
| V03 | notify.push.subscribe and notify.email.add are accepted only for a consent that this relay registered and accepted; the vault calls enable only after the acceptance | PRECONDITION_FAILED |
| V04 | privacyConsentId and privacyPurpose are present in the record and in the statement (a statement without either is refused at the relay), the purpose matches the channel, and in the vault privacy.consent.check {purpose, relayId} returns granted at opt_in | PRECONDITION_FAILED |
| V05 | the unsubscribe token equals the HMAC recomputed for a consent registered at this relay under the current or a retained previous unsubscribe key, compared in constant time | NOTIFY_UNSUBSCRIBE_TOKEN_INVALID |
| V06 | RateLimitPort.consume (F12.S03.M03) allows at most 20 grants per day per user and relay; withdrawals are never limited | RATE_LIMITED |
| V07 | a relay accepts at most 10 unsubscribe calls per minute per IP prefix through RateLimitPort | RATE_LIMITED |
| V08 | apply_relay_change accepts a receipt only when it is signed by the key chain of the relay where the named consent was registered (current key, or previous key within the 7-day overlap) and names that consent's statementCid | NOTIFY_CHANNEL_RECEIPT_INVALID |
| V09 | register and list_changes requests are signed (classrup/relay-request/v1) by a device key of userDid active per F16.S02.M02 at receipt time | UNAUTHENTICATED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-107-09.T01 | unit | PS-107-01.R01, PS-107-01.R02, PS-107-02.R01 | opt in to push on R, withdraw, then re-grant | first record withdrawn terminal; re-grant creates a new record; statement signed and carries privacyConsentId, privacyPurpose and relayKeyId |
| TEST-PS-107-09.T02 | unit | PS-107-02.R03, PS-107-02.R02, PS-107-01.R03 | each rule V01 to V09 violated in turn including email on R2, a token that does not verify, and a reused valid token | documented error code returned; the reused token returns 200 withdrawn unchanged; state unchanged otherwise |
| TEST-PS-107-09.T05 | integration | PS-107-04.R03, PS-107-02.R04 | privacy.consent.withdrawn for notify_email at R; privacy.consent.granted superseding PC1 then withdrawn | only email at R withdrawn with via privacy_withdrawal; push consent re-linked to the new F10 ID and withdrawn when the new grant is withdrawn |
| TEST-PS-107-09.T14 | abuse | PS-107-04.R04, PS-107-02.R01, PS-107-07.R04 | withdrawal receipt signed by relay B for a consent at R; receipt signed by a user device key; consent statement whose audience key is not R's key; R rotated to k2 and signs with k2 within 7 days and with k1 after 8 days | B's and the device-signed receipts refused NOTIFY_CHANNEL_RECEIPT_INVALID; wrong audience refused VALIDATION_FAILED; k2 accepted; stale k1 refused |
| TEST-PS-107-09.T15 | integration | PS-107-02.R05, PS-107-04.R05 | enable push before the registration is accepted; then after acceptance; email module renders a List-Unsubscribe URL and a complaint arrives | push enable refused PRECONDITION_FAILED then accepted; UnsubscribeTokenPort URL verifies; complaint withdraws through RelayWithdrawalPort with via unsubscribe_link |

## Dependencies

Module depends on: F10.S01.M01, F07.S01.M01, F07.S02.M01, F11.S01.M01, F11.S03.M01, F15.S01.M01, F15.S02.M01, F16.S02.M02, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
