# PS-092-07 — Privacy, retention and abuse: Appeals

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S01.M03 Appeals](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/reporting/appeals` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-092-07.R01** Appeals and decisions are P2, readable only by the appellant and the relay's assigned reviewer and operators, and never federated or sent in plain notifications.
- **PS-092-07.R02** Appeal records follow RET-EVIDENCE with the action, and the appellant may keep the signed decision in their vault regardless of relay deletion.
- **PS-092-07.R03** Appeal abuse (spam appeals, reviewer harassment, deadline gaming) is limited by one appeal per action, size caps, relay-clock windows and reviewer anonymity.
- **PS-092-07.R04** The module meets N6 by registering ExportSectionPort, DeletionPort and RetentionPurgePort with F10, classifying every Appeal field per F10.S02.M02, and consuming privacy.deletion.completed.

## Specification

**Data classification**
- Appeal: P2 (appellant, relay reviewer, relay operators).
- Attachments: P2 files stored encrypted on the relay as F12.S01.M02 evidence blobs.
- Reviewer key: relay copy and relay audit log only, P3 towards the appellant; never in statements, events or the vault copy.

**Retention**
- Decided, moot and withdrawn appeals: RET-EVIDENCE (2 years after last related activity) on the relay through the RetentionPurgePort.
- Vault copy: RET-EVIDENCE through the RetentionPurgePort unless the user deletes it earlier; deletion does not recall the relay copy.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Decider reviews own decision, including through a second device key | reviewer principal must differ from the decider's principal by F07.S02.M01 key linkage; enforced in assignment, reassignment and decide; audited |
| T02 | Relay forges or backdates the statement of reasons to close the window | the statement is relay-signed and the appellant's vault stores it on receipt with its own clock; mismatch between vault receipt time and relay time greater than 24 h is flagged to the user |
| T03 | Appeal flooding to overload moderators | one appeal per action, size caps, relay rate limits 5 appeals per day and 20 per 30 days per key |
| T04 | Reviewer harassment | decision, status and moot statements are signed by the relay key only; reviewer key kept relay-side and in the audit log |
| T05 | Forged decision statement shows 'overturned' in the vault | vault accepts decisions only with valid relay signature bound to appealId; others quarantined |
| T06 | Appellant backdates createdAt to gain extra days | window is decided by the relay's receive time; createdAt is a claim and ignored |
| T07 | Appeal left stuck in review by an absent reviewer | reassignment on role loss, operator request and day-10 escalation |
| T08 | An expired or lifted action reported to the appellant as won | moot closure with its reason; no overturned label and no decided event |

**Abuse controls**
- Per-key cap of 5 appeals per day and 20 per 30 days on a relay (F12.S03.M03 window_counter classes appeal.receive.day and appeal.receive.30d).
- Appeals whose statement is empty after trimming or duplicates a previous one by hash are rejected with VALIDATION_FAILED.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-092-09.T08 | abuse | PS-092-07.R01, PS-092-07.R03 | forged decision signature; 6th appeal in a day; 21st appeal in 30 days | decision quarantined, vault never shows decided; 6th and 21st return RATE_LIMITED |
| TEST-PS-092-09.T11 | integration | PS-092-07.R02 | appellant deletes the vault copy; injected clock passes RET-EVIDENCE on the relay | relay copy retained until RET-EVIDENCE end and then purged through the RetentionPurgePort; UI states the relay copy remains |
| TEST-PS-092-09.T22 | integration | PS-092-07.R04 | ExportSectionPort run, then privacy.deletion.completed in the vault with keepEvidence true and false; relay DeletionPort applied | section moderation.appeals exported; vault appeals deleted or pseudonymized; relay copy pseudonymized and retained |

## Dependencies

Module depends on: F12.S02.M01, F12.S01.M01, F12.S01.M02, F12.S02.M03, F07.S02.M01, F08.S01.M01, F16.S01.M01, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
