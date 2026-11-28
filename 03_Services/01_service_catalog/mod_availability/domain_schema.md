# PS-028-01 — Domain schema: Service availability

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S01.M02 Service availability](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_catalog/availability` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-028-01.R01** An AvailabilityCalendar stores the provider, IANA zone, weekly windows, exceptions, buffers, notice, horizon and tz database version; slots are derived, never stored as local strings.
- **PS-028-01.R02** A SlotHold stores UTC start and end, the quote it serves, the holder, an expiry, a reconfirmation flag and a status, and is a P2 record kept only in the provider vault with RET-SHORT after it ends.
- **PS-028-01.R03** Calendar rules are P3 in the vault under schema classrup.services.calendar/v1; only the signed summary classrup.services.availability_summary/v1, built from rules and exceptions with an explicit field allowlist and no client names or hold data, leaves the device on provider action, as P0 to relays and P2 end-to-end encrypted to a client.

## Specification

### AvailabilityCalendar

Schema `classrup.services.calendar/v1` · storage **device** · privacy **P3** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — vault tenant scope |
| providerId | actorId — local principal |
| offeringId? | uuidv7 — id of an F03.S01.M01 ServiceOffering (reference only); absent means provider-wide |
| timeZone | string — IANA zone name known to the bundled tz database |
| tzdbVersion | string — version of the bundled IANA database used to expand rules, for example 2026b |
| weeklyRules | WeeklyRule[] — 0..28 items {isoWeekday 1..7, startLocal HH:mm, endLocal HH:mm, slotMinutes 15..240}; windows on one day must not overlap |
| exceptions | Exception[] — 0..200 items {localDate YYYY-MM-DD, kind closed \| open_extra, windows? } |
| bufferBeforeMinutes | int — 0..120 |
| bufferAfterMinutes | int — 0..120 |
| minNoticeMinutes | int — 0..20160 |
| horizonDays | int — 1..180 |
| summaryCid? | string — cid of the last signed summary statement |
| summarySeq | int — seq of the last signed summary, starts at 0; each new summary uses seq+1 and prev = summaryCid |
| syncState | map — per destination {state: prepared \| transport_acknowledged \| peer_accepted \| refused, at, relayStatement?} |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- weeklyRules windows on the same weekday never overlap and each window length is a multiple of slotMinutes.
- timeZone is always a valid IANA name; offsets are never stored as fixed numbers.
- Derived slot start instants are unique per calendar and ordered by UTC time.

### SlotHold

Schema `classrup.services.slot_hold/v1` · storage **device** · privacy **P2** · retention **RET-SHORT**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| calendarId | uuidv7 — ref AvailabilityCalendar |
| startUtc | timestamp — RFC 3339 UTC, slot start |
| endUtc | timestamp — RFC 3339 UTC; endUtc > startUtc; length equals a multiple of 15 minutes |
| quoteId? | uuidv7 — ref F03.S02.M01 ServiceQuote that this hold serves |
| holderId | actorId — client principal the quote was issued to |
| status | enum — held \| committed \| released \| expired |
| heldAt | timestamp — provider vault clock |
| expiresAt | timestamp — heldAt + ttl, ttl 5 min..72 h 5 min (quote validUntil + 5 min); after extension at most acceptance receipt + 24 h |
| extendedAt? | timestamp — provider vault clock of the single extension on acceptance receipt |
| reholdOf? | uuidv7 — expired or released hold of the same quote that this re-hold replaces |
| needsReconfirmation | boolean — set when a rule change, new exception or tz database change removes or moves the interval |
| kept | boolean — provider explicitly kept the interval with services.slot.reconfirm although it is no longer generated |
| releaseReason? | enum — quote_declined \| quote_withdrawn \| quote_expired \| superseded \| request_cancelled \| offering_withdrawn \| booking_cancelled \| expired \| provider_released \| blocked |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- No two holds with status held or committed on one calendar overlap once buffers are applied.
- A committed hold keeps its UTC interval even if later rule changes remove the slot from the generated set.
- expiresAt is local-clock based; a hold never outlives its quote validity plus 5 minutes, or acceptance receipt plus 24 hours once extended.
- A hold with needsReconfirmation true never commits.

### Storage DDL

```sql
CREATE TABLE services_slot_hold (
  id TEXT PRIMARY KEY, calendar_id TEXT NOT NULL, quote_id TEXT, start_utc TEXT NOT NULL, end_utc TEXT NOT NULL,
  status TEXT NOT NULL, expires_at TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE INDEX services_slot_hold_range ON services_slot_hold(calendar_id, status, start_utc, end_utc);
CREATE INDEX services_slot_hold_quote ON services_slot_hold(calendar_id, quote_id, status);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-028-09.T01 | unit | PS-028-01.R01 | expand Monday rule on 2027-03-28 and 2026-10-25 in Europe/Berlin | nonexistent 02:30 skipped; repeated 02:30 produces one slot at UTC+2; slots stored as UTC |
| TEST-PS-028-09.T03 | property | PS-028-01.R01, PS-028-02.R02, PS-028-09.R02 | random rules in every zone for 2026-2028 | derived slots are unique, ordered, non-overlapping, and no slot falls in a DST gap |
| TEST-PS-028-09.T04 | unit | PS-028-01.R02, PS-028-03.R01 | hold, extend, reconfirm, commit, release, expire transitions plus undeclared ones and a second extend | only declared transitions succeed; others and the second extend return CONFLICT_STATE |
| TEST-PS-028-09.T14 | a11y | PS-028-01.R01 | slot grid and DST banner with screen reader and keyboard | all slots reachable, banner announced, axe zero serious issues |
| TEST-PS-028-09.T16 | integration | PS-028-01.R03, PS-028-07.R01 | run every command with held and committed slots present and inspect the sync outbox | only publish_summary produces an outbound envelope; it carries only the allowlisted fields, no held or committed interval and no client identity |
| TEST-PS-028-09.T17 | integration | PS-028-01.R02, PS-028-07.R04 | retention sweep 30 days after release and expiry | released and expired holds purged through RetentionPurgePort; counts only in privacy.retention.purged |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M02, F08.S01.M01, F11.S01.M03, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [module SPEC](SPEC.md).
