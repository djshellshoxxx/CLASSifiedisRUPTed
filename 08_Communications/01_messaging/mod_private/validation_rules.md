# PS-060-02 — Validation rules: Private messages

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S01.M01 Private messages](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/messaging/private` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-060-02.R01** Envelope input is validated strictly against the schema in the vault before signing and again by the receiving vault; sizes, lengths and encodings are checked before any decryption.
- **PS-060-02.R02** Relay mailbox commands validate size, quota and request signatures without reading ciphertext.
- **PS-060-02.R03** Every violation maps to one stable error code with a localized message key.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | envelope fields have the exact encodings and lengths of the schema (nonce 24 B, ephemeralPub 32 B, wrappedKey 48 B, signature 64 B) | VALIDATION_FAILED |
| V02 | ciphertext length between 17 and 12 288 bytes (plaintext at most 8 192 bytes) and mailbox put body at most 16 384 bytes | PAYLOAD_TOO_LARGE |
| V03 | thread exists in the vault, is active, and the sender is a current participant | NOT_FOUND |
| V04 | in a one-to-one thread the sender is not blocked by the recipient in the local block list (F07.S02.M02) | BLOCKED_PARTY |
| V05 | senderSignature verifies against a non-revoked Ed25519 device key of senderDid known to the receiving vault | COMMS_MESSAGE_SIGNATURE_INVALID |
| V06 | wrappedKeys contains an entry for at least one device the recipient vault owns; otherwise the message is stored quarantined as undecryptable | COMMS_MESSAGE_NOT_FOR_DEVICE |
| V07 | replyToId, when set, refers to a message of the same thread | VALIDATION_FAILED |
| V08 | delete is requested by the author of the message and the message is not already deleted | FORBIDDEN |
| V09 | a vault sends at most 60 messages per minute and 1 000 per day; a relay accepts at most 120 puts per hour per mailbox from one sender DID | RATE_LIMITED |
| V10 | mailbox fetch and acknowledge requests are signed by a device key registered for the mailbox with a timestamp within 120 s of relay time | UNAUTHENTICATED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-060-09.T01 | unit | PS-060-01.R01, PS-060-01.R02, PS-060-01.R04, PS-060-02.R01 | encrypt 8 192-byte plaintext on A1, wrap for A2 and B1, sign, decrypt on B1 | plaintext recovered; envelope fields have exact lengths; relay row contains no plaintext; createdAtClaim stored as claim |
| TEST-PS-060-09.T04 | unit | PS-060-02.R02, PS-060-02.R03 | each rule V02 to V10 violated in turn | documented error code returned and nothing stored |

## Dependencies

Module depends on: F08.S01.M02, F07.S01.M01, F07.S02.M02, F16.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FED-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
