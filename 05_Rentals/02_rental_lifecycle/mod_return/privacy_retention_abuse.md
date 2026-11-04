# PS-043-07 — Privacy, retention and abuse: Rental return

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S02.M02 Rental return](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_lifecycle/return` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-043-07.R01** Return reports, photos and fees are P2, travel only as end-to-end encrypted envelopes and attachments to the two parties, and never appear in logs, notifications or public projections.
- **PS-043-07.R02** Late fees are claims between the parties and are never collected by the platform; enforcement is by agreement, reputation and disputes only.
- **PS-043-07.R03** False overdue claims and fee inflation are limited by deterministic computation from signed terms, owner-only lowering and the 72 hour backdating limit.

## Specification

**Data classification**
- RentalReturn: P2 in both vaults.
- Return photos: P2 encrypted attachments with hashes in the signed report.

**Retention**
- Closed returns and statements: RET-EVIDENCE (2 years after last related activity).
- Quarantined statements: RET-SHORT (30 days).

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Owner inflates the late fee | fee is computed from the terms copied into the confirmed reservation; adjustments can only lower it; the renter's vault recomputes and flags any mismatch |
| T02 | Renter backdates the return | effective return time is the claim only within 72 hours before local receipt time; relay-signed receipt time evidences that relay's clock only |
| T03 | Owner stalls the attestation to hold the deposit | 72 hour silence is recorded as renter_only_silent_owner; the deposit decision clock still runs and the renter can dispute |
| T04 | Forged return report or attestation | signature over JCS bytes and signer role check; non-party keys quarantined |
| T05 | Photos swapped between handoff and return | hashes recorded at signing, same re-encoding rules, differences computed per checklist item |

**Abuse controls**
- Local quarantine and a per-sender quota of 100 inbound return statements per day per counterparty.
- Attachment size limit 10 MB per photo and 50 MB per report (PAYLOAD_TOO_LARGE).

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-043-09.T11 | abuse | PS-043-07.R01, PS-043-07.R02, PS-043-07.R03 | backdated claim 5 days; 101 inbound statements in a day; inspect logs | receipt time used; 101st dropped; no amounts or notes in logs |

## Dependencies

Module depends on: F05.S02.M01, F05.S01.M01, F05.S01.M02, F09.S01.M01, F08.S01.M03, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
