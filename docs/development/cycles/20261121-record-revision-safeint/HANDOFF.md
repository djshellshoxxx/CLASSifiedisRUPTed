# ClassRup — safe optimistic-concurrency revision admission and handoff

Checkpoint: 2026-11-21 UTC. **Draft-only** bounded continuation; this document is not independent approval or a product-test report.

## Frozen source, ancestry and ownership

- Repository: `djshellshoxxx/CLASSifiedisRUPTed`.
- Parent: open draft [PR #103](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/103), branch `codex/classrup-blob-contenttype-dedupe-20261121`, observed remote head `3fb99e65287437446c7bb4482645509512c03083`. It has not been modified by this slice.
- Isolated new branch: `codex/classrup-record-revision-safeint-20261121`, starting from that exact published parent head. No local-only Git history was replayed.
- Test-first published commit: `1303d4835217ce01359268688578f37c7e512852`. Production change commit: `f82ea382991b86bb7fef4e03299c9f9ba95dd62c`. This document adds one commit; inspect the live final ref, tree, and diff before acting.
- Files touched: `packages/kernel/src/storage/contract-suite.ts`, `packages/kernel/src/storage/tx.ts`, this handoff. No change to signed v1 bytes, key handling, codec set, monetary/product limits, timeout values, workflow selections, releases or deployment.
- Main was observed at `449a619f1ae7b66cb42d9cab43dd5493bfe42c2e`, already including merged production-codec-set encrypted restore/reopen acceptance. Do **not** reimplement that completed feature. The next broader recovery boundaries are attachment/reference stores, delivery/lease state, rotation, and device interruption.

## Source-confirmed normal functional defect and bounded correction

`recordStore.put` and `recordStore.remove` both call `checkRevision(expectedRevision)`. Its previous `Number.isInteger` test accepts `Number.MAX_SAFE_INTEGER + 1` (2^53), even though neighboring revision numbers cannot all be represented exactly in IEEE-754 JavaScript. This fails to reject an invalid optimistic-concurrency input **before** adapter lookups and can return an ordinary stale-revision response for an inherently imprecise value. This is a source-derived contract defect; no exploit or production incident is claimed.

Use `Number.isSafeInteger(expected)` together with nonnegativity in the single shared CAS guard. Preserve expected revision 0 creation, supported positive revisions, and ordinary conflict semantics. A shared storage-contract regression covers `put` and `remove` across memory, SQLite and fake IndexedDB: unsafe integer, negative, fractional and non-finite inputs reject with RangeError; no committed record is changed; the largest safe integer remains a well-formed stale revision; normal revision 1 -> 2 update works.

The regression was added before the production edit, but was **not executed RED**. It is not permissible to call the test passing based on source review alone.

## Qualification facts and limits

- At the observed exact head of parent PR #103, Alpha [44959176751](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44959176751) and CLI [44959176640](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44959176640) were **completed/success**. Alpha domain typecheck, spec/dependency checks, tooling/domain runner, production build and browser journey steps reported success; CLI's Ubuntu Node 22 and 24 jobs succeeded. These are **parent-only** and never qualify the present change.
- Local `git ls-remote` still fails with `Could not resolve host: github.com`, so no isolated local worktree, repository TypeScript, Vitest, native browser or complete domain test could be executed. This is a **setup/access blocker**, not an application-test failure.
- Publish a draft PR and inspect its own final-head Alpha, CLI, actual jobs, assertions, skips and browser executions. Queued/in-progress jobs do not count. If a failure occurs, diagnose the exact run before changing workflow behavior.
- Preserve the November 19 complete local domain runner's exit 137 without final report; the PR #56 main-push Alpha cancellation and separate main-push CLI success; PR #57 independently verified main-push results; and every historical failed/incomplete invocation.
- Independent reviews are **not** complete and no independent approval is asserted. The connected repository interface cannot spawn distinct autonomous workers and the local host cannot check out a remote-ref worktree.

## Three separately scoped fresh review assignments — outstanding

1. **Code auditor.** Read the *actual current* parent and child remote SHAs in isolated worktrees when connectivity allows. Review all calls to `checkRevision`, adapter integer storage and CAS use for safe-integer assumptions, signed record revision boundaries, error compatibility and the possibility that callers expect RangeError message text. Run typecheck and focused contract tests serially. Leave exact SHA/tree, commands, results and any required repair.
2. **Normal functional bug hunter.** Demonstrate failing pre-fix contract coverage at test-only commit `1303d4835217ce01359268688578f37c7e512852`, then green after the fix across memory, SQLite and fake IndexedDB; check rollback, stale and missing record responses, max-safe positive values and legitimate updates. Do not replace an unavailable local runner with a static-only conclusion. Keep heavy tests serial.
3. **Defensive security reviewer.** Source-review revision input paths, coercion and serialization, integer precision/overflow risks, record-revision authorization and caller exposure. Suggest defensive hardening where supported, without interrupted offensive reproduction follow-ups or unapproved runtime attacks. Record concrete source findings versus execution gaps.

Each completed worker should leave its evidence, source/tree identity, any confirmed fix and a next-generation handoff. The author should not self-certify independence. Qualified integration requires the final PR's exact-source gates, real independent review, compatible ancestry and active ownership checks; then merge parents in order and inspect actual merge tree and new main-push workflows. No release, deployment, force push, branch deletion, paid external API or unrelated automation changes are authorized. Credit balance is unknown; no exhaustion claim.
