# PS-024-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/03_cycle_execution/mod_recovery. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-ID-001, CTR-COM-001 (R14).

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-024-04.R01 | Writes carry `idempotency_key` and `expected_revision` (recovery revision). | MVP |
| PS-024-04.R02 | `cycle.attest` takes `{recovery_id, outcome, claim_hash, signature, idempotency_key}`. | MVP |
| PS-024-04.R03 | `cycle.compensate` is system-only and idempotent per plan step. | MVP |
| PS-024-04.R04 | `cycle.escalate` takes `{recovery_id, reason_code, case_ref}` and sends only pseudonymous refs. | MVP |

## Data / schema
Events of aggregate `cycle`; payload = recovery record view. Schema 1.0.0.

## Commands / queries / events
| Operation | Caller | Idempotency | Expected revision | Errors |
|---|---|---|---|---|
| cycle.open_recovery | system (dropout event) | cycle + version | null | CYCRECOV.ALREADY_CLOSED |
| cycle.attest | slot participant | key | required | CYCRECOV.WINDOW_CLOSED, SIGNATURE_INVALID, HASH_MISMATCH, OUTCOME_UNKNOWN, ALREADY_ATTESTED |
| cycle.compensate | system | plan step key | required | CYCRECOV.ALREADY_CLOSED, SYS.UNAVAILABLE |
| cycle.escalate | system or participant | key | required | CYCRECOV.ALREADY_CLOSED |
| cycle.recovery_get | participant or moderator (case) | n/a | n/a | SYS.NOT_FOUND |

## States & transitions
PS-024-03.

## Validation & errors
PS-024-02.

## Authorization
PS-024-05.

## Failure, idempotency, concurrency, offline
PS-024-06.

## Privacy, retention, abuse
Events never carry signatures, only digests.

## Observability & budgets
Attest p95 ≤ 300 ms (ASSUMPTION).

## Tests
- TEST-PS-024-04-01 (contract): events validate.
- TEST-PS-024-04-02 (unit): replayed attest returns original.
- TEST-PS-024-04-03 (negative): attest by non-participant denied.

## Acceptance criteria
1. Each command has schema, idempotency and revision rule.
2. Events carry digests, not signatures.
3. Escalation payload contains only refs and reason code.

## Assumptions & open decisions
- ASSUMPTION: 300 ms p95 attest budget.
