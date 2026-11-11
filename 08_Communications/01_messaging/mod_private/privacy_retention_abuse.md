# PS-060-07 — Privacy, retention and abuse: Private messages

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S01.M01 Private messages](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/messaging/private` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-060-07.R01** The relay stores ciphertext and routing metadata only; plaintext, message keys and private keys never leave vaults, and relay logs never contain blobs or plaintext.
- **PS-060-07.R02** Honest limits are shown to users and documented, namely no forward secrecy in the MVP, the relay sees recipient mailbox IDs, times, padded sizes and the per-relay request key of each put (which links puts by one sender on that relay, not to a DID), and a stolen unlocked device exposes its history.
- **PS-060-07.R03** Abuse handling works without relay decryption through local blocking, receiver-side caps on message requests, relay-enforced request signatures with per-mailbox, per-key and new-recipient quotas, and user-initiated reports that carry plaintext and the message key from the reporter's vault so the reviewer can check the key commitment; limits enforced only in the sender's vault are UX guards.
- **PS-060-07.R04** Privacy duties (N6, N6a): fields are classified per F10.S02.M02, ExportSectionPort, DeletionPort and RetentionPurgePort are registered with F10, and the DeletionPort sign step signs remote delete requests and the closes of the user's mailboxes before any key is destroyed.
- **PS-060-07.R05** Sealed sender and linkability limits (PRV-5, PT-15): stored wrappers carry no sender identifier, the relay keeps request-key first-put rows for 30 days only for the new-recipient limit, request keys differ per relay, and own mailbox IDs differ per relay and rotate every 30 days; the residual linkability of one did:key per principal is disclosed.

## Specification

**Data classification**
- Message plaintext and keys: P2 plaintext and P4 keys, vault only.
- MailboxEnvelope: sealed wrapper ciphertext P2, opaque to the relay; mailboxId, size, sentAt, receivedAt, digest and senderClass visible to the relay operator; no sender DID or request key is stored with it.
- Mailbox registration (owner DID, device key IDs, salted hashes of contacts' request keys, push target): P2 relay configuration visible to that relay's operator; the salt prevents reading the contact list without guessing keys.
- Request-key first-put rows (hash of the request key, mailboxId, first put time): P2 relay bookkeeping for the new-recipient limit, RET-SHORT 30 days.
- Own mailbox rows in the vault (relayId, mailboxId, rotation times) and per-relay request keys: P2 rows and P4 private request keys; the current mailboxId is deliberately published as a listing hint.
- MessageReceipt: P2, visible to sender and recipient.

**Retention**
- Relay mailbox envelopes: deleted on acknowledgement or 30 days after receipt (RET-SHORT); a closed mailbox purges its envelopes immediately.
- Vault messages: RET-STANDARD, local purge 30 days after thread archive unless kept; deletion tombstone retains id, device and seq.
- Receipts: RET-SHORT (30 days).
- Request (keyid, nonce) pairs: RET-EPHEMERAL (600 s).
- Request-key first-put rows: RET-SHORT (30 days).

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Relay operator or intruder reads message content | content is ciphertext with per-message keys wrapped to recipient devices; relay holds no private keys |
| T02 | Relay operator maps social graph from metadata | sealed wrappers carry no sender identifier and request keys differ per relay; the relay can still link puts by one request key to mailboxes on that relay and see timing, which is disclosed in the encryption info sheet; padding to 256-byte buckets hides exact lengths; users may choose a relay they self-host |
| T03 | Compromised device key reveals past messages | no forward secrecy in MVP and disclosed; users can revoke a device and delete messages; Future double ratchet |
| T04 | Attacker injects messages impersonating a participant | inbound requires a valid Ed25519 envelope signature by an active device key of the participant (F16.S02.M02) and AEAD additional data binds thread, message and sender device |
| T05 | Message flooding or harassment | vault block list drops chat envelopes, unknown senders land in message requests capped at 5 per DID and 100 in total, relay limits 120 puts per hour per mailbox and request key plus new_mailbox_recipients_per_day per request key; the 60 per minute vault limit is only a UX guard |
| T06 | Replay of an old envelope into another thread | additional data includes threadId and messageId so decryption fails elsewhere, deduplication on messageId in the vault and on (mailboxId, digest) at the relay drops replays, and (keyid, nonce) pairs of put requests are single use within 600 s |
| T07 | Mailbox ID harvested and used to fill the mailbox | puts need an RFC 9421 request signature, unknown request keys share 200 puts per day and 20 % of capacity per mailbox, the 1 000 envelope and tenant byte caps hold, own mailbox IDs rotate every 30 days, and the owner can rotate at once with comms.mailbox.rotate and publish the new ID in a signed profile statement |
| T08 | Multi-key ciphertext: a sender crafts one signed ciphertext that decrypts differently for different recipients, or an abuse report cannot be checked | the key commitment inside the signed statement is checked before acceptance; reports carry K so the reviewer confirms Dec(K, C) = P and the commitment |
| T09 | Sybil senders: many fresh request keys flood a publicly advertised mailbox | aggregate unknown-key quota per mailbox, new_mailbox_recipients_per_day per request key (F12.S03.M04), 80 % of capacity reserved for contacts, receiver-side caps on message requests |
| T10 | A relay or mailbox hint substitutes an agreement key to read sealed wrappers or messages | agreement keys are derived only with F16.S02.M01 agreementPublicKeyOf from Ed25519 device keys listed active in the root-signed identity document; hint keys are refused with SECURITY_AGREEMENT_KEY_UNBOUND |
| T11 | Cross-relay linking of one principal through mailbox IDs (PT-15) | distinct mailbox IDs and request keys per relay and mailbox IDs rotated every 30 days; residual linkability through the one did:key per principal is disclosed (F10.S02.M01) |

**Abuse controls**
- Report message action attaches the decrypted text, the message key K and the signed envelope to a report for the relay operator or local advisory feed only after the reporter confirms; the signature proves the sender key signed it and the commitment proves which plaintext, not that the content is true.
- Relay-local hosting policy can refuse puts from a request key or remove envelopes; no global takedown is claimed, and a sender DID is never visible to the relay to refuse.
- Sender-side limits in the vault are labelled UX guards; enforcement relies on relay quotas (RateLimitPort, F12.S03.M03), the new-recipient limit (F12.S03.M04) and receiving-vault caps.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-060-09.T11 | abuse | PS-060-07.R01, PS-060-07.R03 | inspect relay database, logs and metrics after 1 000 messages; report a message | no plaintext or keys present; report contains plaintext and K only after confirmation |
| TEST-PS-060-09.T20 | abuse | PS-060-02.R04, PS-060-07.R03 | A sends the crafted two-key ciphertext to B and C; C reports it | at least one recipient quarantines with commitment_mismatch; the report with K lets the reviewer verify Dec(K, C) and the commitment |
| TEST-PS-060-09.T23 | integration | PS-060-04.R06, PS-060-07.R04, PS-060-06.R05 | account deletion of A with messages and two mailboxes, once online and once with the device offline until after destroy_keys | the sign step signs the delete requests and two classrup.comms.mailbox_close/v1 before revoke_keys; offline, the residue outbox later delivers them with A's request keys and both relays close the mailboxes; privacy.deletion.completed signs nothing and calls no relay; export section comms.messages present before deletion |
| TEST-PS-060-09.T24 | unit | PS-060-07.R02 | render the encryption info sheet in en and de | text states no forward secrecy, relay-visible metadata (mailbox ID, times, padded sizes and the per-relay request key, but no sender DID), stolen device exposes history and deletion cannot recall copies |
| TEST-PS-060-09.T26 | abuse | PS-060-01.R07, PS-060-04.R07, PS-060-07.R05 | A sends B a message and F11.S02.M01 routes a rental statement for B through the MailboxPort; inspect the put requests, the stored wrappers, relay tables and logs | each put carried an RFC 9421 signature by A's request key for that relay covering content-digest; each wrapper holds only {v, mailboxId, ciphertext, size, sentAt} plus bookkeeping with no sender DID, request key, type, seq or message ID; B's MailboxPort.fetch unseals both and F11.S01.M02 receive routes the message to this module and the rental statement to its F05 owner |

## Dependencies

Module depends on: F08.S01.M02, F07.S01.M01, F07.S02.M01, F07.S02.M02, F16.S02.M01, F16.S02.M02, F16.S02.M03, F11.S01.M01, F11.S01.M02, F11.S01.M03, F11.S02.M01, F15.S01.M01, F15.S02.M01, F15.S04.M03, F12.S03.M03, F12.S03.M04, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FED-001, CTR-IOX-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
