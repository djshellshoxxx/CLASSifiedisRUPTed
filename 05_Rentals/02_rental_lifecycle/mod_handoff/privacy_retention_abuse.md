# PS-042-07 — Privacy, retention and abuse: Rental handoff

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S02.M01 Rental handoff](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_lifecycle/handoff` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-042-07.R01** Reports and photos are P2, travel only as end-to-end encrypted envelopes and attachments to the two parties, and never appear in logs, notifications or public projections.
- **PS-042-07.R02** Photos are stripped of EXIF, XMP and GPS metadata by the sender through F10.S02.M03 before encryption (PRV-4), and the receiving vault checks the decrypted bytes and quarantines any photo that still carries metadata; relays see ciphertext only and perform no content check (ADR-0016 §3, PRV-5); faces and plates are not detected or processed.
- **PS-042-07.R03** Fake or doctored photos and one-sided reports are limited by hashes, explicit exact-cid attestation and the dispute path; no condition truth is claimed.
- **PS-042-07.R04** Every referenced photo is fetched, decrypted, SHA-256 verified and stored locally under RET-EVIDENCE in each vault before it can be attested, and a later message or attachment deletion by its author does not affect evidence copies already stored.
- **PS-042-07.R05** The module registers ExportSectionPort (section rentals.handoffs), DeletionPort and RetentionPurgePort with F10 (N6), classifies every RentalHandoff field through F10.S02.M02, and on privacy.deletion.completed pseudonymizes the deleted party in retained evidence while signatures and photo hashes stay verifiable.
- **PS-042-07.R06** Blocks (N7) never suppress handoff statements for a reservation confirmed before the block - they are verified and stored as evidence with only notifications suppressed.

## Specification

**Data classification**
- RentalHandoff: P2 in both vaults.
- Photos: P2 encrypted attachments; MediaBlob ids in the signed report; verified local copies under RET-EVIDENCE.

**Retention**
- Terminal handoffs, statements and photo copies: RET-EVIDENCE (2 years after last related activity), purged through RetentionPurgePort.
- Quarantined statements and quarantined photos: RET-SHORT (30 days).

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Owner edits the report after the renter attested | attestation binds the exact cid; any edit is a new revision and clears attestations |
| T02 | Renter attests without inspecting | the UI shows a diff and per-item review but cannot force inspection; attestation is evidence of assertion only, stated in the UI |
| T03 | Doctored or reused photos | MediaBlob hashes recorded at signing, takenAt is a claim, metadata stripped; disputes can compare against both parties' verified copies |
| T04 | Forged attestation | signature over JCS bytes and signer role check; non-party keys quarantined |
| T05 | Location leak through photos or readings | sender strips metadata before encryption; receiver quarantines photos with metadata; no GPS fields exist; exact address is never in the report |
| T06 | Evidence disappears because the relay blob expired or the author deleted the message | each vault keeps its own verified copy; attestation requires the copy to be held |
| T07 | Late but honest signature treated as no handoff | window judged on signed createdAt within a 72 h receipt bound; expiry only at startsAt + 96 h |

**Abuse controls**
- Local quarantine and a per-sender quota of 100 inbound handoff statements per day per counterparty.
- Attachment size limit 5 MiB per photo (COMMS_ATTACHMENT_TOO_LARGE) and 20 photos per report, at most 100 MiB per report.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-042-09.T08 | abuse | PS-042-05.R01, PS-042-05.R02, PS-042-05.R03, PS-042-07.R02 | inbound attestation by a non-party key; local attest by the author of the report; photo with GPS EXIF sent by a modified client | the attestation is quarantined with RENTALS_STATEMENT_INVALID; the local attest returns FORBIDDEN; the receiving vault quarantines the photo with RENTALS_PHOTO_METADATA and the relay payload is ciphertext only; no state change |
| TEST-PS-042-09.T10 | abuse | PS-042-07.R01, PS-042-07.R03 | inspect logs, notifications, relay payloads; 101 inbound statements in a day | no item text or photos outside encrypted envelopes; 101st dropped and counted |
| TEST-PS-042-09.T18 | integration | PS-042-07.R04, PS-042-01.R02, PS-042-04.R05 | relay blob of one photo expired before the renter fetched it; author deletes the thread message after the renter stored the other photos; no comms.attachment.deleted reaches the renter vault | the download returns NOT_FOUND, the photo is listed in missingPhotos[] and re-requested, and attest is refused with RENTALS_EVIDENCE_MISSING until re-sent; stored copies stay and verify against their MediaBlob ids after the deletion |
| TEST-PS-042-09.T20 | integration | PS-042-07.R05 | privacy.deletion.completed for the renter; export; retention purge after RET-EVIDENCE | DIDs replaced by the pseudonym; signatures and photo hashes verify; section rentals.handoffs exported; purge removes terminal records and photo copies |
| TEST-PS-042-09.T21 | abuse | PS-042-07.R06 | owner blocks the renter after confirmation, then the renter's attestation arrives | verified and stored, handoff attested, notification suppressed |

## Dependencies

Module depends on: F05.S01.M01, F05.S01.M02, F08.S01.M01, F08.S01.M03, F15.S02.M03, F10.S02.M03, F07.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
