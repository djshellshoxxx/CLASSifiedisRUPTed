# PS-028-01 — Domain schema: Service availability

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S01.M02 Service availability](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_catalog/availability` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-028-01.R01** An AvailabilityCalendar stores the provider, IANA zone, weekly windows, exceptions, buffers, notice, horizon and tz database version; slots are derived, never stored as local strings.
- **PS-028-01.R02** A SlotHold stores UTC start and end, the quote it serves, the holder, an expiry and a status, and is a P2 record kept only in the provider vault with RET-SHORT after it ends.
- **PS-028-01.R03** Calendar rules are P3 in the vault; only the signed summary (windows, no client names, no hold data) is P1 and leaves the device on provider action.

## Specification

### AvailabilityCalendar

Schema `classrup.services.availability/v1` · storage **device** · privacy **P3** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — vault tenant scope |
| providerId | actorId — local principal |
| offeringId? | uuidv7 — ref F03.S01.M01 ServiceOffering; absent means provider-wide |
| timeZone | string — IANA zone name known to the bundled tz database |
| tzdbVersion | string — version of the bundled IANA database used to expand rules, for example 2026b |
| weeklyRules | WeeklyRule[] — 0..28 items {isoWeekday 1..7, startLocal HH:mm, endLocal HH:mm, slotMinutes 15..240}; windows on one day must not overlap |
| exceptions | Exception[] — 0..200 items {localDate YYYY-MM-DD, kind closed \| open_extra, windows? } |
| bufferBeforeMinutes | int — 0..120 |
| bufferAfterMinutes | int — 0..120 |
| minNoticeMinutes | int — 0..20160 |
| horizonDays | int — 1..180 |
| summaryCid? | string — cid of the last signed summary statement |
| syncState | map — per destination {state: prepared \| transport_acknowledged \| peer_accepted \| refused, at} |
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
| expiresAt | timestamp — holdAt + 15 min default, range 5 min..72 h (quote validity) |
| needsReconfirmation | boolean — set when a tz database change moved the local time |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- No two holds with status held or committed on one calendar overlap once buffers are applied.
- A committed hold keeps its UTC interval even if later rule changes remove the slot from the generated set.
- expiresAt is local-clock based; a hold never outlives its quote validity.

### Storage DDL

```sql
CREATE TABLE services_slot_hold (
  id TEXT PRIMARY KEY, calendar_id TEXT NOT NULL, start_utc TEXT NOT NULL, end_utc TEXT NOT NULL,
  status TEXT NOT NULL, expires_at TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE INDEX services_slot_hold_range ON services_slot_hold(calendar_id, status, start_utc, end_utc);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-028-09.T01 | unit | PS-028-01.R01, PS-028-01.R03 | expand Monday rule on 2027-03-28 and 2026-10-25 in Europe/Berlin | nonexistent 02:30 skipped; repeated 02:30 produces one slot at UTC+2; slots stored as UTC |
| TEST-PS-028-09.T03 | property | PS-028-01.R01, PS-028-02.R02, PS-028-03.R02, PS-028-09.R02 | random rules in every zone for 2026-2028 | derived slots are unique, ordered, non-overlapping, and no slot falls in a DST gap |
| TEST-PS-028-09.T04 | unit | PS-028-01.R02, PS-028-03.R01 | hold, commit, release, expire transitions plus undeclared ones | only declared transitions succeed; others CONFLICT_STATE |
| TEST-PS-028-09.T14 | a11y | PS-028-01.R03 | slot grid and DST banner with screen reader and keyboard | all slots reachable, banner announced, axe zero serious issues |

## Dependencies

Module depends on: F03.S01.M01, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [module SPEC](SPEC.md).
