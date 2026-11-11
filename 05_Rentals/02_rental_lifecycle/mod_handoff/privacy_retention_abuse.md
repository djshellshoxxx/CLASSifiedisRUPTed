# PS-042-07 — Privacy, retention and abuse: Rental handoff

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S02.M01 Rental handoff](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_lifecycle/handoff` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-042-07.R01** Reports and photos are P2, travel only as end-to-end encrypted envelopes and attachments to the two parties, and never appear in logs, notifications or public projections.
- **PS-042-07.R02** Photos are re-encoded with all metadata stripped before hashing; GPS tags are never stored (PRV-4); faces and plates are not detected or processed.
- **PS-042-07.R03** Fake or doctored photos and one-sided reports are limited by hashes, explicit exact-cid attestation and the dispute path; no condition truth is claimed.

## Specification

**Data classification**
- RentalHandoff: P2 in both vaults.
- Photos: P2 encrypted attachments; hashes in the signed report.

**Retention**
- Terminal handoffs and statements: RET-EVIDENCE (2 years after last related activity).
- Quarantined statements: RET-SHORT (30 days).

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Owner edits the report after the renter attested | attestation binds the exact cid; any edit is a new revision and clears attestations |
| T02 | Renter attests without inspecting | the UI shows a diff and per-item review but cannot force inspection; attestation is evidence of assertion only, stated in the UI |
| T03 | Doctored or reused photos | hashes recorded at signing, takenAt is a claim, metadata stripped; disputes can compare against both parties' copies |
| T04 | Forged attestation | signature over JCS bytes and signer role check; non-party keys quarantined |
| T05 | Location leak through photos or readings | metadata stripped; no GPS fields exist; exact address is never in the report |

**Abuse controls**
- Local quarantine and a per-sender quota of 100 inbound handoff statements per day per counterparty.
- Attachment size limit 10 MB per photo and 50 MB per report (PAYLOAD_TOO_LARGE).

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-042-09.T10 | abuse | PS-042-07.R01, PS-042-07.R02, PS-042-07.R03 | inspect logs, notifications, relay payloads; 101 inbound statements in a day | no item text or photos outside encrypted envelopes; 101st dropped and counted |

## Dependencies

Module depends on: F05.S01.M01, F05.S01.M02, F08.S01.M03, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
