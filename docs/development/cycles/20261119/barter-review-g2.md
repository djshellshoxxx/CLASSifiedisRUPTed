# Barter review generation 2 — submitted item selections

## Source and ownership

Reviewed integration source: `6efd1074bacaffcefc448bccd835acf69369474c`.
Work branch: `codex/classrup-barter-review-g2-20261119`.
Original fix: `4b46abc9240c83a9da9f3800d45b38507d37e331`, integrated as
`fdb6038c2ece910f150aee2d23f7b805f37dd332`.
Previous handoff read from
`552d55ad788c9b9bf01f4a4916769bbc216305be:docs/development/cycles/20261119/bug-hunt-g1.md`.

The original diff was reviewed with
`git diff 4b46abc9240c83a9da9f3800d45b38507d37e331^...4b46abc9240c83a9da9f3800d45b38507d37e331`.
Both files below have identical blobs in the original fix and the integration
source used for this review:

| File | Frozen Git blob |
|---|---|
| `apps/pwa/src/barter.ts` | `23dc7361b74d74725372ddf281a66c8e90a9b32c` |
| `tests/integration/barter-want-intent.test.ts` | `00605c7fc34f5b18084aec6cfe57b9cd727ac069` |

This independent worker owns this handoff and its execution evidence only. No
production source, test fixture, integration branch or remote ref was changed.
The coordinator owns integration and publication.

## Standards

**No findings in the reviewed patch.** The change follows the bounded-change and
focused-regression guidance in `docs/wiki/Developer-Guide.md`, under
"Contribution and release evidence". It leaves the existing signed-envelope,
authorization, session and persistence boundaries intact. The two captured
strings have names matching their payload fields; no new abstraction or unrelated
behavior was introduced. No documented-standard violation or actionable code
smell was identified in this diff.

## Spec and behavior

**No reproducible correctness regression found in the submitted-pair fix.** The
behavior matches the prior handoff's requirement to capture both CIDs
synchronously, validate the original pair against fresh records and sign those
same references. Review results are bounded to the source and checks below.

| Requirement | Source reasoning and observed evidence |
|---|---|
| Use the submitted pair | The submit listener copies both select values into primitive string constants before calling `run`. The queued handler uses only those constants for both record lookup and the want payload. Both the queued-delay and read-delay regression cases passed; the exported envelope was cryptographically verified and matched the retained envelope. |
| Recheck the original item | The handler performs a new `mutiny.alpha.inputs` query after entering the queued action. The offered record must still have the captured publication CID, belong to the session principal, be published and opt into barter. The captured peer CID must still have a projection, be unconflicted, belong to another owner and be unexpired. Unpublishing the submitted local item before queue execution rejected without signing, persistence, download or success messaging, even after both controls selected a later valid pair. |
| Reject obsolete view/session work | `run` rejects a destroyed view before executing the callback; `load` checks liveness before and after its awaited query. The mounted teardown regression passed. The unchanged action binding compares exact session object identity. Existing action-queue and vault-session tests passed for replaced/locked sessions, including private results arriving during post-commit delivery. `main.ts` also binds success messages and downloads to the original session. |
| Preserve existing behavior | The want type, seven-day expiry construction, signature verification, retain command, download naming, success message and final refresh are unchanged. The patch adds no reservation or consent. Queue failure recovery and current-session work remained covered by the passing action-queue suite. |

The source review included `barter-runtime.ts`, the PWA action/session composition,
`action-queue.ts`, `vault-session.ts`, the envelope signer, identity revocation and
the relevant listing publication lifecycle. This inspection supports the narrow
conclusions above; it is not whole-application qualification.

## Execution evidence

Node: `v24.22.3`. Vitest: `5.1.0`. Production and test files remained unchanged
throughout the runs. Existing installed dependencies were reused through temporary
root and per-package links in the isolated worktree; no dependency install or
lockfile change was made. Those temporary links were removed after validation.

Final focused invocation:

```sh
env NODE_OPTIONS=--max-old-space-size=512 timeout 90s corepack pnpm exec vitest run tests/integration/barter-want-intent.test.ts tests/integration/action-queue.test.ts tests/integration/vault-session.test.ts --maxWorkers=1 --reporter=verbose
```

| Attempt | Observed result |
|---|---|
| Initial root-only dependency reuse, barter and action-queue suites | Exit 1: both action-queue tests passed, but the barter suite failed collection because the isolated kernel package could not resolve `zod`. No barter assertion ran. This was a worktree setup failure. |
| Corrected per-package dependency links; final focused invocation above | Exit 0: 3 files, 11 tests passed in 7.54 seconds: 4 barter intent cases, 2 action-queue cases and 5 vault-session cases. |
| `git diff --check` on the original fix | Exit 0, no diagnostics. |

Exact captured output is retained as
`evidence/barter-review-g2-setup.log.gz` and
`evidence/barter-review-g2-focused.log.gz`. The accompanying
`evidence/barter-review-g2-results.json` records commands, source blobs, exit
codes, setup context and SHA-256 hashes of the decoded logs. The setup failure is
preserved alongside the passing rerun.

## Limits and handoff

- No full suite, typecheck, build or browser journey was run in this worker, as
  directed because of shared memory pressure. The focused suites use Node and a
  stub DOM with real domain handlers and Ed25519 signatures. They do not establish
  browser/IndexedDB behavior or every possible teardown point during signing.
- The stale-session tests cover the shared queue/result guards independently;
  they do not execute a complete mounted barter action through `main.ts` while a
  real browser vault locks. Liveness across the fresh-input read was additionally
  inspected in source.
- The fix preserves the existing eligibility predicate. This review does not
  establish a complete matching-eligibility check at want creation, an atomic
  inventory reservation or a recheck after every later asynchronous operation.
  The previous handoff's local expiry/quantity and peer availability/opt-in
  observations remain outside this patch's proven correction. No additional
  reproducible user-facing failure was established here.
- The passing result qualifies only the frozen source above and the named
  scenarios. Later integration changes require their own relevant validation.

Review totals: Standards — 0 findings; Spec/behavior — 0 findings in the reviewed
patch. No additional source repair is proposed by this worker.
