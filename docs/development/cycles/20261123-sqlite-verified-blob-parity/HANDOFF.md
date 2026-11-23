# ClassRup — SQLite verified attachment read parity

Cycle: 2026-11-23 UTC. Repo: `djshellshoxxx/CLASSifiedisRUPTed`.

## Frozen source / ownership

Direct parent: draft PR #136 `ddccbd998db19f1f8aaa8a560593ea855705e458`, tree `6da1cfcecfe2932135c8250cb7b38ba51a2be238`; read from observed current remote branch, not an old local Git history. Proposed isolated draft child: `codex/classrup-sqlite-verified-metadata-20261123-t20`. Parent #136 was unchanged at preparation. No main or other worker branch was modified. Native `git ls-remote` cannot resolve github.com in this environment, therefore GitHub Git objects were used to create one commit from the exact parent tree. A native isolated worktree and local product execution were unavailable; do not count the setup failure as test results.

## Confirmed bounded production defect and remedy

The kernel's `blobStore.put` in `packages/kernel/src/storage/tx.ts` forbids private (`P1`/`P2`/`P3`) unencrypted blobs on SQLite relay storage. However `readVerifiedBlob` and `readVerifiedBlobBatch` previously checked only structurally valid metadata and a matching SHA-256 content address; a corrupted private-plaintext SQLite row could be returned as verified. The verified digest only covers bytes and does not establish owner authority or authenticate metadata.

The read paths now pass the adapter kind to metadata admission, rejecting private unencrypted stored rows only for SQLite. Generic `verifyStoredBlob` and browser/memory local storage semantics remain unchanged. Added a SQLite-focused integration fixture that alters an adapter read to expose this invalid stored state, checks single and batch rejection, and keeps valid P0 reads working. This is defensive hardening, **not** an attachment export, signed manifest, or end-to-end recovery implementation.

## Exact-source qualification

Parent #136: Alpha [45134312600](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/45134312600) completed success; its domain log reported 965 passed, zero failed/pending/skipped/todo, with 78 passing Chromium/Firefox/WebKit journeys. CLI [45134312599](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/45134312599) completed success for Ubuntu Node 22 and 24. These are **parent-only** gates. No independent reviews were submitted for #136.

This child: no local TypeScript, Vitest, SQLite product or browser run; native Git DNS setup failed. The new regression is **test source only** until exact-head hosted CI finishes. All earlier failed/cancelled/incomplete evidence stays preserved, including #57 local exit 137 and #56 separate cancelled main-push Alpha.

## Next fresh independent review set — assignments, not completed

1. Code audit: compare SQLite read metadata semantics with `tx.ts` blob write admission and `sqlite.ts` row decoding at this exact child SHA; check no browser/memory behavior changed; record frozen commit, tree, commands and results.
2. Functional bug hunt: run focused single/batch verified-blob integration cases across memory, SQLite and IndexedDB, then TypeScript and existing required hosted gates serially; inspect real CI logs and report separate setup/product outcomes. Test private plaintext local storage and valid encrypted private SQLite rows.
3. Source-focused defensive security review: assess tenant isolation, corrupted-row fail-closed behavior, trust in `storage.kind`, metadata-vs-byte integrity, stale sessions and missing ownership proof. Static hardening/remediation only; do not resume interrupted reproduction follow-ups.

These are not independent approvals. Do not merge until current-head required CI, genuine independent reviews and qualified ancestor integration. No weaker crypto, v1 signing, identity, product cap, test timeout, release, deployment, force push, branch deletion or unrelated automation is authorized.

## Next substantive P1 implementation

A versioned owner-authenticated attachment manifest: prove canonical parent-record ownership and signing authority before export, bind manifest metadata and canonical blob refs to owner evidence, respect the existing 32-item / 20 MiB verified batch cap, then atomically re-encrypt into the destination with rollback and encrypted reopen. Preserve v1 record-only restore compatibility. Do not wholesale merge incompatible draft #8.
