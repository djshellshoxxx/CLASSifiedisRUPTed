# ClassRup — attachment-reference durable-persist rollback acceptance

2026-11-21 UTC · isolated bounded **test-only** P1 continuation. Not a release or proof of portable attachment recovery.

## Fresh remote ownership
- Repository: `djshellshoxxx/CLASSifiedisRUPTed`.
- Direct parent: still-open draft #68, `codex/classrup-attachment-reference-coverage-20261120`, frozen head `7a3a962400e44a3d7bb2a6834c869f97bae88ee4`. That parent is unchanged and separate from the #72–#86 stacked PWA/codec candidate branches.
- New isolated branch: `codex/classrup-reference-persist-rollback-20261121`, created from **exact GitHub parent SHA**. Test commit `b615d30bff87f29fd6229c1f02f15dcf3b11bfd7`. The GitHub compare after the test commit returned 1 ahead / 0 behind, affecting only `tests/integration/attachment-reference-coverage.test.ts`. Read actual branch head and full tree again after the documentation commit.
- `main` was previously observed at `449a619f1ae7b66cb42d9cab43dd5493bfe42c2e` (PR #63 merged). The merged mixed-production-codec encrypted restore/reopen acceptance is preserved and not reimplemented.
- PR #68's own exact-head Alpha `44768631941` and CLI `44768631914` were inspected as **completed/success**. These are the parent's results only. PR #68 had **zero submitted GitHub reviews** at this checkpoint. PR #86 head `85d6067b171e238d5a464d397eeaf5021e5c9cc5` separately passed Alpha `44873890273` and CLI `44873890208`; the decoded domain job log gives 857 passing domain assertions, 27 passing tooling tests and 78 passing Chromium/Firefox/WebKit browser journeys, and an Ubuntu CLI job reported 46 tests. The two chains have independent ownership; these qualifications do not qualify this child.

## Bounded acceptance change
Existing PR #68 integration coverage checks callback-thrown transaction rollback, duplicate attach/detach, missing refs, foreign tenant isolation and IndexedDB reopen. The remaining **failure-injection coverage** was a rejection **during the asynchronous durable persist callback**, after the journalled in-memory working set had already staged writes. Source inspection confirmed `createMemoryDriver.commit()` invokes `persist(changes)`, then `undo(state,journal)` if persist rejects; the new test verifies the tenant-to-holder index also returns to a clean state.

A single added 30-second integration case constructs `createStorage(createMemoryDriver({kind:'indexeddb',persist: ...}))`. The initial owner-and-foreign attachment transaction simulates a rejected durable write and must reject; subsequent reads require **zero** holder/reference/missing counts for both principals. A second successful transaction adds only the owner holder and checks a single missing owned reference, with foreign counts unchanged. The attempt counter distinguishes one failed persist and one successful retry. Existing production source, v1 signed/encrypted archive, signing identities, indexes' runtime semantics, product caps, workflow selection and timeout remain unchanged.

This is a *memory working-set persistence failure-injection*, **not** real IndexedDB transaction abortion, a native browser/device interruption test, an observed field regression, nor evidence for attachments being recovered in v1. No new failure is asserted for parent #68; the baseline test has not been executed.

## Verification reality and historical evidence
The source file and kernel working-set `commit` / `undo` logic were inspected via GitHub connector, and a remote GitHub comparison confirmed the single test delta. The local host could not resolve `github.com` for `git ls-remote`; no isolated **local** worktree, frozen pnpm install, local repository TypeScript/Vitest or native browser run occurred. Host CI for this **new exact child head** is required and must be inspected, including any initial failure. The earlier 2026-11-19 complete local domain runner's exit 137 and all historical failed/queued/cancelled checks retain original outcomes.

## Fresh independent review lanes — unassigned/unexecuted
1. **Code review** — own worktree from live new child remote SHA; inspect `MemoryState.write/ungroup`, journal order and `commit` rollback; ensure test deliberately reaches persist *after* staged changes and that failure restores both tenant groups. Validate no false passed assertion due to no actual writes.
2. **Functional bug hunt** — separate worktree; pinned setup, `corepack pnpm typecheck`, then target `tests/integration/attachment-reference-coverage.test.ts` serially. Inspect complete test assertion counts, no forced timeout changes, test against #68 where useful; then compare with native IndexedDB commit-failure behavior. Inspect exact-child Alpha domain, browser and CLI jobs; setup errors are not product failures.
3. **Defensive security reviewer** — source-focused assessment of holder index rollback on persist errors, cross-tenant cardinality, stale refs, overflow semantics and leakage; prohibit aggressive reproduction follow-ups. Record independently supported bugs versus unproven concerns.
Every reviewer must return actual exact-source test/inspection evidence and a new handoff before being counted complete. A checklist here is **not** three completed agents. After verified repairs, pass ownership to a new round rather than stacking unreviewed overlapping fixes.

## Remaining priorities and integration
Already implemented P1 mixed 15-codec encrypted restore/reopen with normal reader compatibility remains intact in main. This test only strengthens the unmerged P1 **read-only attachment-reference diagnostic**. No authenticated blob parent-linkage, v2 portable manifest, cross-device recovery, delivery/lease state, rotation or interrupted real device recovery is implemented. Do not fold excluded `blobs`/`blob_refs` into v1.

Keep this child and parent draft pending **current exact-head hosted checks**, independent code/functional/defensive reviews, prospective and actual merge-tree comparison and post-merge main push checks. Do not merge the incompatible PR #8, deploy, release, force-push, delete branches, use paid APIs, alter prior paused/other automations, or infer credit exhaustion from CI/DNS errors.
