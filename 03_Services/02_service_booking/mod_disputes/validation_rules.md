# PS-030-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 03_Services/02_service_booking/mod_disputes. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-COM-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-030-02.R01 | Eligibility is checked server-side before calling F09. Client checks are advisory. | MVP |
| PS-030-02.R02 | Subject must be in an eligible state (see [workflow_state_machine.md](workflow_state_machine.md)); else `DISPUTE.SUBJECT_NOT_ELIGIBLE`. | MVP |
| PS-030-02.R03 | `now ≤ window_ends_at`; else `DISPUTE.WINDOW_CLOSED` (retryable false). | MVP |
| PS-030-02.R04 | One open link per subject: duplicate → `DISPUTE.DUPLICATE_OPEN` and return the existing `dispute_ref`. | MVP |
| PS-030-02.R05 | `reason_code` ∈ closed enum; unknown value → `DISPUTE.REASON_INVALID`. | MVP |
| PS-030-02.R06 | `OTHER` without note, or note > 500 scalars → `DISPUTE.NOTE_INVALID`. | MVP |
| PS-030-02.R07 | `requested_minor` must match `^(0|[1-9][0-9]{0,38})$`, be ≥ 1 and ≤ subject amount; else `DISPUTE.AMOUNT_INVALID`. | MVP |
| PS-030-02.R08 | Currency mismatch with subject → `DISPUTE.CURRENCY_MISMATCH`. | MVP |
| PS-030-02.R09 | Evidence > 10 digests per party, or malformed digest → `DISPUTE.EVIDENCE_LIMIT`. | MVP |
| PS-030-02.R10 | Actor not a participant → `SYS.NOT_FOUND` (CTR-ERR-001 R08). | MVP |

## Data / schema
Inputs per [domain_schema.md](domain_schema.md). Rule outputs use `details[].rule` closed enum (`eligibility`, `window`, `duplicate`, `enum`, `note_length`, `amount_range`, `currency`, `evidence_count`). Input values never echoed.

## Commands / queries / events
Validation applies to `dispute.create` before F09 call; see [commands_queries_events.md](commands_queries_events.md).

## States & transitions
Validation is a guard for `requested` → `opened` only.

## Validation & errors
| Code | Retryable | message_key |
|---|---|---|
| DISPUTE.SUBJECT_NOT_ELIGIBLE | false | err.dispute.subject_not_eligible |
| DISPUTE.WINDOW_CLOSED | false | err.dispute.window_closed |
| DISPUTE.DUPLICATE_OPEN | false | err.dispute.duplicate_open |
| DISPUTE.REASON_INVALID | false | err.dispute.reason_invalid |
| DISPUTE.NOTE_INVALID | false | err.dispute.note_invalid |
| DISPUTE.AMOUNT_INVALID | false | err.dispute.amount_invalid |
| DISPUTE.CURRENCY_MISMATCH | false | err.dispute.currency_mismatch |
| DISPUTE.EVIDENCE_LIMIT | false | err.dispute.evidence_limit |

## Authorization
Validation runs after the participant check in [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Validation is deterministic given subject state and clock. Clock skew > 5 s is rejected for window checks (ASSUMPTION; server clock authoritative).

## Privacy, retention, abuse
Notes are validated for length only; content is not scanned here. Rejected notes are not stored.

## Observability & budgets
Counter per rule; validation p95 ≤ 10 ms excluding F09 call (ASSUMPTION).

## Tests
- TEST-PS-030-02-01 unit: one case per code, including window boundary at exactly `window_ends_at`.
- TEST-PS-030-02-02 property: amounts 0, 1, subject, subject+1, 39-digit values.
- TEST-PS-030-02-03 negative: non-participant receives `SYS.NOT_FOUND`.

## Acceptance criteria
1. Each rule R01–R10 maps to one code or pass.
2. No error body contains note text or amounts.
3. Window check uses server time only.

## Assumptions & open decisions
- ASSUMPTION: 5 s clock-skew tolerance for window checks.
- Payment checklist applies: amount and currency rules follow CTR-COM-001 R02–R03.
