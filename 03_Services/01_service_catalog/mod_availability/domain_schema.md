# PS-028-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 03_Services/01_service_catalog/mod_availability. **Parent:** [mod_availability SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001 (PENDING `avw_` prefix registration), CTR-PRV-001, CTR-SCH-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-028-01.R01 | Record type `avw` (service availability window) with ID `avw_<26 base32>`, class opaque (schedule timing is private). Prefix `avw` is PENDING CTR-ID-001 registration (MINOR change, owner F03). | MVP |
| PS-028-01.R02 | Fields: `srv_id`, `provider` (`acc_`), `start_utc`, `end_utc` (ISO-8601 Z), `timezone` (IANA name), `recurrence` (RRULE subset, see PS-028-02), `capacity` (integer 1–20), `status`, `hold_expires_at`, `service_region` (coarse region code only), `revision`. | MVP |
| PS-028-01.R03 | `service_region` is a coarse region from the F06 geoprivacy vocabulary (D05 default). Street address, coordinates and exact service location are not stored here. | MVP |
| PS-028-01.R04 | `source` ∈ {`manual`, `ics_import`}. Provenance recorded per window. | MVP |
| PS-028-01.R05 | Canonical owner of service-availability windows: F03.S01.M02 (this module). Listing stock quantity remains with F01.S03.M01 and is never written here. | MVP |

## Data / schema
```json
{"avw_id": "avw_01HZ...", "srv_id": "srv_01HZ...", "provider": "acc_01HZ...",
 "start_utc": "2026-12-05T09:00:00Z", "end_utc": "2026-12-05T11:00:00Z",
 "timezone": "Europe/Berlin", "recurrence": null, "capacity": 1,
 "status": "OPEN", "hold_expires_at": null, "service_region": "DE-BE",
 "source": "manual", "revision": 3, "schema_version": "1.0.0"}
```
- Data classes: schedule fields PRIVATE_PERSONAL; `service_region` LOCATION_COARSE; `provider` PSEUDONYMOUS.
- Persisted with `revision` for CAS (CTR-EVT-001 R02).

## Commands / queries / events
Covered in PS-028-04. Schema IDs: `svcavail.window` (1.0.0).

## States & transitions
Covered in PS-028-03.

## Validation & errors
Covered in PS-028-02.

## Authorization
Covered in PS-028-05.

## Failure, idempotency, concurrency, offline
Covered in PS-028-06.

## Privacy, retention, abuse
Covered in PS-028-07.

## Observability & budgets
Window write ≤ 20 ms p95 (ASSUMPTION).

## Tests
- TEST-PS-028-01-01 (unit): required fields present; `capacity` boundaries 0, 1, 20, 21.
- TEST-PS-028-01-02 (lint): `service_region` values are in the coarse vocabulary; no coordinate field exists.
- TEST-PS-028-01-03 (lint): every field has one CTR-PRV-001 class.

## Acceptance criteria
1. Schema references CTR-ID-001 entity-id definition by `$ref`.
2. No field stores a street address or coordinate (lint).
3. `avw` prefix registration request filed with F15 before implementation (PENDING CTR-ID-001).

## Assumptions & open decisions
- ASSUMPTION: capacity 1–20 per window.
- PENDING CTR-ID-001: `avw` prefix. Review B-06: listing availability (F01.S03.M01) and service availability (this module) share a slug; consumers must use full IDs.
- D05 (geoprivacy) PROVISIONAL default: coarse regions only. See [DECISIONS.md](../../../DECISIONS.md).
