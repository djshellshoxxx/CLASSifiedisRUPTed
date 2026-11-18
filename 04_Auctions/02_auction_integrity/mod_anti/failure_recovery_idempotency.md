# PS-036-06 — failure recovery idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/02_auction_integrity/mod_anti. **Parent:** [mod_anti SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-ID-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-036-06.R01 | Evaluation is idempotent per (`auc_`, `bid_sequence`); replays produce the same schedule. | MVP |
| PS-036-06.R02 | Extension write is CAS on `schedule_revision` under the auction lock. | MVP |
| PS-036-06.R03 | Schedule update and extension log row commit atomically. | MVP |
| PS-036-06.R04 | Missed evaluation (consumer down) is caught up within 60 s of recovery by replaying the bid log from `last_evaluated_sequence`. | MVP |
| PS-036-06.R05 | `effective_end` read by close is final: the close job takes the auction lock and reads `effective_end` once. | MVP |

## Data / schema
Schedule row: `last_evaluated_sequence`, `schedule_revision`. Extension log is the source for replay.

## Commands / queries / events
`anti.evaluate_bid` outbox emits `auction.extended` once per log row.

## States & transitions
No transition moves ENDED back to ENDED-able states. Recovery never decreases `effective_end` (PS-036-02 R03).

## Validation & errors
Retryable: `SYS.UNAVAILABLE`, `ANTISNIP.CLOCK_SKEW`. Non-retryable: `ANTISNIP.POLICY_UNKNOWN`, `SYS.CONFLICT` requires re-read.

## Authorization
Evaluator and catch-up job run as `sys`.

## Failure, idempotency, concurrency, offline
- Duplicate bid event: ignored by sequence (PS-036-02 R07).
- Crash between schedule update and log insert: prevented by R03; if store is not atomic, the reconciliation job recomputes from bid log and repairs the log within 60 s.
- Clock skew across nodes: server time of acceptance comes from the bid record; evaluator never reads its own clock for the window test beyond bid time.
- Offline: not applicable (server-only logic).

## Privacy, retention, abuse
Recovery logs contain IDs and sequence numbers only.

## Observability & budgets
Metrics: `antisnip_replays_total`, `antisnip_reconciliation_repairs_total` (should be 0 in steady state), `antisnip_catchup_seconds`.

## Tests
- TEST-PS-036-06-01 (fault): kill after schedule update before log insert → reconciliation repairs within 60 s.
- TEST-PS-036-06-02 (concurrency): two evaluators for same bid → one log row.
- TEST-PS-036-06-03 (replay): replay full auction log → identical final `effective_end`.
- TEST-PS-036-06-04 (timing): consumer outage 5 min → catch-up completes within 60 s of restart.

## Acceptance criteria
1. Replay determinism holds across fault suite.
2. No duplicate log rows.
3. Close reads a consistent `effective_end` in all fault tests.

## Assumptions & open decisions
- ASSUMPTION: 60 s catch-up target.
- No offline decisions in this module (see D08 for client writes; not applicable here).
