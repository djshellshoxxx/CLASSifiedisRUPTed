# PS-041-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 05_Rentals/02_rental_lifecycle/mod_damage. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-COM-001 (amount and currency rules), CTR-ERR-001, CTR-PRV-001 (EXIF and diagnostics).

**Decision labels:** Reporting window, line caps and evidence minimums are ASSUMPTION (OPEN, F05). D06 PROVISIONAL.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-041-02.R01 | Report allowed only within 7 days after the renter's return attestation (`rtn_`). Later → `DAMAGE.WINDOW_CLOSED` (409). | MVP |
| PS-041-02.R02 | Lines 1–20. Zero or 21+ → `DAMAGE.LINE_LIMIT` (422). | MVP |
| PS-041-02.R03 | Each line with `amount_minor` > 0 has 1–10 digests. Missing → `DAMAGE.EVIDENCE_REQUIRED` (422). | MVP |
| PS-041-02.R04 | Each line amount ≤ declared value of the affected item (`DAMAGE.AMOUNT_OVER_CAP`, 422). Declared value comes from the rental terms. | MVP |
| PS-041-02.R05 | `amount_minor` matches `^(0\|[1-9][0-9]{0,38})$`. Else `COM.AMOUNT_INVALID` (400). Currency equals rental currency (`COM.CURRENCY_MISMATCH`, 422). | MVP |
| PS-041-02.R06 | Sum of lines = `total_minor`. Otherwise `DAMAGE.TOTAL_MISMATCH` (422). | MVP |
| PS-041-02.R07 | `description` ≤ 280 characters; e-mail, phone or address patterns → `DAMAGE.DESCRIPTION_CONTACT_DATA` (400). | MVP |
| PS-041-02.R08 | Photos: image types JPEG, PNG, HEIC only; ≤ 10 MB each (ASSUMPTION); unsupported → `SYS.REQUEST_MALFORMED`. | MVP |
| PS-041-02.R09 | Reporter must be the rental owner; `against` must be the renter. Else `SYS.NOT_FOUND`. | MVP |

## Data / schema
Check order: participant (R09) → window (R01) → shape → line and evidence rules (R02, R03, R05, R06, R07, R08) → cap (R04).

## Commands / queries / events
Applies to `damage.report` at entry, and to per-line decisions at acknowledge or contest.

## States & transitions
Gates only. Transitions in PS-041-03.

## Validation & errors
All `DAMAGE.*` codes are non-retryable. Diagnostics name field path and rule ID only.

## Authorization
R09 is the only authorization rule here.

## Failure, idempotency, concurrency, offline
Offline report is queued (D08) with photo digests computed on device; bytes upload first. Server rejects if window closed at commit (`DAMAGE.WINDOW_CLOSED`, non-retryable).

## Privacy, retention, abuse
Rejected photos are discarded without storage. Validation logs carry no description text.

## Observability & budgets
`damage_validation_reject_total{code}`. Validation p95 ≤ 50 ms excluding upload (ASSUMPTION).

## Tests
- TEST-PS-041-02-01 (unit): one case per R01–R09 code.
- TEST-PS-041-02-02 (boundary): 20 lines pass; 21 fail; exact cap passes; cap + 1 fails.
- TEST-PS-041-02-03 (negative): line with amount and zero digests rejected.
- TEST-PS-041-02-04 (negative): report on day 8 after return → `DAMAGE.WINDOW_CLOSED`.

## Acceptance criteria
1. Every rule ID maps to one test and one registry code.
2. Boundary tests pass at exact limits.
3. No validation log contains description text.

## Assumptions & open decisions
- ASSUMPTION: 7-day window, 20-line cap, 10 MB photo limit (OPEN, F05).
- PROVISIONAL (D06 default, unapproved).
