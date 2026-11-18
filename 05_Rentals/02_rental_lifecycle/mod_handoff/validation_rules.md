# PS-042-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 05_Rentals/02_rental_lifecycle/mod_handoff. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (coarse cells, EXIF), CTR-ERR-001, CTR-EVT-001 (clock rule R04).

**Decision labels:** Window length and clock tolerance are ASSUMPTION (OPEN, F05).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-042-02.R01 | Window: `window_end − window_start` between 30 min and 48 h (ASSUMPTION). Else `RNTHAND.WINDOW_INVALID` (400). | MVP |
| PS-042-02.R02 | Rental must be `RESERVED`; otherwise `SYS.UNPROCESSABLE_STATE` (422). | MVP |
| PS-042-02.R03 | `place_region_cell` must be a registered cell. Coordinates or free-text location → `RNTHAND.LOCATION_TOO_PRECISE` (400). | MVP |
| PS-042-02.R04 | Attest requires every checklist code present; any `issue` requires ≥ 1 photo digest. Missing → `RNTHAND.CHECKLIST_INCOMPLETE` (422). | MVP |
| PS-042-02.R05 | Photo digests ≤ 20 and 64 lowercase hex. Else `SYS.REQUEST_MALFORMED` (400). | MVP |
| PS-042-02.R06 | Attest only inside window ± 15 min client clock tolerance (ASSUMPTION); otherwise `RNTHAND.EXPIRED` (410) when past `window_end + 24 h`, or `RNTHAND.WINDOW_INVALID` before start. | MVP |
| PS-042-02.R07 | Actor must be the owner or renter of the rental. Else `SYS.NOT_FOUND`. | MVP |
| PS-042-02.R08 | Client-origin timestamps follow CTR-EVT-001 R04 bounds. Else `EVT.TIMESTAMP_OUT_OF_RANGE`. | MVP |

## Data / schema
Check order: participant (R07) → rental state (R02) → shape and cell (R03, R05) → window and clock (R01, R06, R08) → checklist (R04).

## Commands / queries / events
Applies to `rental_handoff.schedule` and `rental_handoff.attest`.

## States & transitions
Gates only; see PS-042-03.

## Validation & errors
All `RNTHAND.*` codes are non-retryable. Diagnostics carry rule ID, never location or photo data.

## Authorization
R07 only.

## Failure, idempotency, concurrency, offline
Offline attestation (D08) is revalidated against the window at commit; expired queued attestations are "not applied".

## Privacy, retention, abuse
Rejected location input is discarded; the error does not echo it.

## Observability & budgets
`rental_handoff_validation_reject_total{code}`.

## Tests
- TEST-PS-042-02-01 (unit): one case per R01–R08 code.
- TEST-PS-042-02-02 (boundary): window of 30 min passes; 30 min minus 1 s fails; 48 h passes.
- TEST-PS-042-02-03 (negative): street address in `place_region_cell` rejected, error body lacks the input.
- TEST-PS-042-02-04 (negative): `issue` checklist item with no photo rejected.

## Acceptance criteria
1. Every rule maps to one test and one registry code.
2. No rejected location text appears in responses or logs.
3. Window boundaries tested at both edges.

## Assumptions & open decisions
- ASSUMPTION: window bounds, 15-minute clock tolerance, 24-hour grace.
- OPEN (F05): whether handoff may occur without a reservation for walk-in rentals.
