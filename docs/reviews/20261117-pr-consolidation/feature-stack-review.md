# Classrupted feature-stack and mock-framework PR review

Reviewed repository: `djshellshoxxx/CLASSifiedisRUPTed`.
Comparison baseline: `50abc470139a613f4404bdb9fb442f4011c13932` (`main`, merge PR #44).
Review scope: open PRs #3, #4, #5, #7, #40, #41, #42, #43.
This is a consolidation review, not whole-product release qualification.

## Disposition

| PR | Exact head | Evidence | Recommended action |
| --- | --- | --- | --- |
| #3 | `52bed39dda52c680a4299e20aaefe0f4695b2d58` | 1 unique commit versus main, 25 added `app/` files / 1,466 lines. Exact ancestor of #4, #5, #7 and retained `continuation/classrup-20261101`. | Close as superseded mock framework; preserve historical branch. It is not merged into the active application. |
| #4 | `0ac7f962aaa65e17cf1bd0a6d4b6a5438bd5e108` | 52 branch-only commits versus main, 406 changed paths including 35 mock `app/` paths plus obsolete planning edits. Exact ancestor of #5 and #7. | Close as superseded mock framework; do not merge its older planning state into current canonical specifications. |
| #5 | `ab6541552827b82c7bbbcbba282b2836f92cdd37` | 56 branch-only commits versus main, 409 changed paths; adds keyboard focus, saved-page layout and detail-announcement test material above #4. Exact ancestor of #7. | Close as superseded; preserve useful UX acceptance cases at their existing commits. |
| #7 | `25fa6f0a997253aedb53e0d106b2c0a08b050228` | 59 branch-only commits versus main; its actual base-relative diff against #4 is 24 files / 594 additions / 94 deletions. Adds three-engine browser harness and mock-specific CI. Exact ancestor of `continuation/classrup-20261101` at `fa0cf0c33c80e71787539b964a03c0e8a561c718`. | Close as superseded mock qualification; retain source/evidence. Selectively adapt applicable assertions to current app, not the old harness. |
| #40 | `edcb583afc2cba40f32b0cbdbce765d65febbd21` | Exact ancestor of current main; 13 commits behind, zero unique commits, empty merge-base diff. | Close as already integrated via #44. No code or documentation replay needed. |
| #41 | `560b328dd335aebdc12de01ec339c43ebd164be3` | Exact ancestor of current main; 10 commits behind, zero unique commits, empty merge-base diff. | Close as already integrated via #44. Archive recovery and pagination already in active tree, with newer lifecycle work. |
| #42 | `64cfc398ea3ba2449da0ed7adbfe8d99261bbc05` | Shares exact head with #43; all changes except its last commit are already integrated. Only 2 paths / 16 additions / 2 deletions remain against main. | After merging #43, close #42 as fully integrated. Do not merge again into its old stacked base. |
| #43 | `64cfc398ea3ba2449da0ed7adbfe8d99261bbc05` | One unique commit: `fix(pwa): use the current revision when queued area saves execute`. Parent `d020237d6acf7180c2ccea9681a01ff4d700d1bb` already in main. | Merge after exact-head CI and clean integration-tree validation. Independent source review found no blocker. |

## Standards review

### Current candidate #43

No documented-standard breach or material code-smell issue found in the two-file change. No repository-local `AGENTS.md`, `CONTRIBUTING*` or `*STANDARDS*` files were found through the tracked-file search. The change follows existing action-queue and TypeScript patterns and introduces no dependency, API, storage or cryptographic-format change. `git diff --check origin/main...64cfc39` passed.

The revision is now read inside the serialized callback in `apps/pwa/src/location-preferences.ts`, while the user's chosen cell, visibility and entry mode are still captured at submit time. This distinguishes queued intent from the last committed state without adding a new abstraction. Clear-home already reads its revision inside the queued callback.

### Historical mock branches

These are incompatible integration candidates, not identified vulnerabilities in the current alpha:

- `app/src/data/storage.js` stores draft/saved-listing JSON in plaintext `localStorage` and silently falls back to memory on persistence errors. This was expressly allowed for synthetic demos. Reusing that storage path for real alpha records would discard the active encrypted-vault persistence/failure contract.
- `app/src/data/repositories.js` implements listing submission through an in-memory array and synthetic `local-N` identifiers; `app/src/views/barter.js` uses fixed offers/cycles with no consent/matching/settlement. Their own README says no authentication, no service worker, no payments and no real publication. They must not become a second user-facing runtime with implied production parity.
- `.github/workflows/demo-verification.yml` only targets `work/classrup-haiku-framework` and executes the mock `app/` workspace plus old Python specification audit. It does not qualify the current `apps/pwa`, encrypted vault or pnpm workspace. Adding it to active main would add obsolete tooling rather than extend current qualification.

These observations support closing the old implementation line as superseded while retaining its branches. They do not support marking historical work as merged when it was not.

## Specification and behavior review

### #43 queued save fix

Requirement basis: PR #43 explicitly requires the current revision when each queued location save executes; current location handoff and F06.S02.M02 require exact optimistic revisions and preservation of edits submitted during asynchronous saves.

Before the change, submit 1 and submit 2 could both capture revision 1 while the first command was pending. The first command would commit revision 2, and the second would then fail its stale revision check despite being serialized in the same UI session. The fix reads `saved.revision` when the callback begins. Each prior callback awaits its own `refresh`, so the next callback sees the committed revision.

Reviewed surrounding protections:

- `createActionQueue()` serializes operations and catches only the tail bookkeeping, preserving rejection to each caller while permitting later work.
- `mountLocationPreferences.run()` checks `active` at invocation and again at execution; `destroy()` sets inactive and clears private state. The fix therefore cannot reuse a new vault session accidentally.
- Submitted user values remain captured outside the callback, preserving the second submitted edit rather than accidentally reading later unsent form changes.
- Revision checks remain enforced by the domain command. Query failure can leave a stale revision and cause a later command to fail closed; no bypass is introduced.
- Existing refresh-generation and input-generation guards continue protecting late query responses and unsaved draft state.

The added integration test uses the real `createActionQueue`, delays the first command, submits a second edit before completion, resolves the first save and supplies revision 2 from the query. It asserts that the first command gets revision 1 and the second revision 2. This is a regression of user-visible behavior, not a test that merely repeats the implementation expression.

### #40/#41/#42

The #40 inventory and #41 archive/pagination work are provably present through ancestry. Existing historical validation caveats in their PR descriptions need not be rewritten as new evidence. #42's description refers to its prior qualified checkpoint; the actual remaining diff is exactly #43's queued revision fix. Closing #42 after #43 removes duplicated stack management without dropping code.

### Useful historical UX evidence to retain

The current `tests/browser/alpha.spec.ts` already exercises mobile overflow, 44px visible controls, keyboard-triggered error display and focus. Current CI/browser composition covers the actual app in three engines. The following legacy cases remain useful references, not drop-in runtime changes:

- `app/scripts/checks/editor-focus-visible.mjs` at #7 verifies both `:focus-visible` and a nontransparent outline at least 2px wide after keyboard submission at 390px and 1280px. Current `alpha.spec.ts` only asserts `#error` focus, although current CSS defines a 3px outline. Adapting those assertions would preserve a small unique coverage improvement.
- `app/scripts/checks/detail.mjs` records title-specific live-region announcements and `aria-pressed` transitions for Save/Unsave. There is no matching real saved-listings workflow in the present alpha to which the whole test can be applied. Preserve as future UX acceptance evidence.
- The mock browse checks preserve focus after pagination, Save and Clear filters, and provide fallback when a focused saved item disappears. Apply these cases when corresponding real controls exist; do not import fixture-backed controls to make the tests pass.

All #3/#4/#5/#7 heads are retained as ancestors of the latest mock continuation `fa0cf0c`; closing their PRs does not delete the source or acceptance evidence.

## Independent execution evidence

Used isolated detached worktree `/workspace/scratch/f78bd6f6beec/classrupted-review-stack` at `64cfc39`; main checkout source untouched.

1. Initial attempt lacked workspace dependency links (`zod` resolution); corrected links to the parent's installed workspace dependencies. This was local worktree setup, not a repository defect.
2. New queued-save test on exact candidate: **1 passed, 9 filtered/skipped**.
3. Retained candidate test but substituted only `apps/pwa/src/location-preferences.ts` with baseline `50abc47`: **expected regression failure**, second command `expectedRevision` was 1 instead of 2. This demonstrates the test detects the old defect.
4. Restored candidate source before further verification.
5. Full candidate location-preference file: **10/10 tests passed**, 4.81 seconds.

## Selective preservation follow-up

Parent requested preservation of the unique visible keyboard-focus assertions
before closing the mock-framework PRs. The isolated branch
`codex/consolidate-keyboard-focus-20261117` updates only
`tests/browser/alpha.spec.ts`. It expands the existing real-vault keyboard-error
journey to 390px and 1280px and verifies `:focus-visible`, a visible outline style,
at least 2px width, and nontransparent outline color. A canvas color probe reads
the browser-rendered alpha so the assertion works with any valid CSS color
serialization. Application behavior is unchanged.

Provenance: `app/scripts/checks/editor-focus-visible.mjs` from original commit
`00d1dce` in PR #5, retained by PR #7 at `25fa6f0`. Existing current-app overflow,
touch-target and error-focus assertions are retained.

Playwright test listing successfully discovers **six cases** (two viewports in
Chromium, Firefox and WebKit). A local focused Chromium run built/started the
application but both cases failed **before test execution** because this host
denied Chromium's process-singleton socket creation (`socket() failed:
Operation not permitted`). No browser assertion pass is claimed; pinned
Playwright Chromium/Firefox/WebKit binaries are absent. Parent must obtain
exact-head hosted browser qualification using:

```sh
pnpm exec playwright test --grep 'visible keyboard error feedback'
```

Full project TypeScript check passed with the test-only change:
`GOMEMLIMIT=256MiB GOMAXPROCS=2 node_modules/.bin/tsc -p tsconfig.json --noEmit --singleThreaded`.
`git diff --check` also passed. Initial typecheck encountered duplicate branded
workspace types because source worktree node_modules symlinks pointed to the
parent checkout's packages; relinking local `@classrup` packages to this worktree
resolved the setup error without any source modification.

Parent independently verified exact-head remote CI: Alpha run `43981540981` and CLI run `43981539765` succeeded for `64cfc398ea3ba2449da0ed7adbfe8d99261bbc05`. This reviewer did not fetch those run logs independently and leaves final integration and CI reporting to the parent.

No GitHub mutation, merge, release or deployment was performed by this reviewer. No manual accessibility, target-device performance or full release qualification is implied.
