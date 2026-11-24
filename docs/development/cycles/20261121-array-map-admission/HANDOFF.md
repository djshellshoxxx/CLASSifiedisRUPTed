# ClassRup: reject caller-overridden codec-array traversal before writer acquisition

Checkpoint: 2026-11-21 UTC. Distinct bounded code+test continuation; **draft only**, not an independent review or release.

## Exact sources and ownership

- Repo: `djshellshoxxx/CLASSifiedisRUPTed`; observed `main` at `449a619f1ae7b66cb42d9cab43dd5493bfe42c2e` (PR #63 merged). PRs #56 and #57 were previously merged and main's PR #57 push qualification is recorded in `REMAINING_WORK.md`; do not requalify #57 from its initial queued status.
- Parent draft **#84**, `codex/classrup-vault-codec-shape-preflight-20261121`, exact published commit `ef218a1e06b7290f66fd084a41a498ad13eb4fd5`. This parent is unchanged. Its parent #82 and separate documentation PR #83 remain untouched; older stacked drafts and unrelated automations are unchanged.
- Own isolated remote branch `codex/classrup-codec-array-map-guard-20261121` branched directly from the exact #84 published SHA. Code `8f55a05dad327181815296e654fc9a240f05c131`; test `40e3bf9ad12dab62427e18cca182828db99e30ff`. Remote comparison against #84 after these two commits: **2 ahead / 0 behind**, changing exactly `packages/vault/src/vault.ts` and `packages/vault/src/vault.test.ts`. This documentation commit is additional; inspect live branch identity and tree again before merging. No original local-only SHA history has been merged.

## Exact #84 qualification inspected (parent only)

The previously queued #84 hosted checks are now **completed/success** at exact published parent SHA:
- Alpha verification [44867764029](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44867764029), plan and domain jobs success. Decoded domain job log reports **857 passed, 0 failed/pending/skipped/todo** domain assertions; tooling **27 passed, 0 failed/skipped**; Playwright command used Chromium, Firefox and WebKit and reported **78 passed**. Compiler, spec/dependency/registry checks, setup, build and browser steps succeeded.
- CLI setup [44867764041](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44867764041), plan and two Ubuntu jobs success (Node 24.x and 22.18.0); their logs each report **46 CLI tests**, zero skipped, successful dev and preview Chromium smoke, setup and build.

These are **not qualification for the changed child**. The original 2026-11-19 complete local domain process exit 137 (no final report), the cancelled #56 main-push Alpha and separate CLI success, and other historical failures/incomplete runs remain separate and unchanged. Do not rerun old killed suites without a concrete changed condition.

## Source-derived bug and bounded repair

PR #84's admission correctly rejects null/malformed codecs and throwing getters before the IndexedDB writer token is acquired. However `snapshotBackupCodecs` called the **caller array's `.map` property**. A genuine array with a shadowed `.map` returning `[]` hides its actual invalid codec entries from admission. In that case both public composition routes can accept an invalid registry and `openVault` can acquire a writer token before anything rejects, invalidating an already-open connection on no-Web-Locks runtimes.

The new code invokes `Array.prototype.map.call(codecs, ...)` instead of the array's potentially shadowed method. All valid codec receiver binding, returned frozen snapshots, duplicate/reserved-name/256-type admission and generic errors remain. No changes to the backup v1 envelope, signatures, signing identity, crypto, canonical storage keys/index rules, size or type caps, dependencies, workflow configuration or test timeout.

The existing 30-second writer-fence integration test gains a **tenth** invalid registry using `Object.defineProperty(maskedInvalidCodec, 'map', { value: () => [] })`. It must reject generically via both `vaultFromStorage` and `openVault` and then require the original live owner session to commit a record. The pre-repair source would accept the masked invalid registry, making the expected rejection fail; this is a source-level expected contrast, **not** an executed parent product failure.

## What was verified / what was not

- GitHub connector fetched and compared the exact two-file child diff. It confirmed a 2-ahead/0-behind code-and-test delta at the test commit.
- Standalone Node 22 reduction confirmed a custom array `.map` can return `[]` while intrinsic `Array.prototype.map.call` traverses its actual invalid element. A separate standalone TypeScript strict check compiled an equivalent intrinsic traversal. These **are not** repo typecheck, executed Vitest, browser product tests, nor independent reviews.
- The available host's `git ls-remote https://github.com/djshellshoxxx/CLASSifiedisRUPTed.git HEAD` still failed resolving `github.com`. Therefore no actual isolated **local** worktree, pinned install, complete local typecheck, or new Vitest execution occurred. The isolated **remote branch** was created directly from the exact parent GitHub SHA via connector.
- No independent code-audit, bug-hunt, or defensive-security worker completed this child during this invocation. Their distinct next assignments follow; do not call them approvals.

## Separate fresh review generation (pending)

1. **Code auditor:** create an isolated local worktree at the observed live child SHA. Compare the two-file delta against the exact #84 published source; verify `Array.prototype.map.call` type inference under the pinned compiler, mapping dense/sparse arrays, duplicate/reserved/256 cap, valid class prototype/private-field method binding and double snapshot. Check any side effects of `Symbol.species` or user-altered constructors; recommend the minimal safer alternative if the intrinsic traversal is insufficient. Record exact SHA/tree, command outputs and findings.
2. **Normal bug hunter:** distinct worktree, pinned dependencies; serial `corepack pnpm typecheck` then focused `vault.test.ts` and IndexedDB writer-fence cases. Demonstrate that masked invalid arrays fail at the old source and are rejected at this head where feasible, including a successful original-session commit and normal create/unlock/reopen/v1 backup path. Inspect child-head hosted Alpha/domain/browser and CLI logs; record actual assertion counts, failures and skips.
3. **Defensive security reviewer:** source-focused only. Check custom array/prototype interactions, unexpected getters and exception sanitization, writer-token claim ordering, cleanup, tenant/principal isolation, and whether any genuine trust boundary accepts untrusted codec registration. Separate proven defects from theoretical malicious-local-API cases; no interrupted reproduction follow-ups or aggressive exploitation.

Each independent reviewer must leave an **actual** source-specific handoff and failing/passing evidence before marking that lane complete. Integrate confirmed corrections in an isolated child branch. Subsequent rounds must start fresh from the current remote refs and preserve prior evidence.

## Follow-on P1 feature and integration limits

The mixed **15-production-codec encrypted restore/reopen** acceptance with canonical IDs, rebuilt indexes, retained signing principal and ordinary readers already exists in the verified PR #63/main ancestry; do **not** duplicate it or claim that excluded attachments, delivery/lease recovery, rotation or interrupted-device whole-database recovery is finished. After the bounded writer-preflight chain is independently reviewed and qualified, select a small remaining P1 backup slice, respecting the excluded-store policy and v1 compatibility. Do not wholesale merge incompatible draft #8.

Keep this child draft until its own current-source required hosted gates and independent reviews complete, then qualify ancestors in dependency order, compare prospective/actual merge trees and inspect main-push qualification. No merge, release, deployment, force push, branch deletion, paid API or unrelated automation change is authorized by this checkpoint. The owner's credit balance is not observable; DNS failure or queued CI is not evidence of exhausted credits.
