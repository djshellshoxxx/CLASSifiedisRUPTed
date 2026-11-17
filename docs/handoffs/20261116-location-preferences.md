# Coarse location preferences milestone — November 16, 2026

## Resume from this implementation

Repository `djshellshoxxx/CLASSifiedisRUPTed`, continuation branch
`codex/parallel-completion-20261116`, inherited source `36428ccc8a1ccf365418748abd7cc6ee2dc2bfb3`
on draft PR #42. This handoff covers the new, uncommitted location slice; the
parent integration must record its final source SHA and browser/CI evidence.

Read the current implementation, not an older parked branch. The reviewed
`claude/busy-cerf-vg3hz3` tree contains discovery package metadata/entrypoint but
no location runtime to port. This implementation reuses the current coarse
geohash library, typed transactional repositories, bus, encrypted vault and
backup codec composition.

## Delivered

- `packages/discovery/src/geoprivacy/location/index.ts` implements the canonical
  `discovery.location.set_home`, `clear_home` and `get_own` operations. Every
  operation requires both the local principal actor and that principal's vault
  tenant, in addition to kernel capability authorization.
- Home input is exactly five lowercase geohash characters. Public visibility is
  L0 (nothing), L1 (four characters) or L2 (five characters). Inputs reject
  coordinates, address fields, unknown keys, finer cells and finer public levels.
- Existing settings require exact expected revision. Commands are idempotent
  through the real bus; concurrent stale writes fail. An identical save does not
  increment revision or emit another event.
- The guard stores at most three change timestamps to enforce a true sliding
  24-hour limit, including its exact boundary. Changing only public visibility
  does not consume a home change. Hiding and clearing remain available at
  saturation, and neither resets the guard. Clock rollback does not bypass the
  recent-home-change guard. This is a local anti-probing control, not a defense
  against a user controlling their own clock or restoring an older backup.
- The P1 update event contains only the selected public cell, never the private
  five-character home when L1/L0 was selected. The commands create no signed
  publication, relay message or automatic listing mutation.
- `locationBackupCodecs(backupCodec)` registers only the setting record. The
  codec rejects noncanonical storage keys, foreign ownership, unknown data and
  cells finer than five characters. The documented import policy resets the
  local change window while preserving the saved visibility. There are no
  location-share records in this codec set.
- `apps/pwa/src/location-preferences.ts` provides accessible text tile entry,
  visibility preview, save/clear and explicit copy actions. GPS is requested
  only by an explicit button, once, with a 10-second timeout and no requested
  high accuracy or cached result. The synchronous provider callback snaps to an
  L2 cell; only the cell leaves the callback. Errors do not reveal native
  provider details. Denial, failure and timeout preserve manual entry.
- Disposal aborts pending GPS, invalidates late queries/queued actions, clears
  retained form state and removes the private DOM. Only a saved public
  projection can be copied to the new-listing form. A saved private home can be
  explicitly copied to the local regional search form. Copying does not publish
  or apply a search automatically.

The alpha storage envelope already owns tenant/revision/timestamps. One setting
is stored under the canonical owner-DID key with its UUIDv7 `settingId` inside
the strict data schema. The bounded `changeTimes` list is an explicit internal
addition needed for a sliding window; one count and one last-change timestamp
cannot implement that contract correctly.

## Parent composition

Root owns `apps/pwa/src/main.ts`, `apps/pwa/index.html` and browser tests. The
agreed integration registers `locationDefinitions({localPrincipal}).all`, adds
`locationBackupCodecs(backupCodec)`, mounts `#location-preferences` after unlock,
refreshes its view and disposes it synchronously on session end. Its
`applyToListing(cell)` and `applyToSearch(cell)` callbacks only stage the
appropriate forms. The root reported this composition and an expanded encrypted
backup browser journey implemented; this agent has not independently executed
those browser assertions.

## Verification at the implementation milestone

Command:

```sh
corepack pnpm exec vitest run packages/discovery/src/geoprivacy/location/location.test.ts tests/integration/location-preferences.test.ts --maxWorkers=1 --no-file-parallelism
```

Result: **13/13 tests passed**, two files, 15.28 seconds. Tests cover hidden
defaults, projected event privacy, strict input, owner/tenant authorization,
replay, revision/concurrent writes, rolling-window saturation/exact boundary,
clock rollback, clear/hide availability, encrypted IndexedDB reopen, actual
signed encrypted backup/restore, strict backup ownership/precision, GPS
snap/error/timeout/cancel, explicit copies and stale/queued UI work after lock.
The raw IndexedDB inspection found no home tile, GPS numbers or entry mode in
plaintext; backup ciphertext also excludes the home tile.

The focused suite initially exposed two test harness typos (event `.schema`
instead of `.payload`, log `.entries()` instead of `.records()`); both were
fixed before the 13/13 result. A combined typecheck then found a TypeScript
erasable-syntax restriction on a test-only parameter property; that was fixed
by a normal field assignment. Concurrent worker implementation type errors
belong to that team's final integration, so the parent must run the settled
combined typecheck. `git diff --check` passed at this checkpoint.

Fresh reviewer `/root/fresh_location_review` now owns independent inspection
and any regression fixes. Implementation runtime/test edits stopped before
that handoff.

## Still incomplete

This finishes the bounded coarse-setting slice, not all F06.S02.M02. Precise
location sharing, recipient-key encryption, signed grant/revoke intake,
quarantine, block/context cancellation, transport acknowledgements and ephemeral
share cleanup require the missing authenticated private messaging/device
lifecycle. No such sharing UI or false transport status was added.

The current UI accepts a keyboard-accessible geohash tile; a map grid and an
offline searchable gazetteer remain unfinished. Hardware p95 budgets, manual
assistive-technology qualification, physical location-permission flows and
source-specific browser qualification remain separate evidence gates. JavaScript
references are dropped promptly; the code does not claim physical memory erasure
or deletion of previously published listings/other devices' copies.
