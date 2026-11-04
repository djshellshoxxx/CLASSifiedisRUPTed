# PS-065-03 — Workflow state machine: Meetup handoff check-in

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S03.M02 Meetup handoff check-in](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/meetups/handoff` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-065-03.R01** Each MeetupCheckin starts pending and ends in exactly one of checked_in, no_show or void, which are terminal; a contradiction is a flag and not a state change.
- **PS-065-03.R02** A MeetupShare is active until it expires or is revoked; both end states are terminal and erase relay ciphertext.
- **PS-065-03.R03** Check-in states advance only from verified statements and never from timers alone, except void for elapsed windows.

## Specification

### MeetupCheckin lifecycle

Initial **pending**; terminal **checked_in**, **no_show**, **void**.

| Transition | Trigger | Guard / effect |
|---|---|---|
| pending -> checked_in | comms.meetup.check_in by the party or verified check-in statement from the party | signature verified; emits comms.meetup.checked_in |
| pending -> no_show | comms.meetup.report_no_show by a checked-in party after grace period, or verified report statement | marked as claim of reporter; emits comms.meetup.no_show |
| pending -> void | meetup cancelled, or windowEnd plus 24 hours elapsed without activity | reason stored |

```mermaid
stateDiagram-v2
  [*] --> pending
  pending --> checked_in: comms.meetup.check_in by the party or verified check-in statement from the party
  pending --> no_show: comms.meetup.report_no_show by a checked-in party after grace period, or verified report statement
  pending --> void: meetup cancelled, or windowEnd plus 24 hours elapsed without activity
  checked_in --> [*]
  no_show --> [*]
  void --> [*]
```

### MeetupShare lifecycle

Initial **active**; terminal **expired**, **revoked**.

| Transition | Trigger | Guard / effect |
|---|---|---|
| active -> active | check-in event or state change | snapshot re-encrypted, snapshotRevision + 1 |
| active -> revoked | comms.meetup_share.revoke by owner, or meetup cancelled | relay ciphertext deleted; emits comms.meetup_share.revoked |
| active -> expired | expiresAt reached | relay ciphertext deleted |

```mermaid
stateDiagram-v2
  [*] --> active
  active --> active: check-in event or state change
  active --> revoked: comms.meetup_share.revoke by owner, or meetup cancelled
  active --> expired: expiresAt reached
  expired --> [*]
  revoked --> [*]
```

### Timeouts and scheduled transitions

- Relay deletes expired share ciphertext within 5 minutes of expiresAt (sweep every 60 s).
- Local sweep voids pending check-ins 24 hours after windowEnd.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-065-09.T03 | property | PS-065-03.R01, PS-065-03.R02, PS-065-03.R03 | random sequences of check-in, report, cancel, expiry and clock jumps | terminal states never change; no_show only after checked-in reporter; share states only active to expired or revoked |
| TEST-PS-065-09.T05 | integration | PS-065-04.R03, PS-065-03.R01 | agreed event, cancellation event and reschedule event delivered | pending records created, then voided with shares revoked |

## Dependencies

Module depends on: F08.S03.M03, F08.S01.M01, F08.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
