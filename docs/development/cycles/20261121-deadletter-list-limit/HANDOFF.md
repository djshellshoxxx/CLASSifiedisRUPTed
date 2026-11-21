# ClassRup — dead-letter list limit parity / fresh worker handoff

Checkpoint: 2026-11-21 UTC. Draft, unmerged child of PR #99. This document is evidence and **unexecuted assignments**, not independent review approval.

## Exact ancestry, ownership, unchanged constraints

- Repository: `djshellshoxxx/CLASSifiedisRUPTed`.
- Frozen base is PR #99 `codex/classrup-outbox-pending-limit-20261121` at **`722d80f7bff801f5f8e7044ad3a27907f8eb8c7f`**, tree `4b3197b5bbe8fd7f9ab1de49fec9f3e3a236c581`, observed open/draft. This child is separate from the 38 open PRs at inspection and must not take over existing workers.
- Child branch `codex/classrup-deadletter-list-limit-20261121` created at exact remote base SHA. Test-first commit **`5f764d609a16b1eba1e95cab460eb273ecda497a`**, fix commit **`fbd966cc59ad28d2f04833e3cd2eb13cedded593`**, fix tree **`980819c5b76d21842adde9c8e814cc3530c8814f`**. Fetch the live branch after this handoff commit; it will differ.
- Before handoff, compared fix head against frozen parent: **2 ahead, 0 behind**. Only `packages/kernel/src/storage/contract-suite.ts` and `packages/kernel/src/storage/tx.ts` changed.
- Main observed `449a619f1ae7b66cb42d9cab43dd5493bfe42c2e`. The older local-only/publication SHA mapping stays in original November 19 evidence; never merge those obsolete local-only objects or draft #8.
- Preserve signed v1 records, key identities, encryption, backup admission, numerical product caps, existing workflow/test limits, and all pending attachment/reference, device and delivery/lease exclusions. No deployment or release is authorized.

## Confirmed source issue and bounded fix

`tx.deadLetters.list(consumer, limit = 100)` passed the raw limit to drivers. SQLite `LIMIT -1` returned **all** rows while memory `.slice(0,-1)` returned every row except the final one; different adapters were unexpectedly broad for an invalid request. A local standalone Python sqlite3 table of three rows returned 3 for -1, 0 for 0, 1 for 1. A local standalone Node reduction returned 2/3 for `slice(0,-1)`. These demonstrate language/SQL semantics, **not** product runtime results or remote exploitability.

Added a cross-adapter shared storage-contract regression with two dead rows using existing `tx.inbox.markDead` to seed. It checks invalid `-1`, `-2`, fractional, NaN, both infinities and above-`MAX_SAFE_INTEGER` for scoped and unscoped reads; normal zero, one, two, default 100, consumer scoping and chronological ordering are retained. Fix is one shared `Number.isSafeInteger(limit) && limit >= 0` guard before the driver query. No upper cap was introduced; it would require a separate approved contract. No schema or product behavior changed for valid inputs.

## Qualification receipts and limitations

- **Parent PR #99's exact-head** Alpha run [44938263546](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44938263546) completed **success**, domain job 855 passed/0 failed/pending/skipped/todo, tooling 27 passed and browser journeys 78 passed (the hosted log explicitly shows 78/78). Its CLI run [44938263550](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44938263550) completed **success**; Ubuntu Node 22 and 24 clean-install jobs each passed and one checked log reported 46/46 CLI tests. These only qualify **the parent**, not the new child.
- Locally `git ls-remote https://github.com/djshellshoxxx/CLASSifiedisRUPTed.git HEAD` failed with `Could not resolve host: github.com`; no checkout, worktree, TypeScript/Vitest, browser or product suite was run for this child. The GitHub connector created the new isolated remote branch and ordinary commits. The test-first commit was **not** executed in a RED product run.
- Child Alpha and CLI CI must be checked at **current published child SHA**, not reused from PR #99. A queued, skipped, failed or incomplete run cannot be reported as passed.
- The November 19 complete local domain runner exited 137 with no report; PR #56's separate main push Alpha was cancelled while CLI passed. Historical outcomes remain unchanged.
- **No fresh independent code-audit, functional bug-hunt or source-focused defensive-security worker was available/executed in this invocation.** The lanes below are pending, not signed off. Do not merge this draft without actual current-head CI plus independent review.

## Next distinct fresh workers

1. **Code audit:** freeze live SHA and tree in its own remote-ref worktree where access permits. Check list default, row ordering, scoped filtering, negative/fractional admission and whether callers rely on negative sentinel values. Run typecheck and `contract-suite` test selections serially. Inspect adjacent `sync.list` and `sync.heads` for separate numeric boundary issues, but avoid unrelated modifications to this PR. Record exact executed commands and findings.
2. **Functional bug hunt:** demonstrate parent RED/new GREEN on memory, SQLite and actual fake IndexedDB. Verify all invalid limits in both global and scoped modes; FIFO/deadAt ordering, no side effects, default 100, explicit 0, requeue and reopen semantics. Inspect child Alpha/CLI job logs and each actually selected test engine. Record failures/skips distinctly.
3. **Defensive security review:** read-only source review of unbounded list admission, consumer scope and memory/SQLite parity, large valid limit remaining exposure, and potential regressions. Defensive remediation only; do not resume interrupted reproduction follow-ups or represent theoretical impact as confirmed remote exploitability. Publish exact source and remaining risk.

After the independent workers actually finish, inspect findings, repair only confirmed issues with new normal commits and requalify the exact altered head. Integrate stacked ancestors only in verified dependency order after their separate reviews; inspect actual merge trees and new main-push workflows. Continue prioritized P1 recovery from `docs/development/REMAINING_WORK.md`; record restore/reopen, identity, canonical keys and unimplemented attachment/delivery boundaries separately.

No merge, release, deployment, force push, branch deletion, paid API, unrelated automation change, or assertion that owner credits have been exhausted occurred.
