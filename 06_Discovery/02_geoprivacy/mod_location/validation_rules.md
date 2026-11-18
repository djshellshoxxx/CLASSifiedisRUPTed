# PS-048-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/02_geoprivacy/mod_location. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001 (R02, R06, R07), CTR-PRV-001 (R03), CTR-CAP-001 (R04).

**Decision labels:** Accuracy threshold ASSUMPTION; D05 PROVISIONAL.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-048-02.R01 | Reject `region_cell` not in active registry version as `LOCATION.UNKNOWN_CELL`. | MVP |
| PS-048-02.R02 | Client resolution rejects latitude outside [-90, 90] or longitude outside [-180, 180] or non-finite values as `LOCATION.INVALID_COORDINATES` (client-side). | MVP |
| PS-048-02.R03 | Client resolution refuses fixes with accuracy radius > 25 km (ASSUMPTION) as `LOCATION.ACCURACY_TOO_LOW`; user chooses cell from picker instead. | MVP |
| PS-048-02.R04 | Fix outside every active cell → `LOCATION.OUTSIDE_SUPPORTED_AREA`. | MVP |
| PS-048-02.R05 | Any request body field named `lat`, `lon`, `latitude`, `longitude`, `accuracy` or `address` → `LOCATION.PRECISE_NOT_ALLOWED` and request rejected. | MVP |
| PS-048-02.R06 | `location.cell.set` without consent record for `source = device_resolved` → `LOCATION.CONSENT_REQUIRED`. | MVP |

## Data / schema
| Rule | Where | Code | Retryable |
|---|---|---|---|
| V1 | server: cell | LOCATION.UNKNOWN_CELL | false |
| V2 | client: coordinates | LOCATION.INVALID_COORDINATES | false |
| V3 | client: accuracy | LOCATION.ACCURACY_TOO_LOW | false |
| V4 | client: containment | LOCATION.OUTSIDE_SUPPORTED_AREA | false |
| V5 | server: forbidden keys | LOCATION.PRECISE_NOT_ALLOWED | false |
| V6 | server: consent | LOCATION.CONSENT_REQUIRED | false |

## Commands / queries / events
V5 is enforced by a deny-list schema check at the gateway before parsing, so any precise field is rejected regardless of nesting.

## States & transitions
Rejected input leaves stored cell unchanged.

## Validation & errors
Client errors are rendered locally; server never receives the rejected coordinates. Server error responses never echo values (CTR-ERR-001 R07).

## Authorization
Consent check occurs after authentication (PS-048-05).

## Failure, idempotency, concurrency, offline
Validation is deterministic. Offline: picker selection queued? No: location set requires server; offline attempts are blocked with a message, not queued (D08 PROVISIONAL).

## Privacy, retention, abuse
Gateway logs record only the rule code (V5 counts as `PRECISE_NOT_ALLOWED`), not the body.

## Observability & budgets
Counter `location_validation_reject_total{code}`; any V5 event is a privacy alert.

## Tests
- TEST-PS-048-02-01 (unit): V1–V6 pass/fail.
- TEST-PS-048-02-02 (security): request with nested `lat` field is rejected.
- TEST-PS-048-02-03 (client): accuracy 30 km fix refused.

## Acceptance criteria
1. All six rules tested.
2. Any V5 rejection triggers privacy alert in staging test.
3. No coordinate value appears in any server log sample.

## Assumptions & open decisions
- ASSUMPTION: 25 km accuracy cutoff (F10 to validate).
