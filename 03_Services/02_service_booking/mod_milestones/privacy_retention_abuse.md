# PS-031-07 — Privacy, retention and abuse: Service milestones

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S02.M02 Service milestones](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_booking/milestones` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-031-07.R01** Milestone content, deliverables and notes are P2, travel only as end-to-end encrypted envelopes to the two participants, and never appear in logs or notifications.
- **PS-031-07.R02** Deliverable hashes bind evidence to files without exposing them; relays see ciphertext and size only.
- **PS-031-07.R03** Approval pressure, dummy deliverables and fake payment claims are limited by hash checks, explicit proof labels and the dispute path.
- **PS-031-07.R04** Deliverables are F08.S01.M03 images of at most 5 MiB or external hash references whose bytes never pass through ClassRup.
- **PS-031-07.R05** The module registers ExportSectionPort (section services.milestones), DeletionPort and RetentionPurgePort with F10 (N6), classifies fields with F10.S02.M02, drops milestone statements from blocked DIDs at ingestion (N7) and pseudonymizes the counterparty on privacy.deletion.completed.

## Specification

**Data classification**
- Milestone, Submission, completion signatures: P2, fields classified with F10.S02.M02.
- Deliverable files: F08.S01.M03 encrypted images up to 5 MiB by reference, or external_hash references (name, size, SHA-256) whose bytes are exchanged outside ClassRup; the SHA-256 is recorded in the signed submission.

**Retention**
- Terminal milestones: RET-EVIDENCE (2 years after last related activity), purged through the RetentionPurgePort.
- Quarantined statements: RET-SHORT (30 days) with the failure code.
- On privacy.deletion.completed: the counterparty DID is replaced with the deletion pseudonym; signatures are kept and flagged unverifiable-after-pseudonymization.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Provider submits empty or dummy files to trigger payment | client sees deliverable fingerprints and integrity result, can request changes up to 3 times, and the dispute path stays open |
| T02 | Client falsely says paid | payment shows claimed (unverified) until the payee acknowledges or the chain is final; the booking does not complete on a claim |
| T03 | Provider alters a file after submission | the signed submission carries SHA-256; a mismatch is shown as hash differs and approval is disabled for that file |
| T04 | Replay of an old approval onto a new submission | approval names the exact submission cid; mismatch returns SERVICES_SUBMISSION_STALE |
| T05 | Relay tampers with or reorders statements | signatures cover JCS bytes; reordering is harmless because each statement names its predecessor cid |
| T06 | Proof shown stronger than reality after a reorg | commerce.payment.reorged and commerce.payment.failed lower the proof level; settlement only at acknowledged or final |
| T07 | Provider changes amounts or titles after acceptance | milestones come only from the client-signed quote plan; ids are derived, never assigned |

**Abuse controls**
- Local quarantine and per-sender quota of 100 inbound milestone statements per day per booking counterparty.
- Reports and dispute opening are available on every milestone (F03.S02.M03).

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-031-09.T10 | abuse | PS-031-07.R02, PS-031-07.R03 | alter a file after submission; 101 inbound statements from one counterparty | hash differs shown and approval disabled; 101st dropped and counted |
| TEST-PS-031-09.T15 | integration | PS-031-07.R01 | inspect the diagnostics log and every notification payload during submit, approve, settle and completion | no file names, notes or amounts; only references and template keys |
| TEST-PS-031-09.T19 | abuse | PS-031-07.R04, PS-031-02.R02 | submission with a 6 MiB image, a PDF as attachment, and a PDF as external_hash | first two VALIDATION_FAILED; external hash accepted and verified locally |
| TEST-PS-031-09.T21 | integration | PS-031-07.R05 | statements from a blocked DID; privacy.deletion.completed for the counterparty; export | dropped silently; counterparty pseudonymized; export section services.milestones present |

## Dependencies

Module depends on: F03.S02.M01, F09.S01.M01, F09.S01.M03, F08.S01.M03, F07.S01.M01, F07.S02.M02, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
