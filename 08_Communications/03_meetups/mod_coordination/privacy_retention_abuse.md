# PS-064-07 — Privacy, retention and abuse: Meetup coordination

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S03.M03 Meetup coordination](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/meetups/coordination` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-064-07.R01** Meetups carry only a time window and a public place or an L3 area label; exact home addresses and live locations are never accepted, and the area-label validator rejects address patterns.
- **PS-064-07.R02** Meetup data travels only inside end-to-end encrypted messages to the listed parties; relays see routing metadata only.
- **PS-064-07.R03** The module reduces risk but cannot guarantee safety; the UI repeats the checklist from F08.S03.M01 before the first proposal or agreement.
- **PS-064-07.R04** Signed proposal and cancellation statements are RET-EVIDENCE and survive the thread purge (CTR-PRV-001, FLOW-08), so agreement consents stay re-verifiable; privacy duties (N6) - field classification per F10.S02.M02, ExportSectionPort, DeletionPort, RetentionPurgePort and pseudonymization on deletion - apply.

## Specification

**Data classification**
- Meetup: P2, parties only; place is a verified public spot snapshot or L3 label.
- Signed proposal and cancellation statements: P2 evidence held by the parties.
- Agreements: ConsentStatements (P2, RET-EVIDENCE) held by F08.S02.M02.

**Retention**
- Meetups and their signed proposal statements: RET-EVIDENCE (2 years after last related activity), independent of the thread purge; pseudonymized on principal deletion.
- Agreement statements keep their own RET-EVIDENCE retention in F08.S02.M02.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Pressure to meet at a private address | place model accepts only verified safe spots or L3 area labels; address-like area labels are rejected; the checklist warns |
| T02 | Forged cancellation or change by a stranger | statements need an active party key signature; others are quarantined |
| T03 | Tampering with the agreed window after agreement | agreement signs the proposal cid; any change is a new revision that clears agreements |
| T04 | Fork to claim the other side agreed to a different time | any two different proposals with one revision freeze the meetup whoever sent them; both are shown to the parties |
| T05 | Proposal spam | receiving vaults keep at most 10 open meetups per thread and 5 new proposals per party per day, blocks drop proposals silently, unknown senders in message requests; the 20 per day proposer limit is a UX guard |
| T06 | Fake safe-spot snapshot naming a venue that no curator listed | the snapshot must match a curator-verified spot statement by cid, version and signature |

**Abuse controls**
- Reports include the proposal statements and agreements (F12.S01.M01) at the reporter's discretion.
- Repeated cancellations are visible only to the vault owner as a personal count, with no global score created by this module.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-064-09.T09 | abuse | PS-064-07.R01 | area label with house number, coordinates in area label, 6th proposal from one party in a day at the receiver | COMMS_MEETUP_PLACE_INVALID and silent drop; no P3 stored |
| TEST-PS-064-09.T10 | integration | PS-064-07.R02, PS-064-06.R01 | sync states A to B with relay down then up | states prepared then transport acknowledged then peer accepted; UI text never ahead of state |
| TEST-PS-064-09.T19 | unit | PS-064-07.R03 | open the propose and agree screens for the first time | the F08.S03.M01 checklist is shown before Send proposal and before the first Agree |
| TEST-PS-064-09.T20 | integration | PS-064-01.R04, PS-064-07.R04 | archive and purge thread TH after an agreed meetup, then re-verify; delete B's account | meetup, proposal statements and consents remain and re-verify; B's own vault pseudonymizes B's DID in its kept evidence while A's copy is unchanged |

## Dependencies

Module depends on: F08.S01.M01, F08.S01.M02, F08.S02.M02, F08.S03.M01, F06.S02.M01, F07.S02.M02, F16.S02.M02, F11.S01.M01, F11.S02.M01, F15.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
