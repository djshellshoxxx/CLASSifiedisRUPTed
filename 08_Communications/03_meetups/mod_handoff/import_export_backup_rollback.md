# PS-065-10 — Import, export, backup and rollback: Meetup handoff check-in

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S03.M02 Meetup handoff check-in](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/meetups/handoff` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-065-10.R01** A user's vault export contains their check-in records and statements, and share records without keys.
- **PS-065-10.R02** Import re-verifies statements; records whose meetup is missing become void history and shares always import as expired.
- **PS-065-10.R03** Schema changes follow expand and contract and keep v1 readable for 180 days.

## Specification

- **export:** Section comms.checkins in classrup-export/v1, registered through ExportSectionPort; one line per MeetupCheckin (schema classrup.comms.meetup_checkin/v1) with the signed statements, plus MeetupShare metadata without keys.
- **import:** Signatures re-verified; existing IDs skipped; no-show claims import with their claim label and contradicted flag; shares import as expired and are never re-created.
- **backup:** Vault export is the backup (IOX-6); relay share blobs are RET-EPHEMERAL, covered by relay SQLite backup only for operational recovery, and are not restored after expiry (IOX-7).
- **migration rollback:** Additive fields only in v1; rollback is safe because statements are immutable and derived status is recomputed; shares are short-lived so no migration is needed.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-065-09.T13 | integration | PS-065-10.R01, PS-065-10.R02, PS-065-10.R03 | export, import into fresh vault, restore relay from backup | check-ins round trip; shares import as expired; expired relay share blobs are not restored |

## Dependencies

Module depends on: F08.S03.M03, F08.S01.M01, F07.S02.M02, F16.S02.M02, F16.S02.M03, F11.S01.M01, F11.S01.M03, F11.S02.M01, F15.S01.M01, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
