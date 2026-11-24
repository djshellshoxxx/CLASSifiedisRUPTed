# ClassRup — single-snapshot bounded attachment batch admission

Date: 2026-11-23 UTC. Repository: `djshellshoxxx/CLASSifiedisRUPTed`.

## Frozen source and ownership
Direct parent: draft PR #138, `7c1055822f97345eb448a80779ce91535bff3d4e`, tree `273afa565c0ed6f8a7ad22e47f6f1f129d39fb2f`, branch `codex/classrup-batch-array-bounds-20261123-t21`. Parent source confirmed unchanged immediately before this child was authored. Isolated child branch: `codex/classrup-batch-length-snapshot-20261123-t22`. No previous branch, main, release or deployment modified. Native Git cannot resolve github.com in the prior checked environment; published via GitHub Git objects using the frozen parent tree. This is not a native worktree and cannot be counted as local product execution. Published child exact SHA/tree must be taken from its GitHub PR/commit record.

## Source-confirmed boundary flaw
PR #138 replaced caller-controlled Array iteration with indexed copying, but `readVerifiedBlobBatch` still read `refs.length` once when enforcing the 32-item cap and a second time when determining how many entries to copy. A Proxy wrapping an Array passes `Array.isArray` while returning different values from each length read. The first read may admit 0 or 1 items and the second report an arbitrarily larger copy count, bypassing the bounded-input contract and potentially producing excessive synchronous work.

Capture the Array length once; validate safe integer, nonnegative and at most 32; reuse exactly that count for bounded indexed copying. Preserve no-overridden-iterator behavior, canonical SHA-256 ref validation, distinctness, max 5 MiB per blob, 20 MiB aggregate, tenant scoping and SQLite policies. Added a real storage regression source with a changing-length Array Proxy, admitted empty input and negative spoofed length.

Standalone Node 22.16.0 JavaScript reproduction **executed**: the original two-read pattern observed admitted length 1 then copy count 100000; the one-snapshot pattern observed count 1 and only one length property read. This is not a ClassRup test. Local TypeScript, product Vitest and browser runs are **not executed**; do not claim them passing until current-source hosted qualification finishes.

## Current parent qualification
PR #138 exact-source Alpha run [45151530641](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/45151530641) and CLI [45151530536](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/45151530536) both completed success. Alpha plan/domain completed including typecheck, spec, dependencies, registry, tooling, domain, setup/build and browser journeys. CLI plan and Ubuntu Node 22/24 clean-install jobs completed success. These **qualify parent #138 only**, not this child. No independent reviews had been submitted on #138 at inspection.

## Fresh distinct reviewer assignments — not completed worker evidence
1. **Code audit:** on exact published child SHA/tree, inspect `verified-blob.ts` and batch test. Confirm only one getter read for Array Proxy length; validate zero, negative, fractional and >32 values; confirm no untrusted iterator and no changed byte/tenant semantics.
2. **Normal functional bug hunt:** execute focused batch integration on memory, SQLite and IndexedDB, plus the new Proxy test; inspect race and budget boundaries. Run required tests serially, avoid resource-heavy concurrent suites, preserve setup failures separately from actual product tests.
3. **Defensive security review:** source-focused review for Proxy getter/element traps, prototype pollution surfaces, metadata authentication and plaintext bounds, tenant isolation and detached-byte verification. Do not resume interrupted reproduction follow-ups; only review, hardening and remediation.

No independent worker was launched through the available environment. These three assignments are not reviews or approvals and cannot authorize merge.

## Next substantive P1 feature
An owner-authenticated, separately versioned signed attachment manifest must bind a canonical parent record and signing authority to verified blob refs/holder links and metadata before export. Then implement aggregate-bounded transport, atomic destination re-encryption/rollback and encrypted reopen. Do not infer ownership from holder strings alone or claim that a ciphertext hash authenticates metadata. Preserve v1 record-only signed backup compatibility, identity and signing keys, test limits and product caps. Do not merge draft #8 blindly. Current-source CI and genuine independent reviews are required before integration. Preserve original #57 exit 137 and #56 cancelled main-push Alpha separately from passed PR gates. No release, deployment, force push, branch deletion, paid API or unrelated automation changes.
