# ClassRup — verified attachment byte reads (bounded P1 recovery prerequisite)

Date: 2026-11-23 UTC. Repository: `djshellshoxxx/CLASSifiedisRUPTed`.

## Exact ancestry and ownership
- Frozen observed parent: draft PR #130, `codex/classrup-canonical-blobrefs-20261123-t13`, head `1136240328913e5cdd8e2325df53cd02e70bf2de`. This is **not** the November 19 initial PR #57 head.
- Isolated child branch: `codex/classrup-verified-attachment-read-20261123-t14`, based on the above parent, without rewriting or merging local-only histories.
- Implementation commit `48d71afbfdad21de7dac0cceb4dfe10eb03c0e56`; integration regression `c080d729da0f723ff75cafca771b3e6795d8e7ac`; kernel public export `fa9508fac66e81380daf1067a1920dc39f69c103`. Re-resolve the published PR head/tree before qualification or integration.
- 69 open PRs were observed during reconnaissance, including a long sequential draft stack #72–#130. PR #130's submitted GitHub review list was empty. Do not merge this child or ancestors until their independent reviews and exact-current-source gates are met. No active independent worker identity was verified.

## Parent qualification, preserved failures
PR #130 at its exact observed head completed Alpha workflow [45097224629](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/45097224629) and CLI [45097224656](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/45097224656) with overall **success**. Alpha plan/domain and CLI plan/Ubuntu Node 22.18.0 and 24.x jobs individually returned success. These are **parent-only** gates, not a substitute for this child's CI.

Preserve all prior evidence: initial #57 queued runs 44663370115 and 44663370114 at initial publication, its complete local runner exit 137 with no final report, #56 cancelled main-push Alpha 44658477772 and successful CLI 44658477821, #120 Firefox failure, #116/#105 failures, #126 compiler failure 45074487619 and fixture initialization failure 45074614282. Do not relabel failed, queued, partial or killed runs as passing.

## Implemented bounded production prerequisite
- New `packages/kernel/src/storage/verified-blob.ts` exposes `verifyStoredBlob` and `readVerifiedBlob` through the kernel index.
- Canonical SHA-256 address and stored byte-count checks fail closed on malformed ref, corrupted contents, incorrect declared size or over-limit bytes. A valid tenant-scoped read produces a fresh detached byte snapshot. Missing blobs return `undefined`; corrupted present blobs throw a generic integrity error.
- Verification hashes **stored bytes** (ciphertext where stored encrypted). This is not a claim that ciphertext is decryptable or that holder labels authenticate parent-record ownership.
- Hashing occurs after the bounded storage read completes, rather than continuing adapter operations across an asynchronous crypto hash. For unlocked vault use, callers must independently check session liveness after the await.
- New `tests/integration/verified-attachment-blob-read.test.ts` covers memory, fake IndexedDB, and SQLite: correct bytes, tenant isolation, missing addresses, malformed addresses, bytes/size tampering, and read snapshot isolation.
- Existing v1 signed backup, principal and signing keys, encryption format, blob-size cap (5 MiB), registry/type limits, timeouts and browser selection are unchanged. This does not implement attachment export, portable manifest, atomic import or owner authorization.

## Qualification, independently reviewed status
- No local repository suite or browser tests executed: the run host cannot resolve `github.com` for a local git checkout. Static source inspection and test source creation are **not** executed product test results.
- The child must complete its exact-head hosted Alpha (including the new three-adapter integration test) and CLI Node matrix. Inspect job-level evidence and preserve any failure as failed.
- No distinct independent code-audit, normal functional bug-hunt or defensive security-review worker was available through the tools in this invocation. Their reviews, findings and approvals are **pending**, not completed.

## Fresh successor worker briefs (unexecuted assignments)
1. **Code-audit:** freeze the newest remote PR source/tree. Examine `verified-blob.ts`, `tx.ts` (`blobRefOf`, `isBlobRef`, `MAX_BLOB_BYTES`), all three adapter get paths, and the new three-adapter regression. Check Buffer copying, indexedDB lifetime and size metadata consistency. Record exact source and which tests actually ran.
2. **Functional bug hunt:** inspect the new current-head Alpha/CLI jobs and failure artifacts, then run focused memory/SQLite/IndexedDB cases serially; use realistic read/reopen and input-mutation scenarios. Distinguish missing bytes from corruption and explicit test fixture failures.
3. **Defensive source security review:** inspect tenant scoping, integrity-before-use, stale unlocked-session returns, ciphertext vs plaintext scope, untrusted holder labels and prospective owner-record authority. Keep to review/remediation, not the interrupted reproduction follow-ups. Static-only inspection is not runtime validation.

## Next implementation and integration
The next P1 slice is **a separately versioned, signed attachment manifest**, rooted in canonical principal-owned parent-record codec data rather than arbitrary holder strings. Enforce a transport aggregate bound independent of the 5 MiB per-blob bound, verify each attached blob using this new helper, and test missing/corrupt data, receiver rollback, atomic destination re-encryption and encrypted reopen. Preserve v1 record-only compatibility and excluded categories. Do not use draft #8 as a blind merge source.

Keep this PR draft pending the exact child CI, genuine independent reviews and qualified ancestors. If integration becomes authorized, verify the actual merge tree and main's separate push workflows. No release, deployment, force push, branch deletion, paid API, or unrelated/paused automation changes.
