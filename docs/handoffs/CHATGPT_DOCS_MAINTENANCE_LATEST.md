# ClassRup ChatGPT documentation maintenance handoff

Recorded 2026-11-10 UTC. Source default `main` at `95c46be41233520382566360e7135011412e8e6e`. Reviewed draft alpha PR #10 at `429fcfca9735a323a6ce709d8605429d6c850fdb`, draft continuation PR #11 at `d52b29369271f39a4873ace47c76b1b92d0750b3` and its instructions; PR #8 remains draft.

Documentation-only isolated branch: `chatgpt/zero-codex/docs-wiki-20261110` (based on main). Changed files: `docs/wiki/Home.md`, `docs/wiki/User-Guide.md`, `docs/wiki/Developer-Guide.md`, `docs/wiki/_Sidebar.md`, `docs/wiki/README.md` and this ledger.

Evidence: read main README (planning-only), ADR-0016, `docs/BARTER_ALPHA.md`, `docs/CLI_SETUP.md`, `packages/vault/README.md`, `package.json`, Playwright configuration and workflow definitions at PR #10 head. Checked 2026-11-09 Actions success for that head. Contents distinguish merged/planned vs draft/tested vs incomplete; no protocol or release requirement changed.

Validation: static internal wiki Markdown link existence check on the new source files **passed (0 missing wiki target files)**. Source-pinned GitHub links were assembled from inspected files and exact commits. No runtime tests, Markdown renderer, GitHub live wiki publication or browser link-click test executed in this documentation phase. Live wiki write tool not available.

Open gaps: current main README still accurately describes planning-only baseline, but would require reconciled editing after the alpha is merged; GitHub wiki itself remains unpublished; subsequent changes to PR #10 require re-checking status and commands. Existing specs and TODOs were inspected selectively rather than fully audited; other documentation drift remains for subsequent runs.

Next: ask an authorized GitHub wiki publisher to copy/sync source pages only after checking current wiki content; verify live links; reconcile alpha source and docs after merge or future commits. The next hourly run should inspect PR status first and avoid duplicate doc branches.


## Maintenance rotation 2 — 2026-11-10 UTC

- Source snapshot: `main` planning baseline `95c46be41233520382566360e7135011412e8e6e`, draft alpha PR #10 `429fcfca9735a323a6ce709d8605429d6c850fdb`, new [federation/recovery acceptance matrix PR #15](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/15) `20691f1cce36b1254644ea16bb438ca91221a872`. All are **draft/unmerged** except the planning baseline.
- Isolated docs branch: `chatgpt/zero-codex/docs-wiki-20261110`, starting this rotation at `cb351575ed1f0ce6cd24ff2a6bd9287c3e95ab45`. Changed `docs/wiki/Developer-Guide.md` to link the new trace matrix, while explicitly stating it does not amend approved contracts or complete federation/recovery; document update commit `98eb3d848f23107709453dd0512177b4d6183836`. This ledger is a second documentation-only commit.
- Static navigation check **actually performed** on current wiki source: scanned Markdown local links in `Home.md`, `User-Guide.md`, `Developer-Guide.md`, `_Sidebar.md`; **20 local links checked, zero missing local target files**. External links, heading-anchor semantics, browser navigation and live GitHub Wiki publication were **not** tested.
- Checks: previous PR #10 head retained its historical green Alpha/CLI GitHub Actions runs; PRs #12–#14 showed **no returned PR-triggered workflow runs** for their then-current heads, not a claim of CI passing. New PR #15 and this doc commit require exact-head reinspection. No local pnpm/Playwright or Markdown renderer tests executed.
- Gaps/next: live wiki still not published and requires authorized wiki write access; README, specs and TODOs require incremental reconciliation **after** approved integration. Keep the mandatory User Guide/Developer Guide Home and sidebar links intact. Current privacy caveat remains: key/backup encryption does not imply plaintext IndexedDB domain records are encrypted. No repository settings or release state changed.


## Maintenance rotation 3 — 2026-11-10 UTC

- Snapshots rechecked: `main` planning-only `95c46be41233520382566360e7135011412e8e6e`, experimental alpha PR #10 `429fcfca9735a323a6ce709d8605429d6c850fdb`, draft FED/IOX trace PR #15 `20691f1cce36b1254644ea16bb438ca91221a872`. The two PR #15 exact-head GitHub Actions runs [alpha](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/42824869611) and [CLI](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/42824869654) have since completed **success**. No local tests were rerun here.
- Verified source path behavior in `packages/kernel/src/outbox/dispatcher.ts`, `storage/memory-driver.ts`, `storage/sqlite.ts` plus their tests. Documented the new isolated [draft PR #16](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/16) for cross-tenant aggregate retry isolation in the Developer Guide. Test-first baseline `fe1f9aa849f9bb76140d7700411da62c881166f5` produced an actual **failure** at the Vitest domain stage ([CI run 42832903466](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/42832903466)); its paired CLI run was cancelled. The proposed fix head `a294dd21715edf501aac75bee69f785951985cd5` requires new CI qualification; **do not describe this draft as merged/validated until checked**.
- Only `docs/wiki/Developer-Guide.md` and this maintenance ledger were updated in this rotation. Wiki Home and sidebar still prominently link separate User Guide and Developer Guide; live GitHub Wiki remains **unpublished** because this connector lacks wiki write capability. Preserve the actual privacy boundary (keys/export encrypted, other domain records plaintext IndexedDB), no server custody, optional untrusted relay and no user anonymity claims.
- Validation scope: documentation statements source-pinned and checkable by linked PRs/Actions. Link-target existence is assessed separately from browser rendering and live-wiki publication. No local Markdown browser or domain runtime tests were executed by the docs phase.
- Next: after PR #16's exact-head CI resolves, correct any provisional qualification description; keep User/Developer guides synchronized with verified source and release state. After authorized integration, reconcile the default-branch README and planning/TODO status. No rules, protocols, releases, or settings altered.


### Exact-head qualification addendum (2026-11-10 UTC)
- Draft PR #16's outbox fix head `a294dd21715edf501aac75bee69f785951985cd5` subsequently completed both [Alpha verification 42833329717](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/42833329717) and [CLI setup 42833329675](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/42833329675) with **success**. Alpha job logged **24 Playwright passes**; all **six** OS/Node CLI jobs succeeded. Existing **33** specification warnings persist. All PRs remain **draft/unmerged**, so the wiki User and Developer Guides must not present this change as released.
- Version-controlled wiki navigation was rechecked after documentation edits: **20 local link targets checked, zero missing**; both top-level sections are linked from Home and _Sidebar. Live GitHub Wiki remains unmodified/unpublished. No local tests executed by this docs phase.


---

## Maintenance rotation 4 — 2026-11-10 UTC

- Source reviewed: main `95c46be41233520382566360e7135011412e8e6e` (planning-only), draft alpha PR #10 `429fcfca9735a323a6ce709d8605429d6c850fdb`, draft PR #16 `a294dd21715edf501aac75bee69f785951985cd5`, new regression-only draft PR #17 `18adbfc719a75f7ec1eec793bfbfdb00a1d5e39e`. Both PR #16 exact-head GitHub workflows [Alpha](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/42833329717) and [CLI](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/42833329675) succeeded; existing 33 spec warnings remain.
- Updated `docs/wiki/Developer-Guide.md` at `c976ccb8b99d76e4e303403a808d3eee66cb5be2`, replacing provisional PR #16 CI language with exact-head success and distinguishing new CLI negative test in PR #17 from any implemented fix. [PR #17 CLI 42844193821](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/42844193821) failed on the intentionally newly introduced regression, with six OS/Node jobs reporting failure at the CLI test stage. Its Alpha workflow was still in progress when documentation was changed. No software, financial/protocol requirements, release state or wiki live content changed by this branch.
- **Static link-target check actually run on this rotation:** `Home.md`, `User-Guide.md`, `Developer-Guide.md`, `_Sidebar.md` => 20 local Markdown link references, **0 missing target files**. Home and _Sidebar both contain links to the separate top-level User Guide and Developer Guide. Did not check heading-anchor rendering, remote URLs or live GitHub Wiki availability. The wiki source is **unpublished**; connector lacks direct wiki writes.
- No runtime tests in the docs phase. Next: reconcile PR #17 once a genuine corrective head passes CI; audit specs/TODOs/README drift following authorized integration. Do not describe draft features as shipped.


---

## Maintenance rotation 5 — 2026-11-10 UTC

- Rechecked `main` planning baseline `95c46be41233520382566360e7135011412e8e6e`, unchanged experimental alpha PR #10 `429fcfca9735a323a6ce709d8605429d6c850fdb`, and the isolated CLI regression PR #17. The new regression-only baseline `18adbfc719a75f7ec1eec793bfbfdb00a1d5e39e` completed [Alpha CI 42844193761](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/42844193761) **success**, [CLI CI 42844193821](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/42844193821) **failure on all six OS/Node jobs**. The proposed production correction at `f8ed3a9324de83bd5116b1d7a4a8cfdb8682b88f` is **unqualified** at this ledger update; no full passing exact-head CI is claimed.
- Updated only `docs/wiki/Developer-Guide.md` at `9e8b9222cf94e63a9b9b8b4c3a90a648dee0c7ff` to separate failing test-first baseline from the proposed, unreleased fix. Do not treat the asset validation as shipped or confuse PR #17's source with PR #10's tested head. Source privacy promises remain unchanged.
- Static link-target check actually performed on `Home.md`, `User-Guide.md`, `Developer-Guide.md` and `_Sidebar.md`: **20 relative links, zero missing wiki source targets**; both Home and sidebar link prominently to **User Guide** and **Developer Guide**. This did not test external sites, heading anchors, live browser rendering or actual GitHub Wiki publication.
- No local runtime tests were executed by documentation maintenance. The live GitHub Wiki is **not updated** by this PR; current connector does not provide wiki writing. Open gaps: await exact-head corrective CI; update qualification claims only after successful jobs, reconcile README/TODO after authorized integration, and publish/test live Wiki through an approved method. No release, merge, account-setting or security-protocol changes.
