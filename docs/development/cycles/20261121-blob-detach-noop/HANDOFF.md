# ClassRup — preserve unattached blob on no-op holder detach

Checkpoint: 2026-11-21 UTC. Bounded P1 attachment-lifecycle continuation. **Draft, not a release, independent-review approval or integration.**

## Fresh remote source and ownership

- Repository: `djshellshoxxx/CLASSifiedisRUPTed`; main last observed `449a619f1ae7b66cb42d9cab43dd5493bfe42c2e` (PR #63 merged), with #57 previously merged and its later main-push success separately documented.
- Immediate parent: draft PR #91 `codex/classrup-persist-change-isolation-20261121`, **live verified identical** to published `8f1a364314411cd6d2a9c3062c4a58a1c66a0cc2` (remote compare 0 ahead/0 behind). Its reviewer work is pending, and its branch was not modified.
- New remote child: `codex/classrup-blob-detach-noop-20261121`, forked at that exact parent commit; test-first `d21be03d243901a8fd171bfedc8f51ce9d6a813a`; production correction `0be22e416f415ea00af860f7d389792e57b592e7`. At two commits, compare showed 2 ahead/0 behind and exactly `tests/integration/memory-group-compaction.test.ts` and `packages/kernel/src/storage/tx.ts`. This handoff is a subsequent docs-only commit: inspect fresh head, ancestry, and tree before integration.
- This does not rewrite or consolidate original local-only SHAs. Draft #8, other stacked candidates, main and unrelated automations are untouched.

## Source-confirmed lifetime issue

`blobStore.detach(tenant, ref, holder)` in `packages/kernel/src/storage/tx.ts` unconditionally attempted holder detach, then deleted any existing blob once `holders(tenant,ref)` was zero. If a blob was freshly uploaded but **never attached**, or otherwise had zero holders, an idempotent detach for a **nonexistent holder** deleted the blob even though no reference transition occurred. This is an observable source-level correctness/data-availability gap; there is **no demonstrated field incident, unauthorized actor, or security exploit**. It also bypasses the separate orphan-collection path's time predicate.

The bounded repair reads the pre-detach count, performs the existing detach, and only permits last-holder blob deletion if there **was at least one holder before detachment** and none remain afterward. Existing genuine final-holder deletion and encrypted shredding request semantics remain unchanged. This does not change ref hashing, bytes, encryption, signing identities, backup v1, tenant authority, product caps, dependencies, CI selection or timeouts.

## Test-first regression and evidence

A focused integration case, authored and published **before the production edit**, uses the normal `createMemoryStorage()` transaction API to put a real content-addressed blob with zero holders. A nonexistent-holder detach must return `{deleted:false,shred:false}` and preserve the original bytes; subsequently attaching and detaching a real final holder must delete the blob normally. The existing per-test timeout was not altered. On source inspection the previous implementation violates the first expectation. This is a source-derived RED prediction, **not an executed failing Vitest case**.

Standalone Node 22 behavioral reduction (not the repository's production code) returned:
- Previous logic: nonexistent detach reported `deleted:true`, blob bytes lost; later actual-holder detach could no longer delete it.
- Candidate guard: nonexistent detach reported `deleted:false`, bytes retained; real final-holder detach reported `deleted:true`.

Local `git ls-remote` still failed `Could not resolve host: github.com`, so no local isolated worktree, pinned pnpm install, repository typecheck, Vitest, or actual browser tests were executed. The branch was isolated via GitHub commit-SHA ref creation and source-file APIs. This continuation executed **no genuinely independent review worker**.

## Exact parent #91 qualification (not transferable)

At exact `8f1a364314411cd6d2a9c3062c4a58a1c66a0cc2`, GitHub returned completed/success:
- Alpha [44896458949](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44896458949): `plan` and `domain` success. Decoded domain job reported 835 passed, zero failed/pending/skipped/todo; tooling 27, zero skipped; 78 Chromium/Firefox/WebKit browser journeys passed, one worker. Typecheck/static/setup/build steps successful.
- CLI [44896458966](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44896458966): plan and Ubuntu Node 24 and 22.18.0 jobs success, each with 46 CLI tests, zero skipped, and dev/preview Chromium smoke.
- #91 still had zero submitted reviews at this checkpoint; successful CI is not a replacement for review.
- The original November 19 full local domain run's exit 137 remains **incomplete**, not retroactively passed. PR #56 main-push Alpha `44658477772` was cancelled while CLI `44658477821` succeeded; PR #57 separately qualified and merged. Preserve all historical failures, queues and interruptions in their original sources.

## New genuinely separate review lanes — all pending

1. **Code auditor:** isolated checkout of live child head and frozen #91 parent; review pre-/post-holder-count semantics, missing holders vs real last-holder transition, changes in encrypted shredding requests and orphan collection, rollback behavior, adapter parity across memory/IndexedDB/SQLite, and whether a legitimate API expects no-op detach to be an explicit orphan purge. Record exact SHA/tree, commands, inspected contracts, findings and a new handoff.
2. **Functional bug hunter:** separate isolated checkout, pinned install; serial `corepack pnpm typecheck`, targeted `tests/integration/memory-group-compaction.test.ts`, existing blob/attachment rollback cases and fake-IndexedDB as applicable. Demonstrate RED on prior #91 and GREEN on this child where feasible, including successful actual final-holder deletion and encrypted shred path. Inspect *child exact-head* Alpha/browser/CLI jobs and their logs. Distinguish executed assertions from source predictions.
3. **Defensive security reviewer:** source-only threat-boundary review for per-tenant blob authority, accidental loss of unattached media, stale references, decrypt/shred side effects and timing, and whether an untrusted caller could invoke detach for another owner. Treat theoretical paths and demonstrated source invariants separately; no interrupted reproduction follow-ups.

Every reviewer must finish with a new source-specific evidence receipt, findings and instructions for a fresh successor; the assignments are **not** claimed as launched/completed agent work. Keep heavy tests sequential on a constrained host.

## Future feature, consolidation and stop conditions

The previously requested 15-codec encrypted restore/reopen acceptance with canonical keys, rebuilt indexes, unchanged signing identity and ordinary readers is already present in verified main/PR #63 history; don't duplicate it. P1 attachment recovery is still limited to diagnostic/index and isolated lifecycle work. A versioned authenticated attachment manifest, whole-byte recovery, backup exclusions, lease/delivery policy and interrupted-device acceptance remain unfinished. The follow-on unblocked step should examine orphan/retention and last-holder deletion consistency across adapters without changing the signed/encrypted v1 archive.

This candidate must remain draft until **its own** Alpha/domain/browser and applicable CLI jobs succeed and independent code/bug/defensive reviews complete. Qualify its stacked ancestors in order and verify prospective and actual merge trees and separate main-push CI before any normal integration. No release, deployment, forced push, branch deletion, paid API, wholesale draft #8 merge, unrelated automation change, or inferred credit exhaustion is authorized.
