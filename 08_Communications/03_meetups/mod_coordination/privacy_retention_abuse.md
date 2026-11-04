# PS-064-07 — Privacy, retention and abuse: Meetup coordination

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S03.M03 Meetup coordination](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/meetups/coordination` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-064-07.R01** Meetups carry only a time window and a public place or an L3 area label; exact home addresses and live locations are never accepted, and the label validator rejects address patterns.
- **PS-064-07.R02** Meetup data travels only inside end-to-end encrypted messages to the listed parties; relays see routing metadata only.
- **PS-064-07.R03** The module reduces risk but cannot guarantee safety; the UI repeats the checklist from F08.S03.M01 before first agreement.

## Specification

**Data classification**
- Meetup: P2, parties only; place is a public spot snapshot or L3 label.
- Agreements: ConsentStatements (P2, RET-EVIDENCE) held by F08.S02.M02.

**Retention**
- Meetups: RET-STANDARD, purged locally with the thread; agreement statements keep their own RET-EVIDENCE retention.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Pressure to meet at a private address | place model accepts only safe spots or L3 area labels; address-like labels are rejected; the checklist warns |
| T02 | Forged cancellation or change by a stranger | statements need a party key signature; others are quarantined |
| T03 | Tampering with the agreed window after agreement | agreement signs the proposal hash; any change is a new revision that clears agreements |
| T04 | Fork to claim the other side agreed to a different time | conflicting proposals freeze the meetup; both are shown to the parties |
| T05 | Proposal spam | 20 proposals per day per vault, blocks drop proposals silently, unknown senders in message requests |

**Abuse controls**
- Reports include the proposal statements and agreements (F12.S01.M01) at the reporter's discretion.
- Repeated cancellations are visible only to the vault owner as a personal count, with no global score created by this module.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-064-09.T09 | abuse | PS-064-07.R01, PS-064-07.R03 | label with house number, coordinates in area label, 21st proposal | COMMS_MEETUP_PLACE_INVALID and RATE_LIMITED; no P3 stored |
| TEST-PS-064-09.T10 | integration | PS-064-07.R02, PS-064-06.R01 | sync states A to B with relay down then up | states prepared then transport acknowledged then peer accepted; UI text never ahead of state |

## Dependencies

Module depends on: F08.S01.M01, F08.S01.M02, F08.S02.M02, F08.S03.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
