# ClassRup required backup-coverage validation — bounded continuation

Date: 2026-11-20. This isolated child is based on the observed current remote draft PR #77 head `b0ca779dce845dddcb1a799d418a1f12d61e5069`; main remained `449a619f1ae7b66cb42d9cab43dd5493bfe42c2e`. The parent branch `codex/classrup-backup-inspection-count-validation-20261120` is unmodified. No local-only history was reused or merged.

## Exact development objects

- Runtime code commit: `867c7fcde1c89e59f06a5ba8321cfa439cb98628`, only `apps/pwa/src/backup-coverage.ts`.
- New tests commit: `94604621515dfff92ea18f5e374898e2688079fa`, only `tests/integration/backup-coverage.test.ts`; observed full tree `e86574d72fe2b719dc37bc0ff6733ce7bf86c1a5`.
- Branch: `codex/classrup-backup-inspection-record-validation-20261120`. Recheck final branch head/tree after this handoff commit; do not use the code/test tree above for later CI source qualification.

## Source-identified correctness gap and repair

The prior PWA `readBackupInspection()` validated optional `attachmentCoverage()` results but passed through a resolved malformed **required** `backupCoverage()` result. `describeBackupCoverage()` could then format inconsistent counts or assume arrays exist, and an otherwise malformed result might appear to be a successful inspection. This is a source observation, not an executed reproduction or evidence of compromised storage.

The new `isCoherentBackupCoverage` checks input shape, arrays, boolean flags, safe nonnegative total, populated unique type counts, registry uniqueness, exact unsupported-type calculation, the 256-type cap, the 10,000-record limit flag, and the current documented excluded `blobs`/`blob_refs` stores. It preserves a truthful **lower-bound** count when more than 256 types exist and preserves a truthful blocked over-10,000 record result. An invalid successful required result now rejects via the same already-sanitized fixed error as a thrown required read; optional diagnostics are not attempted after failure. The normal valid record and attachment diagnostics remain otherwise unchanged.

This is a PWA presentation/admission-information guard, not a cryptographic backup verification. Export and restore retain independent internal admission. The unchanged signed/encrypted v1 format still omits attachments and queue/lease state. No storage schema, signing identity, cryptographic constraint, cap, dependency, test timeout, workflow, release or deployment changes.

## Tests authored, not executed

Added a parameterized-in-loop regression to the existing integration test file testing malformed resolved required data (missing fields, impossible/mismatched totals, duplicate registry/types, missing exclusions, malformed flags and unsafe counts) and ensuring the optional attachment reader was never called. Added a valid **blocked** positive control for 10,001 records and 256 reported categories with type-overflow lower-bound semantics. These are two Vitest cases with multiple assertions, not a larger independent case count.

**No checkout, TypeScript compile, Vitest, browser or product test executed on this exact source.** Local `git ls-remote` fails with `Could not resolve host: github.com`; connector-based GitHub source inspection and publication succeeded, but cannot substitute for an executable worktree. At current observation PR #77 Alpha run `44815292853` had a queued domain job, CLI `44815292761` had a queued plan; it had zero submitted reviews. The original 2026-11-19 whole-domain run exited 137 without a final report. PR #69's successful hosted run is an ancestor's separate qualification and cannot qualify this child. PR #56 main-push Alpha remained cancelled while CLI succeeded. Preserve these distinctions.

## Next three independent fresh-worker scopes

1. **Code audit:** inspect exact final child SHA/tree and parent diff, verify TypeScript narrowing and validator invariants against the real `vault.ts` producer; cover empty registries, 256/257 populated type boundaries, count lower-bound overflow, unknown types and exclusion changes. Leave a source-ID and review receipt.
2. **Functional bug hunt:** in a fresh isolated worktree from current remote child, run `corepack pnpm typecheck` and `corepack pnpm test -- tests/integration/backup-coverage.test.ts`, then session and native PWA browser coverage **serially**. Check valid/invalid required results, optional-read suppression, normal attachment results and session lock. Report concrete exit codes, assertion totals, log IDs, and setup failures separately from product test failures.
3. **Source-focused defensive security review:** verify no raw underlying error messages or record/attachment IDs enter display, successful required reads cannot falsely signal a backup guarantee, display text uses `textContent`, session replacement still blocks stale output, and omitted stores remain explicitly acknowledged. Remediation only; do not restart interrupted exploit reproduction.

These are assignments, **not** completed independent workers or approvals. The invocation could not launch fresh review agents. Require current-head hosted Alpha/domain/browser and CLI plus independent reviews of the final integrated source, stacked-parent qualification, actual merge-tree verification and main's separate push qualification before any ordinary merge. Do not blindly merge draft #8 or touch other owners' branches, paused automations or unrelated work. No force push, branch deletion, release, deployment, paid API, or usage-budget exhaustion report.
