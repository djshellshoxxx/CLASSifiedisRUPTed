# PS-143-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/03_release/mod_gates. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-143-06.R01 | Evaluation pins the evidence IDs and digests it read; a decision never changes after recording. | MVP |
| PS-143-06.R02 | Evaluation retries on `SYS.UNAVAILABLE` at most 3 times (ASSUMPTION), same key. | MVP |
| PS-143-06.R03 | A waiver whose `expires_at` has passed is treated as absent on the next evaluation. | MVP |

## Failure, idempotency, concurrency, offline
- **Evidence source unavailable:** evaluation fails with `SYS.UNAVAILABLE`; no decision is written. Never default to `pass`.
- **Partial evidence read:** any missing source yields `blocked`, not an error that could be read as pass.
- **Concurrent evaluations:** same key returns one decision; different keys for the same commit are both recorded and the later one supersedes for display.
- **Waiver grant race:** `expected_revision` on the decision; loser gets `SYS.CONFLICT`.
- **Clock:** expiry uses server time only.

## Tests
- TEST-PS-143-06-01 (unit): source unavailable never produces `pass`.
- TEST-PS-143-06-02 (integration): expired waiver reverts decision to blocked on re-evaluation.
- TEST-PS-143-06-03 (concurrency): two waiver grants on one decision; one wins.

## Assumptions & open decisions
- ASSUMPTION: 3 retries is a default.
- D07 (retention) default applies: PROVISIONAL (D07 default, unapproved).
