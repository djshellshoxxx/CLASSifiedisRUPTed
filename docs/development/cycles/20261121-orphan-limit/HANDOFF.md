# ClassRup — reject invalid orphan-sweep limits before storage mutations

Checkpoint: 2026-11-21 UTC. Bounded storage-lifecycle hardening, **draft-only**. No claim of product execution, independent review completion, merge or release.

## Exact source, ancestry and concurrent ownership

- Repo: `djshellshoxxx/CLASSifiedisRUPTed`.
- Live `main` was compared to the historical merged baseline `449a619f1ae7b66cb42d9cab43dd5493bfe42c2e` and returned identical (0 ahead, 0 behind) at this inspection. Main contains the prior 15-production-codec encrypted restore/reopen acceptance through PR #63; no duplicate archive tests are required.
- Frozen parent: draft **PR #92** on `codex/classrup-blob-detach-noop-20261121`, head `19d5de5eb8e9b2ed8e65a64ef0b54ee27e023c2d`; GitHub comparison against the live remote parent returned **identical, 0 ahead / 0 behind** before fork. The distinct code/test/PR #91 history and the separate vault-codec #82–#86 stack were not modified.
- Own isolated remote ref: `codex/classrup-orphan-sweep-limit-admission-20261121`, created directly from that exact parent commit. Test-first commit `6185e44eee1f16aeb31b40e5cc3609cadf43e1d3`, production correction `5adf1c19b339795a04222f8da67331eb79d1872b`. This handoff is a further docs-only commit; inspect fresh live head/tree/compare before integration.
- After two code/test commits GitHub compare showed **2 ahead, 0 behind**, and *only* `packages/kernel/src/storage/tx.ts` and `tests/integration/memory-group-compaction.test.ts` changed. No former local-only SHA history, main, parents, incompatible draft #8, other owners' branches or automations were rewritten.

## Source-level finding and change

`tx.blobs.collectOrphans(createdBefore, limit = 100)` forwarded arbitrary numeric `limit` values directly to the adapter's orphan selector, then deleted every returned blob. The shared SQLite adapter uses `LIMIT ?`; SQLite interprets `LIMIT -1` as **unlimited**. The memory adapter uses `.slice(0, limit)`; `.slice(0, -1)` selects all but the final row. Therefore an accidentally negative limit could turn a purported bounded orphan sweep into deletion of most or all eligible unattached blobs. This is a source-confirmed input-validation gap, **not** a reported production incident or unauthorized exploit.

The repair rejects non-positive, non-integral, nonfinite and unsafe-integer limits with `RangeError` **before** the adapter is called. It leaves the default batch size of 100 and **all existing valid positive safe-integer limits** untouched. It does not alter the cutoff, orphan selection, storage identity, tenant/ref keys, encryption, signature, v1 archive, signed evidence, product size limits, dependencies, CI workflows or test timeouts. Large positive safe integers remain accepted under the existing API; defining a new maximum is a separate product-policy decision, not smuggled into this correction.

New test-first focused integration coverage builds two ordinary unreferenced P0 blobs through `createMemoryStorage()`, rejects `[-1,0,1.5,NaN,Infinity,MAX_SAFE_INTEGER+1]` with `RangeError` and verifies bytes remain reachable after each rejection. Positive `limit=1` must remove exactly one, leaving one reachable. The source-level RED behavior prior to this fix is predictable for negative and fractional input; **no pre-fix repository Vitest run was executed**.

## Verification and limits

- Standalone Python `sqlite3` on a three-row ephemeral in-memory table returned **all three rows** for `SELECT ... LIMIT -1`, and just one for `LIMIT 1`. Standalone Node 22 `Array#slice(0,-1)` returned two of three sample rows versus one for `.slice(0,1)`. These are explicit SQL/JavaScript behavior demonstrations, **not executions of ClassRup source or product tests**.
- A read-only GitHub connector comparison verified the exact two-file source/test delta. Static inspection of `storage.ts` confirms callback exceptions are rethrown after rollback; inspection of `tx.ts`, `memory-driver.ts` and `sqlite.ts` shows the shared orphan entrypoint and independent selectors. Static review alone is not a successful TypeScript or Vitest test.
- Local host has Node 22 and `tsc`, but `git ls-remote https://github.com/djshellshoxxx/CLASSifiedisRUPTed.git HEAD` still failed `Could not resolve host: github.com`. No isolated **local** worktree, pinned install, project compiler, Vitest, browser or actual SQLite-adapter integration run occurred in this invocation. No new product test is claimed passed.
- Exact parent #92 hosted Alpha [44901369788](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44901369788) was **in progress** with a browser step running when inspected; CLI [44901369757](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44901369757) was **queued**. Do not call them success or substitute #91/#90/#89 historical success for this source. #92 had zero submitted GitHub reviews at inspection.
- Historical November 19 full-domain process exit **137 with no final JSON report**, PR #56 main-push Alpha cancellation and CLI success, and PR #57's subsequent qualified merge and own successful main-push jobs retain their original, separate evidence. Do not rerun unchanged killed or queued work solely to create a green headline.

## Three separately owned fresh review lanes — PENDING, not launched or approved

1. **Code audit:** in an isolated checkout at the *actual latest child SHA*, inspect `tx.blobs.collectOrphans`, memory `.slice`, SQLite `LIMIT`, cutoff/date semantics, existing callers and whether any depend on `limit=0`; compare exact parent; check typecheck and exception/rollback parity under the pinned toolchain. Determine whether an upper safe batch cap is already part of a documented requirement. Record exact tree, diff, commands/results and handoff.
2. **Normal functional bug hunt:** in a separate worktree, first run frozen install and TypeScript, then the one focused `memory-group-compaction.test.ts` file and affected blob lifecycle/SQLite-orphan tests sequentially. Where possible demonstrate RED on #92 plus the test and GREEN on current child. Verify ordinary valid bounded sweep and stable remaining refs, then inspect current-head Alpha domain/browser and applicable CLI jobs with actual assertion counts and skips. Record setup failures separately.
3. **Defensive security review:** source-only analysis of caller authority for cross-tenant orphan sweeps, accidental blob destruction, encrypted blob `shredded()` notifications, limit/cutoff exhaustion surfaces and rollback after persistence failure. Distinguish a legitimate application caller error from an externally reachable trust boundary; no interrupted security reproduction follow-ups or unsupported exploit claims.

Every lane requires a genuine separate completed review and source-specific receipt before being marked complete. No tool available to this invocation started independent engineering agents; the written scopes are future assignments, not evidence.

## Next bounded feature and integration gate

The mixed 15-codec signed/encrypted restore/reopen acceptance with canonical keys, rebuilt indexes, preserved principal and ordinary reads is already in main/PR #63 ancestry. P1 portable attachment recovery remains unfinished: separately authenticated/versioned manifest, owner authority, missing/foreign blob handling, atomic bytes+refs restore, excluded delivery/lease stores, and interrupted-device tests. The next unblocked small slice can add native SQLite/IndexedDB orphan-limit parity or exact persistence/shredding rollback acceptance, **without adding attachments to v1**.

Keep this child draft pending its **own exact-head** hosted Alpha/domain/browser and CLI qualification, three genuinely independent reviews, qualified parent-chain order, prospective/actual merge-tree comparison and post-merge main-push CI. No deployment, release, force push, branch deletion, paid API, unrelated automation edits or inferred credit exhaustion is authorized.
