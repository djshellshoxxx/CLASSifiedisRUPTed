# ClassRup — snapshot-row isolation before in-memory group-index rebuild

Checkpoint: 2026-11-21 UTC. This is a bounded child of draft PR #89, not a merge, a release, an approved independent review, or an attachment recovery implementation.

## Fresh source identities and ownership

- Repository: `djshellshoxxx/CLASSifiedisRUPTed`.
- Direct parent: draft PR #89, branch `codex/classrup-memory-group-compaction-20261121`, observed identical to frozen head `db300c9d7a5a7151eb7d86cdaaf0cdb22d6be87d` immediately before fork.
- Own remote branch: `codex/classrup-snapshot-index-isolation-20261121`, created from the exact parent SHA. Original prior local-only publication aliases were not merged.
- Test-first commit: `a2ec57bd0dd1990a682f21063aaca0411367c3df`. Corrected test-fixture separator: `7d17d3b23a28031ef06f572bed5ccbae8f1e3a4e`. Source remedy: `563e2c61caebc6a88c3295f9cedfb802ee1891dd`. This handoff is an additional documentation commit. Re-read the actual remote head/tree and compare the child against the frozen parent before integration.
- Changed production source: `packages/kernel/src/storage/memory-driver.ts`. Tests: `tests/integration/memory-group-compaction.test.ts`. This document adds a third path. No other source, dependencies, workflows, product caps, timeout or ancestor branches were changed.

## Source-confirmed gap and bounded remedy

`loadSnapshot(state, snapshot)` previously handed every caller-owned snapshot row directly to `MemoryState.write`, retaining the same object reference. A caller that kept its input could later change `blob_refs` `tenant` or `ref` values without updating the index established at load. When an ordinary detach then called `ungroup`, it would calculate a **different group key** from the mutated stored row and leave the original group key behind even after the row was deleted. This is a demonstrated alias/index-invariant failure path in the source and reduced Node model; no production incident or network exploit is asserted.

The minimally scoped fix clones each snapshot row with native `structuredClone` **before** writing it and constructing its group indexes. This also detaches record payload objects and binary `Uint8Array` bytes from caller-owned snapshot inputs. Normal transaction write paths, recovery v1 format, signing identity, canonical record IDs and existing byte/type/record limits are not altered. The snapshot path is already constructed from plain structured-clone-compatible rows; full adapter compatibility and memory cost nonetheless require actual checks.

Two new acceptance cases:
1. Load a principal-scoped `blob_refs` holder snapshot, mutate the original caller object to a different tenant/ref, detach the original holder, and require the original group count to reach zero. The pre-change code retains a stale group and fails the assertion.
2. Load a record and a blob containing a byte array, mutate the caller's record `data` and original bytes, and require the driver to keep the initially loaded values. The pre-change code retains the mutable aliases.

The test was written first. Its original commit accidentally contained **literal** backslash-u fixture separators, corrected in the subsequent test-only commit before source was changed; both commits remain in history as evidence. No test limit, normal function signature or public entrypoint was changed.

## Verification and historical evidence

- Standalone Node 22 reduction of the original grouping behavior showed a stale group remaining with zero stored rows after the caller mutated the shared snapshot object. A separate reduced demonstration using `structuredClone` showed zero rows and zero groups after detach. **These are not executions of the repository or native browser product.**
- Local `git ls-remote https://github.com/djshellshoxxx/CLASSifiedisRUPTed.git HEAD` still failed with `Could not resolve host: github.com`. Therefore no local worktree, frozen workspace install, full TypeScript, Vitest or browser execution was possible. This is a setup blocker, not exhausted credits.
- Parent #89 exact-head Alpha [44886536648](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44886536648) **completed/success**: decoded job log reported 831 domain assertions passed (0 failed/pending/skipped/todo), 27 tooling tests passed, and 78 Chromium/Firefox/WebKit journeys passed. Required typecheck, static and build steps completed. CLI [44886536739](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44886536739) **completed/success**, with Ubuntu Node 24.x and 22.18.0 jobs (46 CLI cases each, no skips). These results qualify **only #89**, not this changed child.
- The original November 19 complete local domain invocation exited 137 without a report; do not replace that failure with selected or subsequent hosted totals. Earlier PR #56 main-push Alpha was cancelled; its separate CLI push succeeded. PR #57 subsequently merged with separate successful main-push qualification. All historical failures, timeouts, queues and partial runs retain their own source/status.
- At this checkpoint PR #89 had no submitted GitHub reviews. No genuinely independent code auditor, functional bug hunter or defensive security reviewer has completed a review of the new source. Do not claim the assignments below are completed.

## Distinct next fresh-worker lanes

1. **Code audit — pending:** isolated worktree from actual remote child head. Compare full source to #89 and parent #88. Audit every call to `createMemoryDriver({ snapshot })` / `loadSnapshot`, structuredClone support on intended browser/Node adapters, row prototypes/Date/Uint8Array handling, snapshot load count and transient memory overhead. Verify that all store tables are clone-compatible, that duplicate keys/known indexes behave identically, and that existing transaction/undo behavior is unchanged. Record exact commit/tree, actual commands, errors and next handoff.
2. **Functional bug hunt — pending:** independent isolated worktree; install pinned dependencies, run TypeScript and `tests/integration/memory-group-compaction.test.ts` serially, confirm each new case fails with the exact pre-fix source and passes on the child, then run relevant snapshot/open-reopen and async persistence rollback tests. Inspect this child's latest-attempt hosted Alpha/domain/native browser and CLI logs for exact head; count actual assertions and skips. Keep all setup failures distinct from test results.
3. **Defensive security review — pending:** separate source-focused review of mutable snapshot aliasing, unintended cross-tenant holder accounting, binary-byte confidentiality/integrity, cloning errors, untrusted object accessors, structuredClone behavior and whether the caller-supplied snapshot is an actual application trust boundary. No interrupted security reproduction follow-ups or aggressive exploitation. Distinguish source invariants from demonstrated product vulnerabilities.

Each lane must produce an independent source-specific handoff, exact tests/evidence and successor instructions before completion is claimed. Do not spawn concurrent heavy suites on a constrained host.

## Broader P1 continuation / integration limits

The owner's original mixed **15-production-codec signed/encrypted restore/reopen** work has already been inherited by qualified mainline history through PR #63; do not duplicate it. Portable attachment recovery requires a separately versioned authenticated authority-bound manifest, real parent-ref validation, atomic ref+byte restore and native device interruption tests. Existing v1 explicitly excludes blob/ref and delivery/lease stores. The current change is **not** that portable format.

Qualify the child and stacked predecessors at their own source, obtain completed independent reviews, compare prospective merge trees, and verify actual merge tree and main's separate push checks after ordinary integration. Keep draft until those gates pass. Do not wholesale merge incompatible draft #8, deploy, release, force push, delete branches, use paid APIs, or modify paused/unrelated automations. Credits are not observable; do not infer exhaustion from CI queue, process kill or local DNS failure.
