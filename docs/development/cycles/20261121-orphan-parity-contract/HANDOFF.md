# ClassRup — cross-adapter bounded orphan sweep acceptance (2026-11-21 UTC)

**Draft-only implementation checkpoint, not an independent approval or release.**

## Fresh observed source and ownership

- Repository: `djshellshoxxx/CLASSifiedisRUPTed`. Main's mixed 15-production-codec encrypted restore/reopen with canonical keys, rebuilt indexes and preserved owner identity already exists in its PR #63 ancestry; do not duplicate or retroactively claim excluded attachment/delivery recovery.
- Parent: [draft #93](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/93), branch `codex/classrup-orphan-sweep-limit-admission-20261121`, live exact SHA `3d8f0b08d5e25eb8288efa778991ca8f86575cc5`; GitHub compare of this SHA to the live branch yielded **identical, 0 ahead/0 behind** immediately before fork. #93 is unchanged.
- Own isolated *remote* branch `codex/classrup-orphan-parity-contract-20261121` created at that exact parent SHA. Initial shared-contract regression commit `ff8b044554e9698cc06f3bd196e60e00b5a88f73`; added rollback contract commit `cd68704f38e31f7c64e78f3ea49a0820c38d8102`. Compare before this documentation commit: **2 ahead, 0 behind, one file** `packages/kernel/src/storage/contract-suite.ts`. Recheck the live final SHA after the documentation commit.
- PR #92 and earlier branches, the separate vault codec chain (#82–#86), PR #8, and other concurrent work were not modified. No original local-only history was imported.

## Actual change and rationale

The previous #93 regression validated invalid orphan limits on **memory only**, although the source defect involved distinct selectors in memory (`Array#slice`) and SQLite (`LIMIT ?`), with IndexedDB also using the memory driver. A new shared contract case, instantiated by `storage.contract.test.ts` against memory, Node SQLite and fake IndexedDB, qualifies the *public storage API* rather than testing selector internals.

The case puts distinct content-addressed blobs into two tenants: an old encrypted unattached P1 blob, a live held old P0 blob, a future-created P0 blob, and a foreign-tenant old P0 orphan. It asserts:
1. An attempted sweep that reports a shredded encrypted blob but returns a transaction error **rolls back**, leaving the blob readable.
2. Each of six invalid limits (`-1`, `0`, `1.5`, `NaN`, `Infinity`, `MAX_SAFE_INTEGER+1`) throws `RangeError` without destroying any blob.
3. A real `limit=1` sweep removes only the oldest eligible encrypted orphan, reports its tenant/ref for owner-side shredding, and preserves held, future, and foreign blobs.
4. The next `limit=1` sweep removes the foreign orphan without a shred notification; a third finds no eligible rows.

The selected source preserves default 100, positive safe-integer limits, cross-tenant sweep semantics, cutoff semantics, existing v1 signed/encrypted backup bytes, product limits, identities, dependency versions, and existing test timeouts. **No production behavior was changed**; this is bounded P1 adapter-parity/rollback acceptance. The test itself is not evidence of any externally callable purge authority or automatic external key deletion.

## Evidence — old and new sources kept separate

- Exact #93 published head GitHub Actions: [Alpha #44906001094](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44906001094), completed/success (plan + domain). Decoded domain job log reports **837 passed, 0 failed/pending/skipped/todo** domain assertions, **27/27 tooling passed**, and **78/78 Chromium/Firefox/WebKit journeys passed**. Its compilation/static/setup/build steps completed.
- [CLI #44906001288](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44906001288) completed/success for both Ubuntu Node 22.18.0 and Node 24; Node 24 decoded log reports **46/46 CLI tests** and dev/preview Chromium smoke, other job success. These are **parent #93**, not the new child.
- #92 exact head Alpha #44901369788 and CLI #44901369757 also now report completed/success, separate from their initial in-progress/queued states. They do **not** qualify this child.
- At this checkpoint no independent reviewer submissions exist on #93 or #92. The new contract case is **authored but not executed** in the local repository; actual new SHA hosted qualification must be retrieved after publication.
- Container `git ls-remote https://github.com/djshellshoxxx/CLASSifiedisRUPTed.git HEAD` still reports `Could not resolve host: github.com`; therefore no isolated local worktree, frozen dependency install, local pnpm/Vitest, native SQLite adapter or browser execution was performed in this invocation. GitHub source and compare operations succeed through connector access. No test result is inferred from static inspection.

Historical failed/incomplete evidence remains unchanged: November 19 full local domain runner exit 137 with no JSON report, PR #56 separate cancelled main-push Alpha #44658477772 and successful CLI #44658477821, followed by PR #57's own qualified normal merge and separate successful main-push jobs. Do not restart unchanged killed processes or queued CI without a remedy.

## Review lanes for the next **genuinely independent** workers — still pending

1. **Code auditor:** checkout *actual* live child SHA in an isolated worktree and compare with frozen #93 parent. Review chronological cutoff ordering, global/tenant scope, SQL and in-memory selector parity, `shredded()` return meaning, `ok/err` rollback, branch/prototype state, and the new test's deterministic ordering. Run pinned typecheck and audit real changes; record source/tree, exact commands, failures and a next-worker handoff.
2. **Normal functional bug hunter:** separate worktree. Serially run `corepack pnpm typecheck`, focused `packages/kernel/src/storage/storage.contract.test.ts`, then affected `memory-group-compaction.test.ts`, `sqlite.test.ts`, `indexeddb.test.ts` if resources permit. Inspect child-head hosted domain, browsers and CLI with actual counts. Where practical compare test failures on parent lacking limit guard with success on child. Distinguish real executed failures from source predictions. Leave exact evidence and fresh successor tasks.
3. **Defensive security reviewer:** source-focused check for owner/tenant authority and cross-tenant sweep accessibility, ciphertext key-shred event treatment on rollback, persistence failure, affected blob availability, batch/cutoff resource exhaustion and errors. No aggressive runtime reproduction or interrupted follow-ups. Record only demonstrated facts and any source-bound remediation needed.

The assignments are **not** completed/approved reviews; this environment does not expose a general code-worker spawn tool. Do not mark a reviewer lane complete solely because this handoff exists. Avoid concurrent heavy suites on a resource-pressured host.

## Integration and follow-on

Keep new child **draft** until its exact-source required Alpha/domain/browser + applicable CLI gates pass and three independent reviews finish. The stacked #68→#93 ancestry and separate vault chain contain many draft dependencies; consolidate only in qualified order, verifying prospective/actual merge trees and main's own push CI. A new passing child cannot qualify unreviewed ancestors.

After qualified consolidation, next genuinely unfinished P1 attachment feature requires an explicitly versioned authenticated manifest, owner authority, tested byte+reference restore/rollback, exclusion of queue/lease stores and interrupted-device validation; do not add attachments to signed/encrypted v1 by implication.

No merge, release, deployment, force push, branch deletion, workflow dispatch, paid external API, credit-exhaustion inference or unrelated automation edit in this checkpoint.
