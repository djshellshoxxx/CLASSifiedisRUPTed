# ClassRup — sync retry due-time admission and fresh review handoff

Checkpoint: 2026-11-22 UTC. Bounded defensive delivery-state integrity repair; draft only.

## Exact source and ownership

- Parent PR #110: `d6fe014efb7d11b331206e37ca1c03e566f5f4bc`, observed unchanged immediately before fork.
- Isolated ref: `codex/classrup-sync-due-time-admission-20261122`.
- Test-first commit: `387e2fbd5bf7a252a87530312af7d99d60f6976d` modifying `packages/kernel/src/storage/contract-suite.ts`; **not executed RED**.
- Fix commit: `63a4a003094b4eec4c5c85c0f981aa6b5f4f1eb4` modifying `packages/kernel/src/storage/tx.ts`.
- This document is added as a separate docs-only commit. Retrieve and record final published head/tree, exact PR workflow runs and the source-to-merge tree before integration.
- No isolated local Git worktree could be created: `git ls-remote` reported GitHub DNS resolution failure. Do not mix original unpublished mapped commits with published history.

## Confirmed finding and repair

The shared `tx.sync.transition` allowed arbitrary `patch.nextAttemptAt` text. The SQLite sync head query requires `next_attempt_at <= now` with canonical ISO string ordering; a value such as `not-an-iso-date` sorts after ISO timestamps, making the prepared head ineligible while it can still block later messages at the same tenant/destination. This is a source-level delivery availability defect, **not** a demonstrated external attack.

The change validates optional due times before reading or writing the row. Undefined and null retain their existing meanings; non-null times must round-trip exactly through `Date.parse` and `Date.toISOString()`. It rejects noncanonical, invalid and non-string due times without adapter writes. Existing valid timestamps, FIFO order, state transitions, signed envelopes, v1 archives, identity, encryption, product caps and timeouts are unchanged.

The shared storage contract now covers eight malformed values, unchanged durable state, valid future scheduling and due eligibility, and clearing the due time. The same contract is used by memory, SQLite and fake IndexedDB. No repository RED/GREEN or native browser testing was executed locally. A standalone Node 22 check demonstrated that an invalid due string compares falsely to an ISO now and that the proposed canonical predicate recognizes normal valid timestamps; this is **not a product test**.

## Qualification truth

- PR #110 at parent head: Alpha [44991118619](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44991118619) **success** (888 executed domain assertions, 27 tooling tests, 78 browser journeys), CLI [44991118548](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44991118548) **success** (Ubuntu Node 22/24). This qualifies parent source only.
- PR #105 Alpha [44968879520](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44968879520) **failed** on a Firefox checkbox browser journey; preserve original failure despite later passing descendants. The 2026-11-19 local complete domain run exited 137 without a final report; older cancelled and incomplete runs remain incomplete.
- New PR current-source Alpha/CLI, genuine repository RED/GREEN, external independent reviews, and ancestor-by-ancestor integration: **pending**.
- No credit balance or additional review worker executor was observable; no budget exhaustion has been reported.

## Next fresh, distinct workers — assigned in record, not actually launched

1. **Code audit:** Check `SyncTransitionPatch` and all call sites at the exact new head. Inspect SQLite/memory/IndexedDB `heads`, `syncMachine`, scoped retry and time formatting; verify canonical timestamp compatibility and scope semantics. Record source/tree and whether conclusions are static only.
2. **Functional bug hunt:** In an isolated worktree, run the test-first commit against original source for RED where feasible, then run current-source tests for GREEN across the three adapters, normal retry/ack paths, full required typecheck/static/build, and browser qualification serially. Preserve historical failures and setup limits.
3. **Defensive security review:** Review malformed scheduling metadata, replay and retry state integrity, tenant/destination FIFO isolation, unchecked receipt and error metadata, and write/rollback ordering. No offensive reproduction follow-ups; record only confirmed findings and defensive mitigations.

After actual review and current-head qualification, integrate qualifying repairs only. Do not merge drafts without independent review, and verify exact merge tree and separate main-push CI. Next broader P1 slices are attachment/reference portability, delivery and lease recovery, rotation and device interruption. Do not merge incompatible #8, release, deploy, force-push, delete branches, purchase APIs, or alter older paused/unrelated automations.
