# Bug hunt generation 1 — submitted barter intent

## Source and ownership

Base: `3aa7a17b28ee07ebec4336b49c3527743510bc16`, the reviewed PR #56 source.
Work branch: `codex/classrup-bug-hunt-20261119`.
This worker owns only `apps/pwa/src/barter.ts`, its new regression suite and this
handoff/evidence. The coordinator owns integration and remote publication.

Frozen source commit: `4b46abc9240c83a9da9f3800d45b38507d37e331`.

Frozen source blobs: `barter.ts` = `23dc7361b74d74725372ddf281a66c8e90a9b32c`;
`barter-want-intent.test.ts` = `00605c7fc34f5b18084aec6cfe57b9cd727ac069`.

## Confirmed finding and repair

**Medium correctness finding: a submitted barter want could sign different
listing references from the pair selected when the owner submitted it.**
The want form read both select values inside its queued callback, after an
asynchronous fresh-record query. The controls remained editable during either
delay. Changing both selections could therefore sign, retain and download a want
for the later pair. The same behavior substituted a later valid pair when the
originally submitted item had been unpublished before execution.

The handler now captures both listing CIDs synchronously in the submit event.
It validates that original pair against freshly loaded records and uses those
same captured references when signing. A no-longer-published original item fails
without signing, persisting or downloading a substitute. Existing session
revocation and signature verification remain in the path. Wants remain proposals
of interest; this change does not create inventory reservations or consent.

The regression mounts the actual PWA component with controlled DOM and action
timing. It uses real Ed25519 signatures, the real kernel, owner authorization,
listing creation/publication, retained peer listings and the actual want handler.
Assertions verify the exported envelope's signature, exact payload and equality
with the saved want. Neither signature verification nor persistence is mocked.

## Execution evidence

Command for the focused suite:

```sh
corepack pnpm exec vitest run tests/integration/barter-want-intent.test.ts --maxWorkers=1 --reporter=verbose
```

| Check | Observed result |
|---|---|
| Initial unchanged-source reproducer | 3 failed, 1 passed. Both queued/read-delay cases signed the later CIDs. The unpublished-original case resolved instead of rejecting. The destroyed-view guard passed. |
| Isolated unchanged-source confirmation | 3 failed, 1 passed on detached base `3aa7a17`, using the final regression fixture; see `evidence/bug-hunt-g1-red.log.gz`. No source was edited during this run. |
| First repaired run | 4 passed, 0 failed; see `evidence/bug-hunt-g1-green.log.gz`. |
| Final source and fixture run | 4 passed, 0 failed; see `evidence/bug-hunt-g1-final.log.gz`. Runtime and test fixture were held unchanged throughout this run. |
| Full `pnpm typecheck` | Killed with exit code 137 before compiler diagnostics. This is not a passing typecheck. |
| Focused TypeScript check | Passed, exit 0, for `barter.ts`, its new test and their transitive imports using the existing strict compiler options. This is not the full repository typecheck. |
| Frozen dependency install in this worktree | Passed with the pinned lockfile and offline store; 55 packages. |
| Separate baseline-capture preparation | Offline install exited 137 after reporting all 55 packages added. The subsequent capture was interrupted with exit 130 without test results. |

The initial failing run was observed directly before editing production source;
its complete stdout was not saved to a file. A later attempted baseline log
capture overlapped a source edit after its shell invocation yielded. It therefore
ran the repaired source and is retained only as
`evidence/bug-hunt-g1-unpinned-diagnostic.log.gz`, **not baseline qualification**.
The four-case repaired run qualifies the behavioral correction; it does not
replace failed or interrupted attempts. No full-suite or browser pass is claimed
by this worker. Two subsequent test-fixture edits only made the signer parameter
type and returned envelope shape explicit; the final run covers those edits.

The final regression and focused typecheck used a 512 MiB Node heap and a
90-second process cap; no test timeout or product acceptance limit changed.
The focused typecheck used an external temporary config extending
`tsconfig.base.json`, included only the two changed TypeScript files (with their
transitive imports), and explicitly resolved `typeRoots` to this checkout's
`node_modules/@types`. Its initial temporary config omitted that path and failed
with TS2688 before source checking; that setup failure is retained in
`evidence/bug-hunt-g1-typecheck-config-error.log.gz`. The corrected invocation
completed with exit 0 and empty diagnostic output.

Captured logs are gzip archives preserving their exact emitted bytes.
`evidence/bug-hunt-g1-results.json` records outcomes and decoded SHA-256 digests.

## Reviewed scope and remaining handoff

Read through the PWA listing editor, revision-history view, closure form,
maintenance scheduler, action queue, session guards and adjacent listing
lifecycle/history commands. These inspections did not reproduce another defect
within this bounded pass. They are not a declaration that those areas are free
of bugs.

The fresh worker should independently review the submitted-pair fix and run the
affected suite plus the project's typecheck on the combined candidate. Additional
signing UI review should examine accepted-action input snapshots and fresh
listing eligibility. In particular, the current want handler's eligibility
predicate is narrower than the menu/matching predicates for local quantity and
expiry and peer barter/availability. Establish a reproducible user-facing failure
and the intended contract before changing that behavior; it is an observation,
not a confirmed security vulnerability.

Backup coverage, storage, the public CLI and security-import work are owned by
the other current workers. Coordinate before editing their files. No remote
branch, deployment, release or main ref was changed by this worker.
