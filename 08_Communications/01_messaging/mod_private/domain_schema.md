# PS-060-01 — Domain schema: Private messages

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S01.M01 Private messages](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/messaging/private` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-060-01.R01** A Message is a vault record holding plaintext, the signed envelope (nonce, ciphertext, key commitment, signature), the per-recipient wrapped keys, the per-device author chain position (senderDeviceId, seq, prev), the cid of the exact signed envelope and the per-recipient delivery rows, with tenant and revision per CTR-ID-001; plaintext never leaves the vault except inside the encrypted envelope.
- **PS-060-01.R02** Cryptographic construction is fixed for v1 as a random 32-byte message key K encrypting padded plaintext with XChaCha20-Poly1305 (additional data thread ID, message ID, sender device ID), a key commitment HMAC-SHA256(K, 'classrup.comms.msg.commit.v1' || messageId) inside the signed statement, and K wrapped per recipient device by x25519 ECDH with a fresh ephemeral key against the agreement key that F16.S02.M01 agreementPublicKeyOf derives from that device's Ed25519 key listed active in the recipient's root-signed portable identity document (F07.S02.M01), never against an agreement key from a relay hint, then HKDF-SHA256 and XChaCha20-Poly1305, using @noble/curves and @noble/ciphers 2.4.0.
- **PS-060-01.R03** Messages are P2; the relay stores only a MailboxEnvelope (the sealed wrapper plus relay bookkeeping, no sender identifier) under RET-SHORT for at most 30 days, while vault Messages follow RET-STANDARD under the user's control.
- **PS-060-01.R04** Timestamps from other parties are claims; the vault stores the sender's createdAt as a claim, its own receivedAt, and the relay-signed receipt time as evidence of that relay's clock only.
- **PS-060-01.R05** Delivery is tracked per recipient: each Message holds one delivery row {recipientDid, mailboxId, relayId, outboxEntryId, syncState, relayReceipt, receiptCid} per recipient mailbox; the message-level state is the minimum across rows shown with 'k of n acknowledged', and a row reaches peer_accepted only with a receipt whose messageCid equals the cid of the exact signed envelope.
- **PS-060-01.R06** A relay mailbox is a resource of this module: comms.mailbox.register creates it for an owner DID with the owner's registered device key IDs, an optional push target and an optional list of salted hashes of contacts' request keys (learned from the senderRequestKey inside wrappers from accepted contacts), comms.mailbox.rotate replaces keys, contact hashes or the mailbox ID, and comms.mailbox.close ends it; the relay keeps these rows in its comms_mailbox table and accepts a put only with an RFC 9421 request signature by a request key, never learning the sender DID.
- **PS-060-01.R07** Sealed sender: every participant envelope put into a mailbox - this module's message, receipt and delete statements and every statement F11.S02.M01 hands to the MailboxPort, including F10.S01.M04 deletion notices - travels as the wrapper {v: 1, mailboxId, ciphertext, size, sentAt}, where ciphertext is XChaCha20-Poly1305 under a fresh wrapper key over {envelope, senderRequestKey} padded to 256-byte buckets, prefixed by that wrapper key wrapped for each recipient device by x25519 to the agreement key derived as in 01.R02 (these derived device keys are the only mailbox keys; a mailbox has no key of its own); the put is signed with the sender's request key for that relay - an Ed25519 key pair the vault generates per principal and relay, encoded as did:key in keyid, never listed in an identity document and used for nothing but puts to that relay - so the relay learns no author, type, seq, message ID or sender DID; a wrapper is sealed once per delivery row and its exact bytes are reused by every retry and resend of that row, so the relay deduplicates it on (mailboxId, digest).
- **PS-060-01.R08** The vault keeps one row per own mailbox {relayId, mailboxId, status: active|forwarding|closed, registeredAt, rotateAt, previousMailboxId?, forwardUntil?} plus its request key per relay; mailbox IDs differ at every relay and are rotated every 30 days per relay (comms.mailbox.rotate with newMailboxId and 14 forward days) to limit cross-relay and cross-period linkability (PT-15), and the in-process vault query comms.mailbox.list_own returns the current active pairs {relayId, mailboxId} that F01.S01.M03 puts into listing projections as mailboxHints 1..3 (N15).

## Specification

### Message

Schema `classrup.comms.message/v1` · storage **device** · privacy **P2** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key (messageId), generated by the sender vault |
| tenantId | uuidv7 — relay or community scope the thread belongs to, per CTR-ID-001 |
| threadId | uuidv8 — ref F08.S01.M02 Thread (derived thread id); must be active |
| direction | enum — outbound \| inbound |
| senderDid | did:key — author principal |
| senderDeviceId | string — key ID of the device whose Ed25519 key signed the envelope; scope of the author chain |
| seq | int — per (threadId, senderDeviceId) counter starting at 1; with prev forms the per-device author chain of CTR-FED-001 FED-3 |
| prev? | string — cid of the same device's previous message in the thread |
| messageCid | string — sha256-<base64url> cid (CTR-ID-001 ID-3) of the exact signed envelope; never changes, a resend reuses it |
| alg | enum — xchacha20poly1305-x25519-v1 (only value in v1) |
| nonce | bytes — 24 bytes base64url |
| ciphertext | bytes — base64url, 17..12 288 bytes (padded plaintext 1..8 192 plus 16-byte tag, padded to 256-byte buckets) |
| keyCommitment | bytes — 32 bytes HMAC-SHA256(K, 'classrup.comms.msg.commit.v1' \|\| messageId); part of the signed statement |
| wrappedKeys | array — 1..64 items { recipientDeviceId, ephemeralPub (32 bytes), nonce (24 bytes), wrappedKey (48 bytes) }; not covered by the sender signature because each wrap is authenticated by its own AEAD and the key commitment binds K |
| senderSignature | bytes — Ed25519 64 bytes over JCS of the signed statement classrup.comms.message/v1 (envelope minus wrappedKeys and sig, including keyCommitment) |
| body? | string — plaintext, 1..8 192 bytes UTF-8; present in the vault only |
| replyToId? | uuidv7 — message in the same thread |
| attachmentIds? | array — 0..4 F08.S01.M03 attachment IDs referenced inside the encrypted body |
| receiptsRequested | boolean — sender asks for receipts; recipients may ignore |
| deliveries | array — outbound only, 1..64 rows { recipientDid, mailboxId, relayId, outboxEntryId, syncState: prepared\|transport_acknowledged\|peer_accepted\|failed\|expired\|cancelled, relayReceipt?: classrup.platform.relay_receipt/v1 {relayId, keyId, destination, digest, receivedAt, epoch, seq, sig}, receiptCid? } |
| syncState | enum — outbound only, derived minimum of deliveries: local_committed \| prepared \| transport_acknowledged \| peer_accepted \| failed |
| status | enum — active \| pending_verification \| quarantined \| deleted |
| quarantineReason? | enum — signature_invalid \| key_revoked \| unknown_thread \| not_participant \| undecryptable \| commitment_mismatch \| fork \| message_request |
| createdAtClaim | timestamp — sender clock, a claim |
| receivedAt? | timestamp — local clock at inbound verification |
| relayReceipt? | object — inbound only: the classrup.platform.relay_receipt/v1 of the wrapper this vault fetched (F15.S02.M01); relay clock evidence only |
| deletedAt? | timestamp — set when status is deleted |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- An inbound Message is stored active only after its signature verified against a device key of senderDid that F16.S02.M02 reports active at the verifier receipt time, its sender is a current participant of the thread, and the key commitment recomputed from the unwrapped K matches; otherwise it is quarantined with a reason.
- (threadId, senderDeviceId, seq) is unique; a second envelope from the same device with the same seq and a different messageCid is a fork of that device's chain, both are kept quarantined with reason fork and the thread shows a fork warning for that device instead of overwriting; different devices of one principal never collide.
- A sender's messages are displayed in the order (createdAtClaim, senderDeviceId, seq); seq is never compared across devices.
- status deleted implies body, ciphertext, keyCommitment and wrappedKeys are erased and only id, threadId, senderDid, senderDeviceId, seq, messageCid and deletedAt remain.
- Delivery rows never move backwards; the message shows peer_accepted only when every row is peer_accepted, and each row's peer_accepted requires a verified receipt from that row's recipient whose messageCid equals messageCid.
- Field classes are annotated per F10.S02.M02 (body and attachment references P2, message key P4 in memory only, routing metadata P2).

### MailboxEnvelope

Schema `classrup.comms.mailbox_envelope/v1` · storage **relay** · privacy **P2** · retention **RET-SHORT**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — relay-assigned (envelopeId) |
| tenantId | uuidv7 — tenant of the mailbox; TenantPort.limits(tenantId) supplies maxEnvelopeBytes and maxMailboxBytesPerRecipient |
| mailboxId | string — 128-bit random identifier of a mailbox registered by comms.mailbox.register at this relay, base64url |
| v | int — wrapper version, 1 |
| ciphertext | bytes — the sealed wrapper ciphertext, opaque; author, type, seq, message ID and sender DID exist only inside it |
| size | int — padded ciphertext length in 256-byte buckets, at most maxEnvelopeBytes (TenantPort.limits, 4 096..262 144, default 262 144) |
| sentAt | timestamp — sender clock claim carried in the wrapper |
| digest | string — sha256-<base64url> of the ciphertext bytes; deduplication key with mailboxId and the receipt digest |
| senderClass | enum — contact \| unknown (whether the salted hash of the put's request key is on the owner's contact list); derived at put time, the key itself is not stored |
| receivedAt | timestamp — relay clock |
| receipt | object — classrup.platform.relay_receipt/v1 from F15.S02.M01 ReceiptPort.issue { relayId, keyId, destination '<relayId>/mailbox/<mailboxId>', digest, receivedAt, epoch, seq, sig } without cid, because the payload is not public |
| expiresAt | timestamp — receivedAt + 30 days |

**Invariants**
- At most one MailboxEnvelope per (mailboxId, digest); a repeated put of the same ciphertext returns the stored receipt.
- A mailbox holds at most 1 000 envelopes and maxMailboxBytesPerRecipient bytes (TenantPort.limits, default 50 MiB); envelopes from unknown request keys may use at most 20 % of that capacity (80 % reserved for contacts) and at most 200 puts per day in aggregate; further puts return COMMS_MAILBOX_FULL or RATE_LIMITED.
- Every stored envelope was accepted with an RFC 9421 request signature by a request key whose (keyid, nonce) pair was not seen in the previous 600 s; the envelope row stores no request key, sender DID or message ID.
- The relay never stores a decryption key or plaintext, never modifies the wrapper and deletes it after fetch plus acknowledgement or at expiresAt.

### MessageReceipt

Schema `classrup.comms.message_receipt/v1` · storage **device** · privacy **P2** · retention **RET-SHORT**

| Field | Type and constraints |
|---|---|
| messageId | uuidv7 — ref Message |
| messageCid | string — cid of the exact signed envelope acknowledged; must equal Message.messageCid |
| recipientDid | did:key — who acknowledged |
| recipientDeviceId | string — key ID that signed the receipt |
| kind | enum — delivered \| read |
| signedAt | timestamp — recipient clock, a claim |
| sig | bytes — Ed25519 over JCS of statement classrup.comms.message_receipt/v1 |

**Invariants**
- At most one receipt per (messageId, recipientDid, kind) and a receipt is only stored when its signature verifies and its messageCid equals the stored messageCid.

### Storage DDL

```sql
CREATE TABLE comms_mailbox (
  mailbox_id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, owner_did TEXT NOT NULL, device_key_ids TEXT NOT NULL, contact_hashes TEXT,
  contact_salt TEXT, push_target TEXT, status TEXT NOT NULL, rotated_to TEXT, forward_until TEXT,
  created_at TEXT NOT NULL, revision INTEGER NOT NULL);
CREATE INDEX comms_mailbox_owner ON comms_mailbox(owner_did, status);
CREATE TABLE comms_mailbox_envelope (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, mailbox_id TEXT NOT NULL, v INTEGER NOT NULL, ciphertext BLOB NOT NULL,
  size INTEGER NOT NULL, sent_at TEXT NOT NULL, digest TEXT NOT NULL, sender_class TEXT NOT NULL,
  received_at TEXT NOT NULL, receipt TEXT NOT NULL, expires_at TEXT NOT NULL);
CREATE UNIQUE INDEX comms_mailbox_dedupe ON comms_mailbox_envelope(mailbox_id, digest);
CREATE INDEX comms_mailbox_expiry ON comms_mailbox_envelope(expires_at);
-- first put of a request key to a mailbox, for the new-recipient limit; RET-SHORT 30 days
CREATE TABLE comms_mailbox_writer (mailbox_id TEXT NOT NULL, request_key_hash TEXT NOT NULL, first_put_at TEXT NOT NULL,
  PRIMARY KEY (mailbox_id, request_key_hash));
-- F11.S01.M03 NonceStore for RFC 9421 requests; 600 s
CREATE TABLE comms_mailbox_nonce (keyid TEXT NOT NULL, nonce TEXT NOT NULL, seen_at TEXT NOT NULL,
  PRIMARY KEY (keyid, nonce));
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-060-09.T01 | unit | PS-060-01.R01, PS-060-01.R02, PS-060-01.R04, PS-060-02.R01 | encrypt 8 192-byte plaintext on A1, commit, wrap for A2 and B1, sign, decrypt on B1 | plaintext recovered; envelope fields have exact lengths; key commitment verifies; relay row contains no plaintext; createdAtClaim stored as claim |
| TEST-PS-060-09.T02 | property | PS-060-01.R02, PS-060-09.R03 | random plaintexts 1..8 192 bytes and random single-bit corruption of ciphertext, nonce, additional data or key commitment | decryption and commitment check succeed unmodified and always fail when corrupted |
| TEST-PS-060-09.T03 | unit | PS-060-01.R03, PS-060-03.R02 | inbound envelope moves pending_verification to active, then the author delete statement is applied | body erased, tombstone kept, seq not reused, comms.message.deleted emitted |
| TEST-PS-060-09.T13 | chaos | PS-060-06.R03, PS-060-01.R05 | one of two recipient mailboxes rejects with 503 while the other accepts | message shows prepared with 1 of 2, accepted copy not re-sent, retry completes the other row |
| TEST-PS-060-09.T18 | integration | PS-060-01.R05, PS-060-03.R01, PS-060-04.R01 | A sends in TG; B acknowledges, C does not; then C sends a receipt for a different messageCid | message shows transport acknowledged with 1 of 2 acknowledged; C's mismatched receipt rejected with COMMS_MESSAGE_RECEIPT_MISMATCH; peer accepted only after C's matching receipt |
| TEST-PS-060-09.T19 | integration | PS-060-06.R03, PS-060-06.R04, PS-060-01.R01 | A1 and A2 both send three messages in TH while offline, then sync; A1 resends after a lost relay receipt | no fork and no freeze; per-device seq 1..3 each; resend has the identical messageCid and is deduplicated by R and B |
| TEST-PS-060-09.T21 | abuse | PS-060-01.R06, PS-060-02.R05, PS-060-05.R02, PS-060-02.R07 | 50 freshly generated request keys with valid signatures flood B's mailbox while A (a contact) keeps sending | unknown keys capped at 200 per day and 20 % capacity and each new key counted once against new_mailbox_recipients_per_day; A's puts still succeed; B's vault keeps at most 5 requests per DID and 100 in total |
| TEST-PS-060-09.T22 | integration | PS-060-04.R05, PS-060-01.R06 | register, rotate (new ID, 7 forward days) and close a mailbox; put to it | every put triggers one dispatch call with owner DID, channel push, category activity, template notify.tpl.activity.wake and hookSource mailbox only; the relay gate reads only the registered channel consent and never calls privacy.consent.check; rotated ID forwards then expires; close purges envelopes |
| TEST-PS-060-09.T26 | abuse | PS-060-01.R07, PS-060-04.R07, PS-060-07.R05 | A sends B a message and F11.S02.M01 routes a rental statement for B through the MailboxPort; inspect the put requests, the stored wrappers, relay tables and logs | each put carried an RFC 9421 signature by A's request key for that relay covering content-digest; each wrapper holds only {v, mailboxId, ciphertext, size, sentAt} plus bookkeeping with no sender DID, request key, type, seq or message ID; B's MailboxPort.fetch unseals both and F11.S01.M02 receive routes the message to this module and the rental statement to its F05 owner |
| TEST-PS-060-09.T29 | abuse | PS-060-01.R02, PS-060-02.R04 | a relay-served mailbox hint for B carries a substituted X25519 key; B's document lists B1 active and B2 revoked | the hint key is refused with SECURITY_AGREEMENT_KEY_UNBOUND and every wrap and seal targets agreementPublicKeyOf(B1) only |
| TEST-PS-060-09.T30 | integration | PS-060-01.R08, PS-060-04.R01 | A registers mailboxes at R1 and R2, the clock advances 31 days, then F01.S01.M03 calls comms.mailbox.list_own | the two mailbox IDs differ; each was rotated once with 14 forward days; list_own returns one current active pair per relay and never a forwarding or closed ID; the query makes no network call |

## Dependencies

Module depends on: F08.S01.M02, F07.S01.M01, F07.S02.M01, F07.S02.M02, F16.S02.M01, F16.S02.M02, F16.S02.M03, F11.S01.M01, F11.S01.M02, F11.S01.M03, F11.S02.M01, F15.S01.M01, F15.S02.M01, F15.S04.M03, F12.S03.M03, F12.S03.M04, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FED-001, CTR-IOX-001, CTR-UX-001. Predecessor: [module SPEC](SPEC.md).
