# ClassRup — inbox attempt-count admission and next worker handoff

Checkpoint: 2026-11-22 UTC. Draft candidate only; no merge, release or deployment.

## Fresh remote source, boundaries and ownership

- Repository: `djshellshoxxx/CLASSifiedisRUPTed`.
- Current parent is draft PR #113, branch `codex/classrup-sync-enqueue-unique-id-20261122`. Its *actual observed remote* head at fork and after the implementation was `2e36d4eda0eb12a9aa0ba3cf8e12bec2acd913fe`, tree `b9c511f88616145fc0430655c8847b4980f0f0a5`.
- New isolated remote branch: `codex/classrup-inbox-attempt-admission-20261122`. No local-only commits or unpublished history were merged. The local host could not resolve `github.com` and could not clone or make a local worktree.
- Test-first commit `08868d188e8a4358d67dee80d4f1b4a91c9251da` adds a shared adapter regression in `packages/kernel/src/storage/contract-suite.ts`. No pre-fix RED test run was executed.
- Production correction `44f7cb8ee619c66ab01dffe11a108f7ba131fb84`, tree `5fd999a0926f8b228704f5d8cb3545a9aa0512eb`, modifies only `packages/kernel/src/storage/tx.ts`.
- GitHub compare at the implementation commit: 2 commits ahead / 0 behind the frozen parent, exactly those two paths. This handoff is a separate docs-only commit; resolve the final published head and tree in the PR and GitHub checkpoint.
- Latest PR search at this checkpoint showed the established open draft stack #74–#113 and other earlier feature drafts; no independent worker review or competing ownership claim was found on this newly isolated branch. Avoid rewriting any ancestor or merging draft #8.

## Confirmed bounded source defect and fix

The common `inboxStore` row constructor forwarded the runtime `attempts` count unchanged to all adapters. Unlike the already-hardened `sync.transition()`, `inbox.markDone`, `inbox.markRetry` and `inbox.markDead` accepted negative, fractional, non-finite, unsafe or nonnumber counters despite the declared `number` type. This could leave inconsistent inbox/dead-letter retry histories across memory, SQLite and IndexedDB. `markDead` persists both inbox and dead-letter rows, making pre-write validation important.

The limited correction checks `Number.isSafeInteger(attempts) && attempts >= 0` in the single row constructor *before* any driver upsert. Ordinary zero, positive safe integer counts, valid retry times, error codes, envelope serialization and state/status meanings are unchanged. This is a source-confirmed admission defect, not a claim of a demonstrated malicious exploit.

New shared contract case tries 8 malformed runtime values against each of the three operations and checks the unchanged inbox plus the absence of a dead letter after every rejection. It also verifies a valid zero-count retry, one-count completion and two-count dead-letter persistence. The same contract is imported by memory, SQLite and fake IndexedDB test suites. The new test was committed before the implementation, but no repository RED/GREEN execution occurred locally.

## Verified qualification, prior failures and limitations

- Frozen parent #113's [Alpha 45005310933](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/45005310933) **completed success**; its plan and domain jobs completed, including typecheck, spec/dependency/registry checks, independent money vectors, tooling, full domain, setup, build and browser journeys. Its [CLI 45005311038](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/45005311038) **completed success**, including two Ubuntu clean-install/smoke jobs under Node 22.18 and Node 24. These checks qualify parent only.
- Current candidate requires its **own exact published-head** hosted Alpha and CLI qualification, all required actual job steps and independent review. Those results cannot be inferred from parent or a queued job.
- Local `git ls-remote` failed with `Could not resolve host: github.com`. No isolated local repository checkout, full TypeScript workspace check, Vitest, real SQLite/IndexedDB or browser tests were executed here. A standalone Node 22 predicate classified 4 valid and 8 invalid values as expected; **this is not a product test**.
- Historical PR #105 [Alpha 44968879520](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44968879520) **failed** on a Firefox checkbox journey. Later green descendants do not rewrite it. The 2026-11-19 complete local domain runner was killed, exit 137 with no report; its failed/incomplete evidence remains. PR #56's main-push Alpha cancellation is separate, and PR #57's later successful main-push verification does not cover this draft.
- No independent reviews, remote worker runs, or genuine external approvals are claimed. No exhausted credits or exhausted usage budget were reported.

## Three distinct successor reviewer assignments — NOT EXECUTED

1. **Fresh code audit:** With an isolated checkout of the actual current published head, inspect every inbox mark caller, retry-counter increments, transaction semantics, and SQLite/IndexedDB/memory bindings. Check that the guard runs before both `markDead` writes, that the valid zero value is compatible and that no production caller relies on invalid counts. Log exact head/tree and all static-only conclusions.
2. **Fresh functional bug hunt:** Execute the test-first commit against the original unfixed source for real RED if feasible, then test the fix for GREEN across all three adapters. Inspect the normal inbox/outbox dispatch/retry/dead-letter/requeue flows and error recovery; run focused contract suites, typecheck, static/build, full required hosted and browser gates without concurrent memory-heavy runners. Retain setup failures separately from product tests.
3. **Fresh defensive security review:** Review source-only input-trust boundary and persistent delivery integrity, malformed counters, tenant/consumer isolation, state replay, receipt preservation and transaction rollback. Confirm any finding before repairing it; do not resume interrupted offensive reproduction follow-ups. Record exact source identities and remaining risks.

Only actual independent work counts as an independent review. The GitHub connector in this execution offers no separate subagent executor; this is a durable assignment, not three completed review reports. Reconcile reviewer findings and independently qualified ancestor-by-ancestor integration before merging. Verify actual merge tree and separate main-push workflow results if integration becomes authorized.

## Next feature priority

The mixed production-codec encrypted restore/reopen acceptance has already been implemented in its own earlier work; do not re-count it. `docs/development/REMAINING_WORK.md` still identifies P1 attachment/reference portability, queue/delivery/lease recovery, rotation, interrupted-device/load acceptance and native WebKit existing-key import. This inbox admission fix is a narrow delivery-state correctness repair, **not** the broader excluded-store recovery milestone.

No release, deployment, force push, branch deletion, paid API use or changes to paused/unrelated automations are authorized. The credit balance is not observable.
