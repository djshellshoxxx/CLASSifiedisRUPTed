# PS-022-06 — Failure, recovery, idempotency and concurrency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/03_cycle_execution/mod_dropouts. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-022-06.R01 | Detection of the same dropout by timer and by a participant report produces one case (merge on key). | MVP |
| PS-022-06.R02 | Timers fire at-least-once; resolution is idempotent by (`dropout_id`, path). | MVP |
| PS-022-06.R03 | Resolution cannot run while any lock in the case is still HELD; mod_lock release is confirmed before `RESOLVING` is entered. | MVP |
| PS-022-06.R04 | Lost lock-release acknowledgement: retry with the same key for up to 24 h; after 24 h the case escalates to mod_recovery. | MVP |
| PS-022-06.R05 | A dropout case and its event are written in one transaction. | MVP |

## Data / schema
Uses `dropout_case.revision` and `dropout_lock_ref` from [domain_schema.md](domain_schema.md). Idempotency key table retained 24 h.

## Commands / queries / events
Retries reuse `idempotency_key`; events keep the original `correlation_id`.

## States & transitions
Recovery never reverts RESOLVED_* states. A wrong resolution is corrected by a recovery case, not by rewriting history.

## Validation & errors
| Code | Retryable | Class | Notes |
|---|---|---|---|
| SYS.CONFLICT | false | conflict / 409 | re-read case |
| CYC_DROPOUT.LOCKS_ACTIVE | true | precondition_failed / 412 | retry after lock confirmation, backoff 5 s to 5 min |
| SYS.UNAVAILABLE | true | unavailable / 503 | backoff 1 s to 60 s, jitter ±20 % |

Timeouts: lock release call 5 s; overall resolution 30 s.

## Authorization
Re-check authorization at commit (CTR-CAP-001 R09).

## Failure, idempotency, concurrency, offline
Partial failure after lock release but before case update: reconciliation job compares lock states and case state every 5 min and repairs forward (never backward). Concurrent resolve calls: revision check; loser gets `SYS.CONFLICT`.

## Privacy, retention, abuse
Reconciliation logs record IDs and codes only.

## Observability & budgets
Metric: `dropout_reconcile_repairs_total`; alarm if any repair older than 30 min remains.

## Tests
- TEST-PS-022-06-01 (integration): timer plus report produce one case.
- TEST-PS-022-06-02 (fault injection): lock release ack lost; retry succeeds; no duplicate release.
- TEST-PS-022-06-03 (concurrency): two resolve calls, one winner.

## Acceptance criteria
1. No case reaches RESOLVING with a HELD lock (checked by property test over 10 000 random sequences).
2. Escalation after 24 h lock-ack loss verified.
3. Reconciliation never moves state backward.

## Assumptions & open decisions
- ASSUMPTION: 5 min reconcile interval and 24 h retry window.
- [DECISIONS.md](../../../DECISIONS.md) D04 — PROVISIONAL (D04 default, unapproved): compensating recovery, no atomic guarantee.
