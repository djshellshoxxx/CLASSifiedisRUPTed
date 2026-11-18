# PS-015-06 — failure, recovery and idempotency
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/01_trade_proposals/mod_two. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-015-06.R01 | Cycle creation with slots is atomic: all invitations and the cycle row, or none. | MVP |
| PS-015-06.R02 | Lock is a single transaction that re-checks PS-015-02 R02 and freezes offers via `mod_offer`; partial lock is rolled back. | MVP |
| PS-015-06.R03 | Confirm timer and expiry are durable and recovered on restart (deadline stored, no in-memory timer). | MVP |
| PS-015-06.R04 | Client retries only for `TWO.MISSING_OFFER`, max 3, backoff 1 s/2 s/4 s. | MVP |

## Data / schema
Uses `cyc_id`, `revision`, `confirm_until`, `expires_at`, `idempotency_key`.

## Commands / queries / events
Server timeout 2 s; lock job timeout 10 s with retry from stored state.

## States & transitions
Crash during lock: stored state is `confirming`; the job re-runs lock idempotently.

## Validation & errors
Retryable: `TWO.MISSING_OFFER`. Terminal: others.

## Authorization
Replays re-authorize; withdrawn cycles reject replayed proposes.

## Failure, idempotency, concurrency, offline
Lock vs withdraw: PS-015-03. Feasibility service down: cycle remains `fully_accepted`, not locked; retry with backoff; after 3 failures alert the owner, no silent lock. Offline: propose and withdraw may queue (D08 PROVISIONAL); accept and lock never queue.

## Privacy, retention, abuse
Queued proposals store slot IDs and keys only.

## Observability & budgets
Lock job duration p95 ≤ 2 s; stuck-in-confirming alert if past `confirm_until` + 60 s.

## Tests
- TEST-PS-015-06-01 (integration): crash mid-lock; restart completes lock once.
- TEST-PS-015-06-02 (integration): feasibility outage holds cycle in `fully_accepted`.
- TEST-PS-015-06-03 (concurrency): 50 parallel propose requests with same key yield one cycle.

## Acceptance criteria
1. No partial lock in 10,000 injected failures.
2. Zero locks without a feasible result.

## Assumptions & open decisions
- ASSUMPTION: feasibility outage alerts after 3 failed attempts.
- D08 PROVISIONAL (Dxx default, unapproved): offline queue for non-binding actions only.
