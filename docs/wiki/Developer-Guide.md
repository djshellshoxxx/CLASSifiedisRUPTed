# Developer Guide

[Home](Home.md) · [User Guide](User-Guide.md)

## Scope and source control

The default `main` branch contains the runnable development alpha. These guides were reconciled against `50abc470139a613f4404bdb9fb442f4011c13932`; pin the exact candidate commit when reproducing tests. The [project status](../status/PROJECT_STATUS.md) records source-specific evidence and outstanding release work. An earlier branch or successful CI run does not qualify a later candidate.

The browser vault is the user-owned product boundary. Follow [ADR-0016](../../planning/adr/ADR-0016.md), the [contract index](../../planning/CONTRACTS.md) and the current code when extending it. Optional relays do not become identity custodians or authorities over local private records.

## Setup and build

Requirements are Git, Node >=22.18.0 and pnpm 10.28.0. Use the [CLI setup guide](../CLI_SETUP.md) for platform installation and configuration details.

```sh
git clone https://github.com/djshellshoxxx/CLASSifiedisRUPTed.git
cd CLASSifiedisRUPTed
git switch main
corepack pnpm install --frozen-lockfile
corepack pnpm run setup --non-interactive
corepack pnpm run doctor
corepack pnpm dev
```

`corepack pnpm build` creates public assets under `dist/`; `corepack pnpm preview` serves the production build locally. Production static hosting requires HTTPS. Setup preserves existing settings and browser records. `.classrup/local.json` stores non-secret local configuration. Intentional later changes use `pnpm run configure`.

## Architecture and module map

| Area | Current responsibility |
|---|---|
| `apps/pwa` | Browser composition, listing editor/history/archive, location preferences, barter coordination and worker, local inbox and session handling |
| `packages/kernel` | Command dispatch, authorization/capabilities, storage/transactions, outbox, validation and observability |
| `packages/identity`, `packages/security`, `packages/vault` | Signing identity, cryptographic primitives, guarded encrypted local records and scoped alpha backups |
| `packages/bazaar`, `packages/discovery`, `packages/mutiny` | Listing lifecycle, verified local discovery and bounded signed-file barter coordination |
| `packages/commerce`, `packages/privacy`, `packages/governance`, `packages/moderation`, `packages/notify`, `packages/i18n` | Implemented foundations and adapters within each package's documented scope; not every planned feature is composed in the PWA |
| `tools/cli`, `tools/specgen`, `tools/trace`, `tools/status` | Local setup/serving, specification generation, executed-test traceability and status reporting |

Read a package's exports, actual composition and tests before treating it as available behavior. Specification-only packages and unmounted adapters remain incomplete.

## Specifications and contracts

`module.spec.yaml` is the source for generated module specifications, process documents, checklists and TODOs under the feature hierarchy. [SPEC_FORMAT.md](../../planning/SPEC_FORMAT.md) and ADR-0015 require changes in YAML followed by `pnpm spec:render`. Hand-written historical process documents must be reconciled into YAML before adoption; copying them over generated files creates source drift.

The [archived planning review](../security-planning/20261116/README.md) preserves a later planning-only contract tree. Its files do not replace the active alpha contracts. Likewise, [historical handoffs](../status/HANDOFF.md) and the preserved hard-slices designs describe their dated source and session. Their commands are reference material, not the present task queue.

## Test and CI commands

```sh
corepack pnpm typecheck
corepack pnpm spec:check
corepack pnpm deps:check
corepack pnpm run test:cli
corepack pnpm run test:tooling
corepack pnpm test --reporter=json --outputFile=test-results/domain.json
corepack pnpm trace --results test-results/domain.json
corepack pnpm run status --results test-results/domain.json --write
corepack pnpm build
corepack pnpm run test:browser
```

Run trace/status before browser tests, which may clear `test-results/`. Browser tests require Playwright's installed browsers. The separate `test:browser:crypto` script is a diagnostic lane; consult the recorded results and upstream-engine limitations before interpreting it as release qualification.

A `TEST-PS-…` annotation establishes traceability only when an executed passing test actually covers its requirement. The non-strict trace report, source counts and generated percentages are not release gates. Preserve assertion limits and failed/incomplete reports; report reruns with their own source and context.

## Security and integration boundaries

Local signing keys, record rows and backups are encrypted. The vault authenticates an inventory of durable rows and migrates legacy plaintext records atomically after successful unlock. Visible metadata and whole-store rollback remain outside those guarantees. The [vault README](../../packages/vault/README.md) explains the algorithms, backup exclusions and session semantics.

The [federation package](../../packages/federation/README.md) describes the bounded alpha signed-file protocol. It does not establish canonical live relay transport, device-key lifecycle or complete federation recovery. Keep authenticated participant/owner checks, revisions, expiry, storage transactions and backup validation intact when composing another domain.

The 51 findings in the [historical security tracker](../../planning/SECURITY_FINDINGS_TRACKER.md) remain planning/readiness findings with distinct closure evidence. A helper, an archived contract or a passing test does not resolve an entire finding.

## Contribution and release evidence

Work from the latest reviewed main or an explicitly identified candidate. Use isolated branches/worktrees for independent tasks and check current PR ownership before editing overlapping paths. Keep changes bounded; add focused regression coverage for behavior defects and run the gates affected by the change.

When integrating a historical PR, check ancestry and file contents. A branch may have been adopted by content with later fixes even when its head is not an ancestor. Record preserved source SHAs and remaining gaps in the [branch ledger](../status/BRANCH_LEDGER.md). Distinguish merging development work from releasing or deploying the product.

These pages are repository wiki source. [Publication status](README.md) is separate from code and documentation integration.
