# PS-053-02 — validation rules
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/01_accounts/mod_recovery. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-053-02.R01 | `recovery.start` returns HTTP 202 with an identical body shape and a latency band of 300–600 ms whether the account exists, is suspended or is unknown. | MVP |
| PS-053-02.R02 | Recovery code input: 20 Crockford base32 characters in 4 groups of 5 (100 bits). Input normalized: case-folded, hyphens and spaces stripped, then validated. | MVP |
| PS-053-02.R03 | OTP: 8 decimal digits, valid 15 min, single use, ≤ 5 attempts per `rec_`. | MVP |
| PS-053-02.R04 | Contact address: RFC 5322 syntax, ≤ 254 octets, NFC-normalized, lower-cased domain. Verified by delivered OTP before enrolment is active. | MVP |
| PS-053-02.R05 | Enrolment (`recovery.method.enroll`) requires a step-up session ≤ 5 min old (see mod_sessions). | MVP |
| PS-053-02.R06 | Unknown fields rejected (`MOD_RECOVERY.REQUEST_MALFORMED`). Body ≤ 2 KiB. | MVP |

## Data / schema
Validation runs in this order: size and depth, JSON schema (CTR-SCH-001), field patterns, state precondition. Failure at any step stops processing.

## Commands / queries / events
Error code mapping below applies to all commands in [commands_queries_events](commands_queries_events.md).

## States & transitions
State precondition checks are listed in [workflow_state_machine](workflow_state_machine.md).

## Validation & errors
| Code | Retryable | Category / HTTP | When |
|---|---|---|---|
| MOD_RECOVERY.REQUEST_MALFORMED | false | validation / 400 | Schema or pattern violation (R02, R04, R06). |
| MOD_RECOVERY.PROOF_INVALID | false | validation / 422 | Wrong code or OTP. Increments `attempt_count`. |
| MOD_RECOVERY.REQUEST_EXPIRED | false | gone / 410 | `now > expires_at`. |
| MOD_RECOVERY.LOCKED | true | rate_limited / 429 | `attempt_count` = 5 or `lock_until` in future. `Retry-After` header set. |
| MOD_RECOVERY.METHOD_NOT_ENROLLED | false | unprocessable_state / 422 | Requested method has no active `rmt_`. |
| MOD_RECOVERY.COOLDOWN_ACTIVE | false | conflict / 409 | `complete` before `cooldown_ends_at`. |
| MOD_RECOVERY.INVALID_STATE | false | conflict / 409 | Transition not allowed from current state. Client reloads. |
| SYS.FORBIDDEN / SYS.UNAUTHENTICATED | false | 403 / 401 | Per CTR-ERR-001. |

User message keys: `recovery.proof_invalid.body`, `recovery.locked.body`, `recovery.cooldown.body`. Diagnostics log `code`, `rec_` ID, `attempt_count`; never the code, OTP or contact.

## Authorization
Validation runs after authentication and before any capability check, except for `recovery.start`, which is anonymous and rate-limited.

## Failure, idempotency, concurrency, offline
Validation is stateless and safe to retry. Rejections are not cached.

## Privacy, retention, abuse
Error responses never echo submitted codes or contact addresses. Validation logs contain no request body.

## Observability & budgets
`recovery_validation_rejections_total{code}`. Validation p95 ≤ 5 ms excluding Argon2id verify.

## Tests
TEST-PS-053-03 (malformed inputs table), TEST-PS-053-04 (enumeration: unknown vs known account responses identical in body and within latency band).

## Acceptance criteria
1. Every code in the table is produced by at least one test.
2. No response differs between known and unknown accounts (R01).

## Assumptions & open decisions
- ASSUMPTION: code length (100 bits) and OTP lifetime.
- PROVISIONAL (D10 default, unapproved): user-held codes.
