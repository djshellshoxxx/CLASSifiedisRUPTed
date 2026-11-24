# ClassRup — record-restore revision admission, qualification and worker handoff

Checkpoint: 2026-11-22 UTC. **Draft/source-only candidate; do not claim local application tests or independent reviews.**

## Exact continuation and ownership

- Canonical repository: `djshellshoxxx/CLASSifiedisRUPTed`. Main at last verified `449a619f1ae7b66cb42d9cab43dd5493bfe42c2e`. Initial November 19 handoff: `docs/development/cycles/20261119/{HANDOFF,QUALIFICATION}.md`. Read all later handoffs and `docs/development/REMAINING_WORK.md` before taking new ownership.
- Current direct parent: draft [PR #105](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/105), head `a39152e1ae2e2583a2b66813528dbbc298517634`, tree `6ad5f7afbda51c08b8ecc5de33f256ac3705c2dc` observed before fork. Parent unchanged. Prior draft #104 corrected expected revision validation. Do not replay local-only history or merge incompatible draft #8.
- Isolated child branch `codex/classrup-restore-revision-validation-20261121` created from the exact published #105 SHA. Test-first published commit `c2a86f75af3fadda80c51d3a31486f6a44dda76b`; implementation published commit `b163f5bf4dbf44bfb6e74d954b17241b3ce67358`. Final SHA/tree should be verified after this handoff commits.
- Changed product files only `packages/kernel/src/storage/tx.ts` and `packages/kernel/src/storage/contract-suite.ts`; this handoff is the third file. No other branch, main, paused automation, deployment, release or API usage was changed.

## Source-confirmed defect and bounded correction

`tx.records.restore` wrote `rec.revision` directly to the driver with **no numerical admission**, while normal CAS expects safe integer revisions. A revision 0, negative, fractional, non-finite or above `Number.MAX_SAFE_INTEGER` could be restored in a memory driver or produce inconsistent adapter failure/identity behavior; revision 0 particularly breaks the `expectedRevision:0` create-only intent, and unsafe revisions cannot participate correctly in precise CAS.

The new `restore` precondition requires a **positive safe integer** before the existing `jsonText`, driver read and early identical/conflict branch. The new shared storage-contract regression checks invalid 0, negative, fractional, NaN, +/-Infinity and 2^53 on both absent and existing records; it verifies absence/unchanged state, valid idempotent duplicate restoration, and retention of a valid maximum-safe revision. This contract suite is included by memory, SQLite and fake IndexedDB adapters. The change intentionally leaves existing exported v1 record signatures, codecs, signing keys, encrypted vault format, product bounds, index layout and test timeouts unchanged.

**Test-first commit was not run RED.** No local repository checkout/worktree, TypeScript, Vitest, browser or true RED/GREEN run was possible because this execution host still reports `Could not resolve host: github.com` for Git. The GitHub connector supplied remote file reads/writes, not an executable checkout. Treat review here as source-only.

## Parent qualification reconciliation (PR #105)

- Parent [Alpha run #44968879520](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44968879520) **completed FAILURE**, not passing: plan successful; domain job passed full typecheck, spec/deps/registry, independent money reference, budget, tooling **27**, full domain **873 passed / 0 failed / 0 pending / 0 skipped**, setup and build. Browser **77/78 passed**; one Firefox journey failed before its actual expiry assertions, at `tests/browser/alpha.spec.ts:25` inside `listing()` in the test at line 90: `locator.check: Clicking the checkbox did not change its state` for `Allow this listing`. Artifact `browser-failures` ID `14733082444` contains a failure screenshot and error context. Root cause *not established*; do not classify as flake or CAS regression without reproduction.
- Parent [CLI #44968879523](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44968879523) **completed SUCCESS**, including Ubuntu Node 22.18.0 and 24.x clean-install smoke jobs.
- Parent #105 and #104 had **zero submitted independent reviews** at inspection. Parent source qualification is failed and remains a merge blocker even if a child run later passes. No repeated unchanged queued CI or killed full suite is authorized without a targeted remedy.
- All historical failures stay distinct: November 19 full local domain exit 137 with no final report; PR #56 main-push Alpha `44658477772` cancelled and CLI `44658477821` succeeded; earlier individual-PR qualification cannot be substituted for current sources.

## Three fresh independent successor assignments — **not executed**

1. **Code audit worker** — use an isolated worktree from exact published remote ref; review `recordStore.restore/put/remove`, CAS semantics at 0/1/MAX_SAFE, valid v1 backup revisions, return/error contract and adapter compatibility. Inspect the new delta and confirm no unintended effect on signature/identity/crypto. Execute targeted TypeScript + storage contract tests *serially* and document exact SHA/tree/commands/outputs.
2. **Normal functional bug-hunt worker** — run the test-first commit `c2a86f75af3fadda80c51d3a31486f6a44dda76b` as a RED control and final candidate as GREEN across memory, SQLite and fake IndexedDB, then test persistent reopen, malformed archive failure atomicity, conflicting existing IDs, ordinary version 1->2 and max-safe behavior. Independently triage parent Firefox checkbox failure using the artifact and a targeted reproduction under the mocked clock. Do not rerun unchanged full browser suites without a reason.
3. **Defensive security-review worker** — source-only review of untrusted backup imports and validation order, tenant/identity-bound CAS behavior, precision/serialization of revisions, and early-return handling. Remediate only source-supported defects. Do not resume interrupted offensive reproduction follow-ups. Record whether the review is static or executed; neither can be claimed without evidence.

Each worker leaves a source/tree identity, exact setup and executed checks, failures, remediations and a successor handoff. Do not run heavy suites concurrently on a pressured host. These assignments are requests for *future independent agents*; none were spawned in this invocation.

## Integration and remaining features

Publish this as a draft stacked only on #105 and verify branch ancestry. Inspect exact-head hosted Alpha and CLI after creation; do not call queued, partial or old parent workflows passing. Merge only once **every dependency** has required final-source qualification and genuine independent review, and verify merge trees and main's own push workflows. If still blocked, prioritize actual Firefox diagnosis plus independent review rather than adding indefinite stacked fixes.

Main already contains the mixed production-codec encrypted restore/reopen slice. Subsequent bounded recovery work remains attachment/reference restoration, delivery/lease recovery, rotation and device-interruption acceptance, as documented in `REMAINING_WORK.md`. No deployment, release, force push, branch deletion, paid API or change to other automations. No credit balance is observable, and no budget exhaustion was reported.
