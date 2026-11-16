# Changelog

All notable changes are recorded here. This project has no tagged release yet; entries
describe what is on the integration branch, with the pull request that introduced each change.

## Unreleased

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
