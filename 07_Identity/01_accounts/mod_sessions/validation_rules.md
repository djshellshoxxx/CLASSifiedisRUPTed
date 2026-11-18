# PS-054-02 — validation rules
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/01_accounts/mod_sessions. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-054-02.R01 | Bearer access token: 43 base64url chars (256 bits), prefixed `sat_`. Refresh token: 43 chars, prefixed `srt_`. Other shapes rejected before any lookup. | MVP |
| PS-054-02.R02 | User-agent string truncated to 256 octets before parsing; unknown families map to `other`. | MVP |
| PS-054-02.R03 | Step-up password or second factor accepted only within the proof window of 5 min. | MVP |
| PS-054-02.R04 | Login and refresh bodies ≤ 4 KiB; unknown fields rejected. | MVP |
| PS-054-02.R05 | Token comparison is constant-time on the digest. | MVP |

## Data / schema
Validation order: size, format prefix, digest lookup, state. Unknown-token responses take the same time band as expired-token responses (± 20 ms).

## Commands / queries / events
Codes below apply to [commands_queries_events](commands_queries_events.md).

## States & transitions
State checks per [workflow_state_machine](workflow_state_machine.md).

## Validation & errors
| Code | Retryable | Category / HTTP | When |
|---|---|---|---|
| MOD_SESSIONS.TOKEN_MALFORMED | false | unauthenticated / 401 | Bad prefix, length or charset. |
| MOD_SESSIONS.TOKEN_INVALID | false | unauthenticated / 401 | Unknown digest. |
| MOD_SESSIONS.SESSION_EXPIRED | true (after re-login) | unauthenticated / 401 | Idle or absolute timeout. |
| MOD_SESSIONS.TOKEN_REUSED | false | unauthenticated / 401 | Refresh token reuse outside grace; family revoked. |
| MOD_SESSIONS.STEP_UP_REQUIRED | true (after step-up) | forbidden / 403 | Sensitive action without step-up ≤ 5 min. |
| SYS.REQUEST_MALFORMED | false | validation / 400 | Schema failure (R04). |

User message keys: `session.expired.body`, `session.stepup.body`. Diagnostics carry `ses_` ID and code only.

## Authorization
Validation happens before authorization; malformed tokens never reach the store.

## Failure, idempotency, concurrency, offline
Validation is stateless and retry-safe.

## Privacy, retention, abuse
Rejected tokens are not logged; only a count per code and a truncated digest prefix (4 hex) for abuse correlation.

## Observability & budgets
`session_validation_rejections_total{code}`. Validation p95 ≤ 2 ms.

## Tests
TEST-PS-054-03 (malformed table), TEST-PS-054-04 (timing band for unknown vs expired tokens).

## Acceptance criteria
1. Each code produced by a test.
2. Timing test: unknown and expired token responses within ± 20 ms over 1 000 samples.

## Assumptions & open decisions
- ASSUMPTION: 256-bit token size; 5 min step-up window.
