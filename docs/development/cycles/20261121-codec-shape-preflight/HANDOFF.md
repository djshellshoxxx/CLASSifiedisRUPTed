# ClassRup: reject malformed codec callback shapes before IndexedDB acquisition

Checkpoint: 2026-11-21 UTC. Bounded continuation of the owner's active ClassRup engineering; this is a draft stacked on PR #82. No release or integration into main.

## Exact remote source and concurrency

- Repository: `djshellshoxxx/CLASSifiedisRUPTed`.
- Fresh observed main: `449a619f1ae7b66cb42d9cab43dd5493bfe42c2e`; GitHub compare showed #82's fixed source 59 ahead/0 behind this main. PR #57 is already merged; never restart its November 19 work.
- Frozen direct parent: draft PR #82 `codex/classrup-vault-early-codec-admission-20261121` at `ba13461483382d8dbeb053ae41fcd7ec9c4ee060`, tree `7bf2c24f395664ce71591f1ea829a4a0b8285e1c`. Its own hosted Alpha `44863669437` and CLI `44863669521` succeeded at that source. These do not qualify the child.
- Independent documentation-only PR #83 has its own branch `docs/classrup-pr82-qualification-review-20261121`, commit `518ad6bc188afa3c283bcfef8b2d1aca63b7d57e`; do not alter it. Multiple upstream drafts remain open (including #81, #80 and #72-#79). Their qualifications and review ownership remain separate.
- Own new isolated branch `codex/classrup-vault-codec-shape-preflight-20261121` forked from the exact published #82 SHA without rewriting it. Production commit `31fee87542b2746302e5a5434b3863b48cb2220e`; regression commit `71ebdc9e784ec675bf51c4438b5232cec01b3cb6`. GitHub compare after these two commits: exactly two changed files (`packages/vault/src/vault.ts`, `packages/vault/src/vault.test.ts`), 2 ahead/0 behind parent. This handoff is a later documentation commit; refresh the actual remote head/tree before integration.

## Source-confirmed issue and bounded implementation

PR #82 validates registered codec names before opening IndexedDB, fixing writer-token supersession when the registration rejects. However its `snapshotBackupCodecs` destructures `codec` and calls `.bind` on `parse`, `indexes`, `validate`, `restoreData` and `recordId` without validating these callbacks' runtime types. Null elements, noncallable members or property getters that throw could leak arbitrary JS exception messages instead of the existing non-sensitive `Invalid backup codecs` error.

The child wraps snapshot/registration admission in a fail-closed generic-error boundary, rejects nonarrays and null entries, verifies required callback functions and optional callback shapes before binding, and retains the existing duplicate/reserved/256-type limits. The current receiver-binding behavior for valid prototype/private-state codecs and the existing double-snapshot public composition seam are preserved. The new guard runs in `openVault` before `openEncryptedStorage`, so invalid registries cannot open IndexedDB or claim a writer token. This is a source-level input-consistency/availability hardening, not a demonstrated user incident, data loss or exploitable secret disclosure.

The existing 30-second, no-Web-Locks writer-fence test now checks nine invalid registries (the original empty and duplicate names plus null codec, noncallable required/optional callbacks and a getter throwing a redacted simulated internal error). Each invalid registry must fail with the exact generic error in both `vaultFromStorage` and `openVault`, and the already-open original encrypted vault must successfully commit a normal owner record afterward. The original valid normal reopen/export/restore and identity tests remain. No v1 wire data, signatures, identity, encryption or storage format, key/index rules, sizes, product caps, dependency lockfile, CI workflows or test timeouts changed.

## Evidence limits and qualification

- GitHub connector compared the two-code/test commit range and retrieved source before and after the changes. Static review confirmed the pre-IndexedDB ordering and preserved base caps. It **does not** establish compilation, product behavior or a completed independent review.
- Local `git ls-remote` failed: `fatal: unable to access ... Could not resolve host: github.com`. No local cloned worktree, pinned pnpm install, TypeScript, Vitest, or native browser tests were executed in this invocation. This is an environment/setup blocker, not a test failure or a claim of success.
- Parent #82 hosted Alpha `44863669437` and CLI `44863669521` completed successfully. Child commit `71ebdc9e...` had no returned workflow runs when queried before PR creation. Inspect **this draft's actual latest head and jobs** before any qualification claim. Do not restart unchanged queues or the historical exit-137 domain run.
- Preserve the historical November 19 full local runner exit 137 without a JSON report, prior-source failures, #56 main-push cancelled Alpha `44658477772` / successful CLI `44658477821`, and exact #57 main-push successes as distinct evidence.

## Fresh separate review assignments (none executed as independent agents here)

1. **Code audit:** isolate an actual Git worktree at this current remote head; compare exact two-file diff to PR #82; verify `BackupCodec` implementation and valid class prototype/private-state receivers, double method binding, absence of legitimate callback values other than functions/undefined, duplicate/reserved/type-cap parity and error-path behavior. Record commit/tree, reviewed files, commands and results.
2. **Normal functional bug hunt:** in a distinct worktree with pinned dependencies, serially run `corepack pnpm typecheck` and the focused `packages/vault/src/vault.test.ts` suite. Confirm all nine malformed cases reject and original writer survives each; check normal create/unlock, persistence, close/reopen, v1 export/recover and the existing class-codec compatibility tests. Inspect exact-current-head Alpha/domain/browser and CLI hosted checks, including counts and skips. Do not parallelize resource-intensive processes on a pressured host.
3. **Defensive security review:** review generic exception containment on Proxy/accessor values and callback binding, existing writer-fence state, cleanup, per-principal isolation, session disposal and any sensitive-error path. Flag theoretical versus confirmed findings. Defensive review/remediation only; do not attempt interrupted reproduction follow-ups.

A genuinely independent reviewer must finish each lane, preserve precise source identities and leave its own fresh handoff before any approval to integrate. Assignments are not completed workers or code-test evidence.

## Next integration/feature decisions

First qualify this source and the stacked upstream drafts with actual required current-source gates and independent reviews. Avoid blindly merging draft #8 or PR #83's documentation into code changes. The prior mixed **15-production-codec-set encrypted restore/reopen with canonical keys, restored indexes, normal readers and preserved identity** has already been implemented and locally accepted on the PR #63/main ancestry; do not count it as unimplemented or duplicate its tests. The remaining P1 backups are excluded attachment/ref bytes and delivery/lease state, rotation, whole-database recovery and interrupted-device/load validation; choose a narrowly specified next slice once this writer-fence candidate is reviewed.

No qualified merge, release, deployment, force push, branch deletion, paid external API, or unrelated/paused automation change is authorized or performed. Owner credit balance is not observable; a DNS failure or GitHub queue is not a credit-exhaustion report.
