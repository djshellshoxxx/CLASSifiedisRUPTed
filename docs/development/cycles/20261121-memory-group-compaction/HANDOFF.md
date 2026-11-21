# ClassRup — reclaim empty in-memory group index buckets

Checkpoint 2026-11-21 UTC. Bounded source/test continuation of the attachment-reference durability track. **Draft only**; not a completed independent review, merge or release.

## Fresh remote source, ownership and ancestry

- Repository: `djshellshoxxx/CLASSifiedisRUPTed`. GitHub comparison of historical merged baseline `449a619f1ae7b66cb42d9cab43dd5493bfe42c2e` against `main` was **identical** at this inspection; do not infer future immutability.
- Upstream draft PR #88 remains at `ae8d1a17be37a12300aec34b973a008f947a267a`. A fresh GitHub compare with its head branch `codex/classrup-reference-delete-persist-rollback-20261121` was **identical**, 0 ahead/0 behind, immediately before creating this child.
- New isolated remote branch `codex/classrup-memory-group-compaction-20261121`, forked from the exact PR #88 head without modifying it. Regression first: `fea340cf3e2eb1b29011d399d9af6e2aaddbd37d`. Driver correction second: `7061044ac328a5dc46de0c36f4563f0a948c627a`. This handoff is a subsequent commit; **re-read live head/tree** before all comparisons or integration.
- Review through the GitHub connector found exactly two non-documentation changes before handoff: `packages/kernel/src/storage/memory-driver.ts` and new `tests/integration/memory-group-compaction.test.ts`. No parent branch, main, another PR, or unrelated automation was modified. Stacked vault PRs #79–#86 have separate ownership.

## Source-confirmed group-retention defect and correction

The in-memory working-set `MemoryState.ungroup` deleted a row key from `groups.get(k(table,group))` but **never deleted the group's map entry when its Set became empty**. The driver supports `records`, `inbox` and `blob_refs` groups. A long-lived instance creating and deleting many distinct groups therefore accumulates empty group keys without live rows. This is a source-observed retention gap, **not** a measured field incident or verified denial-of-service. It is adjacent to PR #87/#88 index-rollback acceptance and their bounded reference-coverage reads.

The correction deletes the map entry when the last group member is removed. It preserves other groups and the independent `blobRefKeysByTenant` cleanup, and uses the same write/undo paths during asynchronous persistence rejection. The internal `MemoryState` class is exported **only from its implementation module** to allow focused deterministic invariants in a new direct-import test; the package entrypoint/API is unchanged.

A new test file (two cases, authored **not yet executed**) verifies: two owner holders share one group while a foreign tenant has a distinct group; partial detach retains the live group; final detach removes only the empty group; reattachment recreates it; and 128 rounds of unique record/inbox/blob-reference group churn leave neither empty group entries nor tenant-index buckets. This is intentionally a deterministic map-size test, not a heap-size benchmark.

No change to encrypted v1 archive/signatures, owner identity, cryptography, record canonical IDs, user-facing APIs, IndexedDB persistence protocol, product limits, test timeouts, dependency locks or workflow selection.

## Verified qualification and limits

- **Parent PR #88** at `ae8d1a17be37a12300aec34b973a008f947a267a`: Alpha [44882155741](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44882155741) **completed/success**, and CLI [44882155817](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44882155817) **completed/success** with Ubuntu Node 22.18.0 and 24.x jobs successful. The decoded Alpha domain job log explicitly reported **829 passed, 0 failed/pending/skipped/todo**, and **26 Chromium browser journeys passed**. These numbers belong solely to parent #88 and do **not** qualify this changed child.
- The complete local November 19 domain suite died with **exit 137 and no final JSON report**. Historical failed, cancelled, queued or partial runs keep their original status and are not overwritten by later independent successes. PR #56 main-push Alpha [44658477772](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44658477772) was cancelled while CLI [44658477821](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44658477821) succeeded; PR #57 later merged and its own main-push checks were successful separately.
- Local `git ls-remote` still failed with `Could not resolve host: github.com`. No isolated **local** checkout, pinned `pnpm` install, TypeScript build, Vitest execution, native browser/IndexedDB abort test, or field-device performance benchmark was possible in this invocation. The remote branch was created from a frozen GitHub commit. No child-head CI outcome is claimed yet.
- No genuine independent code-audit, functional bug-hunt or security worker was launched or completed on this child. Source inspection is static evidence, not executed product tests.

## Fresh independent review generation — all pending

1. **Code auditor**: in a distinct local worktree from the actual live child SHA, inspect `MemoryState.write` / `ungroup` / `groupSet`, `loadSnapshot`, reverse `undo`, and class export. Verify no grouping collision/correctness, live-index handles or snapshot compatibility regression; compare exact parent diff, tree, and test outcomes. Check whether direct test access to the internal class violates repo boundaries. Leave exact source, commands, evidence and next worker handoff.
2. **Functional bug hunter**: use an isolated pinned checkout. Run typecheck then `tests/integration/memory-group-compaction.test.ts` sequentially; where feasible prove the new tests fail at the frozen PR #88 parent (after only test adaptation), then pass at the child. Run existing attachment/reference lifecycle and journal rollback cases serially, then inspect this child's hosted Alpha/domain/browser and CLI logs. Record counts, setup failures and native adapter limits separately. Preserve resource-pressured host (no parallel heavy suites).
3. **Defensive security reviewer**: static defensive review of whether unbounded unique caller-supplied group names can cause meaningful resource retention; index isolation, empty-set lifetime, rollback after failed persistence, tenant boundaries, error channels and whether the internal class export creates a new trust boundary. No interrupted reproduction follow-ups, aggressive exploitation or unsupported severity claims.

Each lane requires an actual independent result and frozen-source handoff before marked complete. Merely assigning these scopes does **not** count as execution. The next generation should start fresh from remote refs and preserve every original incomplete/failed run.

## Next feature and gates

Mixed production-codec encrypted restore/reopen with canonical keys/indexes and identity preservation is already on main through merged PR #63. The next unimplemented P1 backup slice requires carefully scoped **versioned authenticated attachment manifest** design, authority/cross-tenant admission, atomic restore of refs+bytes, device interruption/retry, and explicit exclusion of `blobs`/`blob_refs` from existing v1. Do not equate diagnostics or journal rollback with portable attachment recovery; do not duplicate the previous 15-codec acceptance or wholesale merge incompatible draft #8.

Keep this child and PR #88/#87/#68 **draft** until exact-head required hosted qualification, independent reviews, qualified ancestor ordering, verified prospective/actual merge trees and main-push qualification all pass. No merge, release, deployment, force push, branch deletion, paid API, unrelated automation change, or claim of exhausted credits is permitted without separately supported evidence.
