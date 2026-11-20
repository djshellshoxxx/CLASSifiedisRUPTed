# ClassRup P1 backup visibility — attachment exclusions in the PWA

Date: 2026-11-20. Owner continuation in `djshellshoxxx/CLASSifiedisRUPTed`.

## Exact source and ownership

- **Stacked base:** draft consolidation PR #69, branch `codex/classrup-recovery-consolidation-20261120`, observed head `6d4f6ea7ba9bcf886ae69edd0f167a621308d4b2`, complete tree `ccd65c24112ae97c8ee7bf28a4bc5c9e560ede35`.
- **Isolated branch:** `codex/classrup-pwa-attachment-diagnostic-20261120`, created from that exact published head. The first three normal commits conclude at `30e093025152778817793c81956c1d4d29da862e`, tree `e95d4a214b51366aaf15acad257f8887a84e9e7a`.
- **Changed runtime:** `apps/pwa/src/backup-coverage.ts` and `apps/pwa/src/main.ts`; **changed tests:** `tests/integration/backup-coverage.test.ts`. This handoff adds documentation only. Refresh observed branch and base SHA/tree before further edits.
- **Ownership:** do not alter draft #69, contributing drafts #64–#68, paused older automations or unrelated refs. Merge #69 only with its own current-head required qualification and independent review. Keep this dependent PR draft until its own qualification and review have passed.

## Implemented bounded PWA feature

The existing explicit **Check backup coverage** button now requests *both* record coverage and the unlocked principal's read-only attachment-reference diagnostic. It renders the two reports as ordinary text, without returning IDs, labels, filenames, content types, or bytes. The attachment paragraph distinguishes missing held blobs, present-but-excluded held blobs, total holder rows, unknown counts after overflow, unauthenticated holder labels, and unheld blobs outside the inventory. It explicitly states that the existing v1 record backup excludes attachment bytes and references even when the count is zero.

The call runs within existing `runForSession` guards. Prior displayed inspection text is cleared before the new read. `clearVaultViews()` already clears the display on lock; no cache or persistent diagnostic is introduced. Record and holder reads are successive guarded snapshots, **not a single atomic inventory**. Neither is used to authorize or alter `exportBackup()`.

Three new integration assertions test normal diagnostic wording without identifiers, unqualified overflow with unavailable counts, and empty-holder inventory without a false completeness claim. These tests have **not been executed** here.

No v1 wire/signed envelope change, identity/signature/encryption change, domain admission, storage schema/index, product cap, test timeout, dependency, workflow, deployment or release change.

## Current qualification and historical evidence

Parent PR #69 still requires its own hosted gate resolution. Its previously documented local source `d55bb48117c0f9e4579b01fd6c12030585601d68` passed TypeScript and 20 focused integration cases, but complete shards produced 832 passing, 3 failing, 4 pending assertions; queued hosted runs 44775792417 (Alpha) and 44775792011 (CLI) were **not passing at inspection**. They cannot qualify this new branch. Earlier PR #68's Alpha 44768631941 and CLI 44768631914 completed with successful selected jobs at their own older source; they do not qualify PR #69 or this candidate. Original PR #68 Alpha 44749698450 failed at TS2741 and downstream tests skipped, preserved as failed evidence. The historical complete local suite exit 137 remains incomplete.

No local Git worktree or TypeScript/Vitest/browser execution was performed in this invocation; the container could not resolve github.com. GitHub connector source writes were used. A new current-head PR should trigger its own Actions; inspect exact checkout SHA, job states and logs before recording acceptance. Do not relaunch unchanged queued workflows or killed full suites.

## Fresh review assignments, each requiring independent execution

1. **Code audit:** Freeze exact remote head/tree; inspect PWA `runForSession` race safety, `vaultAction` binding, both vault calls, the inline text update, and lock clearing. Confirm helper return text is deterministic and record/holder scans do not become admission.
2. **Functional bug hunt:** On an isolated checkout run `corepack pnpm typecheck`, focused `tests/integration/backup-coverage.test.ts`, existing attachment-reference coverage tests, then native Chromium PWA check with explicit check/lock/reopen. Run heavy work serially, log setup failures separately from executed assertions.
3. **Defensive security review:** Static review only for cross-principal scope, leakage through status/live DOM, stale data after lock, missing/overflow disclosure, semantic overstatement of holder authority or v1 completeness. Do not resume interrupted security reproductions.

Each reviewer must leave exact commit/tree, commands/job IDs, outcomes, pending findings and an independently usable successor handoff. Integrate only confirmed compatible fixes with fresh source qualification. Preserve PR #69's existing three timeouts and four pending full-domain assertions; partial or older tests do not close them.
