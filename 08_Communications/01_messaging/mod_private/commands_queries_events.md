# PS-060-04 — Commands, queries and events: Private messages

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S01.M01 Private messages](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/messaging/private` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-060-04.R01** The vault exposes send, delete and acknowledge commands that produce signed statements and a local read query; the relay exposes put, fetch and acknowledge mailbox commands.
- **PS-060-04.R02** Each state-changing vault command emits its event in the same IndexedDB transaction as the state change (CTR-EVT-001 EVT-8) and each relay command is atomic in the relay SQLite store.
- **PS-060-04.R03** The module consumes thread, device-key, block and deletion events to keep recipient sets and inbound filtering correct.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `comms.message.send` | comms.message.send | [vault command; produces signed statement classrup.comms.message/v1] { messageId, threadId, body, replyToId?, receiptsRequested? } | { messageId, seq, syncState: local_committed, revision: 1 } | VALIDATION_FAILED, PAYLOAD_TOO_LARGE, NOT_FOUND, BLOCKED_PARTY, RATE_LIMITED |  | yes (Idempotency-Key) |
| `comms.message.delete` | comms.message.delete | [vault command; produces signed statement classrup.comms.message_delete/v1] { messageId, expectedRevision } | { messageId, revision, deletedAt } | NOT_FOUND, FORBIDDEN, CONFLICT_REVISION, CONFLICT_STATE | comms.message.deleted | yes (Idempotency-Key) |
| `comms.message.acknowledge` | comms.message.acknowledge | [vault command; produces signed statement classrup.comms.message_receipt/v1] { messageId, kind: delivered\|read } | { messageId, kind, signedAt } | NOT_FOUND, RATE_LIMITED |  | yes (Idempotency-Key) |
| `comms.mailbox.put` | comms.mailbox.put | [relay command] { mailboxId, messageId, senderDid, blob (≤ 16 384 bytes) } | { envelopeId, relayReceipt: { relayId, receivedAt, sig } } | VALIDATION_FAILED, PAYLOAD_TOO_LARGE, NOT_FOUND, RATE_LIMITED, COMMS_MAILBOX_FULL |  | yes (Idempotency-Key) |
| `comms.mailbox.fetch` | comms.mailbox.fetch | [relay command, signed request] { mailboxId, afterEnvelopeId?, limit ≤ 100 } | { items: [{ envelopeId, blob, receivedAt, relayReceipt }], next? } | UNAUTHENTICATED, NOT_FOUND, RATE_LIMITED |  | yes (Idempotency-Key) |
| `comms.mailbox.ack` | comms.mailbox.ack | [relay command, signed request] { mailboxId, envelopeIds[] (≤ 100) } | { deleted } | UNAUTHENTICATED, NOT_FOUND |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `comms.message.list_thread` | comms.message.read_thread | [vault query] { threadId, afterSeqBySender?, limit ≤ 100 } | { items: Message[] (plaintext, sync state, receipts), next? } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `comms.message.sent` | P2 | { messageId, threadId, seq, recipientDids[], relayId, relayReceivedAt } |
| `comms.message.deleted` | P2 | { messageId, threadId, seq, senderDid, reason: author\|recipient\|purge\|vault_wipe } |
| `comms.message.received` | P2 | { messageId, threadId, senderDid, seq, receivedAt } |

### Events consumed

| Type | Effect |
|---|---|
| `comms.thread.archived` | stop accepting inbound envelopes for the thread and schedule local purge 30 days after archive unless the user keeps it |
| `identity.device_key.revoked` | mark the device as revoked in the local device list; envelopes signed by it after the revocation statement time are quarantined |
| `identity.device_key.added` | add the device to the recipient or self device list so later sends wrap for it |
| `identity.block.added` | silently drop future inbound envelopes from the blocked DID and hide existing messages in group threads |
| `privacy.deletion.completed` | erase all messages in the vault and queue a mailbox ack for pending envelopes |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| COMMS_MESSAGE_SIGNATURE_INVALID | 422 | no | sender signature does not verify or the signing device is revoked |
| COMMS_MESSAGE_NOT_FOR_DEVICE | 422 | no | no wrapped key addressed to a device of this vault |
| COMMS_MAILBOX_FULL | 429 | yes | mailbox holds 1 000 envelopes or 20 MiB; retryAfterMs set |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
vault command comms.message.send
{ "messageId": "0192f3a4-1111-7000-8000-000000000001", "threadId": "0192f3a4-0000-7000-8000-0000000000aa", "body": "Is it still available?" }
-> { "messageId": "0192f3a4-1111-7000-8000-000000000001", "seq": 42, "syncState": "local_committed", "revision": 1 }
relay command POST /api/v1/relay/comms.mailbox.put
Idempotency-Key: 0192f3a4-0000-7000-8000-000000000101
{ "mailboxId": "q3F…", "messageId": "0192f3a4-1111-7000-8000-000000000001", "senderDid": "did:key:z6Mk…", "blob": "…" }
201 { "envelopeId": "0192f3a4-3333-7000-8000-000000000001", "relayReceipt": { "relayId": "relay.example", "receivedAt": "2026-11-04T10:00:01.000Z", "sig": "…" } }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-060-09.T06 | contract | PS-060-04.R01, PS-060-04.R02, PS-060-09.R02 | each vault command, relay command and query executes | outputs, statements and event payloads validate against registry schemas |
| TEST-PS-060-09.T07 | integration | PS-060-04.R03 | device key revoked and added events delivered, then send | revoked device excluded and new device wrapped for later sends only |
| TEST-PS-060-09.T17 | a11y | PS-060-04.R01 | conversation screen on mobile with screen reader | new message announced in polite region, sync state has text, zero serious axe issues |

## Dependencies

Module depends on: F08.S01.M02, F07.S01.M01, F07.S02.M02, F16.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FED-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
