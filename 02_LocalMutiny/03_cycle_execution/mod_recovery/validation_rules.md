# PS-024-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/03_cycle_execution/mod_recovery. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (R14), CTR-ERR-001, CTR-SCH-001. Module code `CYCRECOV` (PENDING CTR-ERR-001).

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-024-02.R01 | Attestation accepted only inside the window (7 days from open, ASSUMPTION). | MVP |
| PS-024-02.R02 | Signature must verify with the party's registered key (Ed25519, ASSUMPTION) over `claim_hash`. | MVP |
| PS-024-02.R03 | `claim_hash` must equal SHA-256 of JCS of the recovery body for the stated cycle version. | MVP |
| PS-024-02.R04 | Attestation outcome must be in the closed enum; `other_with_code` requires a code from the registry. | MVP |
| PS-024-02.R05 | Attestation text may not claim physical handover as verified; the system stores the statement only. | MVP |

## Data / schema
Window 7 days (ASSUMPTION); enum per PS-024-01.

## Validation & errors
| Code | Category (HTTP) | Retryable | Trigger | details[].rule |
|---|---|---|---|---|
| CYCRECOV.WINDOW_CLOSED | unprocessable_state (422) | false | attestation after window | window |
| CYCRECOV.SIGNATURE_INVALID | validation (400) | false | signature fails | signature |
| CYCRECOV.HASH_MISMATCH | validation (400) | false | claim_hash wrong | claim_hash |
| CYCRECOV.OUTCOME_UNKNOWN | validation (400) | false | outcome not in enum | outcome |
| CYCRECOV.ALREADY_ATTESTED | conflict (409) | false | second attestation by same party | attestation |
| CYCRECOV.ALREADY_CLOSED | unprocessable_state (422) | false | action on closed recovery | status |

Messages: `err.cycrecov.<code>`; no values echoed.

## Authorization
Attester must be the slot participant (PS-024-05).

## Failure, idempotency, concurrency, offline
Deterministic; signature check uses the key valid at signing time (CTR-FED-001 R09 pattern).

## Privacy, retention, abuse
Errors never echo signatures or hashes.

## Observability & budgets
Counts per code.

## Tests
- TEST-PS-024-02-01 (unit): one fixture per code.
- TEST-PS-024-02-02 (negative): attestation at window end + 1 s refused.
- TEST-PS-024-02-03 (security): altered body fails HASH_MISMATCH.

## Acceptance criteria
1. Each code produced only by its trigger.
2. No stored attestation lacks a valid signature.
3. No validation response includes signature material.

## Assumptions & open decisions
- ASSUMPTION: Ed25519 and 7-day window; signature library to be reviewed (no custom crypto).
- PROVISIONAL (D06 default, unapproved).
