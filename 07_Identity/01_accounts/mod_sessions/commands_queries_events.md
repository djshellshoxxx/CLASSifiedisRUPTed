# PS-054-04 — commands, queries and events
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/01_accounts/mod_sessions. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-SCH-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-054-04.R01 | State-changing commands require `Idempotency-Key`. A `session.create` replay with the same key returns `SYS.CONFLICT` and never re-issues secrets. | MVP |
| PS-054-04.R02 | Event payloads: IDs, enums, counts. No token, IP, UA string or device label. | MVP |
| PS-054-04.R03 | Commands are online-only and excluded from the D08 offline queue. | MVP |

## Data / schema
Command body example (`session.create`): `{"method": "password | passkey", "proof": "opaque", "device_hint": {"ua_family": "string"}}`.

## Commands / queries / events
| Command | Route | Result | Errors |
|---|---|---|---|
| session.create | POST /v1/sessions | 201 {access_token, refresh_token, expires_at} | TOKEN_INVALID, SYS.RATE_LIMITED |
| session.refresh | POST /v1/sessions/refresh | 200 new pair | TOKEN_REUSED, SESSION_EXPIRED |
| session.revoke | DELETE /v1/sessions/{ses_id} | 204 | STEP_UP_REQUIRED (other session) |
| session.revoke_others | POST /v1/sessions/revoke-others | 200 {revoked_count} | STEP_UP_REQUIRED |
| session.step_up | POST /v1/sessions/step-up | 200 {step_up_at} | SYS.UNAUTHENTICATED |
| session.list | GET /v1/sessions | 200 own list, paged | none |

Events (`aggregate_type` = `session`): `session.created`, `session.rotated`, `session.revoked`, `session.expired`, `session.family_revoked`, `session.step_up_completed`. `max_data_class` = PSEUDONYMOUS.

## States & transitions
Event per transition in [workflow_state_machine](workflow_state_machine.md).

## Validation & errors
Codes per [validation_rules](validation_rules.md).

## Authorization
Per command in [authorization_capabilities](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Idempotency scope (acc_, command, key) for 7 days (CTR-EVT-001 R03). Refresh is not idempotent by key; it relies on the grace window.

## Privacy, retention, abuse
Session list shows device label to owner only.

## Observability & budgets
`session_commands_total{command,code}`; create p95 ≤ 200 ms excluding password hashing.

## Tests
TEST-PS-054-07 (contract per route), TEST-PS-054-08 (session.create replay returns one session).

## Acceptance criteria
1. Each route validates against its schema fixture.
2. Replay test creates exactly one session.

## Assumptions & open decisions
- ASSUMPTION: rate limit 10 creates per account per 10 min.
