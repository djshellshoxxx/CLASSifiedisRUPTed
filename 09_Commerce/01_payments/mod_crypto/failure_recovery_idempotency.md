# PS-068-06 — failure, recovery, idempotency and offline behavior

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/01_payments/mod_crypto (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (Failure section; R11, R12), CTR-EVT-001 (R03), CTR-ERR-001 (R03). **Decisions:** D04, D08 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-068-06.R01 | Each claim is verified by at least two independent RPC or indexer providers per chain (ASSUMPTION). Disagreement yields `COM.VERIFIER_UNAVAILABLE`, not a verdict. | MVP |
| PS-068-06.R02 | Adapter timeout 10 s per provider; retries with exponential backoff (base 2 s, max 5 attempts), then state unchanged. | MVP |
| PS-068-06.R03 | Poll interval: 30 s until `FINAL`, then 10 min until reorg window closes (ASSUMPTION). | MVP |
| PS-068-06.R04 | Offline clients may queue a claim (D08); the server re-validates chain, asset, quote and party status at commit. | MVP |
| PS-068-06.R05 | Chain outage: all claims on that chain keep their state; user label reads "verification delayed". | MVP |

## Data / schema
Verification job row: `claim_id`, `chain_id`, `providers[]`, `last_result_digest`, `next_poll_at`, `attempts`.

## Commands / queries / events
Retries keep the original idempotency key.

## States & transitions
Job states: `scheduled`, `polling`, `agreed`, `disagreed`, `paused_outage`.

## Validation & errors
`COM.VERIFIER_UNAVAILABLE` (503, retryable); `COM.FINALITY_PENDING` (412, retryable).

## Authorization
Jobs run as the adapter `sys_` principal.

## Failure, idempotency, concurrency, offline
Reorg during polling is detected by block hash mismatch and produces `adapter.reorg`. Concurrent dispute and finality: revision check (CTR-COM-001 test 13).

## Privacy, retention, abuse
Job rows are deleted with their claim's retention (RET-EVD).

## Observability & budgets
Metric: provider disagreement count per chain (alert on any sustained disagreement > 15 min).

## Tests
- TEST-PS-068-06-01 (integration): provider outage keeps state; recovery verifies once.
- TEST-PS-068-06-02 (integration): two providers disagree; no verdict; alert raised.
- TEST-PS-068-06-03 (integration): reorg at 2 confirmations reverts state.
- TEST-PS-068-06-04 (property): replayed adapter result changes nothing.

## Acceptance criteria
1. No verdict issued on provider disagreement.
2. Outage never changes claim state (test).
3. Retries never create duplicate verification records.

## Assumptions & open decisions
- ASSUMPTION: two providers minimum per chain.
- D04 (PROVISIONAL default, unapproved). D08 (PROVISIONAL default, unapproved).
