# PS-060-04 — Commands, queries and events: Private messages

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S01.M01 Private messages](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/messaging/private` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-060-04.R01** The vault exposes send, resend, delete and acknowledge commands that produce signed statements and the local read queries list_thread and list_own; the relay exposes the mailbox commands register, rotate, close, put, fetch and ack, and this module is the single owner of recipient mailboxes that F11.S02.M01 delivery and other modules use through the MailboxPort.
- **PS-060-04.R02** Each state-changing vault command emits its event in the same IndexedDB transaction as the state change (CTR-EVT-001 EVT-8) and each relay command is atomic in the relay SQLite store.
- **PS-060-04.R03** The module consumes thread, counterparty key (identity.portable_doc.published with origin received), own device key (identity.device_key.*, the local principal only), block and deletion events to keep recipient sets and inbound filtering correct.
- **PS-060-04.R04** Statement schemas and signer roles are registered with F11.S01.M01 (N2): classrup.comms.message/v1 (a device key of a thread participant), classrup.comms.message_delete/v1 (a device key of the message author), classrup.comms.message_receipt/v1 (a device key of the recipient, bound to messageCid) and classrup.comms.mailbox_close/v1 { mailboxId, relayId, requestId, signedAt, nonce } (a device key registered for the mailbox; the pre-signed close of the deletion sign step); relay mailbox requests are RFC 9421 HTTP message signatures of F11.S01.M03 with the request-signature tag classrup/relay-request/v1, not F16.S02.M03 envelopes.
- **PS-060-04.R05** Every accepted mailbox put calls the relay hook notify.notification.dispatch (F13.S02.M01) for a content-free wake of the mailbox owner when the owner registered a push target (N17); the hook carries only the owner DID, channel push, category activity, template notify.tpl.activity.wake and hookSource mailbox, the relay gate checks only the registered F13 channel consent because privacy.consent.check runs in the vault only, and the hook is bound at relay composition through the MailboxArrivalHook port because F13 modules already depend on this module.
- **PS-060-04.R06** The module registers ExportSectionPort (section comms.messages), DeletionPort and RetentionPurgePort with F10 (N6a); in the F10.S01.M04 sign step, before revoke_keys and destroy_keys, DeletionPort signs delete requests for the user's sent messages and a classrup.comms.mailbox_close/v1 for every own mailbox and queues them, the purge step tombstones local messages, and privacy.deletion.completed is a notification only on which nothing is signed and no relay is called.
- **PS-060-04.R07** The module implements the F11.S02.M01 MailboxPort {put, fetch, ack}, bound at vault composition because F11.S02.M01 cannot depend on this module: MailboxPort.put({ relayId, mailboxId, recipientDid, envelope }) seals the envelope into the wrapper per 01.R07, signs the put with the request key for that relay and returns { envelopeId, receipt } after verifying the receipt; MailboxPort.fetch(mailboxId) returns the unsealed envelopes of the user's own mailbox and MailboxPort.ack acknowledges them only after F11.S01.M02 receive committed each one; F11.S01.M02 routes classrup.comms.message/v1, message_receipt/v1 and message_delete/v1 to this module as their ingest owner and every other statement, including classrup.privacy.deletion_notice/v1, to its own owner.
- **PS-060-04.R08** Every accepted put, a duplicate included, returns in its response field receipt a classrup.platform.relay_receipt/v1 from F15.S02.M01 ReceiptPort.issue with destination '<relayId>/mailbox/<mailboxId>', digest = sha256-<base64url> of the ciphertext bytes and no cid; the vault verifies it against the relay's published key set, retired keys included, before a delivery row reaches transport acknowledged.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `comms.message.send` | comms.message.send | [vault command; produces signed statement classrup.comms.message/v1] { messageId, threadId, body, replyToId?, attachmentIds?, receiptsRequested? } | { messageId, messageCid, senderDeviceId, seq, syncState: local_committed, revision: 1 } | VALIDATION_FAILED, PAYLOAD_TOO_LARGE, NOT_FOUND, BLOCKED_PARTY, RATE_LIMITED |  | yes (Idempotency-Key) |
| `comms.message.resend` | comms.message.send | [vault command; re-queues the identical signed envelope, only wrappedKeys may be rebuilt for a refreshed device list] { messageId, recipientDids? } | { messageId, messageCid, deliveries: [{ recipientDid, syncState }] } | NOT_FOUND, CONFLICT_STATE, BLOCKED_PARTY |  | yes (Idempotency-Key) |
| `comms.message.delete` | comms.message.delete | [vault command; produces signed statement classrup.comms.message_delete/v1] { messageId, expectedRevision } | { messageId, revision, deletedAt } | NOT_FOUND, FORBIDDEN, CONFLICT_REVISION, CONFLICT_STATE | comms.message.deleted | yes (Idempotency-Key) |
| `comms.message.acknowledge` | comms.message.acknowledge | [vault command; produces signed statement classrup.comms.message_receipt/v1] { messageId, kind: delivered\|read } | { messageId, messageCid, kind, signedAt } | NOT_FOUND, RATE_LIMITED |  | yes (Idempotency-Key) |
| `comms.mailbox.register` | comms.mailbox.register | [relay command, RFC 9421 request signature by an owner device key (F11.S01.M03 signRequest, tag classrup/relay-request/v1)] { ownerDid, deviceKeyIds[] (1..10), pushTarget?, contactSalt?, contactHashes? (≤ 2 000 salted SHA-256 hashes of contacts' request keys) } | { mailboxId, capacity: { envelopes: 1000, bytes: maxMailboxBytesPerRecipient of the tenant, unknownShare: 0.2 } } | UNAUTHENTICATED, VALIDATION_FAILED, COMMS_MAILBOX_LIMIT, RATE_LIMITED |  | yes (Idempotency-Key) |
| `comms.mailbox.rotate` | comms.mailbox.rotate | [relay command, RFC 9421 request signature by a device key registered for the mailbox] { mailboxId, deviceKeyIds?, pushTarget?, contactHashes?, newMailboxId?: boolean, forwardDays? (0..30) } | { mailboxId, previousMailboxId?, forwardUntil?, revision } | UNAUTHENTICATED, NOT_FOUND, VALIDATION_FAILED, CONFLICT_REVISION |  | yes (Idempotency-Key) |
| `comms.mailbox.close` | comms.mailbox.close | [relay command, RFC 9421 request signature by a device key registered for the mailbox, or the pre-signed statement classrup.comms.mailbox_close/v1 from the deletion sign step] { mailboxId, closeStatement? } | { mailboxId, closedAt, purgedEnvelopes } | UNAUTHENTICATED, NOT_FOUND |  | yes (Idempotency-Key) |
| `comms.mailbox.put` | comms.mailbox.put | [relay command and MailboxPort route; RFC 9421 request signature (F11.S01.M03 signRequest, tag classrup/relay-request/v1) by the sender's per-relay request key, covering @method, @target-uri, content-digest of this body, created, keyid and nonce; no sender identifier] { mailboxId, wrapper: { v: 1, mailboxId, ciphertext, size (≤ maxEnvelopeBytes), sentAt } } | { envelopeId, receipt: classrup.platform.relay_receipt/v1 { relayId, keyId, destination: '<relayId>/mailbox/<mailboxId>', digest, receivedAt, epoch, seq, sig } } | VALIDATION_FAILED, UNAUTHENTICATED, PAYLOAD_TOO_LARGE, NOT_FOUND, RATE_LIMITED, COMMS_MAILBOX_FULL |  | yes (Idempotency-Key) |
| `comms.mailbox.fetch` | comms.mailbox.fetch | [relay command, RFC 9421 request signature by a device key registered for the mailbox] { mailboxId, afterEnvelopeId?, limit ≤ 100 } | { items: [{ envelopeId, wrapper: { v, mailboxId, ciphertext, size, sentAt }, senderClass, receivedAt, receipt }], next? } | UNAUTHENTICATED, NOT_FOUND, RATE_LIMITED |  | yes (Idempotency-Key) |
| `comms.mailbox.ack` | comms.mailbox.ack | [relay command, RFC 9421 request signature by a device key registered for the mailbox] { mailboxId, envelopeIds[] (≤ 100) } | { deleted } | UNAUTHENTICATED, NOT_FOUND |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `comms.message.list_thread` | comms.message.read_thread | [vault query] { threadId, after?: { createdAtClaim, senderDeviceId, seq }, limit ≤ 100 } | { items: Message[] (plaintext, sync state, deliveries with k of n acknowledged, receipts), next? } | NOT_FOUND |
| `comms.mailbox.list_own` | comms.mailbox.read_own | [in-process vault query over the vault's own mailbox rows, no network; used by F01.S01.M03 for mailboxHints] { relayIds? } | { items: [{ relayId, mailboxId, status: active, rotateAt }] } — the current active mailbox per relay only, never a forwarding or closed ID; at most 10 items | VALIDATION_FAILED |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `comms.message.sent` | P2 | { messageId, messageCid, threadId, senderDeviceId, seq, recipientDid, mailboxId, relayId, relayReceivedAt } — one event per recipient delivery row when its relay receipt is verified |
| `comms.message.deleted` | P2 | { messageId, messageCid, threadId, senderDid, senderDeviceId, seq, reason: author\|recipient\|purge\|vault_wipe, syncStateAtDelete, attachmentIds[] } — emitted on every transition into deleted |
| `comms.message.received` | P2 | { messageId, messageCid, threadId, senderDid, senderDeviceId, seq, receivedAt } |

### Events consumed

| Type | Effect |
|---|---|
| `comms.thread.archived` | for reason superseded keep accepting chat messages for the old threadId from its participants for 7 days and show them in the supersededBy thread; otherwise stop accepting inbound chat messages for the thread and schedule local purge 30 days after archive unless the user keeps it; sealed statements of other types are not bound to a thread and keep flowing to F11.S01.M02 ingestion (N7a) |
| `identity.portable_doc.published` | origin received only, the single source of counterparty key changes: add the addedKeys of that did to its device list so later sends wrap for them and re-verify quarantined messages that waited for a key; for revokedKeys[].revokesEffectiveAt quarantine envelopes that key signed and this vault first saw after that time with reason key_revoked and stop wrapping for it; origin own and relay_stored are ignored |
| `identity.device_key.added` | the local principal's own keys only (payload did is the local principal): add the new own device to the self device list so later sends also wrap for the user's other devices |
| `identity.device_key.revoked` | the local principal's own keys only (payload did is the local principal): stop wrapping for the revoked own device and rotate the user's mailboxes to drop it (comms.mailbox.rotate) |
| `identity.block.added` | silently drop future inbound chat messages (classrup.comms.message/v1) from the DID the local principal blocked and hide existing messages in group threads; sealed wrappers carrying other statements, such as lifecycle statements of a rental confirmed before the block, are still fetched, acknowledged and handed to F11.S01.M02 ingestion where only notifications are suppressed (N7a); nothing is sent to the blocked party |
| `privacy.deletion.completed` | notification only (N6a): confirm locally that the DeletionPort steps left no message bodies, keys or open own mailbox rows; nothing is signed, no relay is called, and envelopes still arriving stay unfetched until the relay expires them |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| COMMS_MESSAGE_SIGNATURE_INVALID | 422 | no | sender signature does not verify or the signing device is revoked |
| COMMS_MESSAGE_NOT_FOR_DEVICE | 422 | no | no wrapped key addressed to a device of this vault |
| COMMS_MESSAGE_COMMITMENT_MISMATCH | 422 | no | key commitment does not match the unwrapped message key; message quarantined |
| COMMS_MESSAGE_RECEIPT_MISMATCH | 422 | no | receipt names another envelope cid or is not signed by the recipient of that delivery |
| COMMS_MAILBOX_FULL | 429 | yes | mailbox holds 1 000 envelopes or the tenant's maxMailboxBytesPerRecipient, or the unknown-key share is used up; retryAfterMs set |
| COMMS_MAILBOX_LIMIT | 409 | no | the principal already holds 3 active mailboxes at this relay or lists more than 10 device keys |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
vault command comms.message.send
{ "messageId": "0192f3a4-1111-7000-8000-000000000001", "threadId": "5f3a9c1e-7b2d-8e4f-9a01-23456789abcd", "body": "Is it still available?" }
-> { "messageId": "0192f3a4-1111-7000-8000-000000000001", "messageCid": "sha256-Hq1…", "senderDeviceId": "z6MkDevA1…", "seq": 42, "syncState": "local_committed", "revision": 1 }
relay command POST /api/v1/relay/comms.mailbox.put
Idempotency-Key: 0192f3a4-0000-7000-8000-000000000101
Content-Digest: sha-256=:X48E9q…:
Signature-Input: sig1=("@method" "@target-uri" "content-digest");created=1793786400;keyid="did:key:z6MkReqA…";nonce="0192f3a4-0000-7000-8000-000000000101";alg="ed25519";tag="classrup/relay-request/v1"
Signature: sig1=:…:
{ "mailboxId": "q3F…", "wrapper": { "v": 1, "mailboxId": "q3F…", "ciphertext": "…", "size": 2048, "sentAt": "2026-11-04T10:00:00.900Z" } }
201 { "envelopeId": "0192f3a4-3333-7000-8000-000000000001", "receipt": { "relayId": "relay.example", "keyId": "relay.example#k1", "destination": "relay.example/mailbox/q3F…", "digest": "sha256-Hc4…", "receivedAt": "2026-11-04T10:00:01.000Z", "epoch": 3, "seq": 9182, "sig": "…" } }
relay hook notify.notification.dispatch { "userDid": "did:key:z6MkOwner…", "channel": "push", "category": "activity", "templateKey": "notify.tpl.activity.wake", "hookSource": "mailbox" }
vault query comms.mailbox.list_own {} -> { "items": [{ "relayId": "relay.example", "mailboxId": "q3F…", "status": "active", "rotateAt": "2026-12-04T10:00:00.000Z" }] }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-060-09.T06 | contract | PS-060-04.R01, PS-060-04.R02, PS-060-09.R02 | each vault command, relay command and query executes | outputs, statements and event payloads validate against registry schemas |
| TEST-PS-060-09.T07 | integration | PS-060-04.R03 | B's portable identity document arrives with origin received adding device B2 and revoking B1, and identity.device_key.added carries A's own did for A's new device, then send | B1 excluded and its later-seen envelopes quarantined; B2 wrapped for later sends only; own device list updated from identity.device_key.* only; no security.key.* event is consumed |
| TEST-PS-060-09.T18 | integration | PS-060-01.R05, PS-060-03.R01, PS-060-04.R01 | A sends in TG; B acknowledges, C does not; then C sends a receipt for a different messageCid | message shows transport acknowledged with 1 of 2 acknowledged; C's mismatched receipt rejected with COMMS_MESSAGE_RECEIPT_MISMATCH; peer accepted only after C's matching receipt |
| TEST-PS-060-09.T22 | integration | PS-060-04.R05, PS-060-01.R06 | register, rotate (new ID, 7 forward days) and close a mailbox; put to it | every put triggers one dispatch call with owner DID, channel push, category activity, template notify.tpl.activity.wake and hookSource mailbox only; the relay gate reads only the registered channel consent and never calls privacy.consent.check; rotated ID forwards then expires; close purges envelopes |
| TEST-PS-060-09.T23 | integration | PS-060-04.R06, PS-060-07.R04, PS-060-06.R05 | account deletion of A with messages and two mailboxes, once online and once with the device offline until after destroy_keys | the sign step signs the delete requests and two classrup.comms.mailbox_close/v1 before revoke_keys; offline, the residue outbox later delivers them with A's request keys and both relays close the mailboxes; privacy.deletion.completed signs nothing and calls no relay; export section comms.messages present before deletion |
| TEST-PS-060-09.T25 | unit | PS-060-03.R04, PS-060-04.R04 | author deletes messages in local_committed, prepared, failed, transport_acknowledged and peer_accepted; inspect statement registry entries | comms.message.deleted with reason author in every case; registry lists message, delete, receipt and mailbox_close statements with signer roles and no F16.S02.M03 context for relay requests |
| TEST-PS-060-09.T26 | abuse | PS-060-01.R07, PS-060-04.R07, PS-060-07.R05 | A sends B a message and F11.S02.M01 routes a rental statement for B through the MailboxPort; inspect the put requests, the stored wrappers, relay tables and logs | each put carried an RFC 9421 signature by A's request key for that relay covering content-digest; each wrapper holds only {v, mailboxId, ciphertext, size, sentAt} plus bookkeeping with no sender DID, request key, type, seq or message ID; B's MailboxPort.fetch unseals both and F11.S01.M02 receive routes the message to this module and the rental statement to its F05 owner |
| TEST-PS-060-09.T27 | integration | PS-060-04.R08, PS-060-03.R01 | put twice with identical ciphertext; a receipt with a wrong destination or digest; a receipt signed by a retired relay key | each put returns a classrup.platform.relay_receipt/v1 with destination <relayId>/mailbox/<mailboxId>, the ciphertext digest and no cid; the duplicate returns the stored receipt; the mismatched receipt leaves the row prepared; the retired-key receipt verifies against the published key set |
| TEST-PS-060-09.T30 | integration | PS-060-01.R08, PS-060-04.R01 | A registers mailboxes at R1 and R2, the clock advances 31 days, then F01.S01.M03 calls comms.mailbox.list_own | the two mailbox IDs differ; each was rotated once with 14 forward days; list_own returns one current active pair per relay and never a forwarding or closed ID; the query makes no network call |
| TEST-PS-060-09.T31 | integration | PS-060-02.R06, PS-060-04.R03 | owner O blocks renter R after a confirmed rental and O's direct thread with R is archived with reason blocked; R sends a chat message and a signed return report | the chat message is dropped silently; the return report is fetched, acknowledged and handed to F11.S01.M02 ingestion and stored with the notification suppressed; R's vault state equals an unblocked control run |
| TEST-PS-060-09.T32 | integration | PS-060-06.R05, PS-060-04.R07 | after A's keys are destroyed the residue outbox sends a classrup.privacy.deletion_notice/v1 to counterparty C | the notice is sealed to the agreement keys derived from C's listed device keys, put with A's request key, unsealed by C and handed to F11.S01.M02 ingestion |

## Dependencies

Module depends on: F08.S01.M02, F07.S01.M01, F07.S02.M01, F07.S02.M02, F16.S02.M01, F16.S02.M02, F16.S02.M03, F11.S01.M01, F11.S01.M02, F11.S01.M03, F11.S02.M01, F15.S01.M01, F15.S02.M01, F15.S04.M03, F12.S03.M03, F12.S03.M04, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FED-001, CTR-IOX-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
