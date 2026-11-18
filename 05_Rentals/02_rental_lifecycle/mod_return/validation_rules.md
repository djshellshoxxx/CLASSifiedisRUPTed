# PS-043-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 05_Rentals/02_rental_lifecycle/mod_return. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-PRV-001 (cells, diagnostics), CTR-EVT-001 (clock rule R04).

**Decision labels:** Early-declaration window (24 h) and owner window (7 days) are ASSUMPTION (OPEN, F05).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-043-02.R01 | Renter may declare return from `due_at − 24 h` onward. Earlier → `RETURN.TOO_EARLY` (409). | MVP |
| PS-043-02.R02 | Declaration allowed once; a second declaration → `RETURN.ALREADY_DECLARED` (409). | MVP |
| PS-043-02.R03 | `return_place_cell` must be a registered cell; coordinates or free text location → `RETURN.LOCATION_TOO_PRECISE` (400). | MVP |
| PS-043-02.R04 | Checklist complete (all four codes); any `issue` requires a note of 1–500 characters. Missing → `RETURN.CHECKLIST_INCOMPLETE` (422). | MVP |
| PS-043-02.R05 | `renter_note` ≤ 500 characters; e-mail, phone or address patterns → `RETURN.NOTE_CONTACT_DATA` (400). | MVP |
| PS-043-02.R06 | Owner confirmation or damage report allowed only while owner window is open (declared_at + 7 days). Later → `RETURN.WINDOW_CLOSED` (409). | MVP |
| PS-043-02.R07 | Only the renter declares; only the owner confirms or reports. Other actors → `SYS.NOT_FOUND`. | MVP |
| PS-043-02.R08 | Client timestamps follow CTR-EVT-001 R04; else `EVT.TIMESTAMP_OUT_OF_RANGE`. | MVP |

## Data / schema
Check order: participant and role (R07) → state (R01, R02, R06) → shape and cell (R03, R05) → checklist (R04) → clock (R08).

## Commands / queries / events
Applies to `return.declare`, `return.confirm`, `return.report_damage`.

## States & transitions
Gates only; PS-043-03.

## Validation & errors
All `RETURN.*` codes non-retryable. Diagnostics: rule ID and field path only.

## Authorization
R07.

## Failure, idempotency, concurrency, offline
Offline declaration queued (D08); revalidated at commit; late commit is recorded with server time, so `late_minutes` stays correct.

## Privacy, retention, abuse
Rejected notes and locations are not echoed or logged.

## Observability & budgets
`return_validation_reject_total{code}`.

## Tests
- TEST-PS-043-02-01 (unit): one case per R01–R08 code.
- TEST-PS-043-02-02 (boundary): declaration at exactly `due_at − 24 h` passes; one second earlier fails.
- TEST-PS-043-02-03 (boundary): owner confirm at exactly declared_at + 7 days passes; +1 s fails.
- TEST-PS-043-02-04 (negative): note with e-mail address rejected, body lacks the note.

## Acceptance criteria
1. Each rule maps to one test and one code.
2. Boundary tests pass at both edges.
3. No rejected note or location text in responses or logs.

## Assumptions & open decisions
- ASSUMPTION: 24-hour early window and 7-day owner window (OPEN, F05).
