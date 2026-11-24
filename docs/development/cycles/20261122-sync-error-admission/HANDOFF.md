# ClassRup — sync retry error metadata validation and engineering handoff

Checkpoint: 2026-11-22 UTC. Draft, stacked on PR #111. No integration into main.

## Frozen source and ownership

- Observed parent PR #111 branch `codex/classrup-sync-due-time-admission-20261122`, head `fd8b7509d134a58453a1bd7f93a511c0038102a0` at fork and rechecked unchanged before publication.
- Isolated child branch: `codex/classrup-sync-error-admission-20261122`.
- Test-first commit: `707c1fdf09f8dbad1401c6df1f6729bdce7bd53c` (shared `packages/kernel/src/storage/contract-suite.ts`).
- Production fix: `72260f10a16505a7659f17cae60de56979e80207` (`packages/kernel/src/storage/tx.ts`).
- Record the final documentation commit, PR head/tree, exact workflow attempts and actual merge tree separately. Do not merge historical unpublished commits whose equal-tree remappings belong to different parents.
- No separate local Git worktree could be created: `git ls-remote` failed because github.com did not resolve. GitHub connector reads/writes were used instead. The parent branch was not modified.

## Bounded source-confirmed defect

`tx.sync.transition()` validated `attempts` and `nextAttemptAt`, but accepted a runtime `patch.lastError` of any type. Its declared `string | null` constraint is only static. This lets malformed delivery error metadata reach adapter persistence and potentially produces inconsistent memory, IndexedDB and SQLite behavior. This is an integrity and portability defect established by source inspection, not a demonstrated external exploit.

The fix rejects supplied, non-null `lastError` values unless they are primitive strings, before driver read/write. Omitted values, null clearing, and ordinary strings keep their prior behavior. Existing transition states, FIFO ordering, signed v1 data, identity, encryption, product caps and test timeouts are unchanged.

The new shared contract tests 7 invalid inputs (number, booleans, array, object, NaN, bigint) for rejection and unchanged persistent row, followed by a valid string retry, omission retention and null clearing. Memory, SQLite and fake IndexedDB use this contract. Test-first commit was *not* executed RED. No repo tests were executed locally. A standalone Node predicate probe passed 4 valid and 7 malformed samples; this is not product testing.

## Qualification and historical evidence

- Frozen parent PR #111 exact-head Alpha [44995939143](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44995939143): success; plan and domain jobs both completed successfully.
- Frozen parent PR #111 exact-head CLI [44995939198](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44995939198): success; plan and Ubuntu Node 22.18.0/24.x clean-install jobs all completed successfully.
- The child PR's **own** Alpha/CLI, repository RED/GREEN tests and independent reviews are **not yet qualified**; fetch current-source runs and all jobs. Parent success cannot qualify this child.
- Historical PR #105 Alpha [44968879520](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44968879520) failed a Firefox checkbox journey; its failure remains recorded despite later descendant successes. The original 2026-11-19 full local domain suite ended at exit 137 without final report. Previous setup failures, cancelled runs and static-only reviews are not passes.
- An absent review is not an approval. No owner credit balance is observable, and no exhausted budget was reported.

## Successor fresh-worker assignments (recorded, **not executed**)

1. **Code audit:** inspect `SyncTransitionPatch`, all normal production callers and per-driver sync upsert binding; check undefined, null, primitive strings and unexpected runtime objects at this exact child source. Record exact head/tree, scope, and static-vs-executed evidence.
2. **Functional bug hunt:** isolate the exact published branch from a remote ref, run the test-first commit against unfixed source for genuine RED if feasible, then fixed cross-adapter shared-contract tests and ordinary retry/ack/list/head flows; perform typecheck, static/build, full hosted Alpha, CLI and browser qualification serially as resources allow. Do not discard historical failures or restart unchanged killed suites without a remedy.
3. **Defensive security review:** source-focused review of tenant/destination FIFO, retry error metadata and receipt serialization, replay state, unauthorized state changes and transaction rollback; propose minimal confirmed hardening only, without resuming interrupted offensive reproduction follow-ups.

After actual worker reviews, integrate only independently approved and current-source qualified commits, ancestor-by-ancestor, then compare actual merge tree and main's separate push runs. Do not blindly merge incompatible PR #8, deploy, release, force-push, delete branches, use paid APIs or change the older paused/unrelated automations.

## Outstanding functional priorities

Review this child and address any confirmed findings. The broader documented P1 backup/recovery backlog after full production-codec encrypted restore/reopen comprises attachment-reference portability, delivery/lease recovery, identity-preserving rotation and interrupted-device/load acceptance. This small fix does not claim to complete those features.
