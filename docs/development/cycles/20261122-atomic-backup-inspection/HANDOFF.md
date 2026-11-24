# ClassRup continuation — atomic read-only backup inspection

Date: 2026-11-22 UTC. Source: parent draft PR #124, exact remote head `addf51f30f1608639eb8c52d483b618ecdd4f348`, tree `50861334eaed3c4b6ce3edebab194333105dd10d`. Stacked branch `codex/classrup-backup-atomic-inspection-20261122`. Resolve published commit/tree and exact-source CI after publication.

## P1 bounded change

The PWA previously called `backupCoverage()` and `attachmentCoverage()` in two independently serialized transactions, so record counts and holder counts could reflect different storage snapshots if writes interleaved. The new optional `UnlockedVault.backupInspection()` computes both reports in **one** read transaction for the same unlocked principal. The PWA helper prefers that path for production vaults and retains the original two-call path for older/test sources. The optional attachment scan is caught within the same read: errors yield unavailable counts, not lost required record coverage. Invalid required reports continue to reject with a generic error; malformed optional attachment values become unavailable. Session locks still revoke late publication.

This is only a consistent *diagnostic snapshot*. It is not an authenticated attachment manifest, does not include attachment bytes or refs, and does not upgrade portable recovery. The original `backupCoverage`, `attachmentCoverage`, v1 sealed format, signing identity, crypto, data schema, product caps, and test limits remain untouched.

## Verification evidence

Parent #124 exact-head Alpha workflow 45063109533 and CLI workflow 45063109493 completed success on 2026-11-22. Alpha plan/domain and CLI plan/Ubuntu Node 22/24 jobs individually succeeded; domain steps include full domain assertions, typecheck, static/setup/build and browser journeys. Their success **does not qualify this child**. Original historical #120 Firefox and #116 Alpha failures, #105 Firefox, #56 cancelled main-push Alpha and the original killed complete-domain run exit 137 remain preserved. No current-source local repository tests ran: `git ls-remote` failed DNS (`Could not resolve host: github.com`). The new regression checks are source-authored, not an executed RED/GREEN cycle. Obtain exact child-head Alpha/CLI job evidence and genuine independent reviews before integration.

## Three distinct fresh review lanes — assigned, not executed

1. **Code audit:** verify one transaction, correct source/branch ancestry and no temporal self-lock issue; examine codec/identity and v1 public API compatibility. Record exact source/tree, actual executed steps and findings.
2. **Functional bug hunt:** with an isolated remote worktree, run focused `packages/vault/src/backup-coverage.test.ts`, `tests/integration/backup-coverage.test.ts`, `tests/integration/attachment-reference-coverage.test.ts` and the backup Playwright journey on all supported browsers. Intentionally interleave a writer with the read transaction and verify snapshot coherence, plus lock during reads and optional diagnostic faults, then serial full gates.
3. **Defensive source security review:** verify principal scoping, read-only semantics, no blob IDs or private types in the DOM, sanitization of failures and session revocation. Review only; no interrupted penetration/reproduction follow-up.

Reviewers must submit evidence independently; this handoff is not a review approval. On qualification failure repair a confirmed defect in an isolated branch; never weaken budget or cancel unchanged jobs to obtain green. Draft integration depends on genuine reviews and qualified ancestor PRs. Actual merge tree and main-push qualification must be checked after any future ordinary merge. P1 authenticated attachment/references recovery, key rotation and persisted delivery/lease policy remain open.

No release, deployment, force push, branch deletion, paid API or unrelated/paused automation mutation. The owner's credit balance is not observable.
