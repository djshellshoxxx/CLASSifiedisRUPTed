# PS-028-07 — privacy retention abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 03_Services/01_service_catalog/mod_availability. **Parent:** [mod_availability SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-CAP-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-028-07.R01 | Window schedules are PRIVATE_PERSONAL: they reveal routine and possibly home presence. Never included in public search, federation or analytics export. | MVP |
| PS-028-07.R02 | `service_region` is LOCATION_COARSE (D05 default). No precise location is stored (PS-028-02 R06). | MVP |
| PS-028-07.R03 | Retention: OPEN, BLOCKED and RETIRED windows with end date older than 30 days are deleted (ASSUMPTION). BOOKED windows are retained with their booking under the booking's retention. | MVP |
| PS-028-07.R04 | Per customer per `srv_`: ≤ 3 holds per day (ASSUMPTION); excess → `SYS.RATE_LIMITED`. | MVP |
| PS-028-07.R05 | Per provider: ≤ 500 window writes per hour; excess → `SYS.RATE_LIMITED`. | MVP |

## Data / schema
Retention fields: `retain_until` (computed), `legal_hold` (set by F10 only). Deletion removes schedule fields and keeps an aggregate count per day.

## Commands / queries / events
Deletion runs as `sys` and emits `svcavail.window.purged` with count only.

## States & transitions
ACTIVE → EXPIRED_HISTORY (end + 30 days) → PURGED. BOOKED windows follow booking retention.

## Validation & errors
Export or deletion under legal hold → `SYS.CONFLICT` (reason `legal_hold`).

## Authorization
Provider may export and delete own windows (`srv.update`). Purge job is `sys`.

## Failure, idempotency, concurrency, offline
Purge idempotent per window. Hold abuse: holds without quote activity expire at TTL (PS-028-03 R02) and do not count against the daily cap after release.

## Privacy, retention, abuse
Abuse patterns: calendar blocking by fake holds; scraping of schedules to infer routines; enumeration of provider windows. Controls: R04, R05, aggregate-only anonymous search (PS-028-05 R03), enumeration alert (PS-028-08). Pseudonyms do not hide the provider's routine from a booked customer.

## Observability & budgets
Metrics: `svcavail_rate_limited_total{kind}`, `svcavail_windows_purged_total`. No schedule content in logs.

## Tests
- TEST-PS-028-07-01 (lint): schedule fields carry PRIVATE_PERSONAL; no coordinate field.
- TEST-PS-028-07-02 (abuse): 4th hold in one day rejected with `SYS.RATE_LIMITED`.
- TEST-PS-028-07-03 (integration): purge after 30 days leaves only daily counts.
- TEST-PS-028-07-04 (negative): scraping test of anonymous search finds no provider IDs or exact times.

## Acceptance criteria
1. Retention job matches R03 in scheduler configuration.
2. Public response scan finds zero schedule fields.
3. Rate limits enforced in staging load test.

## Assumptions & open decisions
- ASSUMPTION: 30-day history; 3 holds per customer per service per day; 500 writes per provider per hour.
- PROVISIONAL: D05 coarse-region default; D07 retention default (unapproved). See [DECISIONS.md](../../../DECISIONS.md).
