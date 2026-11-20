# Backup coverage UI bug hunt — generation 3

## Frozen source and ownership

Reviewed candidate: `2917cb4751786bd475df2b34441cb40e1dfbc43f`.
Isolated branch: `codex/classrup-coverage-bug-g3-20261119`.
Original coverage feature: `e6df4af37f0cab79f3b98d97e26a32b6bfae34f0`.
The candidate also includes the shared recovery preflight introduced by
`2917cb4751786bd475df2b34441cb40e1dfbc43f`.

This worker independently inspected the coverage formatter, the actual PWA
coverage/action/session wiring and teardown, the page markup, both coverage
test suites, the new Playwright coverage/lock case, and adjacent export admission
and session guards. The generation 1 bug-hunt and generation 2 barter/security
handoffs provided guard context; their runs are not counted as this worker's
evidence. No production source or established test fixture changed. The only
changes are this handoff and its reproducible probe/evidence. Integration,
browser qualification, and remote publication remain the coordinator's work.

| Reviewed file | Candidate Git blob |
|---|---|
| `apps/pwa/src/backup-coverage.ts` | `e5dd2bc2ad60d660965b342db1117c58a9ba1d5e` |
| `apps/pwa/src/main.ts` | `26595d77976819925cc362de14e61b4722c8e581` |
| `apps/pwa/index.html` | `428ee98ebdcd8552304b6299322c2ffff4c47f5d` |
| `packages/vault/src/vault.ts` | `8d133151f348cf8213d923cf7098ca9928481f98` |
| `packages/vault/src/backup-coverage.test.ts` | `26d46648b0f1f66482c4f813ede95f899ef723e1` |
| `tests/integration/backup-coverage.test.ts` | `1a260e40c1503ce28d03d418242b66c34575a130` |
| `tests/browser/alpha.spec.ts` | `63195c8d131b461082cc1cd1af53e7bc96fb1cb2` |

## Standards

**No findings in the reviewed coverage UI change.** It follows the bounded-change
and focused-evidence guidance in `docs/wiki/Developer-Guide.md`, under
"Contribution and release evidence." The formatter remains a small, pure
presentation function. The listener uses the established action queue and exact
session identity guard, and teardown clears the new field beside the existing
private fields. No actionable documented-standard breach or code smell was
identified within this scope.

## Spec and behavior

**No reproducible correctness defect found in this scoped pass.** The observed
behavior matches `docs/development/BACKUP_SCOPE.md`. This conclusion is bounded
to source inspection and the lightweight checks below.

| Question | Finding and evidence |
|---|---|
| Are counts and category totals described correctly? | The formatter counts populated `recordTypes`, not all registered codecs. The probe covered zero, one, multiple, and exactly 10,000 records, including unused registered categories. Singular/plural output was correct and the successful message described a previous snapshot. |
| Can a truncated inventory look complete? | Source inspection shows the 257th type acts as an overflow sentinel; only the first 256 types contribute to the reported lower-bound count. The formatter handles type overflow before rendering any count. All seven nonempty combinations of type overflow, unsupported types, and record overflow produced the same reason precedence as export admission. |
| Does a successful preview authorize a later export? | No. Source inspection confirms `exportBackup` recomputes coverage in the same storage read that collects records. Both UI and export prioritize type overflow, then unsupported types, then the 10,000-record cap. The displayed successful snapshot also states that export checks coverage again and that validation/size limits still apply. The later recovery preflight can reject records even after a successful inventory, which is consistent with that contract. |
| Can old counts return after lock or replacement? | The probe executed the exact coverage listener with the actual action queue/session binding and the exact `runForSession` function. Queued requests for a locked or replaced session never called `backupCoverage`. Results arriving during an in-flight lock or replacement did not repaint counts or overwrite the replacement view. Obsolete errors remained hidden and a new-session request still worked. |
| Are displayed private fields cleared? | The exact `clearVaultViews` fragment cleared coverage text and the backup passphrase and hid the workspace. Source inspection confirms manual and automatic locks use that teardown before awaiting storage closure. |
| Are record names/payloads exposed in the new message? | The formatter uses counts and fixed explanatory text. Probes supplied private-looking supported type names and an untrusted-looking unsupported identifier; none appeared in its output. The main handler assigns the string through `textContent`. |
| Does the existing browser test exercise the intended basic flow? | Source review confirms it creates a listing, checks coverage, confirms excluded-data copy, locks, verifies the text and passphrase are empty, unlocks, and checks the count again. It does not delay the inventory call or switch between two different vaults. This worker did not run Playwright. |

The new button has `type="button"` and the result has `role="status"` with a
polite live region. The button is outside the nearby forms. The existing export
listener remains available independently of preview, so coverage is informational
and does not introduce a required extra action before download.

## Commands and observed outcomes

Worktree creation:

```sh
git worktree add -b codex/classrup-coverage-bug-g3-20261119 /workspace/scratch/06c5fd0c70c0/classrup-coverage-bug-g3 2917cb4751786bd475df2b34441cb40e1dfbc43f
```

Source comparison included the original feature's PWA/Playwright diff using
`git show e6df4af -- apps/pwa/src/main.ts apps/pwa/index.html apps/pwa/src/backup-coverage.ts tests/browser`,
then direct reads of the frozen candidate and its updated vault preflight.

Probe command, from the isolated worktree:

```sh
env NODE_OPTIONS=--max-old-space-size=128 timeout 15s node docs/development/cycles/20261119/evidence/coverage-bug-g3-probe.mjs
```

| Attempt/check | Actual result |
|---|---|
| Initial probe setup | Exit 1 before any behavioral check. The source-fragment extractor expected the wrong following comment in `vault-session.ts`. The missing-marker assertion stopped setup. This was a probe defect; it produced no application finding. |
| Corrected probe, unchanged production source | Exit 0; 8 checks passed, 0 failed. Node `v24.22.3`; reported maximum RSS 52,764 KiB. The command completed in about 0.06 seconds. Node emitted its normal experimental warning for `stripTypeScriptTypes`. |
| Final probe after fixture cleanup | Exit 0; the same 8 checks passed, 0 failed, in about 0.33 seconds; maximum RSS 52,836 KiB. The successful-count fixtures now register each populated type plus an unused category, keeping the fixture consistent with a real coverage report. Production source remained unchanged. |
| Staged whitespace check | `git diff --cached --check`: exit 0, no diagnostics. |

The probe imports the actual formatter and action-queue module and strips types
from exact `main.ts` and `vault-session.ts` fragments. Its DOM, session responses,
and unrelated component teardown ports are controlled fixtures. The source
fragments are not rewritten to implement their expected behavior. This makes the
queued/in-flight ordering checks reproducible with no browser or dependency
installation, but does not constitute full mounted-application qualification.

`evidence/coverage-bug-g3-setup.log.gz` preserves the failed setup output.
`evidence/coverage-bug-g3-probe.log.gz` preserves the first passing output and
`evidence/coverage-bug-g3-final-probe.log.gz` preserves the final passing output.
`evidence/coverage-bug-g3-results.json` records the source blobs, commands, outcomes,
probe hashes, and decoded-log SHA-256 hashes. No production source change occurred
between those attempts; the extraction end marker and the fixture's registered
type lists were corrected as described above.

## Limits and next fresh worker

- No Vitest suite, full typecheck, build, browser process, IndexedDB session,
  dependency installation, or vault KDF was run by this worker. The coordinator
  requested lightweight work while a serial qualification run used the
  memory-pressured host. Inspection of existing test assertions is not reported
  as execution of those tests.
- The formatter boundary checks use supplied `BackupCoverage` fixtures. The
  reviewed vault/storage code and existing coverage tests support the count
  contract, but this worker did not execute the real inventory/export path with
  10,000 or 10,001 stored records.
- The controlled pending promises test the listener's queued and in-flight
  session behavior. They do not establish native-browser event timing,
  accessibility announcements, IndexedDB transaction behavior, cryptography,
  actual download delivery, or every possible asynchronous teardown point.
- A fresh worker should use the exact integrated candidate, run the named
  coverage suites and shared action/session suites when memory permits, and run
  the new Playwright case in the required browser projects. A focused additional
  browser scenario should hold coverage pending across automatic lock and then
  open a different vault, checking that old counts/errors never appear.
- A live blocked-coverage scenario should confirm unsupported or over-limit
  data blocks the actual download and that a later export recomputes admission.
  Preserve the distinction between a successful count inventory and a backup
  that passes recovery preflight and size validation. Do not treat these
  remaining qualification scenarios as demonstrated defects.

Review totals: Standards — 0 findings; Spec/behavior — 0 demonstrated defects.
No production repair is proposed by this worker.
