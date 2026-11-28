# PS-030-07 — Privacy, retention and abuse: Service disputes

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S02.M03 Service disputes](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_booking/disputes` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-030-07.R01** Statements and evidence references are P2, travel only as end-to-end encrypted envelopes to the counterparty and the case handler chosen in F09, and never appear in logs or notifications.
- **PS-030-07.R02** Retaliatory or repeated disputes are limited by eligibility, per-booking caps and per-day quotas.
- **PS-030-07.R03** A dispute does not publish anything about the counterparty; any reputation effect is decided by F07 from signed resolutions, not here.
- **PS-030-07.R04** The module registers ExportSectionPort (section services.disputes), DeletionPort and RetentionPurgePort with F10 (N6), classifies fields with F10.S02.M02 and pseudonymizes the counterparty in retained links on privacy.deletion.completed.

## Specification

**Data classification**
- ServiceDisputeLink: P2 with statement text, fields classified with F10.S02.M02; evidence pack holds cids and hashes.

**Retention**
- Resolved, withdrawn and failed links: RET-EVIDENCE (2 years after last related activity), purged through the RetentionPurgePort.
- Quarantined notices: RET-SHORT (30 days) with the failure code.
- On privacy.deletion.completed: counterparty DID replaced with the deletion pseudonym; signatures kept and flagged unverifiable-after-pseudonymization.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Retaliatory dispute right after a bad review | window and one dispute per scope, one open per booking, 3 per booking, statement and evidence are visible to the case handler and counterparty |
| T02 | Forged dispute notice claiming to be the counterparty | signature and signer role checks, notice quarantined on mismatch |
| T03 | Dispute spam to harass a provider | per-sender quota of 10 inbound notices per day in the receiving vault; a locally blocked sender who is a party to an existing booking still reaches quarantine for review (exception to N7) with no notification |
| T04 | Evidence pack leaks private deliverables | pack stores cids and SHA-256 only; file bytes go to the case handler only by explicit opener action and stay encrypted |
| T05 | Modified client freezes approvals or fee claims with a fabricated notice | receiving vault re-validates against its own records and clock, freezes only after the F09 case statement is verified, and fails pending links after 7 days |

**Abuse controls**
- Local quota of 5 disputes opened per day per vault.
- Relay hosting policy may rate limit notice delivery; the module shows refusals in the sync state.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-030-09.T10 | abuse | PS-030-07.R02 | 11 inbound notices from one sender; retaliatory second dispute on the same scope | 11th dropped and counted; duplicate refused |
| TEST-PS-030-09.T11 | integration | PS-030-07.R01 | inspect logs, notifications and relay payloads during open | no statement text, no evidence names, ciphertext only at relay |
| TEST-PS-030-09.T16 | integration | PS-030-07.R03 | open a dispute and inspect outbound traffic and local events | no relay-public projection, no tombstone and no F07 event is produced |
| TEST-PS-030-09.T22 | integration | PS-030-07.R04 | privacy.deletion.completed for the counterparty; export | counterparty pseudonymized; export section services.disputes present |

## Dependencies

Module depends on: F03.S02.M01, F03.S02.M02, F09.S02.M02, F09.S01.M01, F08.S01.M01, F08.S01.M03, F07.S01.M01, F07.S02.M02, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
