# PS-028-04 — Commands, queries and events: Service availability

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S01.M02 Service availability](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_catalog/availability` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-028-04.R01** Calendar and slot commands are vault-local; only publish_summary produces a signed statement (classrup.services.availability/v1).
- **PS-028-04.R02** Every command writes its local events in the same IndexedDB transaction as the state change.
- **PS-028-04.R03** The module consumes booking and quote outcome events to release held or committed slots.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `services.calendar.set_rules` | services.calendar.set_rules | [vault-local] { calendarId?, offeringId?, timeZone, weeklyRules[], bufferBeforeMinutes, bufferAfterMinutes, minNoticeMinutes, horizonDays, expectedRevision? } | { calendarId, revision, affectedHoldIds[] } | VALIDATION_FAILED, SERVICES_TZ_UNKNOWN, CONFLICT_REVISION | services.availability.changed | yes (Idempotency-Key) |
| `services.calendar.add_exception` | services.calendar.set_rules | [vault-local] { calendarId, expectedRevision, exception } | { calendarId, revision, affectedHoldIds[] } | NOT_FOUND, VALIDATION_FAILED, CONFLICT_REVISION | services.availability.changed | yes (Idempotency-Key) |
| `services.calendar.remove_exception` | services.calendar.set_rules | [vault-local] { calendarId, expectedRevision, localDate } | { calendarId, revision } | NOT_FOUND, CONFLICT_REVISION | services.availability.changed | yes (Idempotency-Key) |
| `services.calendar.publish_summary` | services.calendar.publish_summary | [statement classrup.services.availability/v1 signed with the provider device key, expiry 14 days] { calendarId, destinations[] (relay ids or client ids, max 5) } | { summaryCid, syncState } | NOT_FOUND, PRECONDITION_FAILED, DEPENDENCY_UNAVAILABLE |  | yes (Idempotency-Key) |
| `services.slot.hold` | services.slot.hold | [vault-local] { calendarId, startUtc, durationMinutes, holderId, quoteId?, ttlMs? (default 900000, max 259200000) } | { holdId, expiresAt } | NOT_FOUND, SERVICES_SLOT_UNAVAILABLE, SERVICES_HOLD_LIMIT, VALIDATION_FAILED | services.slot.held | yes (Idempotency-Key) |
| `services.slot.release` | services.slot.hold | [vault-local] { holdId, expectedRevision } | { holdId, revision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | services.slot.released | yes (Idempotency-Key) |
| `services.slot.commit` | services.slot.hold | [vault-local, called in the same transaction as booking confirmation] { holdId, expectedRevision } | { holdId, revision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, EXPIRED, SERVICES_SLOT_UNAVAILABLE | services.slot.committed | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `services.calendar.list_slots` | services.calendar.read_own | [vault-local] { calendarId, fromDate, toDate (≤ 31 days after fromDate), durationMinutes } | { slots: [{ startUtc, endUtc, startLocal, utcOffsetMinutes, state: free \| held \| committed }] (≤ 2000) } | NOT_FOUND, VALIDATION_FAILED |
| `services.calendar.get` | services.calendar.read_own | [vault-local] { calendarId } | { calendar: AvailabilityCalendar } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `services.availability.changed` | P3 | { calendarId, providerId, revision, affectedHoldIds[] } |
| `services.slot.held` | P2 | { holdId, calendarId, startUtc, endUtc, expiresAt, quoteId? } |
| `services.slot.committed` | P2 | { holdId, calendarId, startUtc, endUtc } |
| `services.slot.released` | P2 | { holdId, calendarId, reason } |

### Events consumed

| Type | Effect |
|---|---|
| `services.quote.declined` | release the hold of the quote |
| `services.quote.expired` | release the hold of the quote |
| `services.booking.cancelled` | release the committed hold of the booking and free the interval |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| SERVICES_TZ_UNKNOWN | 422 | no | time zone name is not in the bundled tz database |
| SERVICES_SLOT_UNAVAILABLE | 409 | no | slot is not generated, too soon, too far, or overlaps a hold, booking or buffer |
| SERVICES_HOLD_LIMIT | 409 | no | too many active holds for this client or calendar |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
vault command services.calendar.set_rules
{ "timeZone": "Europe/Berlin", "weeklyRules": [{ "isoWeekday": 1, "startLocal": "09:00", "endLocal": "17:00", "slotMinutes": 60 }],
  "bufferBeforeMinutes": 15, "bufferAfterMinutes": 15, "minNoticeMinutes": 1440, "horizonDays": 60 }
-> { "calendarId": "0192f3b0-0001-7000-8000-000000000001", "revision": 1, "affectedHoldIds": [] }
vault command services.slot.hold { "calendarId": "0192f3b0-0001-…", "startUtc": "2027-03-29T07:00:00.000Z", "durationMinutes": 60, "holderId": "did:key:z6Mk…" }
-> { "holdId": "0192f3b0-0002-…", "expiresAt": "2026-11-04T10:15:00.000Z" }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-028-09.T07 | contract | PS-028-04.R01, PS-028-04.R02, PS-028-09.R01, PS-028-09.R03 | each command and the summary statement | outputs, events and statement validate against registry schemas; signature verifies |
| TEST-PS-028-09.T08 | integration | PS-028-04.R03 | quote declined, expired and booking cancelled events delivered twice | holds released once; duplicates skipped |

## Dependencies

Module depends on: F03.S01.M01, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
