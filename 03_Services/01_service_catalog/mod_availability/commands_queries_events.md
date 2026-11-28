# PS-028-04 — Commands, queries and events: Service availability

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S01.M02 Service availability](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_catalog/availability` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-028-04.R01** Calendar and slot commands are vault-local; only publish_summary produces a signed statement (classrup.services.availability_summary/v1).
- **PS-028-04.R02** Every command writes its local events in the same IndexedDB transaction as the state change.
- **PS-028-04.R03** The module consumes quote outcome, booking cancellation, block, device key and deletion events to release held or committed slots and keep stored data consistent.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `services.calendar.set_rules` | services.calendar.set_rules | [vault-local] { calendarId?, offeringId?, timeZone, weeklyRules[], bufferBeforeMinutes, bufferAfterMinutes, minNoticeMinutes, horizonDays, expectedRevision? } | { calendarId, revision, affectedHoldIds[] (held holds now flagged needsReconfirmation) } | VALIDATION_FAILED, SERVICES_TZ_UNKNOWN, CONFLICT_REVISION | services.availability.changed | yes (Idempotency-Key) |
| `services.calendar.add_exception` | services.calendar.set_rules | [vault-local] { calendarId, expectedRevision, exception } | { calendarId, revision, affectedHoldIds[] } | NOT_FOUND, VALIDATION_FAILED, CONFLICT_REVISION | services.availability.changed | yes (Idempotency-Key) |
| `services.calendar.remove_exception` | services.calendar.set_rules | [vault-local] { calendarId, expectedRevision, localDate } | { calendarId, revision, affectedHoldIds[] } | NOT_FOUND, CONFLICT_REVISION | services.availability.changed | yes (Idempotency-Key) |
| `services.calendar.publish_summary` | services.calendar.publish_summary | [statement classrup.services.availability_summary/v1 signed with the provider device key, expiry 14 days, seq+1, prev = summaryCid; relay destinations P0 after privacy.consent.check(federation_publish, relayId) and PRV-6 acknowledgement; client destinations P2 end-to-end encrypted through F08.S01.M01] { calendarId, offeringId?, destinations[] (relay ids or client DIDs, max 5), granularity: slot \| day_part, prv6Acknowledged: true } | { summaryCid, seq, expiresAt, syncState } | NOT_FOUND, VALIDATION_FAILED, PRECONDITION_FAILED, SERVICES_PUBLISH_CONSENT_MISSING, BLOCKED_PARTY, DEPENDENCY_UNAVAILABLE |  | yes (Idempotency-Key) |
| `services.slot.hold` | services.slot.hold | [vault-local] { calendarId, startUtc, durationMinutes, holderId, quoteId?, ttlMs? (default 900000, range 300000..259500000; the quote module passes validUntil + 5 min), reholdOf? } | { holdId, expiresAt } | NOT_FOUND, SERVICES_SLOT_UNAVAILABLE, SERVICES_HOLD_LIMIT, VALIDATION_FAILED, BLOCKED_PARTY | services.slot.held | yes (Idempotency-Key) |
| `services.slot.extend` | services.slot.hold | [vault-local, called by F03.S02.M01 when a verified acceptance arrives] { holdId, expectedRevision, acceptanceReceivedAt } | { holdId, revision, expiresAt } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, EXPIRED | services.slot.held | yes (Idempotency-Key) |
| `services.slot.reconfirm` | services.slot.hold | [vault-local, provider action from the needs-reconfirmation list] { holdId, expectedRevision, keep: true } | { holdId, revision, needsReconfirmation: false, kept } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, SERVICES_SLOT_UNAVAILABLE | services.slot.held | yes (Idempotency-Key) |
| `services.slot.release` | services.slot.hold | [vault-local] { holdId, expectedRevision, reason? } | { holdId, revision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | services.slot.released | yes (Idempotency-Key) |
| `services.slot.commit` | services.slot.hold | [vault-local, called in the same transaction as booking confirmation] { holdId, expectedRevision } | { holdId, revision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, EXPIRED, SERVICES_SLOT_UNAVAILABLE | services.slot.committed | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `services.calendar.list_slots` | services.calendar.read_own | [vault-local] { calendarId, fromDate, toDate (≤ 31 days after fromDate), durationMinutes } | { slots: [{ startUtc, endUtc, startLocal, utcOffsetMinutes, state: free \| held \| committed }] (≤ 2000) } | NOT_FOUND, VALIDATION_FAILED |
| `services.calendar.get` | services.calendar.read_own | [vault-local] { calendarId } | { calendar: AvailabilityCalendar, holdsNeedingReconfirmation: SlotHold[] } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `services.availability.changed` | P3 | { calendarId, providerId, revision, reason: rules\|exception\|tzdb, affectedHoldIds[] } |
| `services.slot.held` | P2 | { holdId, calendarId, quoteId?, holderId, startUtc, endUtc, expiresAt, reholdOf?, needsReconfirmation } |
| `services.slot.committed` | P2 | { holdId, calendarId, quoteId?, startUtc, endUtc } |
| `services.slot.released` | P2 | { holdId, calendarId, quoteId?, reason } |

### Events consumed

| Type | Effect |
|---|---|
| `services.quote.declined` | release the hold of quoteId when it is still held (reasons client_declined, provider_request, superseded, request_cancelled, offering_withdrawn, blocked); no-op when the quote module already released it in its own transaction |
| `services.quote.expired` | release the hold of quoteId with reason quote_expired when it is still held |
| `services.booking.cancelled` | release the hold identified by slotHoldId, or else the active hold of quoteId, whether it is held or committed, with reason booking_cancelled |
| `identity.block.added` | release held holds whose holder is the blocked DID with reason blocked; committed holds stay until the booking module cancels the booking |
| `identity.device_key.revoked` | re-sign the current unexpired summary with a current key (seq+1, prev) and re-queue it to the same destinations; the old signature is no longer shown as valid |
| `privacy.deletion.completed` | replace the erased principal's DID in retained holds (holderId) with the deletion pseudonym; when the local principal is erased, calendars and holds are purged by the DeletionPort plan |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| SERVICES_TZ_UNKNOWN | 422 | no | time zone name is not in the bundled tz database |
| SERVICES_SLOT_UNAVAILABLE | 409 | no | slot is not generated, too soon, too far, needs reconfirmation, expired, or overlaps a hold, booking or buffer |
| SERVICES_HOLD_LIMIT | 409 | no | too many active holds for this client or calendar |
| SERVICES_PUBLISH_CONSENT_MISSING | 412 | no | federation_publish consent is not granted for a selected relay; nothing was signed |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Statement registry (N2): classrup.services.availability_summary/v1 has signer role provider (the providerId it carries) and the allowlisted payload {providerId, offeringId?, timeZone, windows[{startUtc, endUtc}] generated from rules and exceptions only (never subtracting holds or bookings), granularity, issuedAt, expiresAt, seq, prev}. No other statement leaves this module; classrup.services.calendar/v1 and classrup.services.slot_hold/v1 are vault records and export lines only.

### Example

```
vault command services.calendar.set_rules
{ "timeZone": "Europe/Berlin", "weeklyRules": [{ "isoWeekday": 1, "startLocal": "09:00", "endLocal": "17:00", "slotMinutes": 60 }],
  "bufferBeforeMinutes": 15, "bufferAfterMinutes": 15, "minNoticeMinutes": 1440, "horizonDays": 60 }
-> { "calendarId": "0192f3b0-0001-7000-8000-000000000001", "revision": 1, "affectedHoldIds": [] }
vault command services.slot.hold { "calendarId": "0192f3b0-0001-…", "startUtc": "2027-03-29T07:00:00.000Z", "durationMinutes": 60,
  "holderId": "did:key:z6Mk…", "quoteId": "0192f3c0-0002-…", "ttlMs": 259500000 }
-> { "holdId": "0192f3b0-0002-…", "expiresAt": "2026-11-07T10:05:00.000Z" }
vault command services.slot.extend { "holdId": "0192f3b0-0002-…", "expectedRevision": 1, "acceptanceReceivedAt": "2026-11-07T09:00:00.000Z" }
-> { "holdId": "0192f3b0-0002-…", "revision": 2, "expiresAt": "2026-11-08T09:00:00.000Z" }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-028-09.T07 | contract | PS-028-04.R01, PS-028-04.R02, PS-028-09.R01, PS-028-09.R03 | each command and the summary statement | outputs, events and statement validate against registry schemas; signature verifies |
| TEST-PS-028-09.T08 | integration | PS-028-04.R03 | quote declined, quote expired, block added and booking cancelled events delivered twice | holds released once with the documented reason; duplicates skipped |
| TEST-PS-028-09.T19 | contract | PS-028-04.R03 | deliver services.booking.cancelled {bookingId, quoteId, slotHoldId} for a held hold and for a committed hold | both holds released with reason booking_cancelled |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M02, F08.S01.M01, F11.S01.M03, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
