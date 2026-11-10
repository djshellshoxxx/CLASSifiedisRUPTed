# PS-039-02 — validation rules

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-039-02. **Owner:** [05_Rentals/01_rental_catalog/mod_availability](SPEC.md). **Implementing module:** 05_Rentals/01_rental_catalog/mod_availability. **Consumers:** 05_Rentals/02_rental_lifecycle (claim commands), notifications (error keys for requesters and owners), observability; shared F07, F10, F15, F16 per [dependency matrix](../../../DEPENDENCY_MATRIX.md).

## Requirements
- PS-039-02.R01: Every command is validated in the order: envelope (schema version, idempotency key), authorization, input shape, time rules, state and conflict rules. The first failing rule determines the single returned error code.
- PS-039-02.R02: Each rejection returns exactly one code of the form `AVAIL_<CODE>` from the table below, with a retryable flag and a localized message key. Enumerated cases: normal, invalid, expired, duplicate, concurrent, offline replay and adversarial input.
- PS-039-02.R03: Validation messages contain no participant IDs of other parties, no coordinates, and no free text. Messages are localizable by key, and fields are named for screen readers.

## Input rules
| Rule | Applies to | Check |
|---|---|---|
| Timestamps are RFC 3339 UTC with `Z` | all time fields | reject offsets other than `Z` |
| Minute alignment | starts_at_utc, ends_at_utc | seconds and milliseconds must be zero |
| Non-empty range | all intervals | ends_at_utc > starts_at_utc |
| Maximum span | windows, blocks, claims | <= 366 days (A-AVAIL-05) |
| Future publish | windows and blocks | ends_at_utc > now |
| Known timezone | timezone_id | valid IANA identifier |
| Closed reason set | block reason_code | one of the four codes in the schema |
| No unknown fields | every command body | unknown field rejected |
| Owner-only mutation | window and block writes | actor equals listing owner |
| No self-request | claim hold | requester_participant_id differs from listing owner |

## Conflict rules
- Overlapping active windows for one listing are rejected, not merged (A-AVAIL-06). Adjacent windows (`ends == starts`) are allowed.
- A block may not overlap any held (unexpired) or committed claim. The owner must wait for expiry or request a lifecycle cancellation (A-AVAIL-07).
- A claim must lie fully inside one active window and must overlap no unexpired held or committed claim and no active block.
- Adjacent claims and blocks are allowed (A-AVAIL-08).

## Error codes
| Code | Trigger | Retryable | Message key |
|---|---|---|---|
| AVAIL_LISTING_ID_INVALID | listing_id fails format or does not exist | no | listing.invalid |
| AVAIL_LISTING_SUSPENDED | listing suspended by moderation | no | listing.suspended |
| AVAIL_TIMESTAMP_FORMAT | not RFC 3339 UTC with Z | no | time.format |
| AVAIL_TIME_NOT_MINUTE_ALIGNED | seconds or milliseconds non-zero | no | time.alignment |
| AVAIL_RANGE_EMPTY_OR_REVERSED | ends_at_utc <= starts_at_utc | no | time.range |
| AVAIL_RANGE_TOO_LONG | span > 366 days | no | time.span |
| AVAIL_RANGE_IN_PAST | window or block ends at or before now | no | time.past |
| AVAIL_TIMEZONE_UNKNOWN | timezone_id not in IANA database | no | timezone.unknown |
| AVAIL_REASON_CODE_INVALID | block reason outside closed set | no | reason.invalid |
| AVAIL_FIELD_UNKNOWN | body contains a field not in the schema | no | field.unknown |
| AVAIL_SCHEMA_VERSION_UNSUPPORTED | schema_version not 1 | no | schema.unsupported |
| AVAIL_WINDOW_OVERLAP | new window overlaps active window | no | window.overlap |
| AVAIL_WINDOW_LIMIT_EXCEEDED | more than 500 active windows for listing | no | window.limit |
| AVAIL_WINDOW_NOT_FOUND | window_id unknown or not visible to actor | no | window.notfound |
| AVAIL_WINDOW_NOT_ACTIVE | operation on withdrawn window | no | window.inactive |
| AVAIL_WINDOW_HAS_COMMITMENTS | withdraw while committed claim inside window | no | window.committed |
| AVAIL_OUTSIDE_WINDOW | claim not fully inside one active window | no | claim.outside |
| AVAIL_SELF_REQUEST_FORBIDDEN | owner places hold on own listing | no | claim.self |
| AVAIL_CLAIM_CONFLICT | overlap with held or committed claim | no | claim.conflict |
| AVAIL_BLOCK_OVERLAPS_CLAIM | block overlaps held or committed claim | no | block.overlap |
| AVAIL_CLAIM_NOT_FOUND | claim_id unknown or not visible to actor | no | claim.notfound |
| AVAIL_CLAIM_STATE_INVALID | transition not allowed from current state | no | claim.state |
| AVAIL_HOLD_TTL_INVALID | requested TTL outside 1 h to 7 d | no | hold.ttl |
| AVAIL_REVISION_CONFLICT | expected_revision differs from stored revision | yes | conflict.revision |
| AVAIL_IDEMPOTENCY_KEY_MISSING | write without idempotency key | no | idempotency.missing |
| AVAIL_IDEMPOTENCY_KEY_REUSED | same key with different request_hash | no | idempotency.reused |
| AVAIL_NOT_AUTHORIZED | actor lacks capability for action | no | auth.denied |
| AVAIL_QUERY_RANGE_TOO_LARGE | query range > 92 days for public or > 366 days for owner | no | query.range |
| AVAIL_RATE_LIMITED | rate limit for actor or listing exceeded | yes | rate.limited |
| AVAIL_UNAVAILABLE | dependency or lock timeout | yes | service.unavailable |

## Open decisions
- A-AVAIL-06: Overlapping active windows are rejected rather than merged. Merging would hide owner intent.
- A-AVAIL-07: Owner blocks over held or committed claims are rejected, not auto-cancelling the claim. Cancellation belongs to 02_rental_lifecycle.
- A-AVAIL-08: Adjacent intervals are allowed because the interval model is half-open.
- A-AVAIL-09: Maximum 500 active windows per listing. Chosen to bound search and calendar rendering cost.
