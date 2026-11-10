# Developer Guide

[Home](Home.md) · [User Guide](User-Guide.md)

## Scope and source control

The default `main` revision `95c46be41233520382566360e7135011412e8e6e` documents the architecture but does not contain the alpha executable. The source-backed implementation is draft [PR #10](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/10), exact head [`429fcfca9735`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/commit/429fcfca9735a323a6ce709d8605429d6c850fdb), stacked on draft [PR #8](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/8). Its green CI does not authorize merging or shipping. Follow [ADR-0016](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/blob/429fcfca9735a323a6ce709d8605429d6c850fdb/planning/adr/ADR-0016.md) and the [canonical contract index](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/blob/429fcfca9735a323a6ce709d8605429d6c850fdb/planning/CONTRACTS.md); do not reintroduce a relay-authoritative account model.

## Prerequisites, local build and setup

Node >=22.18.0, pinned pnpm 10.28.0 via Corepack, Git and a modern browser. The review checkout must be the exact validated commit. Run from repository root:

```sh
git clone https://github.com/djshellshoxxx/CLASSifiedisRUPTed.git
cd CLASSifiedisRUPTed
git checkout 429fcfca9735a323a6ce709d8605429d6c850fdb
corepack pnpm install --frozen-lockfile
corepack pnpm run setup --non-interactive
corepack pnpm run doctor
corepack pnpm dev
# Separate terminal or after stopping dev:
corepack pnpm build
corepack pnpm preview
```

No product account or remote database is configured by setup. Configuration lives in ignored `.classrup/local.json`; see [CLI reference](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/blob/429fcfca9735a323a6ce709d8605429d6c850fdb/docs/CLI_SETUP.md). `pnpm run setup` / `pnpm run doctor` are required because the bare words invoke pnpm built-ins.

## Architecture and module map

- `apps/pwa`: browser UI, service worker, signed file/barter workflows; local vault is authoritative.
- `packages/kernel`: contracts, command bus, transactions, storage ports, IndexedDB, observability and tests; Node-only relay facilities are separated.
- `packages/identity` and `packages/security`: user-held signing identity and cryptographic primitives.
- `packages/vault`: passphrase-wrapped identity, vault lifecycle and partial encrypted alpha backup.
- `packages/federation`: signed envelope verification. Author-global sequence buffering, retention and device-recovery closure are incomplete.
- `packages/bazaar` / `packages/discovery`: listing authoring and verified retained public projections.
- `packages/mutiny`: bounded signed matching and transactional proposal/reservation/consent coordination.
- `tools/cli`, `tools/specgen`, `tools/trace`: local CLI, specification validation and executed-test trace reporting.
- Other declared packages are largely specification scaffolding; do not infer fully implemented services, auctions, rentals or settlements from their presence.

## Test and CI commands

```sh
corepack pnpm typecheck
corepack pnpm spec:check
corepack pnpm deps:check
corepack pnpm test
corepack pnpm run test:tooling
corepack pnpm run test:cli
corepack pnpm build
corepack pnpm exec playwright install --with-deps chromium firefox webkit
corepack pnpm run test:browser
```

The [alpha verification workflow](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/blob/429fcfca9735a323a6ce709d8605429d6c850fdb/.github/workflows/alpha-checks.yml) runs frozen install, typecheck, spec/dependency checks, tooling/domain tests, trace reporting, build and Chromium/Firefox/WebKit Playwright journeys on Linux. The [CLI setup workflow](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/blob/429fcfca9735a323a6ce709d8605429d6c850fdb/.github/workflows/cli-setup.yml) runs a six-job OS/Node matrix (Ubuntu, Windows, macOS × Node 22.18.0 and 24.x), including Chromium dev/preview smoke. At exact head `429fcfca9735`, [alpha CI](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/42611628000) and [CLI CI](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/42611627973) succeeded November 9, 2026; alpha logs reported 24 Playwright passes and 33 **unresolved specification warnings**. Run these commands yourself after changing code; historical CI is not evidence for future commits.

For requirement-to-test mapping use `planning/REQUIREMENTS_CHECKLIST.json`, `planning/CONTRACTS.md`, `tests/integration`, `tests/browser`, and `corepack pnpm trace --results test-results/domain.json` after producing the appropriate Vitest JSON report. The trace tool's output is evidence about *executed* tests, not proof of end-to-end protocol completeness.

## APIs, contracts and security rules

Start with [CTR-FED-001](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/blob/429fcfca9735a323a6ce709d8605429d6c850fdb/planning/contracts/CTR-FED-001.md) for signed statements, [CTR-IOX-001](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/blob/429fcfca9735a323a6ce709d8605429d6c850fdb/planning/contracts/CTR-IOX-001.md) for backups/recovery, [CTR-PRV-001](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/blob/429fcfca9735a323a6ce709d8605429d6c850fdb/planning/contracts/CTR-PRV-001.md) for privacy and [CTR-TST-001](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/blob/429fcfca9735a323a6ce709d8605429d6c850fdb/planning/contracts/CTR-TST-001.md) for test evidence. Kernel code is shared across vault and optional future relays; do not place secrets on relays or create implicit server authority. Never replace explicit consent with suggestions, inferred delivery, or UI-only state. Reject invalid signatures, stale revisions and incompatible canonical schemas; retain honest disagreement/conflict states.

Current threat boundaries: private domain records are **plaintext IndexedDB**, the backup is incomplete, optional relays are not trusted parties, local reservations are not distributed locks, and pseudonymity is not anonymity. Do not create public issues with exploitation details for undisclosed security findings. Review existing code and negative tests before changing cryptography, schema migrations, storage or inventory.

## Contributing, debugging and release gates

Before editing: inspect active PRs and owner branches, read source-pinned handoffs, select an isolated branch, and write a failing regression test for a verified bug. Keep contracts/specs synchronized with approved decisions only. Review diff, rerun relevant tests, and use a **draft PR** with source SHA, passing/failing commands, CI links, limitations and acceptance criteria. Don't rewrite another agent's work. For browser regressions use Playwright traces/screenshots and local `dev`/ `preview`; for CLI problems run `pnpm run doctor` and check ignored `.classrup/local.json`. Reference [alpha evaluation record](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/blob/429fcfca9735a323a6ce709d8605429d6c850fdb/planning/LOCAL_ALPHA_20261109.md).

Release procedure is **not automatic**: settle PR #8 → #10 branch dependencies, independently qualify privacy and canonical recovery/federation, reconcile spec warnings, pass refreshed security and browser CI, obtain explicit owner authorization, then prepare changelog/versioning/hosting. No alpha release, deployment or production certification has yet been verified.

## Outstanding engineering work

A separate **draft, unmerged** [FED/IOX/ADR-0016 source-to-acceptance gap matrix](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/15) maps canonical federation and recovery requirements to the current alpha source and enumerates negative-test gates. It is an implementation plan, **not** a protocol amendment or proof that incomplete features are available. In particular, alpha per-subject chains do not supply canonical per-author gap buffering, and the encrypted alpha backup does not include complete JSONL export, media and recovery-kit scope. Follow the existing approved contracts before making changes.

Canonical federation and device recovery; private-record encryption and migration; quantity-aware stock; complete counteroffer/handover UX; conflict resolution; expanded negative/regression testing and threat review; live wiki publication. The [project TODO](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/blob/429fcfca9735a323a6ce709d8605429d6c850fdb/PROJECT_TODO.md) and [continuation specification](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/11) track the intended direction; they are not assertions of completion.


### Test-first kernel outbox qualification (draft, not integrated)

The kernel shares an event outbox across vault and optional relay storage adapters. A retry must not suppress an independent event stream with the same aggregate ID under a different tenant or aggregate type. Isolated [draft PR #16](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/16) adds regression coverage and proposes a scoped fix to the dispatcher, memory/IndexedDB-backed pending query, and relay SQLite pending query. **PR #16 is not merged or released.** Its earliest test-only GitHub Actions domain job failed at the Vitest stage (individual assertions not enumerated). The corrective head `a294dd21715edf501aac75bee69f785951985cd5` subsequently passed [Alpha verification](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/42833329717) and all six [CLI matrix jobs](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/42833329675). These results qualify that **draft head only**, not integration into main.

After checking out PR #16's head, a contributor can run the focused test with:

```sh
corepack pnpm exec vitest run packages/kernel/src/outbox/dispatcher.isolation.test.ts
```

Only a completed test run on the **current** PR head establishes evidence. Do not infer that this fixes canonical federation ordering (CTR-FED-001 FED-3); the outbox is a different internal domain-event delivery mechanism.


### CLI asset-build regression under qualification (draft, not integrated)

The isolated [draft CLI hardening PR #17](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/17) introduced a negative regression test at `18adbfc719a75f7ec1eec793bfbfdb00a1d5e39e`. [CLI setup baseline CI](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/42844193821) **failed that regression in all six OS/Node jobs**; [Alpha baseline CI](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/42844193761) subsequently passed. A separate **draft corrective commit** `f8ed3a9324de83bd5116b1d7a4a8cfdb8682b88f` rejects symbolic links or nonregular public assets before and after staging. **The corrective exact head passed hosted CI**: [Alpha verification run 42853469274](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/42853469274) completed success; [CLI setup run 42853469290](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/42853469290) completed success across all six Ubuntu/macOS/Windows × Node 22.18/24 jobs. Superseded cancelled attempts are not passing evidence. Reproduce the original test with `node --test tests/cli/public-symlink.test.mjs` on PR #17's head. **PR #17 is still draft/unmerged, not a fix in main or a release.** A separate stacked [draft PR #19](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/19) adds nested file-link and linked-directory negative tests on its own branch (head `3a66e440847d7e1234e5a82674decdacb3efb954`); its exact-head [Alpha verification 42865325773](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/42865325773) and [CLI setup 42865325775](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/42865325775) both passed (six of six OS/Node CLI jobs; observed Linux/macOS/Windows Node 22 job logs each reported 18 CLI tests passed, 0 failed, 0 skipped). It changes no production code and remains draft/unmerged; the spec inventory still has 33 warnings. The live Wiki has not changed.


### Barter discovery screen-reader status — unmerged acceptance slice

[Draft PR #20](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/20) starts from the exact unmerged alpha PR #10 head `429fcfca9735a323a6ce709d8605429d6c850fdb` and adds a **test-first** browser assertion at `aa9f690284927b9f736ee70b186611f968083253`. After each 2/3/4-party cycle discovery click, Playwright now expects the barter panel's accessible `role="status"` text to announce matching suggestions under approved CTR-UX-001 UX-2. The original UI shows suggestion cards but its live status only reports retained wants. The **test-only baseline** at `aa9f690284927b9f736ee70b186611f968083253` [failed exact-head Alpha CI](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/42874251095): **9 expected assertion failures** (2/3/4 participants on Chromium, Firefox and WebKit), with 15 unrelated browser checks passing. The job log showed the status remained the signed-wants count rather than announcing `matching suggestions`; the paired [CLI setup run](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/42874251168) passed all six OS/Node jobs. The isolated corrective head `e0f153fd9185eaa5b52882931eac1c694d54abc5` updates the existing `role="status"` after rendering discovery results with a suggestion count and an explicit reminder that no consent/reservation/commitment was created. **Exact-head corrective CI now succeeded**: [Alpha verification run 42884821949](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/42884821949) completed successfully (domain job); [CLI run 42884821917](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/42884821917) succeeded on all six Ubuntu/macOS/Windows × Node 22.18/24 jobs. This qualifies only PR #20's unmerged head, **not main, release readiness or the live Wiki**. The scope does not alter signatures, matching/consent, local holds, identity or recovery.


### No-script local vault access — red regression, draft fix awaiting exact-head CI

The original, unmerged alpha HTML permits vault create/unlock/restore form interaction before JavaScript installs `preventDefault` submit handlers. Draft [PR #21](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/21) adds `tests/browser/no-script.spec.ts`. **Test-first proof:** [Alpha run 42894634951](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/42894634951) **failed on the intended no-script warning assertion in Chromium, Firefox and WebKit** (3 failed, 27 other browser checks passed); [CLI run 42894635014](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/42894635014) **succeeded**. The missing `#requires-javascript` element was explicitly reported in all three failing traces. This establishes the browser regression, **not** any real-world credential disclosure.

The first proposed correction at `fd56f83f993e4c49d28a1fa15257bf9e0e218bf6` added native `inert` access controls and a visible no-script explanation. Its [Alpha run 42904619632](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/42904619632) **failed three remaining Playwright assertions** (Chromium/Firefox/WebKit) because the inert create control was still found by Playwright's accessible-role query; **27 other browser checks passed**. Its [CLI run 42904619643](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/42904619643) succeeded. The warning and inert-attribute assertions passed, but this is **not** a qualified correction.

A second minimal corrective head `968d63d8aebac1055ffc911fcceec519f30c8855` keeps `#access` **hidden and inert** until the browser module installs event handlers, and then removes inert/reveals the section; the three-browser regression test is **unchanged**. Only `apps/pwa/index.html` and `apps/pwa/src/main.ts` changed in both corrective commits. Exact-head [Alpha 42905695293](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/42905695293) and [CLI 42905695463](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/42905695463) **both completed successfully on this exact head**: the Alpha workflow's domain job passed and the CLI workflow's six Ubuntu/macOS/Windows × Node 22.18.0/24.x jobs passed. This qualifies only this isolated draft revision, not the unmerged alpha baseline or a release. These results do not establish real-world credential leakage, protocol change or release readiness. PR #21 remains **draft/unmerged**; the live GitHub Wiki remains unpublished.


### Diagnostic privacy regression — test-first, not yet qualified (draft)

[Draft PR #22](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/22), stacked on unmerged alpha PR #10, introduces **two synthetic-data regression tests only**, at `ecaab0015cc180e5dfb3e064018b13440e724728`: `packages/kernel/src/observability/diagnostic-privacy.test.ts`. Tests require user-exported JSONL logs not to contain identifying/token-like text embedded in an unstructured logger message or Error message/stack, under approved CTR-OBS-001/CTR-PRV-001. The original logger/redaction implementation is **unchanged** by PR #22. Hosted CI and any corrective implementation are **not yet qualified**; do not treat these tests, the longstanding audit observation A-001, or draft status as a production fix. Retain structured event names and error codes; require separately documented, test-first and exact-head qualification before integration.

Separate [read-only audit PR #14](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/14) rotation 11 records a conditional in-pass seven-day expiry boundary in the sync sender, with a precise proposed fake-clock/transport reproduction. This is a **source-based, unexecuted observation**, not proven exploitation or a qualified fix. It is not a protocol change or authorization to send expired statements.
