# ClassRup — inbox error-code admission and next independent review handoff

Checkpoint: 2026-11-22 UTC. Bounded draft candidate, NOT merged. No release or deployment.

## Frozen remote and actual ownership

- Repository: `djshellshoxxx/CLASSifiedisRUPTed`.
- Frozen parent: draft PR #114, branch `codex/classrup-inbox-attempt-admission-20261122`, observed head `e20a7a03929f3df3355f8c8c44731d24f1c453db`. Parent remained unmodified.
- Isolated new branch: `codex/classrup-inbox-error-code-admission-20261122`, created directly from that published remote commit using GitHub connector, not local-only history.
- Test-first commit `7f7a278d3ecd42918437e62a6ceb0a91cee49956` changes only `packages/kernel/src/storage/contract-suite.ts`.
- First implementation commit `5045e08f56e0ba7a0967381b69acbaafcde69bcf`; corrective review commit `5f8fd635dc4bdd4e2e474d54855d3664c4567e22` ensures a null runtime code is rejected for retry/dead. Both change only `packages/kernel/src/storage/tx.ts`.
- Fetch the final docs commit, published PR head, tree and exact CI runs after publication. Do not substitute the frozen parent or any local-only Git object for the published branch.
- Latest PR search before work found open drafts through #114, including stacked recovery/storage changes, and no submitted reviews on #114. No fresh independent agent or competing ownership claim was observed for this isolated child.

## Source-confirmed defect and bounded repair

`inbox.markRetry(mark, attempts, nextAttemptAt, code)` and `inbox.markDead(mark, attempts, code)` accepted a runtime `code` of arbitrary type. The declared `string` parameter does not check JavaScript callers. The common inbox row constructor forwarded the value to all drivers, and `markDead` additionally writes a dead-letter `errorCode`. For example, a null, object, bigint, or numeric code could be admitted or produce adapter-specific failure. This is a source-confirmed data-admission/portability defect, not evidence of external exploitation.

The common row constructor now requires **primitive string** codes for retry/dead states, while a completed row continues to use **null**. The validation happens before `d.inbox.upsert` and `d.deadLetters.upsert`. Valid empty string, normal error codes, attempts, retry times, signed envelopes, v1 signatures, identity, encryption, product caps, and test limits remain unchanged.

New shared contract: memory, SQLite, and fake IndexedDB attempt eight malformed runtime codes (null, undefined, number, boolean, NaN, plain object, array, bigint) through both retry and dead transitions, assert rejection/unchanged inbox/no dead letter, then check valid empty-string retry and normal dead-letter persistence. This is a committed **test-first regression**, but the RED test was not executed before implementation.

## Verified parent qualification; child qualification pending

- The frozen PR #114 head `e20a7a03929f3df3355f8c8c44731d24f1c453db` has exact-head [Alpha run 45010009176](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/45010009176): completed **success**. Plan and domain jobs succeeded; domain job includes typecheck, spec/dependency/registry checks, independent money vector, tooling, full domain runner, setup, build and browser journeys, each completed success.
- PR #114 [CLI run 45010009208](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/45010009208): completed **success**. Plan and both clean-install Ubuntu Node 22.18 / Node 24 jobs succeeded, with setup, repeat-setup, build, browser smoke and clean-tree checks. These are **parent** results, not child qualification.
- Local `git ls-remote` failed: `Could not resolve host: github.com`. No isolated local checkout/worktree, repository Vitest/SQLite/IndexedDB, browser tests or full TypeScript workspace check were executed here. GitHub connector source review is **static only**. The child needs its own exact-head Alpha/CLI and independent reviews.
- Preserve historical PR #105 Alpha [44968879520](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44968879520) **failed Firefox checkbox** result, the original full local domain suite **exit 137** with no final report, previous setup failures, and PR #56 main-push Alpha cancellation. Subsequent passing descendants do not retroactively change these outcomes.
- Owner credits and usage balance cannot be observed; no exhaustion event has been reported.

## Distinct fresh successor worker assignments — NOT EXECUTED

1. **Code audit:** isolate exact published branch and review all `inbox.markDone/markRetry/markDead` callers and memory/SQLite/IndexedDB persistence. Verify new status-specific code guard, valid empty string, pre-write ordering, and no legitimate caller needing null for retry/dead. Record exact head/tree, code findings, static-only evidence and next handoff.
2. **Functional bug hunt:** run the test-first commit on the original unfixed parent for actual RED if the host permits, then the current child for GREEN across all three adapters. Exercise inbox retries, dead letters, requeue, outbox FIFO, rollback and normal domain delivery; serially run focused tests, workspace typecheck/static/build, Alpha/CLI/browser checks. Do not confuse setup failure, partial tests or queued CI with passing product tests.
3. **Source-focused defensive security review:** inspect trust boundaries for event envelopes, consumer/tenant isolation, retry/dead-letter corruption, replay, receipt preservation and rollback. Perform defensive review, hardening and remediation only; do not resume interrupted attack reproduction. Require a source-confirmed finding and a focused regression before integrating any repair.

The connector available in this run does **not** provide an independent subagent executor. These are unexecuted assignments, **not** separate approvals or a substitute for reviewer evidence.

## Successor priority and integration gate

First reconcile actual CI and independent reviews for this exact head. The mixed 15-codec encrypted restore/reopen acceptance already exists in earlier candidates; do not re-count it. After this bounded integrity fix, `docs/development/REMAINING_WORK.md` still lists P1 attachment/reference recovery, durable delivery/lease-state portability, rotation, interrupted-device/load testing and native WebKit existing-key import. Preserve incompatible draft PR #8 for selective source review only.

Do not merge this child until its actual current-source CI, independent reviews, and qualified ancestors permit integration; then verify the actual merge tree and separate main-push gates. Do not force push, delete branches, release, deploy, use paid external APIs or alter paused/unrelated automations.
