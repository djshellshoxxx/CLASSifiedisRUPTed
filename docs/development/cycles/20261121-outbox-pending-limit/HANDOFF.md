# ClassRup — outbox pending limit hardening and fresh-worker handoff

Checkpoint: **2026-11-21 UTC**. This is a **draft, unmerged, unreviewed candidate**. No release or deployment.

## Exact source, ownership, and dependency

- Repository: `djshellshoxxx/CLASSifiedisRUPTed`.
- Observed parent draft PR #98, branch `codex/classrup-inbox-read-isolation-20261121`, frozen published head `1d74c955527b2f46880f2b7979fb54157d34dc00`, tree `122d33db2990ec9dccb347bbff65e4b79b2e963b`.
- Parent #98's own Alpha `44932257424` and CLI `44932257402` now report **completed/success**. Both actual workflow job step summaries were checked. This is **parent-only** qualification, not evidence for this child. No independent PR #98 reviews were returned.
- New branch: `codex/classrup-outbox-pending-limit-20261121`, forked from that published parent SHA; test-first commit `175601c6d91dc3d6272915fdf5efff5da356fdcf`; implementation commit `11180896bebbf87298d4714d460cab8c9684364d`, tree `c42d78f9074106ae0047ca53c93165030ef40611`. This documentation commit will advance the head; fetch **live remote head/tree** before any review, edit or qualification.
- Source paths: `packages/kernel/src/storage/contract-suite.ts` and `packages/kernel/src/storage/tx.ts`. Frozen pre-handoff compare was two commits ahead and zero behind #98.
- Main observed unchanged at `449a619f1ae7b66cb42d9cab43dd5493bfe42c2e`. Other stacked draft PRs, including #98, remain separate and were not modified. Do not blindly integrate obsolete local-only commits or incompatible draft #8.

## Source-confirmed defect and bounded correction

The shared `tx.outbox.pending(consumer, types, now, limit)` passed a caller-supplied number directly to each driver without validation. SQLite's `ORDER BY o.seq LIMIT ?` interprets `-1` as **unlimited**; the memory driver's `.slice(0, -1)` returns nearly the full matching queue. The same input therefore creates divergent and unexpectedly large read workloads. Source paths and SQLite behavior were directly inspected. An isolated **Python sqlite3** query with 3 rows returned all 3 for LIMIT -1, none for LIMIT 0, and 1 for LIMIT 1. This is a standalone SQLite behavior demonstration, **not** a repository product test or a claim of exploitable remote access.

The new cross-adapter contract case seeds two outbox events and expects `RangeError` for `-1`, `-2`, `0.5`, `NaN`, `Infinity` and values exceeding `Number.MAX_SAFE_INTEGER`. It also preserves the existing zero-row meaning of `limit=0`, FIFO selection of one event and selection of both. The implementation rejects limits that are not nonnegative safe integers **before** invoking the driver. No upper cap was introduced; such a change would require an explicit product contract. This removes negative/unbounded semantics but does not establish a total bound on large valid read requests.

No runtime feature, v1 signatures, cryptographic checks, signing identities, encryption requirements, test limits, dependencies, workflow selection, and product caps were changed. This is a normal source-level input-admission correction, not a full defensive security certification.

## Verification status and limitations

- Parent PR #98 hosted Alpha/CLI have passed on their own exact head. They **do not qualify this candidate**.
- The local host fails `git ls-remote https://github.com/djshellshoxxx/CLASSifiedisRUPTed.git HEAD` with `Could not resolve host: github.com`. Therefore **no isolated local Git worktree could be created** and no TypeScript/Vitest, full domain, build or browser product tests ran locally on this child. The connector was used to create ordinary commits on a new isolated remote branch.
- The old November 19 complete local domain run exited **137 without a report** and remains incomplete. Older queued, failed and cancelled runs remain separately recorded; PR #56's main-push Alpha was **cancelled**, not passed.
- New child PR's exact-head CI needs publication and inspection. Do not count a queued or partial job as a pass. Do not restart unchanged queued or killed jobs without a concrete remedy.
- **No independent code-audit, normal bug-hunt, or defensive-security worker was available/executed for this new source.** This handoff is an assignment, not a review receipt; do **not** merge pending actual review and current-head qualification.

## Three distinct fresh-worker assignments (not yet executed)

1. **Code audit worker:** freeze the current child SHA/tree in its own remote-ref worktree where access permits. Confirm `pending` limit semantics and the `Storage.read` exception path; inspect callers for `0` and fractional limits; run full typecheck and targeted shared storage-contract tests serially, keeping setup failures separate. Inspect adjacent `sync.heads`, `sync.list` and `deadLetters.list` for separately scoped integer-boundary issues; do not expand this PR without reviewed tests. Publish exact commands, identities and findings.
2. **Functional bug-hunt worker:** verify parent RED/current GREEN for the new test separately on memory, SQLite and fake IndexedDB; also check ordinary FIFO, retry/dead behavior, empty types, zero and positive limits and reopened state. Verify each actually selected engine and the child's Alpha/CLI job logs; preserve failed or skipped paths.
3. **Defensive security-review worker:** perform source-focused review of negative/unbounded SQLite LIMIT and memory slice behavior, DoS risk, caller validation boundaries, tenant/consumer confinement, and any regressions caused by rejection. This is hardening/review only, not the interrupted reproduction follow-up. Distinguish confirmed source flaws from speculative network-access claims. Publish exact evidence and a separate review handoff.

When independent workers finish, inspect their receipts, implement verified repairs on a new ordinary commit, requalify that exact head, and only then consider integration in stacked dependency order; inspect the resulting merge tree and main-push qualification. Continue the next unblocked milestone from `docs/development/REMAINING_WORK.md`. Previously completed production-codec record recovery must not be reimplemented; attachment-reference and delivery/lease backup remain excluded.

No force push, branch deletion, merge, release, deployment, paid external API, unrelated automation edit or claimed exhaustion of owner credits was performed.
