# ClassRup PWA backup diagnostic resilience — isolated continuation

Date: 2026-11-20. Repository: `djshellshoxxx/CLASSifiedisRUPTed`.

## Frozen input and ownership
- **Upstream proposed integration:** draft PR #72, branch `codex/classrup-pwa-recovery-consolidation-20261120`, observed remote head `93dae3705fe4d8d63e2a34401e3352e1e9c5cbbc`. PR #72 targets main at `449a619f1ae7b66cb42d9cab43dd5493bfe42c2e` and retains PR #71 and #70 histories.
- **Isolated follow-on branch:** `codex/classrup-backup-diagnostic-resilience-20261120`, created from that exact remote PR #72 SHA. Do not update the upstream branch or the separate PR #73 documentation follow-on.
- **First implementation:** `8ada161d9ca897b237d6f13ba293905a6dc2510e` changes only `apps/pwa/src/backup-coverage.ts`.
- **PWA call-site change:** `cff6b0e43e129f81f50624bc1c8099dc2000d3d1` changes only `apps/pwa/src/main.ts`.
- **Added acceptance:** `96a5cb11825bf44ef4ee19bbf43727d2c8b7e787` changes only `tests/integration/backup-coverage.test.ts`.
- GitHub comparison with the frozen upstream source showed **3 ahead, 0 behind; exactly these three changed files** before this handoff. Refresh current PR metadata, branch heads, remote PRs and ownership before further writes; never infer source qualification from the original PR's synthetic merge or older local-only commits.

## Source finding and bounded fix
PR #72's backup check clears its previous report and awaits `backupCoverage()` followed by `attachmentCoverage()` in one session-guarded callback. A rejection of the **optional diagnostic** previously rejected the entire callback, suppressing the already successful **record** coverage result. This is a source-observed reliability issue, not an executed browser failure.

`readBackupInspection()` now awaits record coverage as a required operation and separately handles optional attachment-read failure by returning `attachments: null`. The formatter gives the fixed, non-sensitive message **"Attachment check unavailable; counts cannot be confirmed."** plus the unchanged v1-exclusion and unauthenticated-holder caveats. It never repeats an exception message, reference ID, holder label or blob content. It does **not** convert a rejected record-coverage read into a success. On success the same attachment counts and wording remain.

The PWA continues to execute the combined work inside `runForSession(session, () => unlocked, ...)`. Its post-await identity check rejects output after session replacement/lock, including failures swallowed by the optional diagnostic. Rendering still uses `textContent`. This change neither grants attachment backup eligibility nor makes separate record/holder reads atomic. The export path independently rechecks its own record admission; no restore/import path, signed/encrypted v1 format, signer, crypto constraint, schema, codec, data migration, cap, test timeout, CI workflow or other product logic changed.

## Acceptance and evidence separation
Three new cases in the existing `tests/integration/backup-coverage.test.ts` assert:
1. optional attachment rejection retains record counts, shows unavailability/exclusion and cannot leak a sensitive exception;
2. successful attachment read returns the unchanged exact report;
3. required record coverage rejection propagates rather than presenting an exportable state.

**No repository tests, typecheck, native browser journey or independent worker review ran in this invocation.** The container's `git ls-remote https://github.com/djshellshoxxx/CLASSifiedisRUPTed.git` failed with `Could not resolve host: github.com`; only GitHub connector writes and source inspections were available. Source review is not an executed regression test. Do not mark the new assertions passing until a source-bound test runner confirms them.

At inspection, PR #72's latest current-head Alpha #44783073095 and CLI #44783073144 each had a **queued planning job**; PR #71's Alpha #44781546153 and CLI #44781546212 were also queued. PR #69's Alpha #44775792417 had a completed planning job but queued domain job; its CLI #44775792011 had passed a selected Ubuntu Node 24 job, with Node 22 queued. None qualifies this branch. PR #69's historical complete local domain result was **832 passed, 3 failed, 4 pending**. The original November 19 full local runner exited **137 without a final report**. Preserve all records as originally observed, never upgrade partial or queued jobs to passing. PR #56's separate main-push Alpha was cancelled and CLI finished successfully, as previously documented; not rerun or relabeled.

## Next three fresh review scopes (assignments only)
- **Code audit worker:** freeze exact upstream and proposed heads; inspect both source changes, `runForSession` checks, normal and failing attachment reads, public API surface and assumptions about two successive read transactions; verify no conflation with a complete attachment backup.
- **Functional bug-hunt worker:** isolated worktree from current remote ref, serial `corepack pnpm typecheck`, `corepack pnpm test -- tests/integration/backup-coverage.test.ts`, existing PWA/session and attachment-reference suites, and an applicable native Chromium backup-check/lock/reopen journey. Inspect failures and timing separately. Do not retry killed full suites without a concrete remedy.
- **Defensive security reviewer:** strictly source-focused examination of swallowed attachment errors, lock/session replacement, DOM leakage, exception text, tenant scope and whether the fallback might falsely authorize export. No interrupted exploit reproduction follow-ups.

Each independent reviewer must record exact SHA/tree, actual command or CI job IDs, source/failure evidence, findings/remediations and fresh instructions for the next round. The lack of an agent-launch runtime here is not a completed independent review; recorded scopes do not satisfy integration gates.

Keep the follow-on draft until its **actual current-head Alpha/domain/browser and CLI** gates and independent reviews are complete, and until upstream #72 is safely qualified/integrated. Then verify any actual merge tree against the qualified source and observe main's separate push qualification. No release, deployment, force push, deletion, workflow restart, paid external API or unrelated automation modification.
