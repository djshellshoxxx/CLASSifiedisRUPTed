# PS-105-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/02_preferences/mod_hours. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-SCH-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-105-02.R01 | `tz` must be a canonical IANA name present in the pinned tzdata release recorded in config. Aliases are normalized to canonical name before storage. | MVP |
| PS-105-02.R02 | `weekdays` values are integers 1–7 (ISO Monday=1). Empty array is rejected. | MVP |
| PS-105-02.R03 | `start_min` and `end_min` are integers in 0–1440 and multiples of 15. `end_min` = 1440 is allowed; `start_min` = `end_min` is rejected. | MVP |
| PS-105-02.R04 | Replace-all payload is at most 14 windows per channel and 56 total. | MVP |
| PS-105-02.R05 | Overlapping windows on the same channel and weekday are merged server-side, and the response reports the merged set. | MVP |

## Data / schema
| Field | Rule | Error code | Retryable | message_key |
|---|---|---|---|---|
| tz | R01 | HOURS.TZ_UNKNOWN | false | err.hours.tz_unknown |
| weekdays | R02 | HOURS.WEEKDAY_INVALID | false | err.hours.weekday_invalid |
| start_min, end_min | R03 | HOURS.TIME_RANGE_INVALID | false | err.hours.time_range_invalid |
| window count | R04 | HOURS.WINDOW_LIMIT | false | err.hours.window_limit |
| channel | enum push, email, inapp | HOURS.CHANNEL_UNKNOWN | false | err.hours.channel_unknown |
| revision | matches stored | SYS.CONFLICT | true | err.sys.conflict |
| account | must be `acc_` principal | SYS.FORBIDDEN | false | err.sys.forbidden |

## Commands / queries / events
Validation runs before write. Rejected writes emit no event.

## States & transitions
Not applicable (guard only).

## Validation & errors
Envelope per CTR-ERR-001. `details[].field` uses JSON-pointer style (`/windows/3/start_min`). Input values are never echoed (CTR-ERR-001 R07).

## Authorization
Validation does not authorize. See authorization_capabilities.

## Failure, idempotency, concurrency, offline
Validation is deterministic. Clients may pre-validate windows offline using the same tzdata snapshot; server remains authoritative.

## Privacy, retention, abuse
Rejected `tz` values are not logged in clear. Logs carry rule enum only.

## Observability & budgets
Counter per code. Validation p95 ≤ 2 ms.

## Tests
- TEST-PS-105-02-01 (unit): alias `Europe/Berlin` vs legacy alias normalizes to canonical name.
- TEST-PS-105-02-02 (property): all start and end values not multiple of 15 are rejected.
- TEST-PS-105-02-03 (unit): overlapping windows merge and return merged set.
- TEST-PS-105-02-04 (contract): each code matches CTR-ERR-001 format.

## Acceptance criteria
1. Every rule has one failing and one passing fixture.
2. Pinned tzdata version is enforced at startup.
3. No echoed input in responses.

## Assumptions & open decisions
- ASSUMPTION: tzdata updated monthly by platform operations.
- Message keys pending mod_languages catalog.
- D05 PROVISIONAL (D05 default, unapproved) governs zone source.
