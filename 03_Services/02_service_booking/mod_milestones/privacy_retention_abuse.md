# PS-031-07 — Privacy, retention and abuse: Service milestones

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S02.M02 Service milestones](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_booking/milestones` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-031-07.R01** Milestone content, deliverables and notes are P2, travel only as end-to-end encrypted envelopes to the two participants, and never appear in logs or notifications.
- **PS-031-07.R02** Deliverable hashes bind evidence to files without exposing them; relays see ciphertext and size only.
- **PS-031-07.R03** Approval pressure, dummy deliverables and fake payment claims are limited by hash checks, explicit proof labels and the dispute path.

## Specification

**Data classification**
- Milestone, Submission: P2.
- Deliverable files: P2 attachments by reference (F08.S01.M03), SHA-256 recorded in the signed submission.

**Retention**
- Terminal milestones: RET-EVIDENCE (2 years after last related activity).
- Quarantined statements: RET-SHORT (30 days) with the failure code.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Provider submits empty or dummy files to trigger payment | client sees deliverable fingerprints and integrity result, can request changes up to 3 times, and the dispute path stays open |
| T02 | Client falsely says paid | payment shows claimed (unverified) until the payee acknowledges or the chain is final; the booking does not complete on a claim |
| T03 | Provider alters a file after submission | the signed submission carries SHA-256; a mismatch is shown as hash differs and approval is disabled for that file |
| T04 | Replay of an old approval onto a new submission | approval names the exact submission cid; mismatch returns SERVICES_SUBMISSION_STALE |
| T05 | Relay tampers with or reorders statements | signatures cover JCS bytes; reordering is harmless because each statement names its predecessor cid |

**Abuse controls**
- Local quarantine and per-sender quota of 100 inbound milestone statements per day per booking counterparty.
- Reports and dispute opening are available on every milestone (F03.S02.M03).

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-031-09.T10 | abuse | PS-031-07.R01, PS-031-07.R02, PS-031-07.R03 | alter a file after submission; 101 inbound statements from one counterparty | hash differs shown and approval disabled; 101st dropped and counted |

## Dependencies

Module depends on: F03.S02.M01, F09.S01.M01, F08.S01.M03, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
