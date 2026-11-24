# ClassRup — single-blob read snapshot handoff

Date: 2026-11-23 UTC. Repository: djshellshoxxx/CLASSifiedisRUPTed.

## Frozen source and ownership
Parent: draft PR #133, observed remote head `f74564a12376efa44ad23fb348ad6c7dea0744c7`, tree `a74895bd0e520f736162a32fff92369ed53a90e5`. Independent reviews on #133: none observed. Child branch: `codex/classrup-verified-single-read-snapshot-20261123-t17`, created directly from its published GitHub commit; no unpublished local commits merged and no ancestor updated. Recheck current remote head and other worker ownership before any follow-on edits.

Git worktree and local repository tests are unavailable on this host because `git ls-remote` failed with `Could not resolve host: github.com` (exit 128). Authenticated GitHub file reads / Git object writes were used. Do not describe static checks as executed product tests.

## Source-confirmed correction
The existing `readVerifiedBlob` returned an adapter-owned `MediaBlob` from `storage.read` and only copied and hashed its bytes after the transaction settled. The new sibling `readVerifiedBlobBatch` already captures bytes inside the transaction. Single-blob reads now capture declared scalar metadata and copy byte views synchronously inside the read transaction, with size/ref admission before transaction settlement, then perform SHA-256 verification outside the lock. Missing blobs still return undefined; malformed or corrupt blobs fail closed.

A new three-adapter regression (memory, SQLite, fake IndexedDB) simulates invalidation of a returned byte view immediately after read callback completion. Original implementation would hash the invalidated view. The new implementation retains a detached validated snapshot, with no writes or changes to existing v1 signed backup format, signing identities, encryption requirements, 5 MiB blob cap, batch limits, or test timeouts.

## Current qualification
Parent PR #133 Alpha `45114101513` and CLI `45114101477` both completed successfully, with actual successful domain/typecheck/static/build/browser and Ubuntu Node 22/24 jobs. They qualify only the **parent source**, not this child. Child exact-head hosted CI and genuine independent reviews must complete before any merge. This run did not execute new tests locally. Preserve historic failures and incomplete gates: #57 local full domain runner exit 137 without final report; #56 cancelled main-push Alpha; #120 Firefox; #116/#105 and #126 compiler/fixture failures.

## Distinct fresh reviewer handoffs — not approvals
- Code audit worker: freeze child's actual SHA/tree; compare single-blob and batch snapshot paths, transaction lifetime, allocation count, byte admission, branch ancestry; run focused typecheck on a properly provisioned host.
- Functional bug-hunt worker: run the specific single-blob integration suite serially on memory/SQLite/IndexedDB, confirm simulated invalidation regression, missing/not-found and corrupt ref behavior; also run batch suite for compatibility. Record source SHA, counts, and actual failure logs.
- Defensive security-review worker: static/source review only. Verify tenant scoping, post-await vault session obligations, source-byte integrity, unverifiable blob metadata, encryption and parent-record ownership gaps; remediate confirmed issues without exploit reproduction follow-ups.

No independent worker was available through this execution environment; do not infer approval from these briefs.

## Next bounded P1 work
Implement a separately versioned owner-authenticated attachment manifest tied to canonical parent-record evidence and signing authority; then bounded payload import, atomic destination re-encryption / rollback and encrypted reopen. Holder strings are not owner evidence. No PR integration until exact-source CI, independent review and qualified ancestor chain; main-push qualification must follow any actual merge. No release, deployment, branch deletion, force push, paid APIs or unrelated automation changes.
