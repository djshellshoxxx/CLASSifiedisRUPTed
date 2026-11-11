# PS-059-02 — Validation rules: Message attachments

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S01.M03 Message attachments](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/messaging/attachments` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-059-02.R01** Slot requests and uploads are validated against declared limits before any bytes are accepted.
- **PS-059-02.R02** Finalization verifies stored length and hash against the declared values before the blob becomes downloadable.
- **PS-059-02.R03** Every violation maps to one stable error code.
- **PS-059-02.R04** Recipients validate the downloaded ciphertext against cipherSha256, cipherSize and chunkCount from the encrypted message body before decrypting any chunk, and reject reordered, truncated or dropped chunks.
- **PS-059-02.R05** Thread archives and blocks never stop evidence for a context confirmed before the block - attaching, uploading, finalizing, relay deletes and downloads of such attachments proceed whatever the thread state, and only notifications are suppressed (N7a).

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | declaredType is one of image/jpeg, image/png, image/webp | COMMS_ATTACHMENT_TYPE_UNSUPPORTED |
| V02 | plainSize between 1 and 5 241 600, chunkCount equals ceil(plainSize / 65 536) and the ciphertext is at most 5 242 880 bytes | COMMS_ATTACHMENT_TOO_LARGE |
| V03 | in the vault the thread exists and the sender is a participant, and the thread is active or archived with reason blocked while the attachment is evidence for a context confirmed before the block (N7a, for example a rental handoff or damage photo); dispute evidence sent through the AttachmentTransportPort needs no thread | NOT_FOUND |
| V04 | the registered device has fewer than 3 pending slots and used less than 50 MiB of ciphertext in the last 24 h | COMMS_ATTACHMENT_QUOTA |
| V05 | each uploaded chunk has index within range, length 65 536 plus 16 (last chunk shorter) and arrives within the slot lifetime | VALIDATION_FAILED |
| V06 | finalize ciphertext length equals cipherSize and SHA-256 equals the declared hash | COMMS_ATTACHMENT_HASH_MISMATCH |
| V07 | slot not expired at upload or finalize | EXPIRED |
| V08 | a registered device requests at most 60 slots per day, enforced by the relay through RateLimitPort (F12.S03.M03) | RATE_LIMITED |
| V09 | every relay command presents a valid relay access token of a registered device; a missing or invalid token is refused before any other check | UNAUTHENTICATED |
| V10 | recipient: SHA-256 of the downloaded ciphertext equals cipherSha256 from the encrypted body, its length equals cipherSize, and chunk i decrypts only under nonce prefix plus index i with the last flag set only on chunk chunkCount - 1 | COMMS_ATTACHMENT_HASH_MISMATCH |
| V11 | the processed image passes F10.S02.M03 verifyImageClean before encryption | VALIDATION_FAILED |
| V12 | altText, when present, is plain text of at most 140 characters (the shared MediaRef limit of F14.S01.M02), decorative, when present, is a boolean, and decorative true carries no altText | VALIDATION_FAILED |
| V13 | an inbound classrup.comms.attachment_share/v1 is signed by a device key of its uploader, names recipients that include the local principal, and after download the decrypted plaintext's content address equals the blobRef the sharing statement cites; otherwise it is quarantined | COMMS_ATTACHMENT_HASH_MISMATCH |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-059-09.T01 | unit | PS-059-01.R01, PS-059-01.R03, PS-059-02.R01, PS-059-02.R02 | create slots for allowed types and sizes and for the boundaries 5 241 600 and 5 241 601 bytes of plaintext | allowed accepted; larger refused with COMMS_ATTACHMENT_TOO_LARGE; svg refused with TYPE_UNSUPPORTED |
| TEST-PS-059-09.T03 | unit | PS-059-02.R03, PS-059-02.R02 | finalize with wrong hash and with truncated blob | COMMS_ATTACHMENT_HASH_MISMATCH and blob not downloadable |
| TEST-PS-059-09.T10 | abuse | PS-059-01.R02, PS-059-07.R03, PS-059-02.R03 | after message delete inspect the relay live store and the relay backup set; a recipient who saved key and blob opens it; 61st slot in a day | blob absent from live store and backup set; the saved copy still opens as documented; RATE_LIMITED |
| TEST-PS-059-09.T16 | abuse | PS-059-01.R04, PS-059-01.R05, PS-059-02.R04 | hostile relay serves chunks reordered, truncated, with one chunk dropped and with the last chunk flag moved | recipient rejects with COMMS_ATTACHMENT_HASH_MISMATCH before decrypting; no plaintext produced |
| TEST-PS-059-09.T21 | unit | PS-059-01.R05, PS-059-02.R03 | attach with altText of 140 and 141 characters, decorative true without and with altText, then decrypt the message body | 140 accepted and carried with decorative inside the encrypted body; 141 and decorative with altText refused with VALIDATION_FAILED; nothing reaches the relay in plaintext |
| TEST-PS-059-09.T22 | integration | PS-059-02.R05, PS-059-02.R01 | owner O blocks renter R after a rental was confirmed, the direct thread is archived with reason blocked, then O attaches a damage photo for that rental and R downloads it; O then attaches a photo to an unrelated new conversation with R | evidence attach, upload, finalize and download succeed and only the notification is suppressed; the unrelated attach is refused with NOT_FOUND |
| TEST-PS-059-09.T23 | integration | PS-059-04.R05, PS-059-02.R04 | F09.S02.M02 calls AttachmentTransportPort.send for a stripped evidence MediaBlob with recipients B and a mediator M; a tampered share whose plaintext differs from the cited blobRef | ciphertext uploaded once, one attachment_share statement sealed per recipient through the F08.S01.M01 MailboxPort, B and M store a MediaBlob whose content address equals blobRef; the tampered share is quarantined with COMMS_ATTACHMENT_HASH_MISMATCH |

## Dependencies

Module depends on: F08.S01.M01, F08.S01.M02, F09.S02.M02, F15.S02.M03, F10.S02.M03, F11.S01.M01, F11.S01.M03, F11.S02.M01, F15.S01.M01, F16.S02.M03, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
