# Fresh location review — November 16, 2026

Reviewed the location milestone from `20261116-location-preferences.md` against
the F06.S02.M02 contracts, current encrypted vault/backup composition, PWA
session wiring, and the expanded browser backup journey. This review covers
the shared working tree on continuation branch `codex/parallel-completion-20261116`
(inherited Git head `7bf7d51e016616d37b109853061cebeeb51ece85`). The parent must
record the final integrated source SHA and CI results; this is not a release
qualification claim.

## Findings resolved

1. **Unsaved privacy selection could copy older, more precise data.** The
   visibility selector and preview showed the user's new hidden/coarser choice,
   but copy buttons still used the last saved public cell. Both copy actions now
   disappear while area/visibility edits are unsaved, and their callbacks also
   reject that state. Saving re-enables only actions allowed by the saved
   projection. A regression checks hidden precision and a different unsaved home,
   including direct invocation of the hidden controls.
2. **Manual input did not end pending GPS processing.** It prevented the later
   result from replacing text but kept the action pending until a callback or the
   ten-second timeout. Manual area/visibility edits now abort local processing
   immediately; late provider callbacks are discarded and the manual draft is
   preserved. The browser geolocation API itself has no cancellation method;
   the application promptly stops using its result.
3. **Edits during a save could be overwritten by its asynchronous refresh.**
   Input generations now preserve newer drafts while still refreshing the saved
   revision. A regression saves one region, enters another while persistence is
   pending, and verifies the next save uses the newly committed revision.
4. **Refresh after disposal could start an obsolete query.** It now returns
   before querying. Existing generation and active checks continue to discard
   already-running refreshes and queued actions after lock.

The root separately corrected startup composition: it captures `locationView`
instead of dereferencing the clearable global after an await, and wraps startup
notification synchronization, location refresh and listing refresh in
`runForSession`. This prevents a lock from replacing/clearing the active session
between startup phases. Root owns those integration edits and their final checks.

## Checks and evidence

- `corepack pnpm exec vitest run packages/discovery/src/geoprivacy/location/location.test.ts tests/integration/location-preferences.test.ts --maxWorkers=1 --no-file-parallelism`:
  **16/16 passed**, two files, 10.88 seconds, after the three new regressions.
- The final disposed-refresh assertion and the three new UI regressions passed
  in a targeted rerun; unrelated tests were filtered, not marked newly executed.
- `GOMEMLIMIT=256MiB GOMAXPROCS=2 corepack pnpm typecheck --singleThreaded`:
  exited **0** on the shared tree at review time.
- Existing focused evidence includes real encrypted IndexedDB reopen, signed
  encrypted backup/restore, strict ownership/precision validation, actor and
  tenant isolation under an allow-all authorization harness, rolling-window
  boundary/rollback, revision/idempotency checks, and location-event privacy.

Inspection found no additional domain ownership, event projection or backup
admission defect in this slice. Updates require both local actor and local tenant;
strict schemas reject coordinate/address fields; only L1/L2 public projections
enter update events, and L0 events omit the cell. Home coordinates are snapped
synchronously before leaving the provider callback. The import-time reset of
the local change counter is explicitly required by PS-048-10.R02 and is not
claimed to prevent a user controlling their clock or restoring an old backup.

## Boundaries retained

This remains the coarse-setting slice. Precise recipient-bound location shares,
private transport, grant/revoke intake, quarantine, ephemeral-share retention,
map/gazetteer input, target-device latency and manual assistive-technology
qualification remain incomplete. No test run here executed browsers; the parent
must qualify the final browser journeys and preserve any failures. Prior published
listings, downloaded files and historical public events are not erased by clearing
the current private preference. No physical memory-erasure claim is made.

Review edits are limited to `apps/pwa/src/location-preferences.ts`,
`tests/integration/location-preferences.test.ts` and this handoff. No commit,
push, merge, release or deployment was performed by this reviewer.
