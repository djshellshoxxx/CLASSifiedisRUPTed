# PS-028-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 03_Services/01_service_catalog/mod_availability. **Parent:** [mod_availability SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-ERR-001, CTR-PRV-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-028-02.R01 | `end_utc` > `start_utc`; duration between 15 minutes and 24 hours. Otherwise `SVCAVAIL.WINDOW_RANGE_INVALID`. | MVP |
| PS-028-02.R02 | `timezone` must be a valid IANA zone. A local time that does not exist (DST gap) is rejected with `SVCAVAIL.NONEXISTENT_LOCAL_TIME`; an ambiguous local time requires an explicit offset. | MVP |
| PS-028-02.R03 | `recurrence` supports only `FREQ=DAILY` or `FREQ=WEEKLY` with `UNTIL` ≤ 366 days from creation and ≤ 200 expanded occurrences. Otherwise `SVCAVAIL.RRULE_UNSUPPORTED`. | MVP |
| PS-028-02.R04 | For `capacity` = 1, no two OPEN or HELD windows of the same `srv_id` may overlap. Otherwise `SVCAVAIL.OVERLAP`. | MVP |
| PS-028-02.R05 | Per `srv_id`, at most 500 windows in OPEN or HELD state (ASSUMPTION). Excess → `SVCAVAIL.WINDOW_LIMIT_EXCEEDED`. | MVP |
| PS-028-02.R06 | Fields named `address`, `latitude`, `longitude` or `precise_location` → `SVCAVAIL.PRECISE_LOCATION_FORBIDDEN`. | MVP |
| PS-028-02.R07 | ICS import: file ≤ 256 KB; only VEVENT `DTSTART`, `DTEND`, `RRULE` read; other properties dropped; invalid entries reported by index, not by content. | MVP |

## Data / schema
Validation runs on the full window and on the expanded occurrence set for recurrences. Times are normalized to UTC after validation.

## Commands / queries / events
Enforced by `svcavail.create_window`, `svcavail.update_window` and `svcavail.import_ics` before persistence.

## States & transitions
Not applicable. A failed validation leaves no partial rows (batch import is all-or-nothing).

## Validation & errors
| Code | Retryable | Category / HTTP | Diagnostic |
|---|---|---|---|
| SVCAVAIL.WINDOW_RANGE_INVALID | false | validation / 400 | field path |
| SVCAVAIL.NONEXISTENT_LOCAL_TIME | false | validation / 400 | field path |
| SVCAVAIL.RRULE_UNSUPPORTED | false | validation / 400 | rule enum |
| SVCAVAIL.OVERLAP | false | conflict / 409 | conflicting window ID class only |
| SVCAVAIL.WINDOW_LIMIT_EXCEEDED | false | validation / 400 | count |
| SVCAVAIL.PRECISE_LOCATION_FORBIDDEN | false | validation / 400 | field path |
| SVCAVAIL.ICS_INVALID | false | validation / 400 | entry index |

Messages: `err.svcavail.<code>` keys. Input values are never echoed.

## Authorization
Validation runs after authorization (PS-028-05).

## Failure, idempotency, concurrency, offline
Deterministic for the same input and timezone database version. Offline edits validated locally as a preview; server result authoritative (D08).

## Privacy, retention, abuse
ICS import is untrusted input: parser runs with size and entry caps; no network fetch of URLs inside ICS. Rejections per actor counted for abuse signals.

## Observability & budgets
Validation for a 366-day RRULE expansion ≤ 50 ms p95 (ASSUMPTION). Metric `svcavail_validation_rejections_total{code}`.

## Tests
- TEST-PS-028-02-01 (unit): one failing input per code.
- TEST-PS-028-02-02 (unit): DST spring-forward gap time rejected; autumn overlap requires offset.
- TEST-PS-028-02-03 (property): overlap check finds all overlaps in 10,000 random capacity-1 sets.
- TEST-PS-028-02-04 (negative): ICS file of 256 KB + 1 byte rejected; URL inside ICS not fetched.

## Acceptance criteria
1. All seven codes registered in CTR-ERR-001 lint.
2. DST fixtures for at least three zones pass.
3. Import is atomic: zero rows persisted on any failing entry.

## Assumptions & open decisions
- ASSUMPTION: 500-window cap; 15-minute minimum duration.
- Timezone database version pinned per release; upgrades documented (see PS-028-10).
- D05 default (coarse location only) applies to region fields. See [DECISIONS.md](../../../DECISIONS.md).
