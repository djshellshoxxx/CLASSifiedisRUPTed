# ClassRup continuation — dispose encrypted connection on registry rejection

Date: 2026-11-20 Pacific / 2026-11-21 UTC. This is a bounded child of draft PR #80. Keep the parent unchanged while its own completed hosted checks and pending independent reviews are assessed.

## Frozen remote source and ownership

- Repository: `djshellshoxxx/CLASSifiedisRUPTed`.
- Main observed: `449a619f1ae7b66cb42d9cab43dd5493bfe42c2e` (merged PR #63); its own push Alpha `44713847841` and CLI `44713847763` succeeded.
- Draft parent PR #80 head: `8919d4e66ceecf8f6ac32e5f29e38a0c5e260dc2`, tree `dcc7465da75ba064cd0ddf09043895894cb2b33f`. Its two actual current-head PR workflows succeeded: Alpha `44852381137` and CLI `44852381360`. Alpha domain job `136688901506` reported **855 passed / 0 failed / 0 pending / 0 skipped / 0 todo** domain assertions and **78 passed** Chromium/Firefox/WebKit journeys; full typecheck/static/build and tooling steps succeeded. Both Ubuntu CLI setup jobs passed. The earlier parent #79 result of 854 assertions belongs to the unmodified parent.
- At this inspection PR #80 had zero submitted GitHub reviews. Hosted success is not independent approval and the upstream #72–#79 draft stack is not qualified for automatic main integration.
- New isolated child branch `codex/classrup-openvault-init-disposal-20261120` started at that exact PR #80 commit. Production commit `09155b00f0aba73bd6945a83357aaf1a3fe169fc`; test commit `2c6340ecaa1b2d0a728eff6fafd8cfcefeb5a304`, tree `b563b5f62a2e7150516a272927ab83736d8d2525`. Re-fetch the final head/tree after this document commit; no ancestor branches were rewritten.
- Source files changed: `packages/vault/src/vault.ts` and `packages/vault/src/vault.test.ts`. No backup archive format, identity, cryptography, codec semantic, product cap, timeout, workflow, deployment or release change.

## Confirmed source-lifetime finding and repair

`openVault()` previously awaited `openEncryptedStorage()`, acquiring an IndexedDB connection and potentially an exclusive Web Lock, *before* `vaultFromStorage()` validated codec names. A malformed or duplicate registry made `vaultFromStorage()` throw, leaving the just-opened `protectedStorage.storage` connection and writer lease without a close. This is a source-proven error-path resource lifetime defect; actual end-user occurrence and production impact have not been reproduced.

The child now catches synchronous registration failure, awaits protected storage close (preserving the registration exception even if cleanup fails) and rethrows. The original class-codec method binding, registry checks and normal open/unlock/restore remain unchanged. The regression uses the real `openVault()` and fake IndexedDB with an exclusive-lock manager: it rejects both an empty-name and duplicate-name registry, then must open the same named vault with valid codecs, confirm it is uninitialized and close/release the lock. The test reuses the **existing 30-second limit**. This specifically detects the leaked writer lease; it does not prove physical-device interruption recovery or protect a different already-open writer against a rejected connection's initial writer-token claim when Web Locks are absent.

## Evidence and qualification boundary

The parent #80 hosted success above **does not qualify** this changed child. The child code and test are published GitHub source only; no child-source TypeScript/Vitest/browser test has been observed yet. The execution host could not resolve github.com for an isolated Git checkout, so neither a local worktree nor product tests could run there. A GitHub source write is not a product test. Keep the original Nov 19 full domain exit 137, older cancelled/failed runs and parent-source passes separate from this child.

Current priority: create a draft PR with this source and inspect the exact child-head Alpha/CLI jobs when actually completed. Do not rerun unchanged queues or replace failed/incomplete history. Merge only after child-head required checks, qualified ancestry and genuine independent reviews; verify actual merge tree and main-push workflows.

## Fresh distinct review assignments (not completed independent workers)

1. **Code audit:** fetch this exact remote child/head in an isolated checkout; compare the two-file diff and audit the `openEncryptedStorage()` close contract, `openIndexedDbConnection()` Web Lock release and registered-codec validation. Confirm that cleanup does not mask original errors or alter existing v1 recovery. Record exact head/tree, review notes, and whether cleanup errors should be separately surfaced without leaking vault data.
2. **Functional bug hunt:** with real pinned workspace install, run full `corepack pnpm typecheck`, `corepack pnpm test -- packages/vault/src/vault.test.ts`, and focused codec and encrypted-storage tests sequentially; then actual hosted Alpha/domain/browser and CLI gates. Check both malformed and duplicate registries and a valid positive reopen. Record exit codes, assertion totals, failed/pending/skipped cases, exact workflow/job IDs and logs; setup failures stay distinct from tests.
3. **Defensive security review:** source-only review of lease release, temporary memory/keys on failed composition, any residual writer-token replacement before rejected codec validation, authentication, tenant isolation, and error text. Hardening/review only; do not restart interrupted reproduction follow-ups. Report confirmed issues separately from plausible limitations.

Successor must read the 2026-11-19 handoff and qualification, subsequent 2026-11-20 handoffs, current remaining-work register, all newer PR ownership and this exact child source; preserve older failed/incomplete evidence and do not change any unrelated automation. The 51 historical readiness findings remain open. No release, deployment, force push, branch deletion, paid API or blind merge of draft PR #8 is authorized.
