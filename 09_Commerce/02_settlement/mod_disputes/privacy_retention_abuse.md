# PS-070-07 — Privacy, retention and abuse: Disputes

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S02.M02 Disputes](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/settlement/disputes` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-070-07.R01** Cases and evidence are P2, travel only as end-to-end encrypted envelopes to parties and, after every party accepts, to the mediator; relays see ciphertext and routing metadata only.
- **PS-070-07.R02** Evidence shared with a mediator is shared per item by explicit party action, and the UI says the mediator's relay operator cannot read it but the mediator can keep a copy.
- **PS-070-07.R03** Dispute abuse such as harassment, evidence flooding and mediator shopping is limited by quotas, duplicate rules and mutual mediator acceptance.
- **PS-070-07.R04** The module registers ExportSectionPort (section commerce.disputes), DeletionPort (pseudonymization and crypto-shredding of the deleted user's own evidence) and RetentionPurgePort (RET-EVIDENCE) with F10 (N6), annotates every field with its F10.S02.M02 class, and consumes privacy.deletion.completed.
- **PS-070-07.R05** Attachment evidence follows N9 and FLOW-10 - MediaBlob of at most 5 MiB, EXIF, XMP, IPTC and GPS stripped by F10.S02.M03 before encryption, per-object key - so no exact (L4) location reaches the respondent or the mediator through image metadata.
- **PS-070-07.R06** Ingest uses the bounded quarantine of F09.S01.M01 (500 entries or 5 MiB, oldest-first eviction) and, once it is full, drops statements from dids that are party to no known context.

## Specification

**Data classification**
- DisputeCase and evidence references: P2; field classes annotated per F10.S02.M02. Evidence attachments are encrypted MediaBlobs with per-object keys held by parties.
- Evidence may contain third parties' personal data; the UI warns before attaching and excludes P3 data such as exact addresses unless the user adds it deliberately; image location metadata is always stripped.

**Retention**
- RET-EVIDENCE (2 years after last related activity, jurisdiction override via F18) through the RetentionPurgePort.
- On deletion: did pseudonymized in retained records; the deleted user's own evidence blobs are crypto-shredded at completion unless a legal hold applies in this vault (F10.S01.M02); counterparties' copies cannot be recalled.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Harassment by repeated disputes | one open case per context and opener, 5 new cases per day per vault, local block of the sender |
| T02 | Evidence flooding or oversized evidence | 20 items per party, 5 MiB each, 50 MiB per case; excess refused |
| T03 | Forged statement from a non-party | signature and role check; quarantine |
| T04 | Mediator leaks or keeps evidence | mediator chosen by every party, per-item sharing, UI states the mediator can retain copies; pseudonymity is not anonymity |
| T05 | Mediator relay pressures a party | outcomes are statements with no power over money; refusing an outcome has no automatic consequence beyond what that relay hosts under its published policy |
| T06 | Conflicting outcomes from forked vaults | detection and freeze with COMMERCE_DISPUTE_FORK; renegotiation or a new case |
| T07 | Photo evidence discloses an exact location through GPS EXIF tags | F10.S02.M03 strips metadata before encryption; unstripped attachments refused |
| T08 | A party installs a sock-puppet 'relay moderator' who then decides alone | relay-signed directory entry verified against the relay key; self-declared mediators need every party's acceptance for every outcome |
| T09 | A fraudster's block or a victim's block suppresses dispute evidence | statements of an open case are stored despite blocks; open allowed against a blocked party; noResponseReceivedHere instead of a silence claim |
| T10 | Sybil flood of dispute statements from fresh dids | shared bounded quarantine; non-party statements dropped once full |

**Abuse controls**
- New cases limited to 5 per day per vault and 20 evidence statements per hour; ingest limit 20 statements per hour per known party; unknown senders share the bounded quarantine of F09.S01.M01.
- Relays may rate-limit mediator directory reads to 60 per hour per device key.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-070-09.T09 | integration | PS-070-04.R02, PS-070-05.R01, PS-070-07.R02 | every party selects and accepts relay-verified mediator M; A shares two of five evidence items; M proposes no_fault_close | M receives only the two shared items; case resolved without acceptance |
| TEST-PS-070-09.T12 | abuse | PS-070-07.R03, PS-070-07.R01 | 6 cases in one day; 21 evidence statements in an hour; a 6 MiB attachment | 6th case, 21st statement and oversized item refused or rate limited |
| TEST-PS-070-09.T20 | abuse | PS-070-07.R05, PS-070-01.R04 | A attaches a JPEG with GPS EXIF tags and shares it with active mediator M | B and M receive a MediaBlob of at most 5 MiB with no EXIF, XMP or GPS data; an attachment whose stripping failed is refused |
| TEST-PS-070-09.T25 | integration | PS-070-07.R04 | export, deletion and retention purge driven by F10 | section commerce.disputes exported; DeletionPort pseudonymizes and crypto-shreds the deleted user's own evidence; RetentionPurgePort purges after RET-EVIDENCE; every field carries an F10.S02.M02 class |
| TEST-PS-070-09.T26 | abuse | PS-070-07.R06 | 10 000 fresh dids each send one dispute statement | quarantine stays within 500 entries or 5 MiB, oldest evicted first, non-party statements dropped once full; parties' statements still applied |

## Dependencies

Module depends on: F09.S01.M01, F09.S02.M01, F09.S03.M01, F09.S03.M03, F07.S01.M01, F07.S02.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F16.S02.M03, F15.S02.M03, F10.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
