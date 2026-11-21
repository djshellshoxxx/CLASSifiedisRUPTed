# ClassRup — blob encryption-classification dedupe review / handoff

Checkpoint: 2026-11-21 UTC. Bounded **draft-only** child of PR #101. No independent-review approval or product test execution is implied.

## Frozen source and ownership

- Remote parent PR #101: `codex/classrup-sync-limit-parity-20261121` at `98f801b3bb7a1e60bad9a051a9955932c2bccaeb` (unchanged when the child branch was created).
- Child branch: `codex/classrup-blob-encryption-dedupe-20261121`.
- Test-first commit: `27aeae4f3f566408ac3e1a70d9de77449c547bbe`.
- Small production repair: `42235e808cc81d3f1fecf80b636c77d7887dbd52`. Fetch live head after this documentation commit.
- Pre-handoff GitHub comparison against parent: 2 ahead, 0 behind; exactly `packages/kernel/src/storage/contract-suite.ts` (32 added lines) and `packages/kernel/src/storage/tx.ts` (6 added lines).
- No other branch was modified. No force push or merge. Existing v1 signed record bytes, identity, ciphertext bytes, key material, cryptographic vectors, product caps and test timeouts are unchanged.

## Source-confirmed functional and defensive finding

`blobStore.put()` is content-addressed by bytes and tenant. On a duplicate ref it returned the existing `BlobInfo` without comparing its `encrypted` flag against the new caller's declaration. Consequently:
- A plaintext P0 blob followed by a same-byte `encrypted: true` request returned success for an **unencrypted** existing blob. The caller could mistakenly treat the successful put as an encrypted persistence operation.
- An encrypted blob followed by a same-byte `encrypted: false` request likewise returned success for an **encrypted** existing blob, and the existing privacy could be lowered before the mismatch was detected.

Both paths were source-confirmed by reading the shared storage wrapper and adapter implementations. These are **source observations**, not a claim of exploited application flows or a passing product reproduction.

The change rejects conflicting encryption declarations with a `CONFLICT_STATE` result *before* metadata mutation. Same-encryption idempotent dedupe and intended privacy lowering still work. Different tenants may retain the same content ref with different encryption classification. Explicit remove/reinsert remains available when an intentional change of classification is required.

The test-first shared contract case uses memory, SQLite and fake IndexedDB's existing harness. It checks both conflict directions, unchanged metadata and bytes, tenant isolation, matching-encryption dedupe and authorized publication. The test was authored before the production fix but **was not run RED**.

## Verification and qualification

- Parent PR #101 exact-head [Alpha 44948675702](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44948675702) and [CLI 44948675721](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44948675721): completed/success. Alpha domain, typecheck, tooling, build and browser steps completed; CLI clean-install Node 22/24 completed. Parent-only qualification does not qualify this child.
- The execution host returned `Could not resolve host: github.com` to `git ls-remote`; no remote-ref checkout/worktree, TypeScript, Vitest, build, or browser test of **this** child was executed locally.
- New child exact-head hosted Alpha and CLI must be checked **after** draft publication. Do not credit parent results to the child, or turn queued/cancelled/killed gates into passes.
- The November 19 complete local domain suite exited 137 without a report. Preserve the source/evidence in `docs/development/cycles/20261119/QUALIFICATION.md`. Preserve the separate cancelled PR #56 main-push Alpha and later PR #57 qualified main-push evidence as distinct.
- No independent review worker has executed in this invocation. Do not present the author source inspection as independent review.

## Fresh independent worker assignments (distinct ownership)

1. **Code auditor:** freeze this branch and parent exact commits in independent worktrees if GitHub DNS works; compare the blob put/attach/detach flow, encrypted metadata transitions, content-address collision behavior and privacy classification. Inspect likely callers of `blobs.put` and report any legitimate compatibility reliance on conflicting flags. Run TypeScript and focused contract tests sequentially, record SHA and command outcomes.
2. **Normal functional bug-hunter:** run the regression against pre-fix test commit to observe RED and against the production commit to observe GREEN on memory, SQLite and fake IndexedDB; check encrypted `P2`, plaintext `P0`, valid privacy lowering, cross-tenant dedupe, rollback and reopen. Record product assertions and remaining failures without counting static demonstrations as tests.
3. **Source-focused defensive security reviewer:** review data-at-rest encryption contract, caller trust boundaries, dedupe confusion and metadata integrity. Harden only confirmed defensive findings. Do not resume interrupted attack reproduction follow-ups or claim external exploitability.

Wait for all completed worker evidence before independent qualification. If a review identifies incompatible existing behavior, amend the code and requalify the **new** source. Hosted success alone does not authorize a merge. Integrate qualified ancestors in dependency order, check actual merge trees and main-push workflows.

## Remaining feature work

The owner P1 work register (`docs/development/REMAINING_WORK.md`) still distinguishes the tested mixed 15-codec encrypted record recovery candidate from excluded attachment bytes/references, queue/delivery/lease recovery, whole-database rollback, key rotation, and native WebKit existing-key import. This narrow dedupe correction does **not** complete those features. Continue the next unblocked bounded recovery slice after current-source verification.

No release, deployment, branch deletion, force push, paid external API or unrelated automation change is authorized. Owner credits are not observable; no exhausted-budget signal was reported.
