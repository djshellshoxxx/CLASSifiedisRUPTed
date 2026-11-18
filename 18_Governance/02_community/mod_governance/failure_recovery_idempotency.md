# PS-147-06 — failure recovery idempotency

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-147-06. **Owner:** [18_Governance/02_community/mod_governance](SPEC.md). **Implementing module:** 18_Governance/02_community/mod_governance. **Consumers:** F13 notifications, [mod_transparency](../mod_transparency/SPEC.md), F12 moderation (proposed; see [dependency matrix](../../../DEPENDENCY_MATRIX.md)).

## Requirements
- PS-147-06.R01: Business outcome, actors and exclusions. A governance change is either fully recorded or not recorded at all. Retries never double-apply a vote, a proposal, a grant or a revocation. Exclusions: recovery of real-world agreements (none exist in this module) and money movement (none).
- PS-147-06.R02: Retry, timeout, duplicate, concurrency-conflict and partial-failure behavior is defined per operation in the tables below.
- PS-147-06.R03: Budgets: client-facing commands time out at 2 s server-side; tally and execution at 5 s each; membership query at 500 ms per call.
- PS-147-06.R04: Retry policy for automatic execution: max 5 attempts, exponential backoff with full jitter, base 200 ms, factor 2, cap 60 s (A-governance-12).
- PS-147-06.R05: Idempotency keys are scoped to the caller and retained 7 days (A-governance-15). Replays return the first stored response byte-for-byte.
- PS-147-06.R06: Events are published at least once through an outbox written in the same transaction as the state change. Consumers dedupe by `event_id`.

## Idempotency
- Scope: `(principal_ref, idempotency_key)`. `principal_ref` is an HMAC of the caller ID, so the same key from two callers is independent.
- Storage: `idempotency_record` ([domain schema](domain_schema.md)).
- Same key and same `request_sha256`: return the stored status and body. No side effects are repeated.
- Same key and different `request_sha256`: `GOVERNANCE_IDEMPOTENCY_KEY_REUSED` (409).
- Same key while the first request is still in flight: wait up to 2 s for it to finish, then replay. If still in flight, `GOVERNANCE_CONCURRENT_MODIFICATION` (409, retryable).
- Failed first attempts with a 5xx status are not stored. Only final 2xx and 4xx responses are stored, so a 503 can be retried with the same key.
- Natural-key commands (C10 TallyProposal, C11 ExecuteDecision, C13 ExpireDrafts) are idempotent by their target: a second run finds the state already advanced and does nothing.

## Retry and timeout per operation
| Operation | Timeout | Client retry | Server retry | Notes |
|---|---|---|---|---|
| C5, C6, C7, C8, C9 | 2 s | yes, same key, backoff 0.5 s × 2^n, max 4 tries | none | Replay safe |
| C1, C2, C3, C4, C12, C14 | 2 s | yes, same key | none | C14 returns 202 and runs async |
| Membership query at open (C7) | 500 ms per call | none | 2 retries with backoff, then fail | Failure: `GOVERNANCE_DEPENDENCY_UNAVAILABLE`; no state change |
| C10 TallyProposal | 5 s | n/a | scheduler retries next tick (30 s) | Idempotent by state |
| C11 ExecuteDecision | 5 s per attempt | n/a | 5 automatic attempts per A-governance-12 | See execution section |
| C13 ExpireDrafts | 60 s per community | n/a | next daily run | Idempotent by date |

## Concurrency control
- Optimistic: `revision` is required on C4, C6, C7, C8 and C12. Mismatch: `GOVERNANCE_CONCURRENT_MODIFICATION`, client refetches and retries.
- Pessimistic:
  - C7 OpenProposal locks the proposal row `FOR UPDATE`.
  - C9 CastVote locks the proposal row `FOR SHARE`. A vote racing a tally waits for the tally, then reads `closed` and fails with `GOVERNANCE_VOTING_CLOSED`.
  - C10 TallyProposal uses `FOR UPDATE SKIP LOCKED`. Only one worker tallies a proposal.
  - Any role change (C11 grant or revoke, erasure) locks the community row `FOR UPDATE`, so the steward cap and last-steward rules hold under concurrency.
- Audit sequence: `audit_entry.seq` is assigned under the community row lock, so the chain has no gaps.
- Vote upsert: `INSERT ... ON CONFLICT (proposal_id, voter_participant_id) DO UPDATE` with `revision + 1`. Two votes racing from one voter produce one row with the later choice.

## Partial failure and recovery
| Failure point | State after failure | Recovery |
|---|---|---|
| Crash before commit in any command | Nothing written | Client retries with same key |
| Response lost after commit | Recorded | Client retries; replay returns stored response |
| Membership query fails during C7 | Proposal stays draft | Client retries; no partial eligibility |
| Tally crashes mid-transaction | Rolled back; proposal stays open or closed | Scheduler retries on next tick |
| Decision committed, then execution fails | decision recorded; proposal `adopted` then `execution_failed` after attempts | ExecuteDecision retries; operator RetryExecution after 5 failures (C12) |
| Execution applies some effects, then fails | Single transaction: all or nothing | Rollback; state `execution_failed` |
| Outbox relay down | Events queue in outbox | Relay resumes; events not lost |
| Consumer receives duplicate event | Consumer dedupes by `event_id` | No double effect |
| Community frozen during execution | Execution deferred | Resumes when community becomes active |
| Operator restores from backup | See [import and backup](import_export_backup_rollback.md) | Replay of outbox after restore is idempotent |

## Execution retry details (A-governance-12)
- Attempt 1 runs immediately after the decision commits.
- Attempts 2 to 5 wait `min(60 s, 200 ms × 2^(n-2)) × random(0,1)`.
- After 5 failures: state `execution_failed`, `execution_attempts = 5`, alert `governance_execution_stuck` raised. Operator may run C12 at any time. Each operator retry is audited and counts toward `execution_attempts`.
- A permanent guard failure (for example a target that was already revoked) also ends in `execution_failed` with `reason_code` set, and retries stop early after 2 identical reason codes.

## Offline and client behavior (D08)
- Client keeps a local pending vote queue. Pending votes are shown as pending and never as recorded.
- Pending items are sent with their original key. On `GOVERNANCE_VOTING_CLOSED` the client drops the item and shows the proposal result.
- Items older than 7 days, or for proposals no longer open, are discarded on device.
- Reconnect does not replay in a fixed order across proposals. Each item is independent, because votes do not depend on each other.

## Test IDs
- TEST-PS-147-06-T01: Send C9 with the same key and body 3 times. Exactly one vote row and one `vote.cast.v1` event exist. All 3 responses are identical.
- TEST-PS-147-06-T02: Kill the tally worker after the row lock and before commit, 20 times in a run. Final state is one decision row or zero, never two, and no proposal is stuck in `closed` after 60 s.
- TEST-PS-147-06-T03: Force 5 execution failures. State is `execution_failed` with `execution_attempts = 5`. Operator retry succeeds and produces exactly one set of role effects.
- TEST-PS-147-06-T04: Concurrent CastVote and TallyProposal on the same proposal, 100 runs. No vote is counted after close; every vote is either in the tally or rejected with `GOVERNANCE_VOTING_CLOSED`.

## Open decisions
- A-governance-12: execution retry policy (5 attempts, base 200 ms, factor 2, cap 60 s, full jitter). Default adopted.
- A-governance-15: idempotency retention 7 days. Default adopted.
- Related decision: D08 (offline pending queue until server acknowledgment).
