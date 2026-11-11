# PS-060-02 — Validation rules: Private messages

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S01.M01 Private messages](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/messaging/private` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-060-02.R01** Envelope input is validated strictly against the schema in the vault before signing and again by the receiving vault; sizes, lengths and encodings are checked before any decryption.
- **PS-060-02.R02** Relay mailbox commands validate size, quota and request signatures without reading ciphertext.
- **PS-060-02.R03** Every violation maps to one stable error code with a localized message key.
- **PS-060-02.R04** Inbound acceptance runs the key commitment check, the per-device chain check and the counterparty key status check (F16.S02.M02 security.keyrecord.get_status with its freshness) before a message becomes active.
- **PS-060-02.R05** Limits enforced in the sender's own vault are UX guards that a modified client can skip; the limits that bound abuse are enforced where an attacker cannot skip them, at the relay (put proofs, per-mailbox quotas through RateLimitPort, N18) and in the receiving vault (caps on pending message requests).

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | envelope fields have the exact encodings and lengths of the schema (nonce 24 B, ephemeralPub 32 B, wrappedKey 48 B, keyCommitment 32 B, signature 64 B) | VALIDATION_FAILED |
| V02 | ciphertext length between 17 and 12 288 bytes (plaintext at most 8 192 bytes) and mailbox put body at most 16 384 bytes | PAYLOAD_TOO_LARGE |
| V03 | thread exists in the vault, is active (or superseded less than 7 days ago), and the sender is a current participant | NOT_FOUND |
| V04 | send: the local principal has not blocked the recipient in its own block list (F07.S02.M02 isBlockedEither over local data), and BLOCKED_PARTY is returned only when the actor blocked the other party; receive: envelopes from DIDs the local principal blocked are dropped silently (N7); whether the sender is blocked by someone else is unknown to the sender's vault and never checked | BLOCKED_PARTY |
| V05 | senderSignature verifies (F16.S02.M03) against a device key of senderDid whose F16.S02.M02 status at the verifier receipt time is active; a revoked key quarantines with reason key_revoked, freshness unknown keeps the message active with a stale-key warning | COMMS_MESSAGE_SIGNATURE_INVALID |
| V06 | wrappedKeys contains an entry for at least one device the recipient vault owns; otherwise the message is stored quarantined as undecryptable | COMMS_MESSAGE_NOT_FOR_DEVICE |
| V07 | replyToId, when set, refers to a message of the same thread | VALIDATION_FAILED |
| V08 | delete is requested by the author of the message and the message is not already deleted | FORBIDDEN |
| V09 | UX guard in the sender vault: at most 60 messages per minute and 1 000 per day; enforced at the relay through RateLimitPort (F12.S03.M03): at most 120 puts per hour per mailbox and proven sender DID, at most 200 puts per day per mailbox in aggregate from senders not on the owner's contact list, with 80 % of the mailbox capacity reserved for contacts | RATE_LIMITED |
| V10 | mailbox fetch, ack, rotate and close requests are signed by a device key registered for the mailbox with a timestamp within 120 s of relay time | UNAUTHENTICATED |
| V11 | mailbox put carries a put proof signed by a device key of senderDid (context classrup/relay-request/v1, F16.S02.M03) over (mailboxId, messageId, SHA-256 of blob, nonce), with a nonce unused for 24 h and signedAt within 120 s of relay time; without a valid proof the put is refused | UNAUTHENTICATED |
| V12 | keyCommitment equals HMAC-SHA256(K, 'classrup.comms.msg.commit.v1' + messageId) for the unwrapped K before the plaintext is accepted; on mismatch the message is quarantined with reason commitment_mismatch | COMMS_MESSAGE_COMMITMENT_MISMATCH |
| V13 | receiving vault cap: at most 5 pending message requests per unknown sender DID and 100 in total; further envelopes from unknown senders are acknowledged at the mailbox and dropped without any reply | RATE_LIMITED |
| V14 | a receipt's messageCid equals the stored messageCid and its signer is the recipient of that delivery row | COMMS_MESSAGE_RECEIPT_MISMATCH |
| V15 | per-device chain: seq follows the highest stored seq of (threadId, senderDeviceId) and prev equals that device's previous cid, gaps are buffered 24 h; the same device and seq with a different messageCid is a fork | CONFLICT_STATE |
| V16 | mailbox register is signed by an active device key of ownerDid registered at the relay, lists 1..10 device key IDs and the principal holds at most 3 active mailboxes at this relay | COMMS_MAILBOX_LIMIT |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-060-09.T01 | unit | PS-060-01.R01, PS-060-01.R02, PS-060-01.R04, PS-060-02.R01 | encrypt 8 192-byte plaintext on A1, commit, wrap for A2 and B1, sign, decrypt on B1 | plaintext recovered; envelope fields have exact lengths; key commitment verifies; relay row contains no plaintext; createdAtClaim stored as claim |
| TEST-PS-060-09.T04 | unit | PS-060-02.R02, PS-060-02.R03 | each rule V01 to V16 violated in turn | documented error code returned and nothing stored |
| TEST-PS-060-09.T12 | abuse | PS-060-02.R05, PS-060-05.R01 | 61st send in a minute; B has blocked A and A sends in TH and TG | A sees the UX guard notice; A's vault state, responses and delivery rows equal a control run without the block; B's vault drops silently; C receives the TG message |
| TEST-PS-060-09.T20 | abuse | PS-060-02.R04, PS-060-07.R03 | A sends the crafted two-key ciphertext to B and C; C reports it | at least one recipient quarantines with commitment_mismatch; the report with K lets the reviewer verify Dec(K, C) and the commitment |
| TEST-PS-060-09.T21 | abuse | PS-060-01.R06, PS-060-02.R05, PS-060-05.R02 | 50 freshly generated DIDs with valid proofs flood B's mailbox while A (a contact) keeps sending | unknown senders capped at 200 per day and 20 % capacity; A's puts still succeed; B's vault keeps at most 5 requests per DID and 100 in total |

## Dependencies

Module depends on: F08.S01.M02, F07.S01.M01, F07.S02.M02, F16.S02.M02, F16.S02.M03, F11.S01.M01, F11.S02.M01, F15.S01.M01, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FED-001, CTR-IOX-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
