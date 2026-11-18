# PS-022-02 — Validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/03_cycle_execution/mod_dropouts. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-CAP-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-022-02.R01 | Dropout detection accepted only when cycle state ∈ {CONSENTED, LOCKED, ATTESTING}; otherwise `CYC_DROPOUT.NOT_ELIGIBLE` (409). | MVP |
| PS-022-02.R02 | `WITHDREW` accepted only while cycle state is CONSENTING or CONSENTED (before lock). After lock, withdrawal is recorded as `LOCK_TIMEOUT`-class request and routed to resolution. | MVP |
| PS-022-02.R03 | `LOCK_TIMEOUT` requires `now ≥ lock_confirm_deadline` (default 30 min after CONSENTED). Earlier → `CYC_DROPOUT.WINDOW_OPEN` (422). | MVP |
| PS-022-02.R04 | `ATTEST_TIMEOUT` requires `now ≥ attest_deadline` (default 72 h after LOCKED; ASSUMPTION). | MVP |
| PS-022-02.R05 | Resolution `RESOLVED_RESOLVE_AGAIN` requires a successor proposal version created by F02.S02 within 2 h; else `CYC_DROPOUT.SUCCESSOR_MISSING` (422). | MVP |
| PS-022-02.R06 | Cancel or partial resolution requires all locks in the case to be released or marked consumed by mod_lock. | MVP |
| PS-022-02.R07 | `reason_code` must be from the closed enum; free text rejected (`SYS.REQUEST_MALFORMED`). | MVP |

## Data / schema
Validates fields in [domain_schema.md](domain_schema.md).

## Commands / queries / events
Guards run before transitions in [workflow_state_machine.md](workflow_state_machine.md).

## States & transitions
Validation failure leaves state unchanged.

## Validation & errors
| Code | Retryable | Class / HTTP | User message key |
|---|---|---|---|
| CYC_DROPOUT.NOT_ELIGIBLE | false | conflict / 409 | dropout.not_eligible |
| CYC_DROPOUT.WINDOW_OPEN | true | precondition_failed / 412 | dropout.window_open |
| CYC_DROPOUT.SUCCESSOR_MISSING | false | unprocessable_state / 422 | dropout.successor_missing |
| CYC_DROPOUT.LOCKS_ACTIVE | true | precondition_failed / 412 | dropout.locks_active |

Diagnostics contain `cycle_id` and state only.

## Authorization
Actor checks precede validation (see [authorization_capabilities.md](authorization_capabilities.md)).

## Failure, idempotency, concurrency, offline
Deadline checks use server time only; client clocks are ignored. Offline clients can not submit timeouts.

## Privacy, retention, abuse
Rate limit: one `WITHDREW` per party per cycle version (second is idempotent replay). Deadlines are not disclosed before they pass, to avoid timing games.

## Observability & budgets
Counts of each code; validation p95 ≤ 5 ms excluding database.

## Tests
- TEST-PS-022-02-01 (unit): each guard passes and fails on boundary (deadline minus 1 s, plus 1 s).
- TEST-PS-022-02-02 (unit): free-text reason rejected.
- TEST-PS-022-02-03 (integration): cancel with active lock → LOCKS_ACTIVE.

## Acceptance criteria
1. R01–R07 each have a passing and failing test.
2. Deadline checks use server clock; skew test passes at ±5 min.
3. No code reveals another party's identity.

## Assumptions & open decisions
- ASSUMPTION: 30 min lock-confirm and 72 h attest windows.
- [DECISIONS.md](../../../DECISIONS.md) D02 — PROVISIONAL (D02 default, unapproved): successor proposal produced by bounded search only.
