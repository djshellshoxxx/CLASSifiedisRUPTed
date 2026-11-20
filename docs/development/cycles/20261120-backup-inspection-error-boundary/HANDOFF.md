# ClassRup PWA backup inspection — required-read error boundary

Date: 2026-11-20. Repository: `djshellshoxxx/CLASSifiedisRUPTed`. Bounded follow-on, no release or deployment.

## Frozen ownership and source
- Latest inspected `main`: `449a619f1ae7b66cb42d9cab43dd5493bfe42c2e`. It already contains the qualified earlier PR #57 history; do not reuse old local-only commits where published Git objects have equal trees and remapped SHAs.
- Separate upstream parent: draft PR #75, branch `codex/classrup-backup-inspection-round2-20261120`, observed exact head `8132a9c67315bdd07016291817d53360d11ce1cf` and base PR #74 `2742e1a579e83cf1be5bcc81c7169aac94e46334`. This candidate branches from **PR #75's exact published commit**, not from old local history and not from `main`. Do not alter PR #75 or its ancestors directly.
- New branch: `codex/classrup-backup-inspection-error-boundary-20261120`. Runtime repair commit `e7d0d71fba9d71d6f2076f22bc30e63c1b42ee78` updates only `apps/pwa/src/backup-coverage.ts`. Focused test commit `2154eed663fbd54b60ce2793b2eba21301c12a0c` updates only `tests/integration/backup-coverage.test.ts`. A GitHub compare against the exact frozen parent showed two commits ahead, zero behind, exactly these two files, before this handoff. Freeze the new final head and tree again when resuming.
- Earlier drafts #69–#75 have separate owners/qualification. Draft #8 remains incompatible. Do not merge or modify branches without re-checking live refs and ownership.

## Confirmed source observation and bounded repair
In the PWA, `action()` catches errors and `report()` copies `error.message` into the visible error element via `textContent`. Before this patch, `readBackupInspection()` caught and sanitized failures from optional `attachmentCoverage()`, but it allowed arbitrary errors from required `backupCoverage()` to propagate unchanged. A failing storage/backend read could therefore display internal diagnostic text during the user-initiated backup check. This is a **source-observed exposure path**, not an executed attack or proof that real failures actually contain sensitive details.

The required record coverage read now catches its error and **rejects with a fixed non-sensitive message**: `Backup inspection unavailable; saved-record coverage could not be verified.`. It still fails closed, does not return a coverage result, never starts the optional attachment read after record failure, and does not change backup export admission. The earlier optional-diagnostic fallback and v1 attachment-exclusion wording are preserved. The PWA still validates `runForSession` after awaiting this function. No signed v1 bytes, identity, signing, encryption, codec, schema, store operation, holder count cap, timeout, workflow or product limit changed.

## New acceptance and qualification boundaries
Changed the existing required-failure integration test so the rejected message is fixed and the optional attachment read is not invoked after a required failure. Added a second case where the required source throws a fake error containing a tenant and blob digest, asserting the outward message contains neither. These new cases are authored only; **there is no executed Vitest, full typecheck, native browser or exact-head CI pass yet**.

At inspection on 2026-11-20:
- PR #69 current-head hosted Alpha `44775792417` completed its domain job successfully and its CLI `44775792011` completed selected Ubuntu Node 22/24 jobs successfully. This does not qualify #75 or this child; PR #69 had zero submitted independent GitHub reviews.
- PR #75 Alpha `44797676244` and CLI `44797676228` each had a queued plan job; neither passed at observation.
- PR #74 Alpha `44788289124` had completed plan but queued domain; CLI `44788289066` had queued selected jobs.
- PR #72 Alpha `44783073095` had queued domain, and its CLI `44783073144` had one Ubuntu Node 24 success and one queued Ubuntu Node 22 job. None qualifies this child.
- PR #56's distinct main-push Alpha was cancelled; its CLI succeeded. The original November 19 complete local domain suite exited 137 without a report. Historical local PR #69 sharded run had 832 pass / 3 fail / 4 pending. Keep all older incomplete/failed results intact and separate.
- Local git checkout attempt still failed with `Could not resolve host: github.com`. Only GitHub connector reads and writes were available; no worktrees or product tests executed here. No credits/budget exhaustion was reported.

## Three distinct independent next-worker lanes (not yet executed)
1. **Fresh code audit:** freeze exact PR head, tree and parent; verify `readBackupInspection` always rejects on required record error, the optional result remains intact, and PWA `report()` and `runForSession` behavior. Assess legitimate user diagnostics lost by normalization and test whether a typed error code is needed without exposing raw exception text.
2. **Fresh functional bug hunt:** use isolated worktree from remote ref; run `corepack pnpm typecheck`, `corepack pnpm test -- tests/integration/backup-coverage.test.ts`, related PWA/session suites and native browser backup-check/lock journeys **serially**. Check the newly changed error expectation, optional-read skip, normal success, optional failure, lock and supersession. Distinguish setup failures from executed product tests.
3. **Fresh source-focused defensive security review:** check raw error disclosure, DOM textContent, potential exception cause chaining/logging, owner/principal scope, backup count/attachment-exclusion caveats, session revocation, and no false backup authorization. Review/hardening only; do not resume interrupted security reproduction follow-ups.

Independent workers have **not been launched** by this run. They must record exact source IDs, actual test commands/job numbers, original failures, remaining findings and successor handoffs. No independent submitted reviews exist for the inspected parent PRs #69, #72, #74 or #75. Only merge this child after all actual required current-source Alpha/domain/browser and CLI checks and independent reviews succeed, its stacked parents qualify and are integrated, the exact merge tree is verified and main's **separate** push qualification is inspected. Avoid empty polling and unnecessary CI reruns.

No release, deployment, force push, branch deletion, paid external API, workflow restart or unrelated/paused automation change.
