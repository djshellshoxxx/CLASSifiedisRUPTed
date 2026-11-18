# PS-101-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/03_antifraud/mod_signals (Trust&Safety Lead). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-EVT-001 (R04 timestamp range), CTR-PRV-001 (R04 threshold), CTR-ID-001.

**Decision labels:** K_MIN = 5 and report weight caps are PROVISIONAL (D07 default, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-101-02.R01 | `signal_type` must be a registry value. Unknown → `SIGNAL.TYPE_UNKNOWN`. | MVP |
| PS-101-02.R02 | `value` is an integer 0–100 inclusive. Decimals and strings rejected: `SIGNAL.VALUE_OUT_OF_RANGE`. | MVP |
| PS-101-02.R03 | `window_end > window_start`, span ≤ 7 days, both hour-aligned, `window_end` ≤ now + 5 min. Else `SIGNAL.WINDOW_INVALID`. | MVP |
| PS-101-02.R04 | Payload ≤ 2 KiB; only allowlisted keys; any key matching IP, device, coordinate or free-text classes → `SIGNAL.FORBIDDEN_FIELD`. | MVP |
| PS-101-02.R05 | `subject_ref` must resolve to an active `acc_`. Missing or deleted → `SYS.NOT_FOUND` (identical to nonexistent). | MVP |
| PS-101-02.R06 | `source_event_ref` must match `evt_[0-9A-HJKMNP-TV-Z]{26}`. | MVP |
| PS-101-02.R07 | `sgn.update` (suppress) requires `reason_code` ∈ {`fp_confirmed`, `appeal_upheld`, `data_error`}. Free text → `SIGNAL.REASON_INVALID`. | MVP |
| PS-101-02.R08 | Aggregates with fewer than 5 distinct subjects are withheld from output, not rejected at ingest. | MVP |
| PS-101-02.R09 | Validation runs server-side only. Producer-side checks are advisory. | MVP |

## Data / schema
Input validation uses the JSON Schema of PS-101-01 (`signal.recorded` payload, CTR-SCH-001). Constraints: `value` minimum 0, maximum 100, `type` integer; `additionalProperties: false`.

## Commands / queries / events
Applies to `sgn.create` and `sgn.update` (PS-101-04).

## States & transitions
Validation failure leaves no record and emits no event.

## Validation & errors
| Code | Retryable | Category / HTTP | Message key | When |
|---|---|---|---|---|
| SIGNAL.TYPE_UNKNOWN | false | validation / 400 | err.signal.type_unknown | R01 |
| SIGNAL.VALUE_OUT_OF_RANGE | false | validation / 400 | err.signal.value_out_of_range | R02 |
| SIGNAL.WINDOW_INVALID | false | validation / 400 | err.signal.window_invalid | R03 |
| SIGNAL.FORBIDDEN_FIELD | false | validation / 400 | err.signal.forbidden_field | R04 (diagnostic: field path only) |
| SIGNAL.REASON_INVALID | false | validation / 400 | err.signal.reason_invalid | R07 |
| SYS.NOT_FOUND | false | not_found / 404 | err.sys.not_found | R05 |

Diagnostics: field path and rule enum only. Input values never echoed (CTR-ERR-001 R07).

## Authorization
Validation runs after the capability check (PS-101-05). Unauthorized callers receive the same error as for an unknown ID.

## Failure, idempotency, concurrency, offline
Duplicate (`source_event_ref`, `signal_type`) returns the original `sgn_` ID with no new event (not an error). Details: PS-101-06.

## Privacy, retention, abuse
Forbidden-field check is the primary control against accidental collection of personal data (PS-101-07).

## Observability and budgets
Rejects counted by code (PS-101-08). Validation p95 ≤ 5 ms.

## Tests
- TEST-PS-101-03 (unit): each code in the table is raised for its single violation.
- TEST-PS-101-04 (negative): payload with `ip_address` returns `SIGNAL.FORBIDDEN_FIELD`; body contains no input value.
- TEST-PS-101-08 (property): aggregates with 1–4 subjects are never returned.

## Acceptance criteria
1. Every code in the table has a registry entry in CTR-ERR-001 with matching retryable flag.
2. Negative fixtures for R01–R07 pass in CI.
3. No error response echoes an input value.

## Assumptions & open decisions
- ASSUMPTION: 5-minute clock skew matches CTR-EVT-001 R04 client tolerance.
- D07 thresholds (PROVISIONAL, unapproved). D05 geoprivacy: no coordinate is accepted, so no D05 decision is needed here.
