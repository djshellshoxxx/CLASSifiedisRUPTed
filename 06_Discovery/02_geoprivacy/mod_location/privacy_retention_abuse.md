# PS-048-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/02_geoprivacy/mod_location. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R01, R03, R05, R06, R09, R11), CTR-FED-001 (R03); PENDING CTR-DSC-001.

**Decision labels:** D05 PROVISIONAL (client-side resolution, cell-only storage). D07 PROVISIONAL (coordinates 0-day retention in MVP).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-048-07.R01 | Precise coordinates are LOCATION_PRECISE: never stored, never logged, never federated, never in public payloads (CTR-PRV-001 R03). | MVP |
| PS-048-07.R02 | Stored data is one LOCATION_COARSE cell per account. | MVP |
| PS-048-07.R03 | Device permission is requested only from an explicit user action; no background location. | MVP |
| PS-048-07.R04 | Location spoofing: resolved cells from fixes with accuracy > 25 km or impossible speed between consecutive set events (> 900 km/h, ASSUMPTION) are flagged for review, not rejected silently. | MVP |
| PS-048-07.R05 | Account deletion clears cell within 24 h (CTR-PRV-001 R06). | MVP |
| PS-048-07.R06 | Federation of stored cells: Future; only with K_MIN rule (CTR-PRV-001). | Future |

## Data / schema
Retention: cell RET-ACC; consent records RET-AUD; coordinates RET-LOC set to 0 days (no storage). Client cache RET-EPH.

## Commands / queries / events
No coordinates in any command or event.

## States & transitions
Flagged cell (spoofing review) state added: `flagged` (Future detail).

## Validation & errors
Spoof checks produce `LOCATION.FLAGGED_FOR_REVIEW` internal code, not shown to user.

## Authorization
Review access via F12 case scope only.

## Failure, idempotency, concurrency, offline
Spoof check uses only cell codes and timestamps.

## Privacy, retention, abuse
Threats: trilateration by repeated set operations (limited by picker budget and cell granularity; see mod_proximity); GPS spoofing; stalkers using location change timing; metadata leakage in HTTP headers (client sends no coordinates in headers, URLs or query strings); third-party analytics SDK receiving location (forbidden by policy).

## Observability & budgets
Aggregate count of flagged sets per day, K_MIN applied.

## Tests
- TEST-PS-048-07-01 (static): forbidden keys in all payload schemas.
- TEST-PS-048-07-02 (client): no coordinate in URL, headers or body across a full resolve-and-set flow.
- TEST-PS-048-07-03 (abuse): 1 000 spoofed fixes trigger flag rate threshold.
- TEST-PS-048-07-04 (retention): deletion clears cell within 24 h.

## Acceptance criteria
1. Zero coordinate fields in server schemas (static check).
2. Network capture shows zero coordinates.
3. Flagging thresholds defined and reviewed by F10.

## Assumptions & open decisions
- ASSUMPTION: 900 km/h spoof threshold.
- D05 and D07 PROVISIONAL.
