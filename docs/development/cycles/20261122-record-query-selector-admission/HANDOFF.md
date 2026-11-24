# ClassRup continuation — raw record-query selector admission

Date: 2026-11-22 UTC. New isolated draft candidate; no merge or release.

## Frozen refs, ownership, and scope

- Repository: `djshellshoxxx/CLASSifiedisRUPTed`.
- Frozen parent: open draft [PR #119](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/119), branch `codex/classrup-record-query-limit-admission-20261122`, published head `6c450f267fd3d27af8ebbbb2e86c1b91995a2485`. It was rechecked before branching; neither the parent ref nor original local-only mapped history was rewritten.
- Child branch: `codex/classrup-record-query-selector-admission-20261122`, created from the exact parent commit through GitHub; no local clone/worktree was possible because `git ls-remote` still could not resolve `github.com`.
- Test-first commit: `0f66dd419a70487e4ae1883d981ab55419e146a4`, `packages/kernel/src/storage/contract-suite.ts`.
- Production repair: `47262c20d05091dc92a0d79e7911e6847d5f6f6b`, `packages/kernel/src/storage/tx.ts` (tree before this handoff `e65c492fbb18f2e993d8e61fa2a5361d993b1f4f`).
- This handoff is a separate documentation commit. Inspect its resulting final head/tree and exact-head hosted checks before qualification or review.

## Source-confirmed defect and bounded repair

The shared `tx.records.query` guard added by PR #119 validated `limit`, but accepted arbitrary runtime `orderSlot`, `filters[].slot`, `filters[].op`, `dir` and `after` fields. TypeScript's unions are not enforced for direct runtime kernel calls. The SQLite adapter dynamically constructs SQL identifiers with `col(slot) => `idx${slot}`` and interpolates comparison operators from `OPS[op]`; memory/IndexedDB instead use array indexing and JavaScript comparisons. Invalid selectors could therefore create malformed SQL or inconsistent query behavior between adapters. This is a source-level input-admission flaw, **not a claim of demonstrated SQL injection or a remote exploit**.

The shared boundary now validates order slot 0..4, direction asc/desc, an actual filters array with each slot 1..4, one of eq/lt/lte/gt/gte and primitive string values, plus the optional cursor's string ID/string-or-null value. Validation happens before calling any driver. The existing record-query limit behavior, typed repository pagination cap 1..500, storage contracts, encrypted vault, v1 wire/signature/identity, product caps and test limits are unchanged.

The new cross-adapter contract test covers 15 malformed selector/cursor cases (including sparse arrays and SQL-like selector strings), and preserves valid indexed filtering, ordered cursor reads, and simple queries for memory/SQLite/IndexedDB. The test was committed before the source fix, but **was not executed RED**; no local repository TypeScript, Vitest, full-domain, build or browser success is claimed.

## Qualification and historic evidence

- Parent PR #119 `6c450f267fd3d27af8ebbbb2e86c1b91995a2485` [Alpha 45035438867](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/45035438867) completed **success** with plan, domain/typecheck/spec/deps/registry/tooling/build/browser steps; [CLI 45035438873](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/45035438873) completed **success**, including Ubuntu Node 22.18.0 and Node 24.x clean installs. These are **parent-only** results and do not qualify this new code.
- Independent reviews on parent #119 at inspection: zero. Current child has no qualified independent review yet. Any self-review/source inspection is not an independent approval.
- Preserve PR #116 Alpha #45019120389 original **failure** (905 passed, one failed currency-concurrency assertion), even though descendant #117 passed; preserve PR #105's Firefox checkbox failure, the original complete local suite exit 137 without a final report, #56's originally cancelled main-push workflow and other failed/setup/partial runs. Do not turn these into historical passes.

## Fresh successor assignments (not executed)

1. **Independent code auditor**: freeze child final head/tree; compare only against frozen #119. Verify all selector admission paths in `recordStore.query`, `sqlite.ts recordQuerySql`, `memory-driver.ts`, typed repository pagination. Check that canonical valid filters/order/cursors and equality/range paths preserve behavior; publish an exact-source review and actual tests.
2. **Functional bug hunter**: from remote refs in isolated worktrees, run test-first commit to establish a genuine failing RED regression (avoid stressing SQL-like cases beyond ordinary unit tests), then exact repaired head to establish GREEN on memory/SQLite/fake IndexedDB; run required typecheck/spec/build/full-domain/browser/CLI serially and record executed test counts vs setup errors. Do not rerun unchanged 137-killed suites without a changed condition.
3. **Defensive security reviewer**: review SQL identifier and operator interpolation in `recordQuerySql`, any direct untyped kernel query entry points, tenant scoping, cursor admission and query-limit controls. Keep review source-focused and strictly defensive; document actual supported findings separately. No exploit or interrupted reproduction follow-up authorized.

No separate worker-launch facility was available in this run, so these are **unexecuted assignments**, not independent reviews or approvals. Leave exact evidence for new workers on the next invocation.

## Integration and next feature

Inspect actual child PR/head/tree and **current-source** Alpha/CLI workflow jobs and independent reviewer submissions. Repair confirmed failures in a separate, owned branch; do not blindly restart queued jobs or force green. Require genuine independent reviews and qualified integration of the entire draft ancestor chain before ordinary merge; verify resulting merge tree and main's separate push qualification. Other P1 unfinished work remains attachment/reference recovery, delivery/lease recovery, key rotation and interruption/device acceptance, plus existing-identity native WebKit compatibility. Do not count prior full-registry acceptance as complete device restore, or merge incompatible draft #8.

No deploy, release, force push, branch deletion, paid API, credit-balance assumption, paused-task change or unrelated automation change is authorized.
