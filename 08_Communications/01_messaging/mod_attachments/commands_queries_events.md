# PS-059-04 — Commands, queries and events: Message attachments

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S01.M03 Message attachments](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/messaging/attachments` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-059-04.R01** The module exposes slot creation, chunk upload, finalize and delete commands and a ciphertext download query.
- **PS-059-04.R02** Finalize emits comms.attachment.uploaded in the same transaction as the state change.
- **PS-059-04.R03** The module consumes message and deletion events locally to issue signed relay delete requests; every command is classed below as vault command or relay command.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `comms.attachment.attach` | comms.attachment.attach | [vault command; the message that references the blob is signed later by comms.message.send] { attachmentId, threadId, imageBytes (≤ 25 MiB source), altText? } | { attachmentId, plainSize, chunkCount, syncState: local_committed } | VALIDATION_FAILED, COMMS_ATTACHMENT_TYPE_UNSUPPORTED, COMMS_ATTACHMENT_TOO_LARGE, NOT_FOUND |  | yes (Idempotency-Key) |
| `comms.attachment.create_slot` | comms.attachment.upload | [relay command, relay access token] { attachmentId, threadLabelHash, declaredType, plainSize, chunkCount } | { attachmentId, uploadExpiresAt, chunkSize: 65536 } | VALIDATION_FAILED, COMMS_ATTACHMENT_TYPE_UNSUPPORTED, COMMS_ATTACHMENT_TOO_LARGE, COMMS_ATTACHMENT_QUOTA, NOT_FOUND, RATE_LIMITED |  | yes (Idempotency-Key) |
| `comms.attachment.put_chunk` | comms.attachment.upload | [relay command, relay access token] { attachmentId, index, bytes (≤ 65 552) } | { attachmentId, index, received } | VALIDATION_FAILED, NOT_FOUND, EXPIRED, CONFLICT_STATE |  | yes (Idempotency-Key) |
| `comms.attachment.finalize` | comms.attachment.upload | [relay command, relay access token] { attachmentId, cipherSha256, downloadTokenHash, expectedRevision } | { attachmentId, revision, cipherSize } | NOT_FOUND, EXPIRED, COMMS_ATTACHMENT_HASH_MISMATCH, CONFLICT_REVISION, CONFLICT_STATE | comms.attachment.uploaded | yes (Idempotency-Key) |
| `comms.attachment.delete` | comms.attachment.delete | [relay command, request signed by the uploader device key; the vault also records the delete locally and emits the event once the relay confirms] { attachmentId, expectedRevision } | { attachmentId, revision } | NOT_FOUND, FORBIDDEN, CONFLICT_REVISION, CONFLICT_STATE | comms.attachment.deleted | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `comms.attachment.download` | comms.attachment.read | [relay query, bearer download token in the Authorization header] { attachmentId, range? (chunk indexes) } | ciphertext stream with Content-Type application/octet-stream and ETag = cipherSha256 | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `comms.attachment.uploaded` | P2 | { attachmentId, threadId, uploaderId, cipherSize, declaredType } |
| `comms.attachment.deleted` | P2 | { attachmentId, threadId, reason: sender\|message_deleted\|expiry\|vault_wipe } |

### Events consumed

| Type | Effect |
|---|---|
| `comms.message.deleted` | when the author deleted a message that carries an attachment reference, send the signed relay delete request for its blob |
| `privacy.deletion.completed` | send signed relay delete requests for every blob the vault uploaded, then erase local attachment records |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| COMMS_ATTACHMENT_TYPE_UNSUPPORTED | 422 | no | declared media type is not image/jpeg, image/png or image/webp |
| COMMS_ATTACHMENT_TOO_LARGE | 413 | no | processed image exceeds 5 MiB or chunk count does not match size |
| COMMS_ATTACHMENT_QUOTA | 429 | yes | more than 3 pending slots or 50 MiB of uploads in 24 h |
| COMMS_ATTACHMENT_HASH_MISMATCH | 422 | no | stored ciphertext length or SHA-256 differs from the declared value |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
POST /api/v1/relay/comms.attachment.create_slot
Idempotency-Key: 0192f3a4-0000-7000-8000-000000000301
{ "attachmentId": "0192f3a4-2222-7000-8000-000000000001", "threadId": "0192f3a4-0000-7000-8000-0000000000aa",
  "declaredType": "image/jpeg", "plainSize": 1048576, "chunkCount": 16 }
201 { "attachmentId": "0192f3a4-2222-7000-8000-000000000001", "uploadExpiresAt": "2026-11-04T11:00:00.000Z", "chunkSize": 65536 }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-059-09.T05 | contract | PS-059-04.R01, PS-059-04.R02, PS-059-09.R02 | each command and query executes | outputs and event payloads validate against registry schemas |
| TEST-PS-059-09.T06 | integration | PS-059-04.R03, PS-059-03.R03 | author deletes message, vault wipe request, and 30-day expiry | signed relay delete issued or sweep runs, blob erased in each case and downloads return NOT_FOUND |
| TEST-PS-059-09.T15 | a11y | PS-059-04.R01 | attach and view flow with screen reader | progress announced, alt text field reachable, zero serious axe issues |

## Dependencies

Module depends on: F08.S01.M01, F08.S01.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
