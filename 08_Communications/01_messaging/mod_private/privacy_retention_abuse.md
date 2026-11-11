# PS-060-07 — Privacy, retention and abuse: Private messages

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S01.M01 Private messages](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/messaging/private` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-060-07.R01** The relay stores ciphertext and routing metadata only; plaintext, message keys and private keys never leave vaults, and relay logs never contain blobs or plaintext.
- **PS-060-07.R02** Honest limits are shown to users and documented, namely no forward secrecy in the MVP, the relay sees sender DID, recipient mailbox, times and padded sizes, and a stolen unlocked device exposes its history.
- **PS-060-07.R03** Abuse handling works without relay decryption through local blocking, receiver-side caps on message requests, relay-enforced put proofs and per-mailbox quotas, and user-initiated reports that carry plaintext and the message key from the reporter's vault so the reviewer can check the key commitment; limits enforced only in the sender's vault are UX guards.
- **PS-060-07.R04** Privacy duties (N6): fields are classified per F10.S02.M02, ExportSectionPort, DeletionPort and RetentionPurgePort are registered with F10, and deletion signs remote delete requests and closes the user's mailboxes before the keys are destroyed.

## Specification

**Data classification**
- Message plaintext and keys: P2 plaintext and P4 keys, vault only.
- MailboxEnvelope ciphertext: P2, opaque to the relay; routing metadata (senderDid, mailboxId, size, receivedAt, senderClass) visible to the relay operator.
- Mailbox registration (owner DID, device key IDs, salted contact hashes, push target): P2 relay configuration visible to that relay's operator; the salt prevents reading the contact list without guessing DIDs.
- MessageReceipt: P2, visible to sender and recipient.

**Retention**
- Relay mailbox envelopes: deleted on acknowledgement or 30 days after receipt (RET-SHORT); a closed mailbox purges its envelopes immediately.
- Vault messages: RET-STANDARD, local purge 30 days after thread archive unless kept; deletion tombstone retains id, device and seq.
- Receipts: RET-SHORT (30 days).
- Put nonces: RET-EPHEMERAL (24 h).

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Relay operator or intruder reads message content | content is ciphertext with per-message keys wrapped to recipient devices; relay holds no private keys |
| T02 | Relay operator maps social graph from metadata | not prevented in MVP and disclosed in the encryption info sheet; padding to 256-byte buckets hides exact lengths; users may choose a relay they self-host |
| T03 | Compromised device key reveals past messages | no forward secrecy in MVP and disclosed; users can revoke a device and delete messages; Future double ratchet |
| T04 | Attacker injects messages impersonating a participant | inbound requires a valid Ed25519 envelope signature by an active device key of the participant (F16.S02.M02) and AEAD additional data binds thread, message and sender device |
| T05 | Message flooding or harassment | vault block list drops envelopes, unknown senders land in message requests capped at 5 per DID and 100 in total, relay limits 120 puts per hour per mailbox and proven sender DID; the 60 per minute vault limit is only a UX guard |
| T06 | Replay of an old envelope into another thread | additional data includes threadId and messageId so decryption fails elsewhere, deduplication on messageId drops replays, and put nonces are single use |
| T07 | Mailbox ID harvested and used to fill the mailbox | puts need a proof by the sender's device key, unknown senders share 200 puts per day and 20 % of capacity per mailbox, the 1 000 envelope and 20 MiB cap holds, and the owner rotates the mailbox ID with comms.mailbox.rotate and publishes the new one in a signed profile statement |
| T08 | Multi-key ciphertext: a sender crafts one signed ciphertext that decrypts differently for different recipients, or an abuse report cannot be checked | the key commitment inside the signed statement is checked before acceptance; reports carry K so the reviewer confirms Dec(K, C) = P and the commitment |
| T09 | Sybil senders: many fresh did:keys flood a publicly advertised mailbox | put proof per sender DID, aggregate unknown-sender quota per mailbox, 80 % of capacity reserved for contacts, receiver-side caps on message requests |

**Abuse controls**
- Report message action attaches the decrypted text, the message key K and the signed envelope to a report for the relay operator or local advisory feed only after the reporter confirms; the signature proves the sender key signed it and the commitment proves which plaintext, not that the content is true.
- Relay-local hosting policy can refuse puts from a sender DID or remove envelopes; no global takedown is claimed.
- Sender-side limits in the vault are labelled UX guards; enforcement relies on relay quotas (RateLimitPort, F12.S03.M03) and receiving-vault caps.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-060-09.T11 | abuse | PS-060-07.R01, PS-060-07.R03 | inspect relay database, logs and metrics after 1 000 messages; report a message | no plaintext or keys present; report contains plaintext and K only after confirmation |
| TEST-PS-060-09.T20 | abuse | PS-060-02.R04, PS-060-07.R03 | A sends the crafted two-key ciphertext to B and C; C reports it | at least one recipient quarantines with commitment_mismatch; the report with K lets the reviewer verify Dec(K, C) and the commitment |
| TEST-PS-060-09.T23 | integration | PS-060-04.R06, PS-060-07.R04 | account deletion of A with messages and two mailboxes | DeletionPort.execute signs delete requests and closes both mailboxes before keys are destroyed; privacy.deletion.completed finds nothing left to sign; export section comms.messages present before deletion |
| TEST-PS-060-09.T24 | unit | PS-060-07.R02 | render the encryption info sheet in en and de | text states no forward secrecy, relay-visible metadata (sender DID, mailbox, times, padded sizes), stolen device exposes history and deletion cannot recall copies |

## Dependencies

Module depends on: F08.S01.M02, F07.S01.M01, F07.S02.M02, F16.S02.M02, F16.S02.M03, F11.S01.M01, F11.S02.M01, F15.S01.M01, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FED-001, CTR-IOX-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
