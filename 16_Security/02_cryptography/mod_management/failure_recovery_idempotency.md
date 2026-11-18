# PS-129-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/02_cryptography/mod_management. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-129-06.R01 | Idempotency records retained 7 days (CTR-EVT-001 R03). | MVP |
| PS-129-06.R02 | Activation job is idempotent on (`policy_id`, `effective_from`). | MVP |
| PS-129-06.R03 | Command timeout 2 s p95 (ASSUMPTION); server retries internal writes at most 3 times with jitter. | MVP |
| PS-129-06.R04 | Clients holding cached active policy may use it up to 24 h (ASSUMPTION); beyond that, signing operations fail closed with `MGMT.POLICY_STALE`. | MVP |
| PS-129-06.R05 | Restore from backup replays policy events and verifies the hash chain (CTR-EVT-001 R08). | MVP |

## Data / schema
Uses `crypto_policy` and event envelope. No additional tables beyond idempotency and scheduler job records.

## Commands / queries / events
Scheduler tick every 60 s (ASSUMPTION). Tick reads `scheduled` policies whose `effective_from` ≤ now.

## States & transitions
Crash between state write and event emit is prevented by writing both in one transaction. If not possible, the outbox pattern is required; no state change without event.

## Validation & errors
| Code | Category | Retryable | message_key |
|---|---|---|---|
| MGMT.POLICY_STALE | unprocessable_state (422) | false | err.mgmt.policy_stale |
| SYS.UNAVAILABLE | unavailable (503) | true | err.sys.unavailable |

## Authorization
Recovery operations run under `sys_` with `execute` scope and an `aud_` record.

## Failure, idempotency, concurrency, offline
- Concurrent approvals: second writer receives `EVT.REVISION_CONFLICT` and re-reads.
- Clock skew > 5 min between scheduler and clients: activation proceeds on server time; clients receive `effective_from` and apply it locally only with server time.
- Offline writes: none. Policy writes are online-only (D08 does not apply to governance writes).

## Privacy, retention, abuse
Job records hold IDs and timestamps only.

## Observability & budgets
Metric `crypto_policy_activation_lag_seconds` (p95 ≤ 120 s, ASSUMPTION).

## Tests
- TEST-PS-129-06-01: integration, duplicate activation tick creates one active record.
- TEST-PS-129-06-02: chaos, kill scheduler between write and emit; restart yields exactly one event.
- TEST-PS-129-06-03: offline, client past 24 h cache fails closed for signing.

## Acceptance criteria
1. No double activation under 10 concurrent ticks.
2. Restore reproduces identical `active` set and verifies chain.
3. Stale-cache rule enforced at 24 h +/- 1 min.

## Assumptions & open decisions
- ASSUMPTION: 24 h stale window; 60 s tick.
- D08 (offline writes): not applicable to policy governance; PROVISIONAL (D08 default, unapproved) for client caching only.
