# PS-066-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/03_meetups/mod_safe (Platform Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-ID-001, CTR-PRV-001 (R03). **Decisions:** D05 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-066-02.R01 | Reject any request containing a key named `address`, `lat`, `lng`, `coordinates`, `landmark` or `location` (any depth) with `SYS.REQUEST_MALFORMED`. | MVP |
| PS-066-02.R02 | Reject windows longer than PT12H or starting more than P30D after now. | MVP |
| PS-066-02.R03 | `venue_ref` must exist in the curated list or equal `custom_public`. | MVP |
| PS-066-02.R04 | Check-in accepted only when `now` is within `[window_start - 30 min, window_end + 30 min]`. | MVP |
| PS-066-02.R05 | Five failed check-in codes per party per plan within 15 min lock that party's check-in for 15 min. | MVP |
| PS-066-02.R06 | At most one trusted contact per party; contact handle normalized (trimmed, lowercased) before hashing. | MVP |

## Data / schema
Rule enum: `participant`, `forbidden_field`, `window_length`, `window_lead`, `venue_known`, `checkin_code`, `checkin_window`, `checkin_lock`, `trusted_contact_limit`.

## Commands / queries / events
Applies to `meetup.propose`, `meetup.confirm`, `meetup.check_in`, `meetup.set_trusted_contact`.

## States & transitions
A validation failure writes no plan row and no event.

## Validation & errors
| Rule | Code | Category / HTTP | Retryable | Message key |
|---|---|---|---|---|
| Non-participant | `SYS.NOT_FOUND` | not_found / 404 | false | `err.sys.not_found` |
| Forbidden field | `SYS.REQUEST_MALFORMED` | validation / 400 | false | `err.sys.request_malformed` |
| Window too long | `SAFE.WINDOW_TOO_LONG` | validation / 400 | false | `err.safe.window_too_long` |
| Window too far ahead | `SAFE.WINDOW_TOO_FAR` | validation / 400 | false | `err.safe.window_too_far` |
| Venue unknown | `SAFE.VENUE_UNKNOWN` | validation / 400 | false | `err.safe.venue_unknown` |
| Code wrong | `SAFE.CHECKIN_CODE_INVALID` | unprocessable_state / 422 | false | `err.safe.checkin_code_invalid` |
| Check-in outside window | `SAFE.OUTSIDE_WINDOW` | unprocessable_state / 422 | true | `err.safe.outside_window` |
| Lock active | `SYS.RATE_LIMITED` | rate_limited / 429 | true | `err.sys.rate_limited` |
| Contact limit | `SAFE.TRUSTED_CONTACT_LIMIT` | validation / 400 | false | `err.safe.trusted_contact_limit` |

`retryable: true` applies only when the same unchanged request can succeed later (`SAFE.OUTSIDE_WINDOW` before window start; the lock).

## Authorization
Participant check (PS-066-05) runs before field validation; non-participants never learn which rule failed.

## Failure, idempotency, concurrency, offline
Validation is deterministic and uses server time at commit. Diagnostics name the rule enum only; they never echo window times or codes.

## Privacy, retention, abuse
Diagnostics contain no venue, time, handle or code value (CTR-ERR-001 R06).

## Observability & budgets
Counter by (code, rule). Alert when `SAFE.CHECKIN_CODE_INVALID` exceeds 20% of check-ins in an hour (ASSUMPTION; abuse signal).

## Tests
- TEST-PS-066-02-01 (unit): each row of the error table returns its code and retryable value.
- TEST-PS-066-02-02 (unit): nested `location` key in a venue object is rejected.
- TEST-PS-066-02-03 (integration): sixth wrong code locks the party for 15 min; lock expiry allows retry.
- TEST-PS-066-02-04 (unit): check-in at window_end + 31 min is rejected.

## Acceptance criteria
1. Error table implemented exactly and registered in CTR-ERR-001.
2. No error body contains window times, codes or handles (test scan).
3. Non-participant and nonexistent plan responses are byte-identical.

## Assumptions & open decisions
- ASSUMPTION: 30-minute check-in tolerance; 5 attempts per 15 min.
- D05 (PROVISIONAL default, unapproved).
