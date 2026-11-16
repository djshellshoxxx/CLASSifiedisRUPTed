# PS-059-07 — Privacy, retention and abuse: Message attachments

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S01.M03 Message attachments](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/messaging/attachments` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-059-07.R01** The relay stores only ciphertext and the sizes needed for storage; media type is declared and unverified, and filenames are never stored; the relay sees the uploader's relay identity and upload time, which is disclosed.
- **PS-059-07.R02** Client-side stripping removes EXIF, GPS, XMP, IPTC and embedded thumbnails by decoding and re-encoding pixels; this is tested on device but the relay cannot verify it, which is stated in documentation.
- **PS-059-07.R03** Crypto-shredding works because the object key lives only in encrypted message bodies, so erasing the blob makes remaining message copies unusable.

## Specification

**Data classification**
- Attachment ciphertext: P2, opaque to the relay.
- Attachment metadata (uploader relay identity, size, declared type, timestamps): P2 visible to the relay operator.

**Retention**
- Relay blobs: RET-SHORT (30 days, author may extend to 90) or immediately on author delete; vault copies follow the vault retention of the message.
- Expired slots and partial chunks: erased within 1 hour of expiry.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Photo leaks home location through GPS EXIF | device pipeline decodes and re-encodes pixels dropping all metadata; conformance test fixtures with GPS tags must produce zero metadata fields |
| T02 | Malicious file disguised as image | recipients decode with a sandboxed image decoder, never execute; size and type limits; unknown bytes render as an error |
| T03 | Storage exhaustion by flooding uploads | relay quotas of 3 pending slots, 50 MiB per day and 60 slots per day per registered device, 5-minute slot sweep; relay hosting policy may lower them |
| T04 | Linking identical images across users | per-object random key and nonce so ciphertext of the same image is different every time; no deduplication |
| T05 | Unwanted explicit image from a stranger | recipient vault blurs images from threads where the recipient has not replied yet; the recipient can block and report |

**Abuse controls**
- Reports include the decrypted image from the reporter's vault to the chosen relay operator or advisory feed (F12.S01.M02) after explicit confirmation.
- Relay-local rate limits apply; no global signal exists.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-059-09.T02 | unit | PS-059-01.R02, PS-059-07.R02, PS-059-09.R03 | run client pipeline on the three metadata fixtures | output has zero EXIF, GPS, XMP, IPTC, thumbnail and text chunks |
| TEST-PS-059-09.T03 | unit | PS-059-02.R03, PS-059-07.R01 | finalize with wrong hash and with truncated blob | COMMS_ATTACHMENT_HASH_MISMATCH and blob not downloadable |
| TEST-PS-059-09.T10 | abuse | PS-059-07.R03, PS-059-02.R03 | after message delete try to decrypt remaining message copy with key | blob missing so decryption impossible; 61st slot in a day returns RATE_LIMITED |
| TEST-PS-059-09.T11 | abuse | PS-059-07.R01 | inspect database and storage dump | only ciphertext, sizes and declared type present; no filenames or plaintext metadata |

## Dependencies

Module depends on: F08.S01.M01, F08.S01.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
