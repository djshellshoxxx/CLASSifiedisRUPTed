# ClassRup — detach persistence callback changes from indexed memory state

Checkpoint: 2026-11-21 UTC. **Draft source-and-test continuation**, not an independent worker approval, integration, release or deployment.

## Fresh remote ancestry and ownership

- Repository `djshellshoxxx/CLASSifiedisRUPTed`. Current main seen at `449a619f1ae7b66cb42d9cab43dd5493bfe42c2e`, and a GitHub compare to frozen PR #90 showed 19 commits ahead / zero behind at inspection.
- Frozen immediate parent: draft PR #90 on `codex/classrup-snapshot-index-isolation-20261121`, commit `1aba595a42136860cecb2b87fcf52476a88b9f06`. GitHub comparison of this SHA to the live branch was **identical, 0 ahead / 0 behind**, immediately before the fork.
- New remote branch `codex/classrup-persist-change-isolation-20261121`, created directly from this exact parent GitHub SHA; no local-only alias/rewritten commits were merged into it.
- Test-first commit `778116d3625fa28228c46f077c7005a367596d2d`; initial source correction `5832830e706cf635498f0c02a9e9178783a9b241`; deduplicated-final-copy refinement `affa5b7238503a525a9746675456857d5e950c9f`. This handoff is an additional documentation commit; re-read actual head/tree before any integration.
- GitHub compare after the source refinement: **3 ahead, 0 behind**; exactly `packages/kernel/src/storage/memory-driver.ts` and `tests/integration/memory-group-compaction.test.ts` changed. No main/ancestor branch or unrelated automation was changed.

## Source finding, limited repair and test-first evidence

PR #90 clones **incoming** snapshot rows before index construction. However `changesOf(state, journal)` forwarded `state.table(...).get(key)` row references to the asynchronous `opts.persist(changes)` callback. A callback retaining or altering a `Change.row` could therefore modify live in-memory row fields while its indexes still represented earlier values, or modify stored `Uint8Array` bytes. This is a source-level integrity/aliasing boundary; a mutable callback is not established as a remote attacker or production incident.

Two new integration tests were authored before source edits in the existing memory-group test file (existing timeouts unchanged):
1. A persistence callback mutates a blob-reference change row's tenant on attachment. After commit, ordinary final-holder detach must leave zero owner/foreign holders. Pre-fix source is expected to keep a stale owner bucket due to row-key/index disagreement.
2. A persistence callback mutates the first byte of a blob change row. A subsequent ordinary read must preserve the committed original bytes. Pre-fix source is expected to reflect the callback mutation.

The implementation now gathers unique changed keys in original order and `structuredClone`s each **final row only once** immediately before invoking the callback. It keeps `undefined` delete changes unchanged. This avoids repeated copies of intermediate writes to the same key and uses the row-cloning primitive already used at snapshot loading. Public APIs, persistence ordering, undo/rollback, v1 backup envelopes, signatures, identity, encryption constraints, reference keys, product limits, dependencies, workflow selection and test timeouts are unchanged.

A standalone Node 22 reduction demonstrated that live object aliasing allows a callback to change the underlying row and leave an index group stale; a second reduced check using the deduplicated clone implementation produced two unique detached changes and preserved original row/byte values. **These were not repository tests, native browser journeys or real persistent IndexedDB execution.**

## Qualification and honest limits

- Parent PR #90 exact published SHA `1aba595a42136860cecb2b87fcf52476a88b9f06`: Alpha [44891690355](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44891690355) **completed/success** with plan and domain jobs success (failure screenshot collection skipped by design); CLI [44891690375](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44891690375) **completed/success** with Ubuntu Node 22.18.0 and 24.x jobs successful. The connector summary did not establish exact assertion/browser counts for #90. These statuses qualify only the frozen parent, **not this child**.
- GitHub DNS on the local execution host still fails: `git ls-remote` yields `Could not resolve host: github.com`. Thus no local clone/worktree, pinned pnpm install, full typecheck, Vitest or browser product test ran at this source. The branch was isolated at the remote commit boundary through the GitHub connector.
- The complete 2026-11-19 local domain run exited **137 without a final report**; preserve it. PR #56's main-push Alpha `44658477772` was **cancelled**, CLI `44658477821` success, and later PR #57 passed its own separate main-push runs. Historical queued, cancelled, failed and incomplete jobs remain distinct.
- At the inspection PR #90 had **zero submitted PR reviews**. No actual independent code-audit, functional bug-hunt, or defensive security reviewer completed this new source. Do not mistake the assignments below for executed workers.

## New separately owned review lanes (PENDING)

1. **Code audit:** isolated worktree from live child SHA, diff against exact #90, inspect `changesOf`, dedup/ordering, structured-clone compatibility for all driver row kinds, commit/rollback and asynchronous persistence behavior; review memory overhead and whether any callback legitimately relies on live mutable change rows. Record source SHA/tree, commands, exact failures and a new handoff.
2. **Functional bug hunt:** independent worktree, pinned dependencies; serial `corepack pnpm typecheck`, focused `tests/integration/memory-group-compaction.test.ts`, attachment-reference persistence rollback tests, then applicable indexeddb and snapshot tests. Verify red on frozen #90 and green on child where feasible. Inspect hosted Alpha/domain/native browser and CLI exact-child jobs and retain assertions/skips/setup failures separately.
3. **Defensive security review:** source-focused on cross-tenant blob holder correctness, persisted/live state divergence, row/byte aliasing, callback trust authority, clone exceptions, writer token/rollback semantics, privacy and error channels. No interrupted reproduction follow-ups. Distinguish confirmed source invariant failures from actual exploitable trust-boundary vulnerabilities.

Each fresh lane must finish and leave exact-source evidence and handoff before marked complete. Avoid concurrent heavy suites and use the current remote head, not old documentation SHAs, for a new generation.

## Priority, merge and release boundaries

The mixed production 15-codec encrypted restore/reopen acceptance, canonical keys, rebuilding and identity retention are already in verified mainline PR #63 history: do not duplicate them. P1 attachment/reference recovery remains **diagnostic/atomic-index phases** only: authenticated versioned portable attachment manifest, authority and reference checks, whole-byte atomic restore, delivery/lease policy and interrupted-device acceptance still require separate design/implementation. Existing encrypted v1 excludes those stores.

Remain draft pending child-source hosted qualification and genuinely independent review, then qualify stacked ancestors, inspect prospective and actual merge trees and main-push runs. Do not wholesale merge incompatible draft #8, deploy, release, force push, delete branches, use paid APIs, alter older paused or unrelated automations, or infer exhausted credits from host DNS/CI queue/process exit.
