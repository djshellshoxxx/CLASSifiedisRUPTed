# ClassRup — bounded verified attachment batch handoff

Date: 2026-11-23 UTC. Repository: djshellshoxxx/CLASSifiedisRUPTed.

## Source, parent and ownership
Frozen parent: draft PR #132 at remote head 004e9bc440b1d99380d5f87c0c3595a37ba3deb6, tree 199f788cbd73b7ff6844e0e07eca41a1935aaaac. Child branch: codex/classrup-verified-attachment-batch-20261123-t16, created from that GitHub commit. No original unpublished local-only history merged; no parent branch modified. At inspection #132 had no independent reviews, review threads, or distinct active file ownership claim. Recheck actual remote child head/tree and other workers before any further changes or integration.

Local isolated worktree was unavailable: git ls-remote failed due DNS resolution of github.com. Authenticated GitHub Git objects were used to publish this change. No local typecheck, Vitest, or browser run is claimed.

## Production progress and acceptance
Introduced readVerifiedBlobBatch and kernel public export. Takes a snapshot of input refs before any asynchronous storage work, requires distinct canonical SHA-256 refs and at most 32 items, performs one tenant-scoped read transaction, and enforces an independent 20 MiB aggregate byte limit (with optional smaller caller budget). It copies bounded byte buffers before transaction settlement, then verifies every detached blob outside the transaction. Missing/corrupt/over-budget sets reject all-or-nothing. No persistent writes.

Added a three-adapter integration test for memory, SQLite and fake IndexedDB. Scenarios cover correct reads, caller-array mutation, detached bytes, tenant isolation, missing refs, malformed refs, duplicates, oversized item count, smaller byte budget and an empty set. Test source is published but not locally executed; it is not a qualified passing test until exact-head CI actually passes.

This is only a bounded transport READ prerequisite. No signed attachment manifest, parent ownership proof, session-liveness assurance, crypto decryption, destination re-encryption, or portable restore. Holder labels are not owner authority. Blob digest covers stored ciphertext when encrypted, not unverified metadata. Existing signed v1 archives, signing identities, encryption constraints, 5 MiB per-blob cap, other product limits, and test timeouts are unchanged.

## Qualification and historical evidence
Parent #132 exact-head Alpha 45108782786 and CLI 45108782792 both completed success; Alpha plan/domain (typecheck, static, tooling, domain, build, browser) and CLI plan/Ubuntu Node 22/24 passed. This qualifies only #132, not the child. This candidate requires its own current-head Alpha/CLI plus genuinely independent reviews. Do not merge based on ancestor results.

Preserve all historical failed/incomplete runs, including #57 complete local domain exit 137 without JSON report; #56 separate main-push Alpha cancelled / CLI success; #120 Firefox, #116/#105 and #126 compiler/fixture failures. Do not rerun unchanged historical jobs or call static inspection executed tests.

## Successive fresh workers — distinct assignments, NOT completed
1. Code audit: freeze exact remote SHA/tree, inspect index public types, batch snapshot and adapter get contracts, aggregate accounting and empty/error paths; execute focused typecheck/test only on a host with dependencies and record exact commands/results.
2. Functional bug hunt: run three-adapter integration serially, check caller-input mutation, stable snapshot under an interleaved write, duplicates/noncanonical refs, missing/corrupt bytes, all-or-nothing and resource thresholds; record actual assertion counts, SHA and failures.
3. Defensive source security review: confirm tenant scoping, byte-hash versus metadata authenticity, session liveness after awaits, reference ownership versus holder labels, aggregate buffers and subsequent ciphertext re-encryption requirements. Review/remediate only; do not resume interrupted exploit follow-ups.

No separate workers were launchable within this invocation; these briefs are not approvals.

## Next bounded milestone
Establish parent-record ownership from authenticated canonical codec data and a separately versioned, signed attachment manifest. Only then implement bounded binary transport, atomic receiver re-encryption, rollback, encrypted reopen and compatibility assertions. Keep all ancestors and this PR draft pending exact-source qualification and genuine independent review. For qualified future merges, inspect actual merge tree and separate main-push workflows. No release, deployment, force push, branch deletion, paid API, or unrelated/paused automation changes.
