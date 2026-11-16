# PS-059-01 — Domain schema: Message attachments

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S01.M03 Message attachments](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/messaging/attachments` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-059-01.R01** An Attachment stores sender, thread, ciphertext blob reference, ciphertext size, chunk size and count, ciphertext hash and declared media type; it never stores the object key or any plaintext metadata.
- **PS-059-01.R02** Attachments are P2 ciphertext with RET-STANDARD retention; deleting the blob is the crypto-shredding action because the key exists only inside encrypted messages.
- **PS-059-01.R03** Plaintext limits are 5 MiB (5 242 880 bytes) after processing, 4096 px maximum on the long edge, and media types image/jpeg, image/png and image/webp only.

## Specification

### Attachment

Schema `classrup.comms.attachment/v1` · storage **relay+device** · privacy **P2** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key, client generated |
| tenantId | uuidv7 — tenant scope |
| threadId | uuidv7 — ref F08.S01.M02 Thread in the sender vault; the relay stores it only as an opaque label hash |
| uploaderDid | did:key — sender device principal that holds the relay access token |
| messageId? | uuidv7 — ref F08.S01.M01 Message; set when the message referencing this blob is sent |
| declaredType | enum — image/jpeg \| image/png \| image/webp |
| plainSize | int — 1..5 242 880 bytes, declared |
| cipherSize | int — plainSize + 16 bytes per 64 KiB chunk, at most 5 242 880 + 1 280 bytes |
| chunkSize | int — fixed 65 536 |
| chunkCount | int — 1..80 |
| cipherSha256 | bytes — SHA-256 of the full ciphertext, 32 bytes, set at finalize |
| blobRef | string — relay storage key, never returned to callers |
| downloadTokenHash | bytes — SHA-256 of the 256-bit download token; the token itself lives only in the encrypted message body |
| status | enum — pending \| uploaded \| deleted \| expired |
| uploadExpiresAt | timestamp — createdAt + 1 h |
| createdAt | timestamp — RFC 3339 UTC |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- status uploaded implies cipherSha256 matches the stored blob and cipherSize equals the stored length.
- status deleted or expired implies blobRef is erased and no blob exists in storage.
- An Attachment is referenced by at most one Message.

### Storage DDL

```sql
CREATE TABLE comms_attachment (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, thread_id TEXT NOT NULL, uploader_id TEXT NOT NULL, message_id TEXT,
  status TEXT NOT NULL, cipher_size INTEGER NOT NULL, upload_expires_at TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE INDEX comms_attachment_thread ON comms_attachment(tenant_id, thread_id, status);
CREATE INDEX comms_attachment_uploader_day ON comms_attachment(uploader_id, status, upload_expires_at);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-059-09.T01 | unit | PS-059-01.R01, PS-059-01.R03, PS-059-02.R01, PS-059-02.R02 | create slots for allowed types and sizes and for boundary 5 242 880 and 5 242 881 | allowed accepted; larger refused with COMMS_ATTACHMENT_TOO_LARGE; svg refused with TYPE_UNSUPPORTED |
| TEST-PS-059-09.T02 | unit | PS-059-01.R02, PS-059-07.R02, PS-059-09.R03 | run client pipeline on the three metadata fixtures | output has zero EXIF, GPS, XMP, IPTC, thumbnail and text chunks |

## Dependencies

Module depends on: F08.S01.M01, F08.S01.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001. Predecessor: [module SPEC](SPEC.md).
