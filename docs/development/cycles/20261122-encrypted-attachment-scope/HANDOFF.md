# ClassRup — encrypted attachment scope acceptance handoff

Date: 2026-11-22 UTC. Frozen parent: draft PR #127, head `7a003dc6cb84555ac149018a19dddacc2f9661df`, tree `b4b79905a99f979086d0f1648db6577f7c7d4c10`. Isolated branch `codex/classrup-encrypted-attachment-scope-20261122-t11`. Re-resolve published head/tree and current PR checks; parent history is preserved without rebasing or force pushing.

## Current-source qualification confirmed before this candidate

PR #127 Alpha [45080407537](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/45080407537) completed **success** at exactly `7a003dc6cb84555ac149018a19dddacc2f9661df`. Its domain job 137387101424 completed typecheck, specification, dependency, registry, independent money vectors, tooling, **943 passed/0 failed/pending/skipped** domain assertions, setup/build, and **26 passed** browser journeys; the plan also succeeded. CLI [45080407592](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/45080407592) completed **success** with Ubuntu Node 22 and 24 clean-install and browser-smoke jobs. These qualify PR #127's source only, not this child. PR #127 still has **zero submitted independent GitHub reviews**, so is not eligible for qualified integration.

Preserve #126's failed first TypeScript Alpha 45074487619, its corrected-head failed domain Alpha 45074614282 with the unexecuted three-adapter fixture, and #127's subsequent passing correction. Also retain PR #120's historical Firefox failure, #116's Alpha failure, #105's Firefox failure, PR #56's cancelled separate main-push Alpha, and the original local complete-domain exit 137. Do not reclassify or silently replace evidence.

## Bounded acceptance added

`tests/integration/backup-inspection-encrypted-attachment-scope.test.ts` exercises the production encrypted IndexedDB wrapper via fake-indexeddb. It persists an owner record plus a content-addressed, held local blob, verifies single-snapshot diagnostics before and after close/reopen, exports v1 and restores into a different named encrypted vault. The expected record survives under the same principal, but **blob bytes/holder references do not restore**. This is intentionally an executable **negative capability boundary**, not a portable attachment solution. No production code, format, signatures, identity, encryption, domain caps, per-test timeout or browser selections changed.

No local test execution was possible: `git ls-remote` returned `Could not resolve host: github.com`. The test is source-authored only until this child receives current-head hosted qualification; it is not claimed GREEN or independently reviewed. The earlier local exit 137 does not justify widening timeouts.

## New review assignments — not executed or approvals

1. **Fresh code auditor:** review exact child tree, new test, `packages/vault/src/vault.ts`, `packages/vault/src/encrypted-storage.ts`; check v1 compatibility, distinct destination address binding, and whether source and restore retain signing identity. Record source/tree and static versus executed checks.
2. **Fresh functional bug hunter:** run the new test in isolation first, then serial hosted Alpha domain/typecheck/build/browser and CLI. Inspect any real failure artifact and preserve the original run. Check real vs fake IndexedDB limitations, source reopen, destination restore and existing record readers. No concurrent heavy suites.
3. **Fresh defensive security reviewer:** source-only audit of principal scoping, untrusted holder strings, encrypted row AAD/address binding, no private payload/refs in inspection, lock/cleanup, and missing attachment interpretation. Review/hardening only; do not resume interrupted reproduction follow-ups.

These are assignments, **not independent workers actually launched**. Do not claim a self-review as independent approval. Before editing, refresh owner activity and exact remote refs, use a fresh isolated worktree/ref and respect existing PR ownership.

## Remaining P1 and integration gate

Read `docs/development/REMAINING_WORK.md` and the attachment Phase A design in PR #67. The new test **demonstrates** excluded data, but complete recoverability requires a separately versioned, authenticated manifest, real owner/reference authority, canonical digest/key validation, bounded byte transport and atomic re-encryption into destination storage. Existing holder strings do not prove owner authority. Delivery/lease recovery, rotation, native WebKit import and complete device-interruption acceptance remain separate. Do not silently modify v1, lift 16-MiB archive or other product caps, or merge incompatible PR #8.

Keep this PR draft until actual required current-source gates, genuine independent reviews and qualified ancestor integration pass. Verify every eventual merge tree and main-push qualifications. No release, deployment, force push, deletion, paid API or mutation of older paused/unrelated automations. Credit balance remains unobservable.
