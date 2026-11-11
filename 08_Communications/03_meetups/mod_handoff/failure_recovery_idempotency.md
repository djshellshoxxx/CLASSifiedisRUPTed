# PS-065-06 — Failure recovery and idempotency: Meetup handoff check-in

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S03.M02 Meetup handoff check-in](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/meetups/handoff` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-065-06.R01** Check-in and report commands commit locally first and statements travel through F11.S02.M01 on the F15.S01.M01 outbox with states prepared, transport acknowledged and peer accepted; the UI shows exactly the reached state.
- **PS-065-06.R02** Statement handling is idempotent on cid; share put is idempotent on (shareId, snapshotRevision) and share delete and revoke are idempotent on shareId.
- **PS-065-06.R03** There is no distributed lock; a no-show claim and a check-in from the accused are both kept and flagged contradicted, whichever arrives first.

## Specification

- **idempotency:** Vault commands idempotent on (meetupId, partyDid, proposalHash); relay put and delete use Idempotency-Key with 24 h window and are naturally idempotent on (shareId, snapshotRevision) and shareId.
- **concurrency:** expectedRevision on check-in and report; each vault command is one IndexedDB transaction; relay put rejects an older snapshotRevision with CONFLICT_REVISION; a no-show report racing a check-in statement ends with both stored, contradicted true and at most one comms.meetup.no_show_contradicted.
- **retries:** Statements use the F15.S01.M01 outbox timers (CTR-IDM-001 IDM-4 backoff base 500 ms, cap 30 s, 6 attempts; unsent entries expire 7 days after creation after a day-6 prompt); share put and delete follow the same backoff, and a share whose delete cannot reach the relay is still deleted there by the expiry sweep.
- **offline:** Check-in works offline and shows saved on this device; statements are sent when online; share creation requires a relay connection and says so.
- **partial failure:** If the relay is down at check-in time the check-in is still recorded locally and sent later, and the share snapshot is updated when the relay returns; if the share put fails after the local record is created the share shows unavailable and can be retried.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-065-09.T07 | integration | PS-065-06.R01, PS-065-06.R03 | check-in offline then reconnect; relay down at share update | local check-in kept; sync states advance prepared to transport acknowledged to peer accepted; share shows unavailable then updates |
| TEST-PS-065-09.T08 | integration | PS-065-06.R02, PS-065-06.R03 | no-show report and the accused's check-in arrive in both orders | both stored, contradicted true, no overwrite, status unchanged |

## Dependencies

Module depends on: F08.S03.M03, F08.S01.M01, F07.S02.M02, F16.S02.M02, F16.S02.M03, F11.S01.M01, F11.S02.M01, F15.S01.M01, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
