# Independent storage review — generation 3

**Decision: no blocking finding in the bounded storage reference-isolation repair.**

Reviewed on November 20, 2026 (UTC) in the November 19 development cycle. This is
an independent review of the frozen repair, not qualification of a later combined
candidate or a release.

## Pinned source and scope

- Baseline: `30526fb2745e8d6e2bb15efae5b8106bcdcf53d0`.
- Frozen source: `085aa1e4f10184e3dd549d5577e2415b92ee77f1`.
- Author handoff/tip: `a0bd061a14182f0ba8d7c96d6190a06dd2d0a99b`.
- Review branch: `codex/classrup-storage-review-g3-20261119`.
- Isolated worktree: `classrup-storage-review-g3`, created at the author tip.

The review compared `30526fb...a0bd061`. The intervening commits are the source
repair `085aa1e` and documentation-only handoff `a0bd061`. The two reviewed source
files are unchanged between those commits:

- [`tx.ts`](../../../../packages/kernel/src/storage/tx.ts): copies for
  `recordStore.put`, `recordStore.restore`, and `migrationStore.insert/list`.
- [`storage.reference-isolation.test.ts`](../../../../packages/kernel/src/storage/storage.reference-isolation.test.ts):
  12 parameterized regression cases across memory, fake IndexedDB and SQLite.

The driver implementations, transaction wrapper, migration runner, shared
contract tests and relevant contracts were read to assess those changes. This
review changes no production source, package tests or dependency versions.

## Standards

**No documented-standard violation or actionable smell-baseline finding.**

The patch is consistent with the Developer Guide's
[contribution and release evidence](../../../wiki/Developer-Guide.md#contribution-and-release-evidence)
requirements for bounded changes, focused regression coverage and pinned source.
The four explicit index assignments preserve the fixed tuple shape in
[`IndexValues`](../../../../packages/kernel/src/storage/driver.ts). The migration
helper copies precisely the three declared scalar fields. Neither boundary needs
a general deep-cloning dependency or a broader refactor to satisfy this repair.

The added cases use fresh adapter instances and close them in `finally`, matching
the storage tests' local style. They exercise observable query and migration
results rather than relying on internal object identity alone.

## Spec and correctness

**No missing, incorrect or out-of-scope behavior found for the requested repair.**

| Boundary | Finding and preserved behavior |
|---|---|
| `records.put` | A fresh tuple receives the same four primitive string/null values before the driver write. Retained caller arrays cannot alter query membership or ordering afterward. Revision validation, CAS failure details, revision increment, JSON conversion and timestamp rules are unchanged. This preserves [IDM-2](../../../../planning/contracts/CTR-IDM-001.md). |
| `records.restore` | The absent-record path copies the tuple while retaining the imported revision and timestamps. Existing-record checks still compare revision and JSON data, returning `identical` or `CONFLICT_REVISION` before any write. An identical restore still leaves existing indexes alone, preserving the prior collision behavior associated with [IOX-2](../../../../planning/contracts/CTR-IOX-001.md). |
| `migrations.insert` | The driver receives a new object containing `id`, `checksum` and `appliedAt`. Mutating the caller's row cannot change its stored identity, checksum or chronology. All declared fields are primitive strings, so the explicit shallow copy covers the declared row model. |
| `migrations.list` | Each returned row is newly allocated. Altering a listed row, including during a throwing read callback or after that read ends, cannot mutate storage. `map` preserves the driver's existing order: `appliedAt`, then ID. |
| Adapter composition | The memory driver's retained row references, also used for IndexedDB's working set and persistence changes, now receive detached inputs. SQLite continues binding the same scalar values and returning the same values. No query comparator, SQL, schema, transaction-lifetime code or driver interface changed. |
| Migration workflow | The forward-only runner still records completed steps once, skips already recorded IDs, rejects duplicate IDs supplied to the runner, and rolls back failed steps. The [SCH-5](../../../../planning/contracts/CTR-SCH-001.md) bookkeeping path is preserved. SQLite schema checksum-drift checking still uses its existing direct SQL path. |

The original regression file covers both record write paths and migration input
and output boundaries. Its record assertions concentrate on slot 1. The reviewer
probe adds behavioral checks of all four slots, null exclusion, ID tie-breaking,
ascending/descending order and cursor positions. It also checks a successful
update followed by stale-CAS rejection, restore idempotency/conflicts, migration
chronology, repeated migration execution and failed-step rollback on each adapter.

The patch does not alter the baseline's `records.listTypes` method or generation
1 blob-snapshot implementation; both remain outside the changed hunks.

## Independently executed validation

All commands ran in the isolated review worktree on the pinned source, with Node
`v24.22.3`. No full suite, full typecheck or browser test was run.

| Invocation | Observed result |
|---|---|
| `node node_modules/vitest/vitest.mjs run packages/kernel/src/storage/storage.reference-isolation.test.ts --maxWorkers=1` | **12 passed**, 0 failed; one test file, 2.61 seconds. This is a rerun of cases included in the author's 73-test invocation. |
| `node docs/development/cycles/20261119/evidence/storage-review-g3.probe.mjs` | Three adapter scenarios passed: memory, fake IndexedDB and SQLite. These are reviewer probes, not additional Vitest test cases. |
| `node node_modules/vitest/vitest.mjs run packages/kernel/src/storage/sqlite.test.ts -t TEST-PS-119-09.T14 --maxWorkers=1` | **1 passed; 3 excluded by the explicit name filter**. One file, 2.10 seconds. The selected test includes SQLite checksum-drift refusal and data-migration workflow checks. |
| `corepack pnpm install --offline --frozen-lockfile --ignore-scripts` | Passed; all 55 packages reused locally, no downloads, dependency or lockfile changes. |
| `git diff --cached --check` | Passed before the review commit. |

The first migration-test invocation failed during import because the newly
created worktree had no local kernel dependency link for `zod`; **no tests were
collected or executed**. The worktree then received its own frozen offline
dependency installation and the identical filtered command passed. That setup
failure is preserved separately and is not reported as a failed behavior test.
The earlier reference-isolation rerun and reviewer probe used the author's
already-installed dependencies without changing source or dependency versions.

Evidence retained with this review:

- [Reviewer probe source](evidence/storage-review-g3.probe.mjs).
- [Reviewer probe output](evidence/storage-review-g3-probe.log.gz).
- [Initial migration-test setup failure](evidence/storage-review-g3-migrations-setup-failure.log.gz).
- [Successful migration-test rerun](evidence/storage-review-g3-migrations.log.gz).

The output archives preserve the captured bytes, including the runner's terminal
blank lines; compression also keeps those lines out of Markdown/source whitespace
checks.

The author's [validation record](evidence/code-audit-g2-validation.json) separately
reports **8 failed / 4 passed** on the original production source, **73 passed**
on the fixed overlapping storage suites, and **1 passed / 3 name-filter
exclusions** in its migration invocation. This review does not add its reruns to
those counts or claim that the 73-test invocation was independently repeated.

## Limits and integration handoff

The review establishes no blocker for these four public-boundary copies. It
does not establish native-browser behavior, encrypted-vault recovery, persistence
after reopening an IndexedDB database, performance, full TypeScript compatibility
or complete-suite qualification. SQLite uses the actual Node SQLite adapter; the
cross-adapter probes use an in-memory SQLite database. The separate filtered
migration test also exercises a temporary file-backed SQLite database and its
startup checksum check.

The declared input/output row model and existing trusted driver boundaries are
the review scope. The final integrator should preserve the source pin and run
the appropriate combined-candidate gates after integration. No code change is
requested by this review. This reviewer did not push, merge or modify another
worktree's source files.

Standards findings: **0**. Spec/correctness findings: **0**. No blocking issue in
either axis within the stated scope and validation limits.
