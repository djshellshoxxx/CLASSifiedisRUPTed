# PS-043-07 — Privacy, retention and abuse: Rental return

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S02.M02 Rental return](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_lifecycle/return` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-043-07.R01** Return reports, photos and fees are P2, travel only as end-to-end encrypted envelopes and attachments to the two parties, and never appear in logs, notifications or public projections.
- **PS-043-07.R02** Late fees are claims between the parties and are never collected by the platform; enforcement is by agreement, reputation and disputes only.
- **PS-043-07.R03** False overdue claims and fee inflation are limited by deterministic computation from signed terms, owner-only lowering, and an effective return time bounded by the earliest verifiable evidence rather than either party's own clock.
- **PS-043-07.R04** Return photos are at most 5 MiB each, stripped by the sender through F10.S02.M03, checked for metadata by the receiver after decryption, and kept as verified local copies under RET-EVIDENCE in each vault unaffected by later message deletion.
- **PS-043-07.R05** The module registers ExportSectionPort (section rentals.returns), DeletionPort and RetentionPurgePort with F10 (N6), classifies every RentalReturn field through F10.S02.M02, and on privacy.deletion.completed pseudonymizes the deleted party in retained evidence while signatures stay verifiable.
- **PS-043-07.R06** Blocks (N7) never suppress return statements for a reservation confirmed before the block - a blocked party's report, contest or completion is still verified and stored and the clocks run, so an owner cannot block the renter to suppress the return report and then claim not_returned.

## Specification

**Data classification**
- RentalReturn: P2 in both vaults.
- Return photos: P2 encrypted attachments with MediaBlob ids in the signed report; verified local copies under RET-EVIDENCE.

**Retention**
- Closed returns and statements: RET-EVIDENCE (2 years after last related activity), purged through RetentionPurgePort.
- Quarantined statements and photos: RET-SHORT (30 days).

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Owner inflates the late fee | fee is computed from the terms the renter signed in the request; adjustments can only lower it; the renter's vault recomputes and flags any mismatch in the late-fee Deal |
| T02 | Renter backdates the return | effective return time is the claim only within 72 hours before the earliest verifiable evidence; relay-signed receipt time evidences that relay's clock only |
| T03 | Owner stalls to hold the deposit or raise the late fee | silence after relay receipt is recorded as renter_reported_unconfirmed and stops the fee at the effective time; the deposit decision clock still runs and the renter can dispute |
| T04 | Forged return report or attestation | signature over JCS bytes and signer role check; non-party keys quarantined |
| T05 | Photos swapped between handoff and return | MediaBlob hashes recorded at signing, same stripping rules, differences computed per checklist item |
| T06 | Renter claims a return the owner never received | silence never attests; the owner can contest not_received; the calendar stays blocked and the not_returned path stays open |
| T07 | Owner blocks the renter to suppress the report | lifecycle statements bypass the block drop |

**Abuse controls**
- Local quarantine and a per-sender quota of 100 inbound return statements per day per counterparty.
- Attachment size limit 5 MiB per photo (COMMS_ATTACHMENT_TOO_LARGE) and 20 photos per report.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-043-09.T11 | abuse | PS-043-07.R01, PS-043-07.R02, PS-043-07.R03 | backdated claim 5 days before relay receipt; owner offline 5 days then records receipt; 101 inbound statements in a day; inspect logs | effective time is the relay receipt; fee not raised by the late receipt; 101st dropped; no amounts or notes in logs |
| TEST-PS-043-09.T23 | integration | PS-043-07.R04, PS-043-04.R05 | relay blob of a return photo expired before the owner fetched it; renter deletes the thread message after the owner stored the photos; no comms.attachment.deleted reaches the owner vault; photo with GPS metadata | the download returns NOT_FOUND and the photo is listed in missingPhotos[] and re-requested; attest refused with RENTALS_EVIDENCE_MISSING until re-sent; stored copies stay and verify after deletion; the GPS photo quarantined with RENTALS_PHOTO_METADATA |
| TEST-PS-043-09.T24 | integration | PS-043-07.R05 | privacy.deletion.completed for the renter; export; retention purge after RET-EVIDENCE | DIDs replaced by the pseudonym and signatures verify; section rentals.returns exported; purge removes terminal records |
| TEST-PS-043-09.T25 | abuse | PS-043-07.R06 | owner blocks the renter after handoff, then the renter's return report arrives | verified and stored; silence clock runs from relay receipt; notification suppressed; a later not_returned declaration is refused with PRECONDITION_FAILED |

## Dependencies

Module depends on: F05.S02.M01, F05.S01.M01, F05.S01.M02, F09.S01.M01, F08.S01.M01, F08.S01.M03, F15.S02.M03, F10.S02.M03, F07.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
