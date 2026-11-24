# ClassRup PR #79 — round 2 attachment-count invariant repair and handoff

Date: 2026-11-20. Continue the owner's ClassRup engineering under the existing source-bound qualification and independent-review gates.

## Fresh GitHub identities and ownership

- Current upstream `main` at inspection: `449a619f1ae7b66cb42d9cab43dd5493bfe42c2e`. The selected PR #79 base remains draft PR #78 `codex/classrup-backup-inspection-record-validation-20261120` at `ad1e56f9bf9f9f9081391ab678f48dc161860ae4`. Parent branch unchanged.
- PR #79 branch `codex/classrup-backup-coverage-overflow-fixture-20261120` was observed at `4fce5be379e15318df6cb147aae7fbb7e80f70e0`, tree `2c4996dfe390d5bc55c0b63287c821504b8ec66d`, before this follow-on.
- Two ordinary source/test commits were added directly to the existing owner continuation branch (no competing assignees or submitted independent reviews observed): `0d33a3d03e0012639d8e2e641bebbdd792cc59ff` for `apps/pwa/src/backup-coverage.ts`, then `2136c5f791c67e528e40e00f4f8a2edf610302af` for `tests/integration/backup-coverage.test.ts`.
- Post-test code/test head `2136c5f791c67e528e40e00f4f8a2edf610302af`, complete Git tree `6312a88759398c7e945ecdc90d2693f473e75034` (verified through GitHub Git Commit API). Re-read the latest branch ref/complete tree after this documentation commit. No force push, merge, branch deletion, or edit to ancestor PRs was attempted.
- GitHub comparison against exact PR #78 parent after the test commit: 5 commits ahead, zero behind, changed paths limited to the PWA validator, one integration test and the prior handoff.

## Confirmed source-level consistency gap and narrow remediation

The current storage producers define `referenceCount` as the size of the set of distinct refs encountered in `blob_refs` and `holderCount` as the count of holder rows (tenant-index set cardinality for memory/IndexedDB, bounded SQL row count for SQLite). Consequently, with `limitExceeded: false`, **zero distinct refs and a positive holder-row count cannot occur**. The existing `isCoherentAttachmentCoverage` accepted this contradictory result because `holders >= refs` is insufficient when `refs === 0`. It could display `0 held references` alongside positive holder rows as an apparently valid report. This is a code-derived invariant bug, not a reproduced backend corruption incident.

The repair now rejects the impossible combination by requiring `refs > 0 || holders === 0`, while retaining all existing bounds, relation checks and overflow handling. The invalid-report loop now includes a zero-reference/one-holder case; a separate positive case confirms a real all-zero `AttachmentCoverage` report still succeeds and displays `0 holder rows`. Only UI diagnostic validation/tests changed. No signer, identity, AES-GCM, record v1 wire format, product cap, schema, storage adapter, transaction, restore, workflow or dependency change.

## Executed evidence and limitations

- **No current-head repository TypeScript, Vitest or native browser tests executed.** The host's `git ls-remote` failed: `Could not resolve host: github.com`; an isolated worktree could not be made. Connector source reads and GitHub writes are not product-test execution.
- At the initial source inspection, PR #79's prior head `4fce5be...` had Alpha #44825334957 and CLI #44825334909, each returned as **queued** by GitHub. Those jobs do not qualify either follow-on commit, and no old workflow was rerun. New head-specific workflow results require fresh inspection.
- PR #79 contained zero submitted independent GitHub reviews; PR #69 has previous successful exact-older-source hosted Alpha/CLI qualification, but no completed independent review at inspection. Ancestor and local tests cannot qualify this changed head.
- Historical PR #56 main-push Alpha #44658477772 was cancelled while CLI #44658477821 succeeded; original Nov 19 complete local domain process exited 137 without final report; preserve them as cancelled/incomplete, not passing. Do not retry unchanged queued CI or the killed complete suite without a concrete remedy.
- The owner's remaining credits are not exposed. There was no reported exhausted-budget condition.

## Next distinct fresh review lanes (assignments, not completed worker execution)

1. **Independent code auditor:** Freeze PR #79's actual new head/tree and review both changed files against the storage producers. Confirm positive zero/one/multiple holders, impossible zero/positive pair, 10,000 cap, null-on-overflow, type and unsupported-category coherence. Inspect tests/fixture code against production PWA interfaces; identify exact source references and log any source issue in an independent receipt.
2. **Independent functional bug hunter:** Create an isolated worktree from the verified remote branch (not old local-only history). Run `corepack pnpm install --frozen-lockfile` only if needed, `corepack pnpm typecheck`, then `corepack pnpm test -- tests/integration/backup-coverage.test.ts` serially. Extend to attachment-reference storage tests and PWA session/browser journeys if resources allow. Record exit codes, complete assertion counts and real job/log identifiers. Keep DNS/setup failures separate from executed product tests; do not run heavy suites concurrently.
3. **Independent defensive security reviewer:** Source-focused review only: tenant confinement, no attachment IDs/bytes or raw errors in text, session revocation on delayed optional failures, false claim of v1 completeness, impossible count injections, and bounded work/overflow signaling. Review and hardening only; do not resume the interrupted reproduction follow-ups. Leave source SHA/tree and distinct findings/handoff.

After each review, inspect its real evidence before integrating repairs. Keep PR #79 draft until actual current-head required Alpha/domain/browser and CLI qualification plus independent reviews and ancestor integration pass. Verify any actual merge tree and separately inspect `main` push qualification. Incompatible draft #8, paused ClassRup tasks, other projects, releases, deployments and paid APIs remain untouched.
