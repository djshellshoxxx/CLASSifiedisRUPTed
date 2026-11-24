# ClassRup PR #79 — round 5 exact-head hosted failure repair and handoff

Date: 2026-11-20 UTC. Repository: `djshellshoxxx/CLASSifiedisRUPTed`.
This document records an *executed* hosted qualification failure on the prior head and a narrow source-evidence-driven repair. It is not a completion claim.

## Remote source and ownership

- Current integration `main` observed: `449a619f1ae7b66cb42d9cab43dd5493bfe42c2e`; PR #56 and PR #57 are already merged, with historical main-push evidence preserved.
- Draft parent PR #78 source: `ad1e56f9bf9f9f9081391ab678f48dc161860ae4`. PR #79 is stacked on this parent, not directly on main. Do not merge draft PR #8 or the local-only pre-publication history.
- PR #79 entering this round: `928b3f29798ab56bdf884697d4b1b5e3a1bf9f2e`, no submitted reviews or separately assigned active reviewers observed.
- **Repair commit:** `e062c88163f8ec8165f1752ad7456f78ea89e358`, file `packages/commerce/src/valuation/currency/currency.test.ts`. This document advances the branch again; successor must fetch the actual new remote SHA and tree.

## Real hosted results for frozen pre-fix source

Alpha verification [run 44834626391](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44834626391), job `domain` 136629055982, completed **failure**, not queued. Install, full TypeScript, spec/dependency/registry checks, independent Python money vectors, bundle budget and 27/27 tooling assertions all passed before the full domain step. The full Vitest command `corepack pnpm test --reporter=json --outputFile=test-results/domain.json` wrote a complete JSON report and exited **1** (not a host-killed or incomplete run).

Artifact `browser-failures` ID `14679235684` contains `domain.json`, [GitHub artifact](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44834626391/artifacts/14679235684). Artifact ZIP SHA-256: `7f98a67e3a11871d1d87d54c556f9607ab8b23e6b6c454cd4996be50e6349a8e`, bytes 50,262; uncompressed JSON SHA-256 `57eb4df84dfac4cdbeff37659f05f8471194ebf2a58a2757c10fb33351a655bc`, bytes 358,349. Parsed Vitest aggregate: **854 total assertions; 853 passed, 1 failed, 0 pending, 0 todo; 245 suites, 243 passed, 2 reported failed**. Only one failed *assertion* was found in the full per-case inventory:

`packages/commerce/src/valuation/currency/currency.test.ts:167` — `TEST-PS-073-09.T09 serializes concurrent duplicate registration, replays command IDs and enforces revisions`: `AssertionError: expected 18 to be 6`. In that same test, two calls attempt to register the same code concurrently with `decimals: 6` and `decimals: 18`. The test already asserts exactly one success and one `COMMERCE_CURRENCY_EXISTS`, but incorrectly assumed that the first call must win. No evidence in this artifact establishes a corrupt persisted registration; the observed 18 value is consistent with the second valid winning writer.

The `tests/integration/backup-coverage.test.ts` file ran **17/17 passed**, including the new required-session-replacement regression. The separate vault backup-coverage file ran **4/4 passed**. Browser journeys and later Alpha build steps were **skipped after the domain failure**; they are not passing Alpha gates.

CLI setup [run 44834626369](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44834626369), on the same frozen head, completed **success**: plan plus Ubuntu Node 22.18.0 and 24.x clean-install jobs, including their selected CLI assertions, setup, build and development/production browser smoke. It is only evidence for that frozen source; it does not qualify this follow-on.

Prior historical Nov 19 local complete-domain runner exited 137 without report; prior unrelated failures/cancelled or pending runs remain preserved separately.

## Repair and rationale

Changed the final currency-test assertion to derive the expected decimals from whichever of the two distinct calls actually returned `ok`; it then requires the stored row to contain that exact winning call's decimals. This retains all existing checks for a single winner, replayed command id, one status event and stale revision conflict. It does not force scheduling order, suppress a race failure, relax product caps/timeouts or change production logic. No vault signing, crypto, identity, encrypted v1 format, backups, schemas, package versions, configuration or workflows were modified.

The local runtime has no usable GitHub DNS resolution, so no fresh checkout/worktree or local test command executed. The **only full executed product test** in this round is the preserved prior-head hosted run above. The new repair is **not yet qualified**. Do not rerun the unchanged failed workflow; wait for or inspect newly triggered current-head runs. Avoid heavy concurrent local suites.

## Next independent fresh-worker assignments

1. **Code audit:** freeze latest PR #79 source/tree; inspect new currency assertion's winner mapping against the actual register command and bus serialization semantics. Verify the test still detects a mismatch (success for one input but persistence of the other), retains idempotent replay and conflict checks. Inspect the backup-inspection validator's exact source and stale-session guard for regressions.
2. **Functional bug hunt:** use isolated worktree from freshly fetched remote PR #79 ref; execute current-head focused currency and backup coverage cases, full TypeScript, then Alpha required domain/browser and CLI selected gates with actual job IDs. If any winner mismatch persists, determine whether product race is real rather than weakening assertions. Record failed setup separately from product execution.
3. **Defensive security review:** source-only inspect tenant isolation and privacy of diagnostic counts, error sanitization, revocation guard, and registry command idempotency. Do not conduct the interrupted reproduction follow-ups. Never mistake a static-only note for an executed security test.

Each successor must provide exact source/tree and commands/CI IDs, distinguish authored vs executed tests, integrate only confirmed repairs, and leave the next durable handoff. Three scopes are instructions, **not** evidence that independent agents were launched or reviewed.

## Integration boundaries

Keep PR #79 draft and unmerged until current-head required Alpha + CLI qualification and genuinely independent sign-off pass, then qualify upstream ancestry, verify the actual merge tree and separate main-push jobs. Preserve paused unrelated automations. No release, deployment, force push, branch deletion, paid external API, or silent budget-exhaustion inference.

