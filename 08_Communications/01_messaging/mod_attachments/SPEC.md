# F08.S01.M03 — Message attachments

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F08.S01](../SPEC.md). **Process IDs:** PS-059-01…PS-059-10. **Code:** `packages/comms/src/messaging/attachments`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Encrypted image attachments for private messages (ADR-0016). The sender's vault strips all metadata with the F10.S02.M03 pipeline (EXIF, GPS, XMP, IPTC, ICC description text, thumbnails), re-encodes the image, encrypts it in 64 KiB chunks with a fresh per-object key under a STREAM construction (XChaCha20-Poly1305, nonce = random prefix plus chunk index, last-chunk flag in the additional data) and uploads only ciphertext, stored as an encrypted F15.S02.M03 MediaBlob on the user-selected relay. The object key, nonce prefix, ciphertext hash, chunk count and a random download token travel inside the end-to-end encrypted message body, so recipients verify the downloaded ciphertext before decrypting. Deleting an attachment removes the blob from the relay's live store; it is not crypto-shredding, because recipients who received the message hold the key, and a relay that keeps its own backups could still hold ciphertext, which the UI says. Ciphertext is limited to 5 MiB. A relay without blob storage disables attachments for its users (fail closed). The same pipeline implements the F09.S02.M02 AttachmentTransportPort for dispute evidence, whose key material reaches recipients sealed through the F08.S01.M01 mailbox; thread archives and blocks never stop evidence for a context confirmed before the block.

## Responsibilities

- Own the Attachment record (MediaBlob reference of the ciphertext, sizes, chunk layout, declared media type, slot state) and its lifecycle.
- Run the vault pipeline (F10.S02.M03 strip and verify, re-encode, STREAM chunk-encrypt, queue upload) as one vault command.
- Provide relay commands that issue upload slots to relay-registered device keys, accept chunked ciphertext uploads and finalize them with a hash check into an encrypted MediaBlob (F15.S02.M03).
- Serve ciphertext downloads to holders of the secret download token carried in the encrypted message, and delete blobs on author delete in any message state, abandoned delivery, expiry or account deletion.
- Enforce size, type and quota limits on declared values and on the stored ciphertext length.
- Provide the client-side pipeline contract for metadata stripping before encryption and verification by round-trip tests.
- Register the F10 privacy ports so that account deletion sends signed relay deletes for every uploaded blob while the device keys still exist (N6).
- [object Object]

## Not responsible for

- Message text and key wrapping (F08.S01.M01); the attachment key, nonce prefix, integrity data and blob reference are carried inside the message plaintext.
- Public listing photos and their processing (F01 listing media).
- Image content moderation by the relay; the relay cannot read ciphertext, so reports carry plaintext from the reporter's device (F12.S01.M02).
- Blob storage and content addressing (F15.S02.M03 MediaBlob) and the metadata stripping implementation (F10.S02.M03); this module calls them.
- The meaning of dispute evidence (F09.S02.M02) and the alt text component (F14.S01.M02); this module transports the evidence blob and carries altText and decorative unchanged.
- Future: video and audio attachments, resumable uploads over 5 MiB, perceptual-hash matching on the client.

## User stories

- As a member, I can attach a photo to a message and be sure that location and device data in the photo are removed before it leaves my phone.
- As a recipient, I can view the photo only if I received the encrypted message carrying its download token, and it is removed from the relay's live store when the sender deletes it, although a copy I already saved stays.
- As a member on a slow connection, I see upload progress and can retry without re-selecting the photo.
- As a sender, I am told plainly that deleting a photo removes it from the relay but cannot take it back from people who already saved it.

## Edge cases

- Image yields more than 5 241 600 bytes of plaintext after re-encoding (more than 5 MiB of ciphertext); the client reduces quality in steps down to a minimum of 1280 px on the long edge and otherwise refuses with COMMS_ATTACHMENT_TOO_LARGE; the relay also refuses ciphertext over 5 242 880 bytes.
- Upload is interrupted after 3 of 10 chunks; the slot stays open for 1 hour and the client resumes at the next chunk index.
- File declared as image/jpeg but client-side sniffing shows a different type; the client refuses and the relay can only check the declared type list, so a hostile client may mislabel and recipients treat blobs as untrusted bytes.
- Sender deletes the message while recipients are downloading; downloads in flight finish, later relay requests return NOT_FOUND, and copies already saved by recipients cannot be recalled.
- Sender deletes a message that is still local committed, prepared or failed; the attachment is finalized on the relay already, so comms.message.deleted triggers the signed relay delete anyway.
- The outbox entry of the message expires after 7 days without reaching any relay; the abandoned delivery triggers the signed relay delete of the already finalized blob.
- A hostile relay serves chunks reordered, truncated or with one chunk dropped; the recipient rejects the ciphertext because the hash, chunk count or chunk index nonce does not match, and nothing is decrypted.
- Same photo attached twice; two independent keys and blobs are produced, no deduplication, so identical images cannot be linked.
- Quota exhausted (50 MiB per registered device per day); the next slot request is refused with COMMS_ATTACHMENT_QUOTA.
- An owner blocks the renter after a rental was confirmed and the direct thread is archived with reason blocked; the owner's damage photos for that rental still upload, the renter still downloads them, and only notifications are suppressed (N7a).
- Alt text of 141 characters, or decorative true together with alt text, is refused with VALIDATION_FAILED before encryption.

## UX and accessibility

- Attach sheet: choose photo, shows a preview with a Remove location data and metadata notice, size after processing and a Send button.
- Upload progress bar in the message bubble with cancel and retry.
- Image viewer: full screen, pinch zoom, save to device only on explicit action, report image.
- Delete confirmation: says the photo is removed from the relay's live store, and that people who already saved it, and relay backups the relay may keep, can still hold a copy.

**States:** idle; processing; uploading; uploaded; failed-retry; deleted; expired-slot; quota-exceeded; integrity-failed

**Accessibility:** Progress bar exposes role=progressbar with aria-valuenow and an accessible name.; Images carry an alt text field the sender may fill (plain text of at most 140 characters, the shared MediaRef limit of F14.S01.M02) or a decorative flag, both inside the encrypted body; default alt is Photo attachment and a decorative image renders with empty alt.; Viewer controls are keyboard operable with targets of at least 44 by 44 px.

## Owned data

- `Attachment` (classrup.comms.attachment/v1, P2, RET-SHORT)

## Interfaces

- Commands: `comms.attachment.attach`, `comms.attachment.remove`, `comms.attachment.create_slot`, `comms.attachment.put_chunk`, `comms.attachment.finalize`, `comms.attachment.delete`
- Queries: `comms.attachment.download`
- Emits: `comms.attachment.uploaded`, `comms.attachment.deleted`
- Consumes: `comms.message.deleted`, `federation.delivery.failed`, `privacy.deletion.completed`

## Dependencies

F08.S01.M01, F08.S01.M02, F09.S02.M02, F15.S02.M03, F10.S02.M03, F11.S01.M01, F11.S01.M03, F11.S02.M01, F15.S01.M01, F16.S02.M03, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001, CTR-UX-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-059-01 | [Domain schema](domain_schema.md) | 5 |
| PS-059-02 | [Validation rules](validation_rules.md) | 5 |
| PS-059-03 | [Workflow state machine](workflow_state_machine.md) | 4 |
| PS-059-04 | [Commands, queries and events](commands_queries_events.md) | 5 |
| PS-059-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-059-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-059-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-059-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-059-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 4 |
| PS-059-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/comms/src/messaging/attachments/index.ts`.

## Acceptance criteria

- All tests T01 to T23 pass in CI.
- Fixture images with GPS, XMP and text metadata produce zero metadata after the device pipeline.
- After a message is deleted no ciphertext blob for its attachment exists in the relay's live MediaBlob store.
