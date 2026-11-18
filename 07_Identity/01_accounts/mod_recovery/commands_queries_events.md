# PS-053-04 — commands, queries and events
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/01_accounts/mod_recovery. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-SCH-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-053-04.R01 | Every state-changing command requires `Idempotency-Key` (16–128 chars) and `expected_revision` where a `rec_` exists. | MVP |
| PS-053-04.R02 | Commands are versioned under `/v1/`. Breaking change = new major path. | MVP |
| PS-053-04.R03 | Event payloads carry IDs, enums and counts only. No contact, code, OTP or IP. Event `max_data_class` = PSEUDONYMOUS. | MVP |
| PS-053-04.R04 | `recovery.start` response is identical for known and unknown accounts (see PS-053-02.R01). | MVP |
| PS-053-04.R05 | Commands are rejected offline; they are excluded from the D08 pending queue. | MVP |

## Data / schema
Command bodies (JSON, CTR-SCH-001 schema IDs `recovery.start.request@1.0.0` etc.):
```json
{"method": "recovery_code | verified_contact", "account_hint": "string (contact or handle, normalized)"}
```

## Commands / queries / events
| Command | Route | Expected revision | Result | Errors |
|---|---|---|---|---|
| recovery.start | POST /v1/recovery/requests | none | 202 {request_ref} | REQUEST_MALFORMED |
| recovery.submit_proof | POST /v1/recovery/requests/{rec_id}/proof | yes | 200 {state} | PROOF_INVALID, LOCKED, REQUEST_EXPIRED |
| recovery.complete | POST /v1/recovery/requests/{rec_id}/complete | yes | 200 {state} | COOLDOWN_ACTIVE, INVALID_STATE |
| recovery.cancel | POST /v1/recovery/requests/{rec_id}/cancel | yes | 200 {state} | INVALID_STATE |
| recovery.method.enroll | POST /v1/accounts/me/recovery-methods | none | 201 {rmt_id, masked} | METHOD_NOT_ENROLLED, SYS.UNAUTHENTICATED |
| recovery.method.revoke | DELETE /v1/accounts/me/recovery-methods/{rmt_id} | yes | 204 | INVALID_STATE |

Queries: `GET /v1/accounts/me/recovery-methods` (masked, own only); `GET /v1/recovery/requests/{rec_id}` (owner session or proof-bound token).

Events (CTR-EVT-001, `aggregate_type` `recovery_request` or `recovery_method`): `recovery_request.started`, `.proof_accepted`, `.proof_rejected`, `.cooldown_started`, `.completed`, `.cancelled`, `.locked`, `.expired`; `recovery_method.enrolled`, `.revoked`.

## States & transitions
Event emission per transition is defined in [workflow_state_machine](workflow_state_machine.md).

## Validation & errors
Codes per [validation_rules](validation_rules.md).

## Authorization
Per command, see [authorization_capabilities](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Idempotency scope = (actor or anonymous hint digest, command type, key), retained 7 days (CTR-EVT-001 R03).

## Privacy, retention, abuse
Subscribers receive envelope and payload only. Notification service receives generic text templates only (CTR-PRV-001 R10).

## Observability & budgets
`recovery_commands_total{command,code}`.

## Tests
TEST-PS-053-07 (contract: each route against CTR-EVT-001 and CTR-ERR-001), TEST-PS-053-08 (idempotency replay).

## Acceptance criteria
1. Each route and event validates against its schema fixture.
2. Replayed `recovery.start` with same key returns the same `request_ref`.

## Assumptions & open decisions
- ASSUMPTION: anonymous start rate limit (10 per account hint per 24 h).
- PROVISIONAL (D10 default, unapproved).
