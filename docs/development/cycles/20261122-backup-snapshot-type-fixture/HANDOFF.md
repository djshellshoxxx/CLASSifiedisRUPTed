# ClassRup continuation — atomic snapshot test fixture admission

2026-11-22 UTC. Frozen source: draft PR #126, head `9ea4fad90c947f9bd0136b307f8f3a1f7983c0a7`, base PR #125 `9c348f88ec6ea9886b016135827e0a5667f50a51`. Isolated child `codex/classrup-backup-snapshot-repo-type-fixture-20261122`; no parent history was rewritten or merged from local-only commits.

## Confirmed hosted Alpha failure and bounded repair

The corrected-head #126 Alpha [45074614282](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/45074614282) finished **failure** in the domain test step; typecheck, specification, dependency, registry, Python money vectors, bundle size and 27 tooling tests passed. Downloaded its exact `browser-failures` artifact #14774777665, `domain.json`. It records **940 passing assertions, zero failing assertions, 240 passing suites and one failed suite**. The failed suite is `tests/integration/backup-inspection-atomic-snapshot.test.ts` at module initialization: `defineRepo: type test.backup-snapshot must be <slug>.<entity>`. Thus the test's three adapter scenarios **did not execute**; do not count the 940 unrelated passing assertions as complete domain qualification. Setup/build/browser stages downstream of the failed step did not execute.

Source review confirmed `packages/kernel/src/storage/repo.ts` requires `/^[a-z0-9]+\\.[a-z0-9_]+$/`. The new fixture used an unsupported hyphenated entity name, unlike existing `test.note` fixtures. Child commit `7234a9f0a1512bdf06e0ba9596d3250bc94b7317` changes only the test fixture's `type` from `test.backup-snapshot` to `test.backupsnapshot`; no production code, timeouts, product caps, v1 wire, signing identities or encryption changed. This is an evidence-based fix for suite initialization, **not** yet an executed passing test.

#126 CLI [45074614289](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/45074614289) completed success with Ubuntu Node 22 and 24, but does not close #126's failed Alpha or qualify this child. Earlier first-head #126 Alpha [45074487619](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/45074487619) had a distinct typecheck failure, corrected in its own prior commit. Preserve it too.

## Fresh three-lane worker handoff (assignments; not approvals)

1. **Independent code review:** On the exact new remote head, verify fixture naming against the kernel `defineRepo` type contract and PR #125's single-read `backupInspection()` semantics. Check cross-adapter transaction lifecycle, no altered identity/signature/v1 behavior and that the test truly injects after a completed read. Publish static review evidence and source identities.
2. **Functional bug hunt:** Run the exact new test first, serially, and report per-adapter assertions, then the existing coverage tests and unchanged hosted domain/build/browser/CLI gates. Inspect actual JSON artifacts for any newly exposed failure. Do not repeat a killed full local suite or change test limits.
3. **Defensive security review:** Source-focused review of principal scoping, private payload/blob-holder non-disclosure, optional-diagnostic error handling, locked-session revocation and read/write snapshot separation. Review/remediation only, no interrupted reproduction follow-ups. Report static-only scope separately from executed product tests.

No actual independent workers were launched or approvals submitted in this environment. Before editing, inspect active owners/current PRs and use a fresh isolated ref; do not modify ancestor PR #126.

## Continuation and integration gates

Obtain the child PR's current-source Alpha and CLI runs, exact Git head/tree, and genuinely independent reviews. Do not merge child or ancestors until each required gate and ancestor integration qualifies; verify the actual merge tree and subsequent main-push checks. The next unblocked P1 production slice after qualification remains authenticated attachment/reference recovery, or delivery/lease-state recovery if owned/blocked; preserve compatibility and keep draft PR #8 untouched. Older failed Firefox #120, Alpha #116, #105, initial local exit 137 and cancelled main-push #56 remain historical evidence, never overwritten.

No release, deployment, force push, branch deletion, paid APIs or changes to older paused/unrelated automations. The owner's remaining credits are not observable.
