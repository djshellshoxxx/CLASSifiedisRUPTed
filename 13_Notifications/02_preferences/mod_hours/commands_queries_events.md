# PS-105-04 — Commands, queries and events: Quiet-hours schedule

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M02 Quiet-hours schedule](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/hours` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-105-04.R01** Saving the schedule is a vault command that emits notify.quiet_hours.changed in the same IndexedDB transaction and produces a signed mirror statement when a relay holds push or email consent.
- **PS-105-04.R02** The relay exposes a mirror command and both environments expose the same pure evaluate query.
- **PS-105-04.R03** The module consumes channel consent events to mirror the current schedule to a newly consented relay.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `notify.quiet_hours.set` | notify.quiet_hours.set | [vault command; produces signed statement classrup.notify.quiet_hours/v1 when a relay holds consent] { enabled, timeZone, windows[] (≤ 4), expectedRevision? } | { scheduleId, revision, mirrorState: none\|local_committed\|prepared\|transport_acknowledged\|peer_accepted, currentlyQuiet, quietEndsAt? } | VALIDATION_FAILED, NOTIFY_QUIET_TZ_UNKNOWN, NOTIFY_QUIET_WINDOW_INVALID, CONFLICT_REVISION, RATE_LIMITED | notify.quiet_hours.changed | yes (Idempotency-Key) |
| `notify.quiet_hours.mirror` | notify.quiet_hours.mirror | [relay command, relay access token] { statement: { userDid, seq, enabled, timeZone, windows[], sig } } | { seq, relayReceiptAt, relayReceiptSig } | VALIDATION_FAILED, NOTIFY_QUIET_TZ_UNKNOWN, NOTIFY_QUIET_WINDOW_INVALID, PRECONDITION_FAILED, UNAUTHENTICATED, CONFLICT_STATE, RATE_LIMITED |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `notify.quiet_hours.get` | notify.quiet_hours.read_own | [vault query] {} | { schedule: QuietHoursSchedule \| null, currentlyQuiet, quietEndsAt? } |  |
| `notify.quiet_hours.evaluate` | notify.quiet_hours.evaluate | [pure function, vault and relay] { at: timestamp, schedule } | { quiet: boolean, quietEndsAt?: timestamp, nextQuietStartsAt?: timestamp } | VALIDATION_FAILED |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `notify.quiet_hours.changed` | P2 | { userDid, enabled, timeZone, windowCount, mirrorSeq?, revision } |

### Events consumed

| Type | Effect |
|---|---|
| `notify.channel.opted_in` | send the current schedule as a mirror statement to the relay that now holds the consent |
| `notify.channel.opted_out` | mark mirroring to that relay as ended and request deletion of the mirrored copy |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| NOTIFY_QUIET_TZ_UNKNOWN | 422 | no | time zone is not in the pinned IANA tzdata |
| NOTIFY_QUIET_WINDOW_INVALID | 422 | no | a window is shorter than 15 minutes, longer than 12 hours, equal start and end, or overlapping |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
vault command notify.quiet_hours.set
{ "enabled": true, "timeZone": "America/New_York", "windows": [ { "days": [1,2,3,4,5,6,7], "start": "22:00", "end": "07:00" } ] }
-> { "scheduleId": "0192f3b2-0000-7000-8000-000000000001", "revision": 1, "mirrorState": "local_committed", "currentlyQuiet": false }
evaluate { "at": "2026-03-08T06:30:00Z", "schedule": { … } }   // 01:30 EST on the spring-forward night
-> { "quiet": true, "quietEndsAt": "2026-03-08T11:00:00Z" }     // 07:00 EDT
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-105-09.T07 | contract | PS-105-04.R01, PS-105-04.R02, PS-105-09.R02 | set, mirror, get, evaluate execute | outputs, statements and event payloads validate against registry schemas |
| TEST-PS-105-09.T08 | integration | PS-105-04.R03, PS-105-03.R02 | channel opted in and opted out events delivered | schedule mirrored to the consenting relay and deletion requested when consent ends |
| TEST-PS-105-09.T15 | a11y | PS-105-04.R01 | settings screen with screen reader and keyboard | inputs labelled, currently quiet announced, zero serious axe issues |

## Dependencies

Module depends on: F13.S02.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
