# PS-064-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/03_meetups/mod_coordination. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-PRV-001 (LOCATION_PRECISE never in public payloads), CTR-SCH-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-064-02.R01 | `window_start` > now + 1 h; `window_end` > `window_start`; duration ≤ 6 h; `window_start` ≤ now + 30 days. | MVP |
| PS-064-02.R02 | `window_start` and `window_end` on whole minutes; local-time display converted server-side from user timezone (no precise location used). | MVP |
| PS-064-02.R03 | `venue_ref` must exist in the active public venue registry and be in state `listed`. | MVP |
| PS-064-02.R04 | `place_text` 0–80 code points, NFC; rejects email, phone, URL, and street-number-plus-street patterns (heuristic). | MVP |
| PS-064-02.R05 | Exactly one of `venue_ref` or `place_text` may be set; both empty is allowed only while state is `proposed`. | MVP |
| PS-064-02.R06 | Disclosure `point` must be a valid WGS84 coordinate with ≤ 5 decimal places (about 1 m) and must be inside the venue's bounding box or a registered meeting area (ASSUMPTION). | MVP |
| PS-064-02.R07 | Validation messages never echo `place_text` or coordinates. | MVP |

## Data / schema
Maps to [domain_schema.md](domain_schema.md).

## Commands / queries / events
Applies to `ProposeMeetup`, `ProposeReschedule`, `ShareMeetupPoint`.

## States & transitions
Validation precedes state change.

## Validation & errors
| Code | `retryable` | `message_key` | `details[].rule` |
|---|---|---|---|
| `COORD.WINDOW_INVALID` | false | `err.coord.window_invalid` | `window` |
| `COORD.WINDOW_TOO_FAR` | false | `err.coord.window_far` | `horizon` |
| `COORD.VENUE_NOT_LISTED` | false | `err.coord.venue_not_listed` | `registry` |
| `COORD.PLACE_TEXT_INVALID` | false | `err.coord.place_invalid` | `forbidden_content` |
| `COORD.PLACE_CONFLICT` | false | `err.coord.place_conflict` | `exclusive` |
| `COORD.POINT_INVALID` | false | `err.coord.point_invalid` | `geo` |

## Authorization
Validation does not authorize; PS-064-05 runs first.

## Failure, idempotency, concurrency, offline
Deterministic for same input and registry version. Venue registry removal after proposal does not invalidate existing meetups; new proposals rejected.

## Privacy, retention, abuse
`ShareMeetupPoint` values never logged or echoed. Rejections count by rule only.

## Observability & budgets
`coord_validation_fail_total{code}`; validation p95 ≤ 5 ms.

## Tests
- TEST-PS-064-02-01 (unit): window boundary cases (1 h, 30 days, 6 h).
- TEST-PS-064-02-02 (negative): place text containing address pattern rejected; error has no echo.
- TEST-PS-064-02-03 (property): point with more than 5 decimals rejected.
- TEST-PS-064-02-04 (privacy): coordinates absent from errors and logs (fixture scan).

## Acceptance criteria
1. All rules enforced server-side.
2. No echo of place text or coordinates.
3. Window invariants hold at boundary tests.
4. Venue registry membership enforced.

## Assumptions & open decisions
- ASSUMPTION: 1 h minimum lead time; 6 h maximum duration; 30-day horizon.
- PROVISIONAL (D05 default, unapproved): venue registry and coarse regions.
