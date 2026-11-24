# ClassRup — encrypted IndexedDB abort qualification (2026-11-23)

## Exact ancestry and scope
- Frozen direct parent: draft PR #152, commit `1136069ba8c8cf8f4eb708c53afb518c679befb0`, branch `codex/classrup-owner-retirement-persist-rollback-20261123-t35`.
- Prior parent PRs #150–#151 remain owned by their respective branches. Observed `main` at `449a619f1ae7b66cb42d9cab43dd5493bfe42c2e`; no ancestor or main edits.
- New isolated child: `codex/classrup-owner-retirement-idb-abort-20261123-t36`; test-only change to `tests/integration/attachment-owner-retirement-idb-abort.test.ts`. No runtime, cryptographic, signing, storage-format, retention-policy, or cap changes.

## Acceptance regression source
- Seed two real canonical P0 attachment references in a signed-record source vault; produce v1 encrypted record backup and separately authenticated manifest.
- Restore into a new encrypted IndexedDB vault using `fake-indexeddb`. Seed one existing retained blob, a stale managed holder, and an unknown external holder; leave the second expected blob absent.
- On the import under test, intercept only an IDB object-store `blob_refs` deletion and invoke `IDBTransaction.abort()`. This exercises a real fake-indexeddb transaction abort rather than throwing from the memory driver's persist callback.
- Require import rejection; assert exact working-set snapshot; close and unlock the encrypted database again, require identical retained/missing blobs and reference coverage; probe holder identity via intentionally rejected transactions; then retry and verify retained/new bytes and exact holder identities.
- Restore the global fake-IDB method in a `finally` block. Test is intentionally scoped to fake-indexeddb and does **not** claim a native Chromium/Firefox/WebKit hardware or power-failure test.

## Qualification status
Parent #152 exact-head Alpha run 45283496935 and CLI run 45283496989 completed successfully; this **does not** qualify this child. Source submitted without native worktree execution because `git ls-remote` cannot resolve github.com in the available container. New head must pass its own typecheck, domain/integration, build and browser/CLI checks, followed by an independent review. Treat any cancelled browser job as inconclusive rather than passing. No independent review is claimed.

## Required follow-up
1. Verify the child PR head/base and both hosted CI workflows, including actual test counts. If failure, reproduce from logs and repair only this child in a new commit.
2. Independent code audit of the fake-indexeddb `IDBObjectStore.prototype.delete` interception, transaction-abort timing, cleanup and failure oracle; confirm test fails if rollback behavior is broken.
3. Independently qualify ancestor stack in order, resolve cancelled Alpha of #150 by observed evidence, and review real browser IDB failure coverage separately.
4. Do not merge until dependency/ownership, exact-head CI and independent review gates are satisfied. No release, deployment, force push, branch deletion, or final-holder purge.
