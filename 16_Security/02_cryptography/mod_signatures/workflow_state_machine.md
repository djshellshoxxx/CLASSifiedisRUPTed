# PS-130-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/02_cryptography/mod_signatures. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-FED-001, CTR-EVT-001, CTR-ERR-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-130-03.R01 | A verification request is in exactly one state at a time: `pending`, `valid`, `invalid`, `key_unknown`, `key_expired`, `key_revoked`. | MVP |
| PS-130-03.R02 | `key_unknown` retries key fetch at most 3 times (1 s, 4 s, 16 s backoff; ASSUMPTION) before a terminal result. | MVP |
| PS-130-03.R03 | `valid`, `invalid` and `key_revoked` are terminal for that subject and key pair. | MVP |
| PS-130-03.R04 | A `key_unknown` subject may be re-verified after a key sync; the result is then final. | MVP |

## Data / schema
State is `verification.result` in [domain_schema.md](domain_schema.md).

## Commands / queries / events
Transitions occur on `signature.verify` and on key-sync notifications from `mod_key`.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | verify requested | subject validated | pending | none |
| pending | signature checks pass | key valid at occurred_at | valid | record result |
| pending | signature checks fail | any | invalid | emit `signature.verification_failed` |
| pending | key lookup miss | retries left | pending | backoff |
| pending | key lookup miss | retries exhausted | key_unknown | record result |
| pending | key expired at time | valid_until < occurred_at | key_expired | record result |
| pending | key revoked or compromised before time | compromised_at ≤ occurred_at | key_revoked | emit `signature.verification_failed` |
| key_unknown | key sync delivers key | key valid | pending | re-verify |

## Validation & errors
Invalid transitions return `SIG.KEY_NOT_VALID_AT_TIME` only for synchronous callers.

## Authorization
Transitions are internal; only `sys_` may force re-verification.

## Failure, idempotency, concurrency, offline
Concurrent verify requests for the same subject and key coalesce into one lookup.

## Privacy, retention, abuse
Verification results retained with the subject (PUBLIC).

## Observability & budgets
Gauge `sig_pending_total`; alert if pending older than 10 min.

## Tests
- TEST-PS-130-03-01: unit, every row of the table.
- TEST-PS-130-03-02: integration, key arrives during backoff and result becomes `valid`.

## Acceptance criteria
1. No subject enters two terminal states.
2. Backoff schedule measured within ±10%.

## Assumptions & open decisions
- ASSUMPTION: backoff values above.
- D01 (federated verification): PROVISIONAL (D01 default, unapproved).
