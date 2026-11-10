# PS-043-02 — validation rules

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-043-02. **Owner:** [05_Rentals/02_rental_lifecycle/mod_return](SPEC.md). **Implementing module:** 05_Rentals/02_rental_lifecycle/mod_return. **Consumers:** clients and the event consumers listed in [commands_queries_events.md](commands_queries_events.md).

## Purpose and scope
Defines every input check applied to return commands, the exact error code returned for each failed check, and the order in which checks run. Field definitions come from [domain_schema.md](domain_schema.md). Authentication failures use F07/F16 codes and are outside this prefix.

## Requirements
- PS-043-02.R01: Every rejected command returns exactly one code from Table 3 and no partial state change. Checks run in the order in Section "Check order".
- PS-043-02.R02: Case coverage. Invalid input, duplicate keys, out-of-window timestamps, stale revisions, blocked actors and oversized notes each map to one code. Adversarial input (bidi overrides, control characters, back-dated timestamps) is rejected, never silently corrected except for NFC normalization and trimming.
- PS-043-02.R03: Messages are localized through `message_key`. No error message contains participant data, note text or coordinates.
- PS-043-02.R04: Error body follows CTR-ERR-001 and the shape in Section "Error body".
- PS-043-02.R05: Text normalization: Unicode NFC, then trim leading and trailing whitespace, then length check. Newlines are not permitted in notes.
- PS-043-02.R06: Timestamp acceptance: RFC 3339 with explicit offset, precision to seconds (fractional seconds truncated to milliseconds). Accepted window for `returned_at`: `handoff_at <= returned_at <= server_now + 300 s` (A-return-10).

## Check order
1. Transport and authentication (F07/F16 codes).
2. Idempotency-Key presence and format (RETURN_IDEMPOTENCY_KEY_INVALID).
3. schema_version support (RETURN_SCHEMA_VERSION_UNSUPPORTED).
4. Participant block status (RETURN_PARTICIPANT_BLOCKED).
5. Rate limits (RETURN_RATE_LIMITED).
6. Feature flag (RETURN_FEATURE_DISABLED).
7. Payload syntax and field rules (Table 2).
8. Rental lookup and actor role (RETURN_RENTAL_NOT_FOUND, RETURN_NOT_FOUND, RETURN_ROLE_NOT_PERMITTED).
9. State and window checks (Table 2 state rows, Table 3 window codes).
10. Revision check (RETURN_REVISION_CONFLICT).

## Table 1 — field rules
| Field | Rule | Code |
|---|---|---|
| `returned_at` | RFC 3339 with offset, present, parseable | RETURN_RETURNED_AT_INVALID |
| `returned_at` | within accepted window (R06) | RETURN_RETURNED_AT_OUT_OF_RANGE |
| `condition_declared` | present, one of unchanged, changed_noted | RETURN_CONDITION_INVALID |
| `renter_note`, `owner_note` | 0-280 code points after NFC | RETURN_NOTE_TOO_LONG |
| `renter_note`, `owner_note` | no control characters, no U+202A-U+202E, U+2066-U+2069, no U+0000, no newline | RETURN_NOTE_INVALID_CHARACTERS |
| `return_point_ref` | null or in the agreement's return_point_refs | RETURN_POINT_NOT_IN_AGREEMENT |
| `dispute_reason_code` | present on dispute, one of the four enum values | RETURN_DISPUTE_REASON_INVALID |
| `resolution` (moderator) | confirmed or closed | RETURN_MODERATION_REF_INVALID |
| `moderation_decision_ref` | present, ULID format, known to moderation | RETURN_MODERATION_REF_INVALID |
| `expected_revision` | integer >= 1, present on every mutating command | RETURN_REVISION_CONFLICT |
| `Idempotency-Key` | 26-128 chars of `[A-Za-z0-9_-]` | RETURN_IDEMPOTENCY_KEY_INVALID |
| `Idempotency-Key` | same key with different request hash | RETURN_IDEMPOTENCY_PAYLOAD_MISMATCH |
| `schema_version` | must equal 1 (A-return-11); any other value rejected | RETURN_SCHEMA_VERSION_UNSUPPORTED |

## Table 2 — state and window rules
| Command | Allowed from state | Window rule | Codes on failure |
|---|---|---|---|
| InitiateReturn | rental handoff_state = handed_off; no active return on rental | now in [handoff_at, due_at + 30 days] (A-return-03) | RETURN_RENTAL_NOT_ACTIVE, RETURN_WINDOW_NOT_OPEN, RETURN_WINDOW_CLOSED, RETURN_ALREADY_OPEN |
| DeclareReturn | initiated | none beyond returned_at rule | RETURN_INVALID_TRANSITION |
| CancelReturn | initiated | none | RETURN_INVALID_TRANSITION |
| ConfirmReturn | declared, unconfirmed | declared_at + 14 d for declared; declared_at + 30 d for unconfirmed | RETURN_INVALID_TRANSITION, RETURN_WINDOW_CLOSED |
| DisputeReturn | declared, unconfirmed | same as ConfirmReturn | RETURN_INVALID_TRANSITION, RETURN_WINDOW_CLOSED |
| ResolveReturnDispute | disputed | none | RETURN_INVALID_TRANSITION |

## Table 3 — error codes
| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| RETURN_RENTAL_NOT_FOUND | 404 | no | rental unknown or actor is not a party (same body either way) |
| RETURN_NOT_FOUND | 404 | no | return unknown or actor is not a party |
| RETURN_ROLE_NOT_PERMITTED | 403 | no | party but wrong role for this command |
| RETURN_RENTAL_NOT_ACTIVE | 409 | no | rental not handed off |
| RETURN_WINDOW_NOT_OPEN | 409 | no | before handoff_at |
| RETURN_WINDOW_CLOSED | 409 | no | after the applicable window |
| RETURN_ALREADY_OPEN | 409 | no | active return exists; details carry its return_id |
| RETURN_INVALID_TRANSITION | 409 | no | state does not allow the command |
| RETURN_REVISION_CONFLICT | 409 | after refetch | expected_revision stale; details carry current_revision |
| RETURN_RETURNED_AT_INVALID | 422 | no | malformed timestamp |
| RETURN_RETURNED_AT_OUT_OF_RANGE | 422 | no | outside accepted window |
| RETURN_CONDITION_INVALID | 422 | no | missing or unknown condition |
| RETURN_NOTE_TOO_LONG | 422 | no | more than 280 code points |
| RETURN_NOTE_INVALID_CHARACTERS | 422 | no | forbidden characters |
| RETURN_POINT_NOT_IN_AGREEMENT | 422 | no | return point not agreed |
| RETURN_DISPUTE_REASON_INVALID | 422 | no | missing or unknown reason |
| RETURN_MODERATION_REF_INVALID | 422 | no | bad moderation reference or resolution |
| RETURN_RESOLUTION_NOT_PERMITTED | 403 | no | non-moderator resolution attempt |
| RETURN_IDEMPOTENCY_KEY_INVALID | 400 | no | missing or malformed key |
| RETURN_IDEMPOTENCY_PAYLOAD_MISMATCH | 422 | no | key reused with different payload |
| RETURN_SCHEMA_VERSION_UNSUPPORTED | 400 | no | unsupported schema_version |
| RETURN_PARTICIPANT_BLOCKED | 403 | no | F07 block in effect |
| RETURN_RATE_LIMITED | 429 | yes, after Retry-After | rate limit exceeded |
| RETURN_FEATURE_DISABLED | 503 | no | rental_return.enabled is false |
| RETURN_DEPENDENCY_UNAVAILABLE | 503 | yes, after Retry-After | projection or moderation unreachable |
| RETURN_IMPORT_REJECTED | 422 | no | import record failed checks; details.reason enum |
| RETURN_INTERNAL_ERROR | 500 | yes, same Idempotency-Key | unexpected failure |

## Error body
```json
{
  "error": {
    "code": "RETURN_REVISION_CONFLICT",
    "http_status": 409,
    "retryable": false,
    "message_key": "rental_return.error.revision_conflict",
    "details": { "current_revision": 3 },
    "diagnostic_id": "dgn_01J8XDIAG0000000000000001"
  }
}
```
`details` never contains note text, coordinates or names.

## Open decisions
- A-return-05: Idempotency-Key format is an opaque client string of 26-128 chars; generated as ULID by the PWA.
- A-return-06: Note limit is 280 code points (not bytes), counted after NFC.
- A-return-07: Trailing and leading whitespace is trimmed; internal whitespace is kept.
- A-return-10: Clock skew tolerance for returned_at is 300 seconds beyond server time.
