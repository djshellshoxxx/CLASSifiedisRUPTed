# Changelog

All notable changes are recorded here. This project has no tagged release yet; entries
describe what is integrated into main, with the pull request that introduced each change.

## Unreleased

### Public-record CLI continuation (2026-11-18)

- Verify supported public listing and withdrawal files with
  `node tools/cli/classrup.mjs record verify --file FILE [--json]`.
  Shared PWA validation checks payloads, author binding and expiry after native
  signature and content-hash verification. Bounded file reads and fixed errors
  preserve the command's local, read-only scope.
- Versioned JSON success and error results use stdout. Human errors use stderr.
  Chain history, revocation, current ownership and trust remain unestablished;
  private vault commands and complete CLI parity remain planned.
- Preserve [PR #51](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/51)'s
  strict Base64url tests, shared DOM test helper, CI symlink enforcement and
  test-discovery cleanup in the combined continuation candidate.

### Exhaustive consolidation (2026-11-18)

- [PR #48](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/48) extracts the
  feature-catalog generator, immutable dependency registry and four opt-in read-only
  query definitions from draft #8 into the current kernel. Catalog membership does
  not enable product functionality. PWA controls, runtime flag adapters, relay composition,
  backup/quarantine integration and target-device qualification remain unfinished.
- Generation and build checks reject stale output. Independent review repaired
  partial-write retry cleanup and checkout line-ending staleness, with focused
  regression coverage. Existing vault and signed-record formats are unchanged.
- Fresh native Ed25519 generation recovers from eligible `OperationError` failures
  within three sequential attempts, before key export or persistence. New identity,
  vault and real-browser regressions cover recovery, exhaustion and preserved
  identity after reopening. Existing-key imports remain unchanged; the affected
  WebKit engine's deterministic import defect is still unresolved. The
  [native diagnostic and review](docs/reviews/20261117-exhaustive-consolidation/native-keygen-review.md)
  preserves both failed raw probes and the mitigation's evidence boundary.
- [PR #50](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/50) records the
  exhaustive 52-branch / 47-PR starting inventory, bounded security review, corrected
  WebKit evidence and adapted client-owned future CLI specification. Domain CLI
  commands remain planned. Stacked draft #49 was closed as superseded after the
  independent documentation merge.
- Runtime main `5a502aa` passed its own first-attempt push workflows: 695 domain
  assertions, 27 tooling tests, 72 browser journeys and all six platform jobs.
  The [completed main record](docs/reviews/20261117-exhaustive-consolidation/main-qualification-20261118.json)
  preserves actual main job/log evidence separately from earlier PR qualification
  and the historical queued checkpoint.
- The pre-existing high Picomatch development-toolchain advisory remains unresolved;
  the dependency audit exits 1. The product remains a development alpha. See the
  [dated security review](docs/reviews/20261117-exhaustive-consolidation/security-review.md).

### Parallel continuation (2026-11-16)

- Owner closure reasons, signed expiry withdrawals, automatic local expiry/30-day
  archive maintenance, and re-download of verified publication/withdrawal evidence.
- Idle/hidden-tab vault lock, page-local unlock backoff, safe crypto failure-stage
  diagnostics, and session guards for delayed results/downloads and failed startup.
- Pure exact-money conversion/arithmetic/allocation with independent Python
  vectors and a deterministic browser bundle CI check. Target performance remains
  unqualified; existing alpha wire amounts are not migrated.
- Opt-in signed-consent core and notification signer-chain validation fixes.
  Consent product composition/backup/quarantine are still pending.
- Milestone handoffs and independent review records under `docs/handoffs/`.

### Consolidated (2026-11-11)

- Stage 3 specifications as data and the Stage 4 kernel (PR #8) and the local alpha with vault,
  signed listings, barter coordination and CLI setup (PR #10) are combined on one branch.
- Outbox retries are scoped to tenant, aggregate type and aggregate ID, so a failing consumer in
  one stream no longer delays another tenant's events (PR #16).
- `classrup build` refuses symbolic links and non-regular files anywhere under the public asset
  tree, before and after staging (PRs #17, #19).
- Barter cycle discovery announces its result count in a live status region (PR #20).
- Vault access forms stay hidden and inert until scripts finish initializing; a no-script notice
  explains why (PR #21).
- Diagnostic log messages that are not stable event identifiers, and Error messages, stacks and
  causes, are redacted before reaching any log sink (PR #22).
- Queued sync entries that expire while an earlier send is in flight are failed as `EXPIRED`
  instead of being dispatched (PR #23).

### Added

- `pnpm run status`: generated per-feature and per-module status from the specification, source
  definitions and executed test results (`docs/status/FEATURE_STATUS.md`).
- `docs/status/BRANCH_LEDGER.md`: disposition of every branch and pull request.
- `docs/status/PROJECT_STATUS.md`: verification evidence, open risks and release readiness.
