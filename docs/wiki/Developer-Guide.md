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

The isolated [draft CLI regression PR #17](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/17) is test-only at `18adbfc719a75f7ec1eec793bfbfdb00a1d5e39e`. [CLI setup CI](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/42844193821) failed the newly added negative test across the six OS/Node jobs. This is **failing-baseline evidence**, not a completed hardening change. Run `node --test tests/cli/public-symlink.test.mjs` from that PR's exact checkout to reproduce where symlinks are supported. Do not mark the asset-boundary requirement complete before an isolated correction and new passing exact-head checks. No change has been made to the live Wiki.
