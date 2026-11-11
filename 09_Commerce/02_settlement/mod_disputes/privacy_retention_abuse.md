# PS-070-07 — Privacy, retention and abuse: Disputes

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S02.M02 Disputes](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/settlement/disputes` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-070-07.R01** Cases and evidence are P2, travel only as end-to-end encrypted envelopes to parties and, after both accept, to the mediator; relays see ciphertext and routing metadata only.
- **PS-070-07.R02** Evidence shared with a mediator is shared per item by explicit party action, and the UI says the mediator's relay operator cannot read it but the mediator can keep a copy.
- **PS-070-07.R03** Dispute abuse such as harassment, evidence flooding and mediator shopping is limited by quotas, duplicate rules and mutual mediator acceptance.

## Specification

**Data classification**
- DisputeCase and evidence references: P2. Evidence blobs are encrypted attachments with per-object keys held by parties.
- Evidence may contain third parties' personal data; the UI warns before attaching and excludes P3 data such as exact addresses unless the user adds it deliberately.

**Retention**
- RET-EVIDENCE (2 years after last related activity, jurisdiction override via F18).
- On deletion: did pseudonymized in retained records; evidence blobs of the deleted user are crypto-shredded at completion unless a legal hold applies on a relay; counterparties' copies cannot be recalled.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Harassment by repeated disputes | one open case per context and opener, 5 new cases per day per vault, local block of the sender |
| T02 | Evidence flooding or oversized evidence | 20 items per party, 10 MiB each, 50 MiB per case; excess refused |
| T03 | Forged statement from a non-party | signature and role check; quarantine |
| T04 | Mediator leaks or keeps evidence | mediator chosen by both, per-item sharing, UI states the mediator can retain copies; pseudonymity is not anonymity |
| T05 | Mediator relay pressures a party | outcomes are statements with no power over money; refusing an outcome has no automatic consequence beyond what that relay hosts under its published policy |
| T06 | Conflicting outcomes from forked vaults | detection and freeze with COMMERCE_DISPUTE_FORK; renegotiation or a new case |

**Abuse controls**
- New cases limited to 5 per day per vault and 20 evidence statements per hour; ingest limit 20 statements per hour per sender.
- Relays may rate-limit mediator directory reads to 60 per hour per device key.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-070-09.T12 | abuse | PS-070-07.R03, PS-070-07.R01 | 6 cases in one day; 21 evidence statements in an hour; oversized evidence | 6th case, 21st statement and oversized item refused or rate limited |
| TEST-PS-070-09.T13 | integration | PS-070-07.R02, PS-070-01.R02 | principal deletion completes during an open case | did pseudonymized, signatures flagged, evidence blobs crypto-shredded, counterparty copy untouched |

## Dependencies

Module depends on: F09.S01.M01, F09.S02.M01, F09.S03.M03, F07.S01.M01, F07.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
