# PS-059-01 — Domain schema: Message attachments

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S01.M03 Message attachments](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/messaging/attachments` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-059-01.R01** An Attachment stores sender, thread label hash, the MediaBlob reference of the ciphertext, ciphertext size, chunk size and count, ciphertext hash, declared media type and slot state; it never stores the object key, the nonce prefix or any plaintext metadata, and the ciphertext bytes are an encrypted MediaBlob held by F15.S02.M03.
- **PS-059-01.R02** Relay-side attachment rows and blobs are RET-SHORT (deleted 30 days after upload, or earlier on delete) and the vault copy follows the referencing message's RET-STANDARD; deleting the blob removes it from the relay's live store, which is not crypto-shredding in the CTR-PRV-001 sense because every recipient of the message holds the per-object key.
- **PS-059-01.R03** Limits are 5 MiB (5 242 880 bytes) of ciphertext, which allows at most 5 241 600 bytes of processed plaintext in at most 80 chunks, 4096 px maximum on the long edge, and media types image/jpeg, image/png and image/webp only.
- **PS-059-01.R04** Encryption is a STREAM construction over XChaCha20-Poly1305 with a fresh 32-byte key: chunk i (65 536 bytes, last chunk shorter) is sealed with the 24-byte nonce = 20-byte random prefix || uint32 big-endian i and additional data JCS({attachmentId, chunkCount, index: i, last: i = chunkCount - 1}), so reordering, truncation or dropping of chunks fails authentication.
- **PS-059-01.R05** The encrypted message body (F08.S01.M01) carries {attachmentId, relayId, blobRef, key, noncePrefix, cipherSha256, cipherSize, plainSize, chunkCount, declaredType, downloadToken, altText?}; recipients check cipherSha256 and cipherSize of the downloaded ciphertext against these values before decrypting any chunk.

## Specification

### Attachment

Schema `classrup.comms.attachment/v1` · storage **relay+device** · privacy **P2** · retention **RET-SHORT**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key, client generated |
| tenantId | uuidv7 — tenant scope |
| threadId? | uuidv8 — vault only: ref F08.S01.M02 Thread; never sent to the relay |
| threadLabelHash | string — relay copy: HMAC-SHA256 of threadId under a per-device salt, opaque to the relay and used only for quota grouping |
| uploaderDid | did:key — sender principal whose registered device holds the relay access token |
| messageId? | uuidv7 — vault only: ref F08.S01.M01 Message; set when the message referencing this blob is composed |
| declaredType | enum — image/jpeg \| image/png \| image/webp |
| plainSize | int — 1..5 241 600 bytes, declared |
| cipherSize | int — plainSize + 16 bytes per chunk, at most 5 242 880 bytes |
| chunkSize | int — fixed 65 536 |
| chunkCount | int — 1..80 |
| cipherSha256 | bytes — SHA-256 of the full ciphertext, 32 bytes, set at finalize |
| blobRef? | string — blob:sha256-<base64url> F15.S02.M03 MediaBlob ref of the ciphertext with encrypted true; set at finalize, never returned to download callers |
| downloadTokenHash | bytes — SHA-256 of the 256-bit download token; the token itself lives only in the encrypted message body |
| status | enum — pending \| uploaded \| deleted \| expired |
| uploadExpiresAt | timestamp — createdAt + 1 h |
| retainUntil? | timestamp — relay-signed in the finalize response: uploadedAt + 30 days |
| createdAt | timestamp — RFC 3339 UTC |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- status uploaded implies cipherSha256 matches the stored MediaBlob and cipherSize equals its length.
- status deleted or expired implies blobRef is detached and the MediaBlob is deleted from the relay's live store.
- An Attachment is referenced by at most one Message.
- The relay copy never holds threadId, the object key, the nonce prefix or any plaintext metadata.

### Storage DDL

```sql
CREATE TABLE comms_attachment (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, thread_label_hash TEXT NOT NULL, uploader_id TEXT NOT NULL,
  status TEXT NOT NULL, cipher_size INTEGER NOT NULL, blob_ref TEXT, upload_expires_at TEXT NOT NULL,
  retain_until TEXT, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE INDEX comms_attachment_label ON comms_attachment(tenant_id, thread_label_hash, status);
CREATE INDEX comms_attachment_uploader_day ON comms_attachment(uploader_id, status, upload_expires_at);
CREATE INDEX comms_attachment_retain ON comms_attachment(status, retain_until);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-059-09.T01 | unit | PS-059-01.R01, PS-059-01.R03, PS-059-02.R01, PS-059-02.R02 | create slots for allowed types and sizes and for the boundaries 5 241 600 and 5 241 601 bytes of plaintext | allowed accepted; larger refused with COMMS_ATTACHMENT_TOO_LARGE; svg refused with TYPE_UNSUPPORTED |
| TEST-PS-059-09.T10 | abuse | PS-059-01.R02, PS-059-07.R03, PS-059-02.R03 | after message delete inspect the relay live store and the relay backup set; a recipient who saved key and blob opens it; 61st slot in a day | blob absent from live store and backup set; the saved copy still opens as documented; RATE_LIMITED |
| TEST-PS-059-09.T16 | abuse | PS-059-01.R04, PS-059-01.R05, PS-059-02.R04 | hostile relay serves chunks reordered, truncated, with one chunk dropped and with the last chunk flag moved | recipient rejects with COMMS_ATTACHMENT_HASH_MISMATCH before decrypting; no plaintext produced |
| TEST-PS-059-09.T17 | integration | PS-059-01.R01 | finalize an upload and inspect storage | ciphertext stored as MediaBlob blob:sha256-… with encrypted true; the attachment row holds only slot, chunk and size metadata |

## Dependencies

Module depends on: F08.S01.M01, F08.S01.M02, F15.S02.M03, F10.S02.M03, F11.S02.M01, F15.S01.M01, F16.S02.M03, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001, CTR-UX-001. Predecessor: [module SPEC](SPEC.md).
