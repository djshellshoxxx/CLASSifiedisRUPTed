# PS-060-04 — Commands, queries and events: Private messages

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S01.M01 Private messages](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/messaging/private` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-060-04.R01** The vault exposes send, resend, delete and acknowledge commands that produce signed statements and a local read query; the relay exposes the mailbox commands register, rotate, close, put, fetch and ack, and this module is the single owner of recipient mailboxes that F11.S02.M01 delivery and other modules use.
- **PS-060-04.R02** Each state-changing vault command emits its event in the same IndexedDB transaction as the state change (CTR-EVT-001 EVT-8) and each relay command is atomic in the relay SQLite store.
- **PS-060-04.R03** The module consumes thread, counterparty key (security.key.*), own device key (identity.device_key.*), block and deletion events to keep recipient sets and inbound filtering correct.
- **PS-060-04.R04** Statement schemas and signer roles are registered with F11.S01.M01 (N2): classrup.comms.message/v1 (a device key of a thread participant), classrup.comms.message_delete/v1 (a device key of the message author), classrup.comms.message_receipt/v1 (a device key of the recipient, bound to messageCid); relay mailbox requests and put proofs are classrup/relay-request/v1 envelopes of F16.S02.M03.
- **PS-060-04.R05** Every accepted mailbox put calls the relay hook notify.notification.dispatch (F13.S02.M01) for a content-free push to the mailbox owner when the owner registered a push target (N17); the hook carries only the owner DID, category messages and a template key, F13.S02.M01 checks privacy.consent.check for purpose notify_push before sending, and the hook is bound at relay composition through the MailboxArrivalHook port because F13.S01.M03 already depends on this module.
- **PS-060-04.R06** The module registers ExportSectionPort (section comms.messages), DeletionPort (plan, execute, pseudonymize) and RetentionPurgePort with F10 (N6); DeletionPort.execute runs while the device keys still exist, signs delete requests for the user's sent messages, acknowledges and closes the user's mailboxes and tombstones local messages before F10.S01.M04 destroys the keys.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `comms.message.send` | comms.message.send | [vault command; produces signed statement classrup.comms.message/v1] { messageId, threadId, body, replyToId?, attachmentIds?, receiptsRequested? } | { messageId, messageCid, senderDeviceId, seq, syncState: local_committed, revision: 1 } | VALIDATION_FAILED, PAYLOAD_TOO_LARGE, NOT_FOUND, BLOCKED_PARTY, RATE_LIMITED |  | yes (Idempotency-Key) |
| `comms.message.resend` | comms.message.send | [vault command; re-queues the identical signed envelope, only wrappedKeys may be rebuilt for a refreshed device list] { messageId, recipientDids? } | { messageId, messageCid, deliveries: [{ recipientDid, syncState }] } | NOT_FOUND, CONFLICT_STATE, BLOCKED_PARTY |  | yes (Idempotency-Key) |
| `comms.message.delete` | comms.message.delete | [vault command; produces signed statement classrup.comms.message_delete/v1] { messageId, expectedRevision } | { messageId, revision, deletedAt } | NOT_FOUND, FORBIDDEN, CONFLICT_REVISION, CONFLICT_STATE | comms.message.deleted | yes (Idempotency-Key) |
| `comms.message.acknowledge` | comms.message.acknowledge | [vault command; produces signed statement classrup.comms.message_receipt/v1] { messageId, kind: delivered\|read } | { messageId, messageCid, kind, signedAt } | NOT_FOUND, RATE_LIMITED |  | yes (Idempotency-Key) |
| `comms.mailbox.register` | comms.mailbox.register | [relay command, request signed by an owner device key (classrup/relay-request/v1)] { ownerDid, deviceKeyIds[] (1..10), pushTarget?, contactSalt?, contactHashes? (≤ 2 000 salted SHA-256 hashes) } | { mailboxId, capacity: { envelopes: 1000, bytes: 20971520, unknownShare: 0.2 } } | UNAUTHENTICATED, VALIDATION_FAILED, COMMS_MAILBOX_LIMIT, RATE_LIMITED |  | yes (Idempotency-Key) |
| `comms.mailbox.rotate` | comms.mailbox.rotate | [relay command, request signed by a device key registered for the mailbox] { mailboxId, deviceKeyIds?, pushTarget?, contactHashes?, newMailboxId?: boolean, forwardDays? (0..30) } | { mailboxId, previousMailboxId?, forwardUntil?, revision } | UNAUTHENTICATED, NOT_FOUND, VALIDATION_FAILED, CONFLICT_REVISION |  | yes (Idempotency-Key) |
| `comms.mailbox.close` | comms.mailbox.close | [relay command, request signed by a device key registered for the mailbox] { mailboxId } | { mailboxId, closedAt, purgedEnvelopes } | UNAUTHENTICATED, NOT_FOUND |  | yes (Idempotency-Key) |
| `comms.mailbox.put` | comms.mailbox.put | [relay command, put proof signed by a device key of senderDid] { mailboxId, messageId, senderDid, blob (≤ 16 384 bytes), putProof: { keyId, nonce, signedAt, sig } } | { envelopeId, relayReceipt: { relayId, receivedAt, sig } } | VALIDATION_FAILED, UNAUTHENTICATED, PAYLOAD_TOO_LARGE, NOT_FOUND, RATE_LIMITED, COMMS_MAILBOX_FULL |  | yes (Idempotency-Key) |
| `comms.mailbox.fetch` | comms.mailbox.fetch | [relay command, signed request] { mailboxId, afterEnvelopeId?, limit ≤ 100 } | { items: [{ envelopeId, senderDid, senderClass, blob, receivedAt, relayReceipt }], next? } | UNAUTHENTICATED, NOT_FOUND, RATE_LIMITED |  | yes (Idempotency-Key) |
| `comms.mailbox.ack` | comms.mailbox.ack | [relay command, signed request] { mailboxId, envelopeIds[] (≤ 100) } | { deleted } | UNAUTHENTICATED, NOT_FOUND |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `comms.message.list_thread` | comms.message.read_thread | [vault query] { threadId, after?: { createdAtClaim, senderDeviceId, seq }, limit ≤ 100 } | { items: Message[] (plaintext, sync state, deliveries with k of n acknowledged, receipts), next? } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `comms.message.sent` | P2 | { messageId, messageCid, threadId, senderDeviceId, seq, recipientDid, mailboxId, relayId, relayReceivedAt } — one event per recipient delivery row when its relay receipt is verified |
| `comms.message.deleted` | P2 | { messageId, messageCid, threadId, senderDid, senderDeviceId, seq, reason: author\|recipient\|purge\|vault_wipe, syncStateAtDelete, attachmentIds[] } — emitted on every transition into deleted |
| `comms.message.received` | P2 | { messageId, messageCid, threadId, senderDid, senderDeviceId, seq, receivedAt } |

### Events consumed

| Type | Effect |
|---|---|
| `comms.thread.archived` | for reason superseded keep accepting envelopes for the old threadId from its participants for 7 days and show them in the supersededBy thread; otherwise stop accepting inbound envelopes for the thread and schedule local purge 30 days after archive unless the user keeps it |
| `security.key.registered` | add the device key to the device list of ownerPrincipal (own or counterparty) so later sends wrap for it, and re-verify quarantined messages that waited for that key |
| `security.key.revoked` | mark the key of ownerPrincipal revoked from revocationEffectiveFrom; envelopes it signed that this vault first saw after that time are quarantined with reason key_revoked and later sends stop wrapping for it |
| `identity.device_key.added` | own account only: add the new own device to the self device list so later sends also wrap for the user's other devices |
| `identity.device_key.revoked` | own account only: stop wrapping for the revoked own device and rotate the user's mailboxes to drop it (comms.mailbox.rotate) |
| `identity.block.added` | silently drop future inbound envelopes from the DID the local principal blocked and hide existing messages in group threads; nothing is sent to the blocked party |
| `privacy.deletion.completed` | after F10.S01.M04 destroyed the keys: confirm that DeletionPort.execute left no message bodies, keys or open mailboxes; nothing is signed here and envelopes still arriving stay unfetched until the relay expires them |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| COMMS_MESSAGE_SIGNATURE_INVALID | 422 | no | sender signature does not verify or the signing device is revoked |
| COMMS_MESSAGE_NOT_FOR_DEVICE | 422 | no | no wrapped key addressed to a device of this vault |
| COMMS_MESSAGE_COMMITMENT_MISMATCH | 422 | no | key commitment does not match the unwrapped message key; message quarantined |
| COMMS_MESSAGE_RECEIPT_MISMATCH | 422 | no | receipt names another envelope cid or is not signed by the recipient of that delivery |
| COMMS_MAILBOX_FULL | 429 | yes | mailbox holds 1 000 envelopes or 20 MiB, or the unknown-sender share is used up; retryAfterMs set |
| COMMS_MAILBOX_LIMIT | 409 | no | the principal already holds 3 active mailboxes at this relay or lists more than 10 device keys |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
vault command comms.message.send
{ "messageId": "0192f3a4-1111-7000-8000-000000000001", "threadId": "5f3a9c1e-7b2d-8e4f-9a01-23456789abcd", "body": "Is it still available?" }
-> { "messageId": "0192f3a4-1111-7000-8000-000000000001", "messageCid": "sha256-Hq1…", "senderDeviceId": "z6MkDevA1…", "seq": 42, "syncState": "local_committed", "revision": 1 }
relay command POST /api/v1/relay/comms.mailbox.put
Idempotency-Key: 0192f3a4-0000-7000-8000-000000000101
{ "mailboxId": "q3F…", "messageId": "0192f3a4-1111-7000-8000-000000000001", "senderDid": "did:key:z6Mk…", "blob": "…",
  "putProof": { "keyId": "z6MkDevA1…", "nonce": "Zt7…", "signedAt": "2026-11-04T10:00:00.900Z", "sig": "…" } }
201 { "envelopeId": "0192f3a4-3333-7000-8000-000000000001", "relayReceipt": { "relayId": "relay.example", "receivedAt": "2026-11-04T10:00:01.000Z", "sig": "…" } }
relay hook notify.notification.dispatch { "userDid": "did:key:z6MkOwner…", "channel": "push", "category": "messages", "templateKey": "notify.tpl.messages.new" }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-060-09.T06 | contract | PS-060-04.R01, PS-060-04.R02, PS-060-09.R02 | each vault command, relay command and query executes | outputs, statements and event payloads validate against registry schemas |
| TEST-PS-060-09.T07 | integration | PS-060-04.R03 | security.key.registered and security.key.revoked for B's devices and identity.device_key.added for A's own new device, then send | B's revoked key excluded and its later-seen envelopes quarantined; new keys wrapped for later sends only; own device list updated from identity.device_key.* only |
| TEST-PS-060-09.T18 | integration | PS-060-01.R05, PS-060-03.R01, PS-060-04.R01 | A sends in TG; B acknowledges, C does not; then C sends a receipt for a different messageCid | message shows transport acknowledged with 1 of 2 acknowledged; C's mismatched receipt rejected with COMMS_MESSAGE_RECEIPT_MISMATCH; peer accepted only after C's matching receipt |
| TEST-PS-060-09.T22 | integration | PS-060-04.R05, PS-060-01.R06 | register, rotate (new ID, 7 forward days) and close a mailbox; put to it | every put triggers one dispatch call with owner DID, category and template key only; rotated ID forwards then expires; close purges envelopes |
| TEST-PS-060-09.T23 | integration | PS-060-04.R06, PS-060-07.R04 | account deletion of A with messages and two mailboxes | DeletionPort.execute signs delete requests and closes both mailboxes before keys are destroyed; privacy.deletion.completed finds nothing left to sign; export section comms.messages present before deletion |
| TEST-PS-060-09.T25 | unit | PS-060-03.R04, PS-060-04.R04 | author deletes messages in local_committed, prepared, failed, transport_acknowledged and peer_accepted; inspect statement registry entries | comms.message.deleted with reason author in every case; registry lists message, delete and receipt statements with signer roles |

## Dependencies

Module depends on: F08.S01.M02, F07.S01.M01, F07.S02.M02, F16.S02.M02, F16.S02.M03, F11.S01.M01, F11.S02.M01, F15.S01.M01, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FED-001, CTR-IOX-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
