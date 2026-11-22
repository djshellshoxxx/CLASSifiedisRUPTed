# ClassRup — record put index tuple boundary and next review handoff

Checkpoint: 2026-11-22 UTC. Bounded P1 source correction; no merge, release or deployment.

## Exact source and owner/worker boundaries

- Repository: `djshellshoxxx/CLASSifiedisRUPTed`.
- Frozen ancestor: draft PR #108, `codex/classrup-restore-index-shape-validation-20261122`, observed head `002317d7efbcb360f3aad4e14e0489369a064e28`. Its code is unchanged in the ancestor branch. The branch for this slice is `codex/classrup-record-put-index-shape-20261122`.
- Test-first commit: `413dd3b0e984a7c428c023a901d953f4fe40b125`.
- Implementation commit: `d7cef62d31c6402cca633bd40ca20b1ec5256125`.
- Modified paths: `packages/kernel/src/storage/contract-suite.ts` and `packages/kernel/src/storage/tx.ts`. This document is the third path.
- The GitHub connection was used to create an isolated branch from the observed remote head; local Git worktree creation and local project tests were unavailable because `git ls-remote` still returned `Could not resolve host: github.com`. No local-to-remote commit history was blindly merged.

## Source finding and repair

Review of #108 revealed that `tx.records.restore(rec, idx)` now rejects malformed four-slot runtime tuples but the sibling `tx.records.put(input)` still copied `input.idx[0..3]` without runtime shape admission. A fifth slot was silently truncated; array-like inputs were accepted and sparse/missing or non-string values could cross into the adapter, causing inconsistent durable indexes or failures.

The narrow repair extracts the existing #108 restore validation into `checkIndexValues(idx)`, calls it before any driver read in `records.put`, and reuses it for `records.restore`. Both now require an actual array of exactly four own entries, each `string | null`. Valid empty strings and nulls continue to be allowed, and normal CAS, canonical key, signatures, signing identity, encryption, v1 backup formats, crypto vectors, product caps and timeouts are unchanged.

The test-first shared storage contract adds a positive create/update control and seven malformed shape examples for both missing and existing records; each requires rejection without changing records or indexed queries. Memory, SQLite and fake IndexedDB import this shared contract suite. A genuine executed repository RED or GREEN run is **not claimed**.

## Verified evidence and limitations

- Frozen parent PR #108 current-source Alpha [44982634023](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44982634023) and CLI [44982634021](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44982634021) both completed **SUCCESS**. The Alpha domain job completed typecheck, static gates, tooling, domain tests, build and browser journeys; CLI completed both Ubuntu Node 22/24 jobs. **These qualify the parent source only.**
- PR #105 Alpha [44968879520](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44968879520) remains **FAILED** on the Firefox "Allow this listing" checkbox browser journey (873 domain assertions passed); its CLI [44968879523](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44968879523) succeeded. Later passing descendants do not reclassify that historical failure.
- A manually copied `checkIndexValues` TypeScript predicate passed `tsc --strict --target es2022 --module commonjs` and Node 22 testing against two valid plus seven malformed runtime values. This is a **standalone predicate check, not project TypeScript, Vitest, browser or RED/GREEN evidence**.
- Current candidate's exact-head hosted Alpha/CLI jobs must be inspected after the PR exists. No source test may be called passing before its hosted runs complete. Historic #57 local full domain exit 137, setup failures, and #56 main-push cancellation remain preserved in earlier handoffs.
- Independent reviewers are not present in the current environment. The following are **three assignments**, not performed reviews or approvals.

## Successive fresh review assignments

1. **Independent code audit:** Inspect the exact current published head in a fresh isolated worktree, verify `IndexValues` type and record-store callers, compare the restored helper semantics against #108 and all three adapters. Check that no valid legacy four-slot tuple changed meaning. Record commit/tree, commands and any confirmed findings.
2. **Functional bug-hunt:** Execute this branch's test-first commit for real RED and fix commit for GREEN with memory, SQLite and IndexedDB contract suites; serially run applicable full TypeScript, static/build gates, then browser journeys and CLI checks. Keep failing initial runs separate. Investigate #105 Firefox case only with a targeted changed condition or reproduction. Look for additional record-write failures without expanding this PR opportunistically.
3. **Defensive security audit:** Trace runtime/unsafe caller index handling and tenant isolation across put/restore/query; verify malformed inputs fail before reads/writes and cannot bypass CAS or insert corrupted index rows. Source-focused hardening only, no interrupted offensive reproduction follow-ups. Record exact source and independent evidence.

After the first three finish, qualified repairs and fresh independent successor reviews are required before a merge. All workers should leave exact SHAs, tests, known limits, remaining findings and next handoff instructions.

## Integration and next feature boundary

Keep this child draft until its exact-source CI and genuine independent review pass, and ancestor gates are independently qualified in order. The long draft chain is not itself a completed consolidation. Verify merge tree and separate main push qualification only after authorized ordinary merge. Do not infer credit exhaustion from a CI queue or host failure.

Mixed production-codec encrypted restore/reopen is implemented on main through #63. The next P1 recovery slices include attachment/reference portability, encrypted delivery/lease state, rotation/device interruption and native WebKit existing-key import. Avoid incompatible draft #8 wholesale integration and protect all existing signed identities and v1 formats.

No release, deployment, force push, branch deletion, paid API or unrelated automation changes are authorized.
