# F08.S01.M03 — Message attachments

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F08.S01](../SPEC.md). **Process IDs:** PS-059-01…PS-059-10. **Code:** `packages/comms/src/messaging/attachments`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Encrypted image attachments for private messages (ADR-0016). The sender's vault strips all metadata (EXIF, GPS, XMP, ICC description text, thumbnails), re-encodes the image, encrypts it in 64 KiB chunks with a fresh per-object key (XChaCha20-Poly1305) and uploads only ciphertext to the blob store of the user-selected relay. The object key and a random download token travel inside the end-to-end encrypted message body, so deleting the ciphertext blob crypto-shreds the attachment for everyone who has not yet saved it. Images are limited to 5 MiB. A relay without blob storage disables attachments for its users (fail closed).

## Responsibilities

- Own the Attachment record (ciphertext blob reference, size, chunk layout, declared media type) and its lifecycle.
- Run the vault pipeline (strip metadata, re-encode, chunk-encrypt, queue upload) as one vault command.
- Provide relay commands that issue upload slots to relay-registered device keys, accept chunked ciphertext uploads and finalize them with a hash check.
- Serve ciphertext downloads to holders of the secret download token carried in the encrypted message, and delete blobs on author delete, expiry or vault wipe request.
- Enforce size, type and quota limits on declared values and on the stored ciphertext length.
- Provide the client-side pipeline contract for metadata stripping before encryption and verification by round-trip tests.

## Not responsible for

- Message text and key wrapping (F08.S01.M01); the attachment key and blob ID are carried inside the message plaintext.
- Public listing photos and their processing (F01 listing media).
- Image content moderation by the relay; the relay cannot read ciphertext, so reports carry plaintext from the reporter's device (F12.S01.M02).
- Future: video and audio attachments, resumable uploads over 5 MiB, perceptual-hash matching on the client.

## User stories

- As a member, I can attach a photo to a message and be sure that location and device data in the photo are removed before it leaves my phone.
- As a recipient, I can view the photo only if I received the encrypted message carrying its download token, and it stops being downloadable from the relay when the sender deletes it, although a copy I already saved stays.
- As a member on a slow connection, I see upload progress and can retry without re-selecting the photo.

## Edge cases

- Image is 5 MiB plus one byte after re-encoding; the client reduces quality in steps down to a minimum of 1280 px on the long edge and otherwise refuses with COMMS_ATTACHMENT_TOO_LARGE; the relay also refuses ciphertext over 5 MiB plus chunk overhead.
- Upload is interrupted after 3 of 10 chunks; the slot stays open for 1 hour and the client resumes at the next chunk index.
- File declared as image/jpeg but client-side sniffing shows a different type; the client refuses and the relay can only check the declared type list, so a hostile client may mislabel and recipients treat blobs as untrusted bytes.
- Sender deletes the message while recipients are downloading; downloads in flight finish, later relay requests return NOT_FOUND, and copies already saved by recipients cannot be recalled.
- Same photo attached twice; two independent keys and blobs are produced, no deduplication, so identical images cannot be linked.
- Quota exhausted (50 MiB per member per day); the next slot request is refused with COMMS_ATTACHMENT_QUOTA.

## UX and accessibility

- Attach sheet: choose photo, shows a preview with a Remove location data and metadata notice, size after processing and a Send button.
- Upload progress bar in the message bubble with cancel and retry.
- Image viewer: full screen, pinch zoom, save to device only on explicit action, report image.

**States:** idle; processing; uploading; uploaded; failed-retry; deleted; expired-slot; quota-exceeded

**Accessibility:** Progress bar exposes role=progressbar with aria-valuenow and an accessible name.; Images carry an alt text field the sender may fill (max 200 characters) that travels inside the encrypted body; default alt is Photo attachment.; Viewer controls are keyboard operable with targets of at least 44 by 44 px.

## Owned data

- `Attachment` (classrup.comms.attachment/v1, P2, RET-STANDARD)

## Interfaces

- Commands: `comms.attachment.attach`, `comms.attachment.create_slot`, `comms.attachment.put_chunk`, `comms.attachment.finalize`, `comms.attachment.delete`
- Queries: `comms.attachment.download`
- Emits: `comms.attachment.uploaded`, `comms.attachment.deleted`
- Consumes: `comms.message.deleted`, `privacy.deletion.completed`

## Dependencies

F08.S01.M01, F08.S01.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-059-01 | [Domain schema](domain_schema.md) | 3 |
| PS-059-02 | [Validation rules](validation_rules.md) | 3 |
| PS-059-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-059-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-059-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-059-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-059-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-059-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-059-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-059-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/comms/src/messaging/attachments/index.ts`.

## Acceptance criteria

- All tests T01 to T15 pass in CI.
- Fixture images with GPS, XMP and text metadata produce zero metadata after the device pipeline.
- After a message is deleted no ciphertext blob for its attachment exists on the relay.
