# PS-059-10 — Import, export, backup and rollback: Message attachments

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S01.M03 Message attachments](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/messaging/attachments` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-059-10.R01** A user's vault export contains attachment metadata and the ciphertext they hold locally, and the key remains only inside the exported encrypted messages.
- **PS-059-10.R02** Import validates sizes, hashes and thread existence; rows whose blob is missing or fails the hash are kept as expired history.
- **PS-059-10.R03** Schema changes follow expand and contract; a new chunk size is introduced as a new field value while v1 chunk size 65 536 stays readable.

## Specification

- **export:** Section comms.attachments in classrup-export/v1, registered through ExportSectionPort; one line per Attachment (schema classrup.comms.attachment/v1) with blobs as separate files named by attachment ID in the archive.
- **import:** Hash is recomputed per blob; mismatches or oversize items are rejected; existing IDs are skipped; imported items get status uploaded only when the thread exists and is active, otherwise expired.
- **backup:** The vault export is the primary backup (IOX-6); relay attachment rows are covered by the relay SQLite backup (IOX-3, IOX-7) while the attachment MediaBlobs are excluded from relay backups; losing a relay loses no user-owned record.
- **migration rollback:** Additive fields only in v1; rollback is safe because older versions ignore unknown fields and still read chunkSize 65 536 attachments.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-059-09.T14 | integration | PS-059-10.R01, PS-059-10.R02, PS-059-10.R03 | export, re-import and restore from backup | attachment rows and ciphertext round trip identical; import with missing blob marks row expired |

## Dependencies

Module depends on: F08.S01.M01, F08.S01.M02, F15.S02.M03, F10.S02.M03, F11.S02.M01, F15.S01.M01, F16.S02.M03, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
