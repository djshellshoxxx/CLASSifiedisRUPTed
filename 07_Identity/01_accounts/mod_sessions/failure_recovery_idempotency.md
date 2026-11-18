# PS-054-06 — failure, recovery and idempotency
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/01_accounts/mod_sessions. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-054-06.R01 | Refresh rotation is a compare-and-set on `current_refresh_hash` in one transaction. Two concurrent refreshes: exactly one rotates; the other is served from grace or triggers reuse handling. | MVP |
| PS-054-06.R02 | Family revocation is atomic across all member sessions. | MVP |
| PS-054-06.R03 | Store outage: validation fails closed (`SYS.UNAVAILABLE`, 503). No cached grant is extended past its TTL during outage. | MVP |
| PS-054-06.R04 | Session secrets are never placed in the offline queue (D08 exclusion). Offline clients keep an access token only until its own expiry. | MVP |
| PS-054-06.R05 | Revocation events are delivered to all edge caches within 60 s (ASSUMPTION) via a versioned revocation list. | MVP |

## Data / schema
`revocation_list` (ses_ or rfm_ ID, revision, expires_at = absolute timeout). Contains no secrets.

## Commands / queries / events
Replay of `session.create` with the same key returns `SYS.CONFLICT`; secrets are never re-issued. Refresh is never replayed by key.

## States & transitions
Failure outcomes mapped in [workflow_state_machine](workflow_state_machine.md).

## Validation & errors
`SYS.UNAVAILABLE` (retryable) on store outage; `TOKEN_REUSED` on family reuse.

## Authorization
Revocation list checks run before any capability check.

## Failure, idempotency, concurrency, offline
- Clock skew > 60 s: server time governs; client expiry hints ignored.
- Edge cache partition: revocation list expiry bounded to 60 s; beyond that, validation calls origin.
- Recovery of family after reuse: no automatic recovery; user must log in again.

## Privacy, retention, abuse
Revocation list entries purged at absolute expiry.

## Observability & budgets
`session_cache_staleness_seconds` p95 ≤ 60; `session_store_unavailable_total`.

## Tests
TEST-PS-054-11 (concurrent refresh), TEST-PS-054-12 (store outage fails closed), TEST-PS-054-13 (offline queue excludes session commands), TEST-PS-054-14 (revocation propagates within 60 s).

## Acceptance criteria
1. No test yields two successful rotations from one refresh secret outside grace.
2. Store outage test shows zero successful validations.

## Assumptions & open decisions
- ASSUMPTION: 60 s propagation bound; 10 s grace.
- PROVISIONAL (D08 default, unapproved): offline queue excludes session commands.
