# Handoff — project paused 2026-11-11

The repository owner paused this project at 01:06 UTC on 2026-11-11 (all workers except two other
projects were told to finish and update GitHub). From 01:13 UTC agents were also failing with
"out of usage credits". Everything that existed at that point is on GitHub; nothing was merged to `main`.

## What is on GitHub

| Branch | Head | Content | Evidence |
|---|---|---|---|
| `integration/classrup-completion` | `75d4bf5` | Stage 3/4 kernel + local alpha + seven reviewed fixes + planning docs + `pnpm run status` + status documents | Local: typecheck, spec, deps, 168 unit, 18 CLI, 8 tooling tests, build, 10 Chromium journeys all pass. GitHub Actions on this head had been queued since 00:58 UTC and had not started when this was written |
| `agents/ci/trim-workflows` | `3f41b81` | Workflow changes and `tools/ci/plan.mjs` | Local tooling tests 14/14. **Never run on GitHub** (parked with `[skip ci]`) |
| `agents/discovery/coarse-filters` | `4f60ff9` | F06.S02.M01 coarse regions, F06.S01.M03 search filters | Lane tests 24/24, 23 test IDs. Unreviewed |
| `agents/discovery/ranking` | `de8f44d` | F06.S03.M01 relevance, F06.S03.M02 fairness | Lane tests 34/34, 22 test IDs. Unreviewed |
| `agents/i18n/languages-currencies` | `a0f9422` | F14.S02.M01 languages, F14.S02.M02 currency display | Lane tests 41/41, 18 test IDs. Unreviewed |
| `agents/notify/prefs-inapp` | `d6076d1` | F13.S02.M03 channel opt-in/out, F13.S02.M04 in-app preferences, F13.S01.M03 in-app notifications | Lane tests 31/31, 28 test IDs. Unreviewed |
| `agents/governance/taxonomy-prohibited` | `9972491` | F18.S01.M03 goods taxonomy, F18.S01.M02 prohibited items | Lane tests 28/28, 17 test IDs. Unreviewed |
| `agents/privacy/classification-metadata-consent` | `2752f04` | F10.S02.M02 classification model, F10.S02.M03 metadata minimization. **F10.S01.M01 consent not started** | Lane tests 44/44, 21 test IDs. Unreviewed |
| `agents/moderation/rate-limits-signals` | `c098f1b` | F12.S03.M03 rate limiting, F12.S03.M04 account limits, F12.S03.M02 fraud signals | Lane tests 60/60, 29 test IDs. Unreviewed |
| `agents/orchestration/wave1-handoff` | this branch | This file and `docs/status/wave1/` | Documentation only |

"Lane tests" were re-run by the integration lane on each implementation commit together with
`typecheck`, `deps:check` and `spec:check` (all 0 errors). Every lane's diff stays inside its modules'
code directories. The full suite and the browser journeys were **not** run on any lane branch, and no
lane has run on GitHub Actions (each is parked with `[skip ci]`).

"Test IDs" counts distinct `TEST-PS-…` IDs on passing tests. Whether each test really performs its
specification row is exactly what the review stage was for, and that stage did not run.

## Lanes that produced nothing

| Lane | Modules | What happened |
|---|---|---|
| B1 | F01.S04.M01 purchase offers, F01.S04.M02 negotiation | Stopped after 15 minutes of reading; no file written |
| B2 | F01.S02.M01 sell, F01.S02.M02 wanted, F01.S02.M03 giveaway terms | Agent died on a usage-credit error; no file written |
| C1 | F09.S01.M01 noncustodial claims, F09.S01.M02 cash, F09.S02.M01 receipts | Agent died on a usage-credit error; no file written |
| M1 | F08.S01.M02 threads, F08.S01.M01 private messages | Stopped; no file written |
| M2 | F08.S02.M02 consent capture, F08.S03.M01 safe meetup guidance | Stopped; no file written |
| U1 | F02.S03.M04 cycle execution and recovery | Stopped; no file written |
| X2 | F12.S01.M01 flags, F12.S01.M02 evidence, F12.S02.M02 spam detection | Agent died on a usage-credit error; no file written |

Their definitions and guidance are in `docs/status/wave1/lanes.json`. No branch was pushed for them.

## Remaining work, in order

1. **Get CI evidence for the consolidation.** Check the two workflows on pull request 24 at `75d4bf5`.
   Firefox, WebKit, Windows and macOS have no local evidence.
2. **Review the seven implemented lanes** (pipeline stages 2 to 4: two independent reviews, fix, verify).
   Start with test honesty and authorization. `docs/status/wave1/reviewer-probes/` shows where two
   reviewers were looking when they were stopped: new-author slots and promoted caps in ranking fairness,
   and agreement between the two currency-formatting engines.
3. **Implement the seven lanes that produced nothing**, plus F10.S01.M01 consent.
4. **Integrate.** Packages `commerce`, `comms`, `moderation`, `notify`, `governance`, `privacy` and `i18n`
   have no `src/index.ts` and no `exports` field; `discovery` and `bazaar` need new re-exports. Lanes were
   told not to touch those files, so nothing imports the new modules yet. Merge each lane with `--no-ff`,
   add the entry points, run the full validation, regenerate `docs/status/FEATURE_STATUS.md`.
5. **Wire the new domains into the PWA** with browser journeys. None of the new modules is reachable from
   the user interface.
6. **Security review of the existing alpha code.** The five-lens review was started and stopped; four of
   five finders died on credit errors and none reported. No finding exists from it.
7. **Run the CI change once** (`agents/ci/trim-workflows`) before relying on it.

## Findings to carry forward

- `packages/vault/src/vault.ts` `restoreBackup` requires the backup's record types to equal the running
  application's codec list exactly. Registering any new record type makes every earlier backup
  unrestorable. Reported to the session that owns the vault slices; not changed here.
- Playwright clears `test-results/`, which is also where the Vitest JSON is written. Run `trace` and
  `status` before the browser tests.
- Each push to a pull-request branch currently starts 14 Actions jobs, 7 of them cancelled duplicates.
  `agents/ci/trim-workflows` removes that.

## Other lanes at the time of the pause

- **Sibling Claude session**, branch `claude/difficult-project-parts-dcqlup`: federation author chains,
  encryption at rest (kernel IndexedDB storage, vault), device recovery (identity), import preflight
  (vault), value balancing and quantity (mutiny, `packages/bazaar/src/listings/index.ts`). Those files
  are its; this lane did not touch them.
- **ChatGPT zero-Codex lane**, branches `chatgpt/zero-codex/*`: one test-first slice per hour stacked on
  the alpha head; pull requests 12, 13 and 14 are its living logs.

## Resuming

```sh
git fetch origin '+refs/heads/*:refs/remotes/origin/*'
git switch integration/classrup-completion
corepack pnpm install --frozen-lockfile
corepack pnpm typecheck && corepack pnpm spec:check && corepack pnpm deps:check
corepack pnpm test --reporter=json --outputFile=test-results/domain.json
corepack pnpm run status --results test-results/domain.json --write
corepack pnpm run test:cli && corepack pnpm run test:tooling
corepack pnpm run test:browser
```

To check a lane: `git switch <lane branch>`, the first three commands above, then
`corepack pnpm vitest run packages/<package> --maxWorkers=2`.
