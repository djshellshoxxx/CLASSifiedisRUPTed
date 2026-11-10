# PS-030-02 — validation rules

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-030-02. **Owner:** [03_Services/02_service_booking/mod_disputes](SPEC.md). **Implementing module:** 03_Services/02_service_booking/mod_disputes. **Consumers:** F07, F10, F15, F16 per [dependency matrix](../../../DEPENDENCY_MATRIX.md); event subscribers in [commands_queries_events.md](commands_queries_events.md).

## Purpose and scope
Defines server-side validation for every command in this module, the typed error codes they return, and the reason-code vocabularies. The server is authoritative. Client checks are advisory only. Validation never decides the merits of a dispute.

## Requirements
- **PS-030-02.R01**: Business outcome: every rejected command returns exactly one typed error with a stable code, so clients can explain the problem and recover. Actors: all parties, moderators, system. Exclusions: merit assessment (moderator, see [workflow_state_machine.md](workflow_state_machine.md)); payment amount validity beyond format (F09).
- **PS-030-02.R02**: Covered cases: invalid, expired (window closed), duplicate (active dispute exists, idempotency reuse), concurrent (revision and busy conflicts), offline replay (idempotency), adversarial (non-party access, forged hash, oversized or disguised binary, control characters, bidi overrides).
- **PS-030-02.R03**: Validation of a 2000-character text field completes in at most 5 ms server-side at p95. Error messages are localized client-side from the code; the server returns no localized prose. Accessible error association is a client requirement: each field error includes a `field` path so the UI can bind it to the control.
- **PS-030-02.R04**: Check order is fixed: (1) authentication, (2) schema version, (3) idempotency key format, (4) payload shape, (5) field constraints, (6) resource existence and party membership, (7) capability, (8) state and guard, (9) revision. Non-parties receive `DISPUTES_NOT_FOUND` at step 6 so existence is not disclosed.
- **PS-030-02.R05**: Text normalization: Unicode NFC, then trim. Reject U+0000 to U+001F except LF and TAB (`DISPUTES_TEXT_CONTROL_CHARACTERS`). Reject bidirectional override and isolate characters U+202A to U+202E and U+2066 to U+2069. Line breaks are allowed in statements only.

## Field limits
| Field | Rule |
|---|---|
| Claim, response, rebuttal body | 1 to 2000 chars |
| Reviewer note, decision text | 1 to 1000 chars |
| Settlement note, appeal grounds, return request text | 0 to 1000 chars (appeal grounds 1 to 1000) |
| External link | `https` scheme only, up to 2048 chars, no userinfo, no port other than 443 |
| Evidence label | up to 120 chars |
| Evidence count per party | 10 items |
| Evidence file size | at most 20971520 bytes (20 MiB) |
| Evidence total per dispute | at most 100 MiB across both parties |
| Rebuttals per party | at most 5 |
| Claimed amount | integer 0 to 99999999999; both amount and currency or neither |
| Currency | ISO 4217 uppercase, in F09 allowlist |

Binary checks: MIME type is determined from magic bytes, not the declared header. Images must decode, must be no larger than 8000 px per side, and have EXIF and GPS metadata removed before state becomes `available`. PDFs must not be encrypted and must have at most 50 pages. The client-supplied SHA-256 must equal the server-computed hash. Contact-detail patterns (email, phone, postal address) in text are a moderation flag (`flag_contact_detail`), not a rejection (A-disputes-16).

## Booking eligibility (OpenDispute)
- Eligible statuses: `in_progress`, `delivered`, `completed`. A `cancelled` booking is eligible only for category `cancellation_terms`.
- Window: now must be at or before `completed_at` + 60 days, or `cancelled_at` + 60 days for cancelled bookings (A-disputes-04).
- A `milestone_ref`, if given, must belong to the booking.

## Error codes
Form: `DISPUTES_<CODE>`. Prefix is the module token (A-disputes-03). Fields per CTR-ERR-001: `code`, `http_status`, `retryable`, `field` (optional), `message_key`, `diagnostic_id`.

| Code | HTTP | Retryable | Trigger |
|---|---|---|---|
| DISPUTES_NOT_FOUND | 404 | no | Dispute missing, or caller is not a party and not a moderator |
| DISPUTES_FORBIDDEN | 403 | no | Party or role lacks the capability for an existing resource |
| DISPUTES_IDEMPOTENCY_KEY_MISSING | 400 | no | Write without `Idempotency-Key` |
| DISPUTES_IDEMPOTENCY_KEY_INVALID | 400 | no | Key length or characters outside rule |
| DISPUTES_IDEMPOTENCY_KEY_REUSED | 409 | no | Same key, different `request_hash` |
| DISPUTES_IDEMPOTENCY_IN_PROGRESS | 409 | yes, after 1 s | Same key, first attempt still running |
| DISPUTES_SCHEMA_VERSION_UNSUPPORTED | 400 | no | `schema_version` not 1 |
| DISPUTES_PAYLOAD_INVALID | 422 | no | Shape or type error; `errors[]` lists fields |
| DISPUTES_TEXT_EMPTY | 422 | no | Required text empty after trim |
| DISPUTES_TEXT_TOO_LONG | 422 | no | Over field limit |
| DISPUTES_TEXT_CONTROL_CHARACTERS | 422 | no | Forbidden control or bidi characters |
| DISPUTES_CATEGORY_UNKNOWN | 422 | no | Category not in enum |
| DISPUTES_REMEDY_UNKNOWN | 422 | no | Remedy not in enum |
| DISPUTES_REASON_CODE_UNKNOWN | 422 | no | Reason not in the list for that command |
| DISPUTES_AMOUNT_INVALID | 422 | no | Amount without currency, or out of range |
| DISPUTES_BOOKING_REF_INVALID | 422 | no | Booking ref malformed or not found for the caller |
| DISPUTES_BOOKING_INELIGIBLE | 409 | no | Booking status not eligible |
| DISPUTES_OPEN_WINDOW_CLOSED | 409 | no | Past the 60-day window |
| DISPUTES_ACTIVE_DISPUTE_EXISTS | 409 | no | Unique index conflict on active dispute |
| DISPUTES_ALREADY_RESOLVED | 409 | no | Prior dispute on same booking or milestone is `closed` or `resolved_mutual` |
| DISPUTES_OPEN_SUSPENDED | 403 | no | Claimant suspended from opening (A-disputes-12) |
| DISPUTES_BLOCKED_COUNTERPARTY | 403 | no | Block record exists against the counterparty (A-disputes-10) |
| DISPUTES_RATE_LIMITED | 429 | yes, after `Retry-After` | Per-claimant or per-token limit |
| DISPUTES_STATE_CONFLICT | 409 | no | Transition not allowed from current state |
| DISPUTES_REVISION_CONFLICT | 409 | yes, after refetch | `expected_revision` differs from stored revision |
| DISPUTES_BUSY | 409 | yes, after 200 ms | Row lock not acquired within 2 s |
| DISPUTES_RESPONSE_WINDOW_CLOSED | 409 | no | Response after `response_due_at` |
| DISPUTES_EVIDENCE_WINDOW_CLOSED | 409 | no | Evidence after `evidence_due_at` or outside allowed states |
| DISPUTES_EVIDENCE_LIMIT_EXCEEDED | 422 | no | Count or size total exceeded |
| DISPUTES_EVIDENCE_TYPE_UNSUPPORTED | 422 | no | MIME or kind not allowed |
| DISPUTES_EVIDENCE_TOO_LARGE | 413 | no | Over 20 MiB per file |
| DISPUTES_EVIDENCE_UNREADABLE | 422 | no | Decode, page count or encryption check failed |
| DISPUTES_EVIDENCE_HASH_MISMATCH | 422 | no | Client SHA-256 differs from computed value |
| DISPUTES_UPLOAD_EXPIRED | 410 | no | Upload ticket older than 24 hours or already used |
| DISPUTES_EVIDENCE_NOT_FOUND | 404 | no | Evidence ID not in this dispute |
| DISPUTES_EVIDENCE_ALREADY_WITHDRAWN | 409 | no | Withdraw on withdrawn item |
| DISPUTES_SETTLEMENT_PENDING_EXISTS | 409 | no | A `proposed` settlement already exists |
| DISPUTES_SETTLEMENT_EXPIRED | 409 | no | Response after `expires_at` |
| DISPUTES_SETTLEMENT_SELF_RESPONSE | 409 | no | Proposer tries to accept or reject own proposal |
| DISPUTES_REVIEWER_CONFLICT | 409 | no | Reviewer is a party, or the prior decider |
| DISPUTES_REVIEWER_NOT_ASSIGNED | 409 | no | Decision by someone other than `current_reviewer_ref` |
| DISPUTES_REOPEN_LIMIT_REACHED | 409 | no | `reopen_count` already 1 |
| DISPUTES_OUTCOME_INVALID | 422 | no | Outcome not permitted for category or appeal round |
| DISPUTES_APPEAL_WINDOW_CLOSED | 409 | no | After `appeal_deadline_at` |
| DISPUTES_APPEAL_LIMIT_REACHED | 409 | no | `appeal_count` already 1 |
| DISPUTES_FEATURE_DISABLED | 503 | yes | Feature flag off (A-disputes-19) |
| DISPUTES_DEPENDENCY_UNAVAILABLE | 503 | yes | Booking, identity or upload dependency failed after retries |
| DISPUTES_INTERNAL | 500 | yes | Unclassified server failure; `diagnostic_id` only |

## Reason-code vocabularies
- Intake reject: `duplicate`, `out_of_scope`, `booking_ineligible`, `abuse_detected`, `insufficient_claim`.
- Withdraw: `resolved_directly`, `mistaken_claim`, `other`.
- Escalation: `response_window_elapsed`, `evidence_window_elapsed`, `party_requested`.
- Release reviewer: `reviewer_unavailable`, `conflict_detected`.
- Decision: `evidence_supports_claimant`, `evidence_supports_respondent`, `evidence_mixed`, `insufficient_evidence`, `policy_violation`, `party_conduct`, `other`.

Allowed outcomes per category: any outcome except `mutual_settlement`, `withdrawn` and `rejected_at_intake`. Appeal round decisions may not be `no_fault_recorded` without a `decision_text`.

## Open decisions
- A-disputes-03: Error prefix `DISPUTES_` is derived from the module name. Pending CTR-ERR-001 (F15).
- A-disputes-16: Contact-detail detection is a moderation signal, not an enforcement guarantee.
- A-disputes-12: Thresholds for suspension are in [privacy_retention_abuse.md](privacy_retention_abuse.md).
