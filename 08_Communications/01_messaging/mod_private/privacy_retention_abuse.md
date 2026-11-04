# PS-060-07 — Privacy, retention and abuse: Private messages

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S01.M01 Private messages](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/messaging/private` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-060-07.R01** The relay stores ciphertext and routing metadata only; plaintext, message keys and private keys never leave vaults, and relay logs never contain blobs or plaintext.
- **PS-060-07.R02** Honest limits are shown to users and documented, namely no forward secrecy in the MVP, the relay sees sender DID, recipient mailbox, times and padded sizes, and a stolen unlocked device exposes its history.
- **PS-060-07.R03** Abuse handling works without relay decryption through local blocking, message requests for unknown senders, relay rate limits and user-initiated reports that carry plaintext from the reporter's vault.

## Specification

**Data classification**
- Message plaintext and keys: P2, vault only.
- MailboxEnvelope ciphertext: P2, opaque to the relay; routing metadata (senderDid, mailboxId, size, receivedAt) visible to the relay operator.
- MessageReceipt: P2, visible to sender and recipient.

**Retention**
- Relay mailbox envelopes: deleted on acknowledgement or 30 days after receipt (RET-SHORT).
- Vault messages: RET-STANDARD, local purge 30 days after thread archive unless kept; deletion tombstone retains id and seq.
- Receipts: RET-SHORT (30 days).

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Relay operator or intruder reads message content | content is ciphertext with per-message keys wrapped to recipient devices; relay holds no private keys |
| T02 | Relay operator maps social graph from metadata | not prevented in MVP and disclosed in the encryption info sheet; padding to 256-byte buckets hides exact lengths; users may choose a relay they self-host |
| T03 | Compromised device key reveals past messages | no forward secrecy in MVP and disclosed; users can revoke a device and delete messages; Future double ratchet |
| T04 | Attacker injects messages impersonating a participant | inbound requires a valid Ed25519 envelope signature by a device key of the participant and AEAD additional data binds thread, message and sender device |
| T05 | Message flooding or harassment | vault block list drops envelopes, unknown senders land in message requests, relay limits 120 puts per hour per mailbox and sender DID, vault limits 60 per minute |
| T06 | Replay of an old envelope into another thread | additional data includes threadId and messageId so decryption fails elsewhere, and deduplication on messageId drops replays |
| T07 | Mailbox ID harvested and used to fill the mailbox | per-sender put limit, 1 000 envelope and 20 MiB cap, mailbox owner can rotate the mailbox ID and publish a new one in a signed profile statement |

**Abuse controls**
- Report message action attaches the decrypted text and the signed envelope to a report for the relay operator or local advisory feed only after the reporter confirms; the signature proves the sender key signed it, not that the content is true.
- Relay-local hosting policy can refuse puts from a sender DID or remove envelopes; no global takedown is claimed.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-060-09.T11 | abuse | PS-060-07.R01, PS-060-07.R03 | inspect relay database, logs and metrics after 1 000 messages; report a message | no plaintext or keys present; report contains plaintext only after confirmation |
| TEST-PS-060-09.T12 | abuse | PS-060-07.R02 | 61st send in a minute; 121st put in an hour; blocked recipient | RATE_LIMITED; blocker's vault drops silently and sender sees no error |

## Dependencies

Module depends on: F08.S01.M02, F07.S01.M01, F07.S02.M02, F16.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FED-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
