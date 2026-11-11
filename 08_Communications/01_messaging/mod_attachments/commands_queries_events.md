# PS-059-04 — Commands, queries and events: Message attachments

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S01.M03 Message attachments](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/messaging/attachments` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-059-04.R01** The module exposes the vault commands attach and remove, the relay commands create_slot, put_chunk, finalize and delete, and a ciphertext download query.
- **PS-059-04.R02** The uploader vault emits comms.attachment.uploaded in the same IndexedDB transaction that records a verified finalize response and comms.attachment.deleted in the transaction that records a delete response or the passing of retainUntil.
- **PS-059-04.R03** The module consumes message, delivery and deletion events locally to issue signed relay delete requests; every command is classed below as vault command or relay command, and the ciphertext is stored as a F15.S02.M03 MediaBlob.
- **PS-059-04.R04** The module registers ExportSectionPort (section comms.attachments), DeletionPort (plan, execute, pseudonymize) and RetentionPurgePort with F10 (N6); DeletionPort.execute sends signed relay deletes for every blob the user uploaded and erases local keys before F10.S01.M04 destroys the device keys.
- **PS-059-04.R05** The module implements the F09.S02.M02 AttachmentTransportPort send(blobRef, recipients[], perObjectKey) -> { attachmentId, cipherBlobRef, syncState }: it reads the local evidence MediaBlob already stripped by F10.S02.M03, re-runs verifyImageClean, STREAM-encrypts it under the caller's per-object key with a fresh nonce prefix, uploads it with create_slot, put_chunk and finalize (threadLabelHash = HMAC of the caller's context reference under the per-device salt) and delivers the descriptor {attachmentId, relayId, cipherBlobRef, plainBlobRef = blobRef, key, noncePrefix, cipherSha256, cipherSize, plainSize, chunkCount, declaredType, downloadToken} to each recipient as statement classrup.comms.attachment_share/v1 (signer a device key of the uploader, registered with F11.S01.M01, N2, ingest owner this module) sealed through the F08.S01.M01 MailboxPort; a recipient vault verifies it, downloads, checks the ciphertext and stores the plaintext as a local MediaBlob whose content address equals plainBlobRef.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `comms.attachment.attach` | comms.attachment.attach | [vault command; the message that references the blob is signed later by comms.message.send] { attachmentId, threadId, imageBytes (≤ 25 MiB source), altText? (≤ 140 characters), decorative?: boolean } | { attachmentId, plainSize, chunkCount, syncState: local_committed } | VALIDATION_FAILED, COMMS_ATTACHMENT_TYPE_UNSUPPORTED, COMMS_ATTACHMENT_TOO_LARGE, NOT_FOUND |  | yes (Idempotency-Key) |
| `comms.attachment.remove` | comms.attachment.remove | [vault command; sends relay command comms.attachment.delete signed by the uploader device key and records the response] { attachmentId, expectedRevision } | { attachmentId, revision, status: deleted\|delete_pending } | NOT_FOUND, FORBIDDEN, CONFLICT_REVISION, CONFLICT_STATE, DEPENDENCY_UNAVAILABLE | comms.attachment.deleted | yes (Idempotency-Key) |
| `comms.attachment.create_slot` | comms.attachment.upload | [relay command, relay access token] { attachmentId, threadLabelHash, declaredType, plainSize, chunkCount } | { attachmentId, uploadExpiresAt, chunkSize: 65536 } | UNAUTHENTICATED, VALIDATION_FAILED, COMMS_ATTACHMENT_TYPE_UNSUPPORTED, COMMS_ATTACHMENT_TOO_LARGE, COMMS_ATTACHMENT_QUOTA, RATE_LIMITED |  | yes (Idempotency-Key) |
| `comms.attachment.put_chunk` | comms.attachment.upload | [relay command, relay access token] { attachmentId, index, bytes (≤ 65 552) } | { attachmentId, index, received } | UNAUTHENTICATED, VALIDATION_FAILED, NOT_FOUND, EXPIRED, CONFLICT_STATE |  | yes (Idempotency-Key) |
| `comms.attachment.finalize` | comms.attachment.upload | [relay command, relay access token] { attachmentId, cipherSha256, downloadTokenHash, expectedRevision } | { attachmentId, revision, cipherSize, blobRef, retainUntil, relaySig } | UNAUTHENTICATED, NOT_FOUND, EXPIRED, COMMS_ATTACHMENT_HASH_MISMATCH, CONFLICT_REVISION, CONFLICT_STATE |  | yes (Idempotency-Key) |
| `comms.attachment.delete` | comms.attachment.delete | [relay command, RFC 9421 request signature by the uploader device key made with F11.S01.M03 signRequest under the request-signature tag classrup/relay-request/v1, not an F16.S02.M03 envelope] { attachmentId, expectedRevision } | { attachmentId, revision, deletedAt, relaySig } | UNAUTHENTICATED, NOT_FOUND, FORBIDDEN, CONFLICT_REVISION, CONFLICT_STATE |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `comms.attachment.download` | comms.attachment.read | [relay query, bearer download token in the Authorization header] { attachmentId, range? (chunk indexes) } | ciphertext stream with Content-Type application/octet-stream and ETag = cipherSha256 | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `comms.attachment.uploaded` | P2 | { attachmentId, threadId (from the local record), uploaderId, cipherSize, declaredType, blobRef, retainUntil } — emitted in the uploader vault only |
| `comms.attachment.deleted` | P2 | { attachmentId, threadId (from the local record), reason: sender\|message_deleted\|delivery_abandoned\|expiry\|vault_wipe } — emitted in the uploader vault only |

### Events consumed

| Type | Effect |
|---|---|
| `comms.message.deleted` | when the author deleted, in any delivery state, a message whose attachmentIds reference an attachment of this vault, send the signed relay delete for an uploaded blob or abandon a pending slot |
| `federation.delivery.failed` | when the abandoned outbox entry (failed or expired) carries a message referencing an uploaded attachment of this vault and no recipient row reached transport_acknowledged, send the signed relay delete for its blob |
| `privacy.deletion.completed` | after F10.S01.M04 destroyed the keys: confirm that DeletionPort.execute deleted every uploaded blob and erased local attachment records and object keys; nothing is signed here |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| COMMS_ATTACHMENT_TYPE_UNSUPPORTED | 422 | no | declared media type is not image/jpeg, image/png or image/webp |
| COMMS_ATTACHMENT_TOO_LARGE | 413 | no | ciphertext would exceed 5 MiB or chunk count does not match size |
| COMMS_ATTACHMENT_QUOTA | 429 | yes | more than 3 pending slots or 50 MiB of uploads in 24 h |
| COMMS_ATTACHMENT_HASH_MISMATCH | 422 | no | stored or downloaded ciphertext length, SHA-256 or chunk sequence differs from the declared value |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
POST /api/v1/relay/comms.attachment.create_slot
Idempotency-Key: 0192f3a4-0000-7000-8000-000000000301
{ "attachmentId": "0192f3a4-2222-7000-8000-000000000001", "threadLabelHash": "8d0f6c…", "declaredType": "image/jpeg",
  "plainSize": 1048576, "chunkCount": 16 }
201 { "attachmentId": "0192f3a4-2222-7000-8000-000000000001", "uploadExpiresAt": "2026-11-04T11:00:00.000Z", "chunkSize": 65536 }
finalize -> { "blobRef": "blob:sha256-Xk3…", "retainUntil": "2026-12-04T10:05:00.000Z", "relaySig": "…" }; the uploader vault then emits comms.attachment.uploaded with threadId from its own record
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-059-09.T05 | contract | PS-059-04.R01, PS-059-04.R02, PS-059-09.R02 | each command and query executes | outputs and event payloads validate against registry schemas |
| TEST-PS-059-09.T06 | integration | PS-059-04.R03, PS-059-03.R03 | author deletes the message in prepared and in peer_accepted state; delivery abandoned after 7 days; retainUntil passes | signed relay delete issued or sweep runs, blob erased from the live store in each case and downloads return NOT_FOUND |
| TEST-PS-059-09.T18 | integration | PS-059-04.R04, PS-059-07.R04 | account deletion with three uploaded attachments | DeletionPort.execute sends three signed relay deletes before keys are destroyed; privacy.deletion.completed finds nothing to sign; export section comms.attachments present beforehand |
| TEST-PS-059-09.T23 | integration | PS-059-04.R05, PS-059-02.R04 | F09.S02.M02 calls AttachmentTransportPort.send for a stripped evidence MediaBlob with recipients B and a mediator M; a tampered share whose plaintext differs from the cited blobRef | ciphertext uploaded once, one attachment_share statement sealed per recipient through the F08.S01.M01 MailboxPort, B and M store a MediaBlob whose content address equals blobRef; the tampered share is quarantined with COMMS_ATTACHMENT_HASH_MISMATCH |

## Dependencies

Module depends on: F08.S01.M01, F08.S01.M02, F09.S02.M02, F15.S02.M03, F10.S02.M03, F11.S01.M01, F11.S01.M03, F11.S02.M01, F15.S01.M01, F16.S02.M03, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
