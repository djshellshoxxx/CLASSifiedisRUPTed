# PS-059-07 — Privacy, retention and abuse: Message attachments

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S01.M03 Message attachments](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/messaging/attachments` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-059-07.R01** The relay stores only ciphertext and the sizes needed for storage; media type is declared and unverified, filenames and threadIds are never stored; the relay sees the uploader's relay identity and upload time, which is disclosed.
- **PS-059-07.R02** Client-side stripping uses F10.S02.M03 stripImage and verifyImageClean, removing EXIF, GPS, XMP, IPTC and embedded thumbnails by decoding and re-encoding pixels; this is tested on device but the relay cannot verify it inside ciphertext, which is stated in documentation.
- **PS-059-07.R03** Deleting a blob removes it from the relay's live store only; attachment blobs are excluded from this module's relay backup set, but a relay keeping its own backups (up to 12 months under CTR-IOX-001 IOX-3) and recipients who saved the key and blob can still recover the attachment, which the UI and documentation state; true shredding is the sender erasing its key, with recipients erasing theirs on a verified delete request as best effort.
- **PS-059-07.R04** Privacy duties (N6): fields are classified per F10.S02.M02, ExportSectionPort, DeletionPort and RetentionPurgePort are registered, and deletion sends signed relay deletes before the keys are destroyed.

## Specification

**Data classification**
- Attachment ciphertext: P2, opaque to the relay, stored as an encrypted MediaBlob.
- Attachment metadata (uploader relay identity, size, declared type, thread label hash, timestamps): P2 visible to the relay operator.
- Object key and nonce prefix: P4 inside encrypted message bodies only.

**Retention**
- Relay blobs and rows: RET-SHORT (30 days after upload) or immediately on delete; no extension.
- Vault copies follow the vault retention of the referencing message (RET-STANDARD).
- Relay backups: attachment blobs are excluded; only rows are backed up.
- Expired slots and partial chunks: erased within 1 hour of expiry.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Photo leaks home location through GPS EXIF | F10.S02.M03 pipeline decodes and re-encodes pixels dropping all metadata and verifyImageClean runs before encryption; conformance fixtures with GPS tags must produce zero metadata fields |
| T02 | Malicious file disguised as image | recipients decode with a sandboxed image decoder, never execute; size and type limits; unknown bytes render as an error |
| T03 | Storage exhaustion by flooding uploads | relay quotas of 3 pending slots, 50 MiB per day and 60 slots per day per registered device through RateLimitPort, 5-minute slot sweep; relay hosting policy may lower them |
| T04 | Linking identical images across users | per-object random key and nonce prefix so ciphertext of the same image is different every time; no deduplication |
| T05 | Unwanted explicit image from a stranger | recipient vault blurs images from threads where the recipient has not replied yet; the recipient can block and report |
| T06 | Hostile relay reorders, truncates or drops chunks | STREAM nonces bind the chunk index, the additional data binds attachmentId, chunkCount and the last-chunk flag, and the recipient checks cipherSha256 and cipherSize from the encrypted body before decrypting |
| T07 | Deleted attachment recovered from relay backups or recipient copies | blobs are excluded from this module's relay backup set; the UI and documentation state that relay-kept backups and recipients who saved key and blob can still recover it |

**Abuse controls**
- Reports include the decrypted image from the reporter's vault to the chosen relay operator or advisory feed (F12.S01.M02) after explicit confirmation.
- Relay-local rate limits apply through RateLimitPort (F12.S03.M03); no global signal exists.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-059-09.T02 | unit | PS-059-07.R02, PS-059-09.R03 | run the F10.S02.M03 client pipeline on the three metadata fixtures | output has zero EXIF, GPS, XMP, IPTC, thumbnail and text chunks and verifyImageClean passes |
| TEST-PS-059-09.T10 | abuse | PS-059-01.R02, PS-059-07.R03, PS-059-02.R03 | after message delete inspect the relay live store and the relay backup set; a recipient who saved key and blob opens it; 61st slot in a day | blob absent from live store and backup set; the saved copy still opens as documented; RATE_LIMITED |
| TEST-PS-059-09.T11 | abuse | PS-059-07.R01 | inspect database and storage dump | only ciphertext, sizes, declared type and thread label hashes present; no filenames, threadIds or plaintext metadata |
| TEST-PS-059-09.T18 | integration | PS-059-04.R04, PS-059-07.R04 | account deletion with three uploaded attachments | DeletionPort.execute sends three signed relay deletes before keys are destroyed; privacy.deletion.completed finds nothing to sign; export section comms.attachments present beforehand |
| TEST-PS-059-09.T20 | unit | PS-059-07.R03 | render the delete confirmation and documentation page | text says removed from the relay's live store and that recipients who saved it and relay-kept backups may still hold a copy; it never says crypto-shredded |

## Dependencies

Module depends on: F08.S01.M01, F08.S01.M02, F15.S02.M03, F10.S02.M03, F11.S02.M01, F15.S01.M01, F16.S02.M03, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
