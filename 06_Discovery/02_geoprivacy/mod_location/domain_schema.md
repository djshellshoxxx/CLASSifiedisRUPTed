# PS-048-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/02_geoprivacy/mod_location. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R03, R06, R09, R11), CTR-ID-001 (`acc_`), CTR-SCH-001; PENDING CTR-DSC-001.

**Decision labels:** Client-side cell resolution is PROVISIONAL (D05 default, unapproved). Coordinates are never persisted (PROVISIONAL, D07 default, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-048-01.R01 | Stored location for discovery is one `region_cell` per `acc_` (LOCATION_COARSE). No other location field is stored by this module. | MVP |
| PS-048-01.R02 | Latitude and longitude are never persisted, logged or sent to the server in MVP; cell resolution runs on the client against public cell geometry. | MVP |
| PS-048-01.R03 | Device-supplied coordinates have a lifetime of ≤ 2 s in client memory (ASSUMPTION) and are discarded after resolution. | MVP |
| PS-048-01.R04 | Stored cell carries `set_at`, `source` (`picker` or `device_resolved`) and `consent_id`. | MVP |
| PS-048-01.R05 | Home address text is not accepted in MVP; geocoding by third parties is Future and requires F10 review. | Future |

## Data / schema
```json
{
  "account_ref": "acc_<26>",
  "region_cell": "DE-BE-C1",
  "source": "picker|device_resolved",
  "set_at": "RFC 3339 UTC",
  "consent_id": "grt_<26> or null",
  "data_class": "LOCATION_COARSE"
}
```
Not stored: `lat`, `lon`, `accuracy_m`, `address`, device identifiers, geocoder results.

## Commands / queries / events
`location.cell.set`, `location.cell.clear`, `location.consent.grant`, `location.consent.withdraw`, query `location.cell.get`. Event `location.cell.changed` (LOCATION_COARSE only). Detail in PS-048-04.

## States & transitions
Stored cell: `unset → set → cleared`; `set → set` on change. Consent: `none → granted → withdrawn`. See PS-048-03.

## Validation & errors
See PS-048-02. Error prefix `LOCATION.`.

## Authorization
See PS-048-05.

## Failure, idempotency, concurrency, offline
See PS-048-06.

## Privacy, retention, abuse
Retention: stored cell RET-ACC (account lifetime + 30 days grace). Coordinates RET-LOC is 0 days in MVP. See PS-048-07.

## Observability & budgets
See PS-048-08.

## Tests
- TEST-PS-048-01-01 (static): schema has no lat, lon, accuracy or address key.
- TEST-PS-048-01-02 (unit): `source` enum rejects other values.
- TEST-PS-048-01-03 (client): device coordinates absent from all outbound requests.

## Acceptance criteria
1. Schema validated; no coordinate field present.
2. Network capture during device resolution contains no coordinates (test).
3. Withdrawal clears stored cell (PS-048-03).

## Assumptions & open decisions
- ASSUMPTION: client can download cell geometry for the active registry version.
- D05 PROVISIONAL; D07 PROVISIONAL.
