# ClassRup backup coverage: fixture parity and overflow coherence

Date: 2026-11-20. Owner-directed continuation in `djshellshoxxx/CLASSifiedisRUPTed`.

## Source identity and ownership
- Remote `main` observed at `449a619f1ae7b66cb42d9cab43dd5493bfe42c2e` (PR #63 baseline). The selected parent is **draft PR #78** `codex/classrup-backup-inspection-record-validation-20261120`, observed head `ad1e56f9bf9f9f9081391ab678f48dc161860ae4`, complete tree `bef8c38c08eb2f053938aee664b4d0cc559708f6`.
- New isolated child: `codex/classrup-backup-coverage-overflow-fixture-20261120`. No ancestor branch, main, incompatible draft #8 or unrelated worker branch was altered.
- Runtime commit `a718cc4428660788bd9b309e11524270a21370c7`: only `apps/pwa/src/backup-coverage.ts`.
- Test commit `bdcfd55525cb4c31d7518d4bee582337e1f8803f`: only `tests/integration/backup-coverage.test.ts`; pre-handoff code/test tree `1f668f8a649a8e3524e4397764c072a4f20e3054`.
- Verified GitHub compare from PR #78 head: **2 ahead / 0 behind**, two changed files; fetch the branch head and complete tree again after this handoff commit.

## Source-observed findings and bounded fixes
1. PR #78 introduces required record-coverage validation insisting that `excludedStores` contains both `blobs` and `blob_refs`, as provided by production `packages/vault/src/vault.ts`. Its shared `tests/integration/backup-coverage.test.ts` fixture still declared `['blobs']` only. All positive `readBackupInspection` tests based on this fixture would reject before optional inspection. Corrected the shared fixture to `['blobs', 'blob_refs']`; retained the existing negative missing-exclusion test. This is an exact source-level inconsistency, not an executed test-failure log.
2. PR #78 accepts `typeLimitExceeded: true` even if `recordTypes` has fewer than 256 populated categories. Production `coverage()` obtains up to 257 categories, slices exactly 256, and only then sets the overflow flag. A true overflow with fewer than 256 returned rows is therefore impossible. Reject such reports to avoid displaying a false count-limit state. Retain valid exactly-256, non-overflow and truncated-256 outcomes.
3. Added an invalid resolved-coverage test input for the impossible overflow to the existing loop. The existing positive control for 256 truncated categories remains unchanged.

This is PWA diagnostic correctness and test fixture parity only. It is **not** an authenticated backup-completeness proof. Existing signed/encrypted v1 bytes, record/identity signatures, product caps (256 types, 10,000 records/holder rows), codec/restore behavior, and excluded stores remain untouched.

## Qualification state and preserved evidence
- **No local checkout or executable product tests** for the child. `git ls-remote` failed with `Could not resolve host: github.com`; GitHub connector reads and ordinary source writes succeeded, but no worktree could be created.
- Parent PR #78 Alpha and CLI original runs `44824459480` (CLI) and its paired current-source Alpha (inspect via GitHub by exact head) were queued at inspection. Parent PR #77 Alpha `44815292853` had a queued domain job and CLI `44815292761` had a queued plan. Do not count any as passed. Do not restart unchanged queues.
- An earlier PR #69 GitHub-hosted Alpha and CLI were reported passed at its exact older source, but zero independent PR reviews had been submitted at this inspection. Older ancestor qualification does not qualify this child.
- PR #56 separate main push Alpha `44658477772` was cancelled and CLI `44658477821` passed. The original Nov 19 local full domain suite exited **137 without a final report**. Preserve actual failures, cancellations, skips and incomplete runs separately.
- No credits-exhausted condition was reported; no remaining-credit estimate exists.

## Three fresh, non-overlapping review assignments
1. **Code auditor:** Freeze the new head/tree and compare with parent PR #78. Check `isCoherentBackupCoverage` directly against `vault.ts::coverage` and real stored-category boundary behavior. Verify 0, 1, 256 and >256 populated categories, registered type constraints, excluded-store semantics and compatibility with existing positive tests. Record exact SHA/tree, executed commands if any, findings and limitations in a new handoff.
2. **Functional bug hunter:** In a fresh isolated worktree from the observed remote child ref, run `corepack pnpm install --frozen-lockfile` only if needed, `corepack pnpm typecheck`, then `corepack pnpm test -- tests/integration/backup-coverage.test.ts` **serially**; follow with affected vault/PWA session tests and supported browser checks. Record process exit codes, complete assertion totals and log identifiers, distinguish setup/DNS failures from executed product test results, and avoid concurrent heavy suites.
3. **Defensive security reviewer:** Static/source-focused check of required/optional diagnostic boundaries, sanitized errors, session revocation, lower-bound/overflow truthfulness, tenant privacy, DOM rendering, and explicit non-inclusion of `blobs`/`blob_refs` from v1. Do not conduct interrupted reproduction follow-ups. Record source identities, any confirmed hardening finding and limitations.

No fresh worker runtime or independent submitted approvals were available in this invocation; these are **assignments, not completed audits**. Require current-head Alpha/domain/browser and CLI jobs and completed independent review before ordinary integration; qualify stacked ancestors, then verify the actual merge tree and main's separate push jobs. Preserve draft #8, older paused automations and unrelated workers. No release, deployment, force push, branch deletion, paid API, unchanged workflow rerun or crypto/schema change is authorized.
