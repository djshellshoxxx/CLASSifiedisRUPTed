# ClassRup — bounded attachment batch array input handoff

Date: 2026-11-23 UTC. Repository: `djshellshoxxx/CLASSifiedisRUPTed`.

## Exact source and isolation

Direct remote parent: draft PR #137, branch `codex/classrup-sqlite-verified-metadata-20261123-t20`, commit `a3b7bbe5ea3ce8f628594a44367c2411f0981c40`, tree `fb602eb2f49ad215d130e562d8178a8749db7fd6`, verified unchanged immediately before preparing this successor. Isolated child branch: `codex/classrup-batch-array-bounds-20261123-t21`. Source identity for the published child is its actual GitHub PR head; do not use stale local-only review history. Ancestor and main refs remain untouched. The hosted environment cannot resolve github.com with native Git, so no isolated native worktree or local repository test execution is claimed. GitHub's authenticated Git object API was used to publish one child commit.

## Reproduced source-level correctness finding

`readVerifiedBlobBatch` validates `Array.isArray(refs)` and `refs.length <= 32` but formerly took its snapshot with `[...refs]`. A real Array can override `Symbol.iterator` to yield extra elements or throw, so that spread could process data outside the declared bounded array length and execute an untrusted iterator. A standalone Node 22.16.0 demonstration with a zero-length Array confirmed that spread captured one iterator-supplied element while indexed copying captured zero. This is a language-semantics reproduction, not a ClassRup product test.

The correction snapshots exactly `refs.length` indexed entries in a synchronous bounded loop before the first await. It retains canonical-reference, duplicate, 32-item, 20 MiB and per-blob 5 MiB validation. One new integration test uses real memory storage and replaces the Array iterator with both a throwing getter and an empty Array yielding a hidden ref. This regression source remains **unexecuted locally** until current-head hosted CI completes. No cryptographic, identity, v1 backup, SQLite policy or timeout changes.

## Qualification and historical evidence

The parent PR #137's own Alpha [45141590153](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/45141590153) and CLI [45141590184](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/45141590184) completed success. Alpha plan/domain checks and CLI plan/Ubuntu Node 22/24 jobs all completed success, including typecheck, domain, browser and build steps. They qualify the **parent source only**. PR #137's independent GitHub reviews were zero at inspection.

The new child needs its own exact-head Alpha/CLI jobs, logs, independent reviews and qualified ancestor integration. No local pnpm/Vitest/TypeScript/browser execution occurred. Preserve original #57 exit 137 with no final domain report, #56 cancelled main-push Alpha 44658477772 (CLI 44658477821 success), and subsequent failed/incomplete workflow receipts as distinct history. Do not re-run unchanged queued CI or killed suites.

## Fresh distinct assignments (not completed worker results)

1. **Code audit:** inspect this exact child source, `verified-blob.ts`, `tx.ts`, and adapter input behavior. Verify bounded index capture and failure on holes/getters without changing storage semantics. Report exact SHA/tree and static vs executed evidence.
2. **Functional bug hunt:** execute focused verified-attachment batch/single reads against memory, SQLite and IndexedDB, then required Alpha/CLI jobs serially. Check empty arrays, sparse arrays, iterator overrides, duplicate refs and byte budget; preserve actual failures.
3. **Defensive security review:** assess untrusted Array accessors, session liveness after async hashing, tenant isolation, missing owner authentication, metadata integrity, potential budget bypass and safe failure. Review/remediate only; do not resume interrupted reproduction follow-ups.

No independent worker completion or approval is implied. Only merge after exact-source required gates and genuine independent approvals; then verify merge tree and main's own push CI.

## Next P1 product milestone

A separately versioned signed attachment manifest must authenticate the principal, canonical parent-record identity and binding to holder/ref/metadata; verify the owner authority and signing identity before access. Use the bounded verified read APIs, authenticate transport metadata, then atomically re-encrypt and import with rollback and encrypted reopen. V1 record-only exports must remain compatible. Do not blindly merge draft #8, release, deploy, force-push, delete branches or use paid APIs.
