# Fresh review: vault session protection — November 16, 2026

## Scope and checkpoint

Fresh reviewer consumed `20261116-inventory-audit.md` and reviewed the working
continuation relative to `560b328dd335aebdc12de01ec339c43ebd164be3`. Scope was
`apps/pwa/src/main.ts`, `vault-session.ts`, the vault controller/backoff and
identity diagnostic changes. Other teams' lifecycle, precision and consent
implementations are outside this review. The working tree was still changing;
this is not a final-head release approval.

## Required findings sent to the integration owner

1. **Post-command lock race.** `command()` checked the original session after
   dispatch but then awaited notification synchronization without checking it
   again. Auto-lock during that await could return old results to a caller,
   permitting downloads or success messages after lock. Recheck the original
   session after the final await. The publish handler's subsequent asynchronous
   signature verification also needs a freshness check before download. A
   regression should defer synchronization, lock, resolve it and assert that no
   stale result reaches the download/message path.
2. **Manual close errors suppressed.** The action wrapper intentionally suppresses
   errors from revoked sessions. Manual lock revokes first, so a rejection from
   `session.lock()` was also suppressed. Automatic lock has a separate error
   callback, but manual lock did not. Report close failures explicitly from the
   teardown path while keeping private views cleared and avoiding writes to a
   later unlocked session.
3. **Failed startup cleanup is incomplete and ordered after close.** The
   create/unlock catch left listing, peer and principal DOM populated if a late
   `connect()` step failed after rendering. Restore cleared listing/peer DOM but
   left the principal. Both awaited storage close before clearing/invalidation,
   so close failure could bypass cleanup entirely. Use the same synchronous
   session invalidation/private-view clearing for all failure and lock paths,
   then await closing storage. This defect predates the new timer but becomes
   important to the shared teardown refactor.

These findings were source-confirmed control-flow defects. They were not
represented as browser-reproduced failures.

## Follow-up resolution

The integration owner addressed all three findings. The fresh reviewer checked
`runForSession` guarding both domain work and post-commit synchronization,
token-bound downloads, session-bound component status callbacks,
`clearVaultViews()` before any storage close, explicit closure-failure reporting
and reopening blocked after a failed close. A second review identified concurrent
automatic-lock/startup-failure closures overwriting the global pending promise;
the owner now chains each closure behind the prior promise and clears only its
own captured promise.

The focused session/controller/action-queue suite then passed **14/14** tests,
including the regression that locks during deferred notification delivery and
rejects the stale result before download. Private DOM cleanup and storage-close
ordering were source-reviewed; this report does not claim a browser pass or
failure-injection browser execution for those paths.

## Positive evidence

- `corepack pnpm exec vitest run packages/vault/src/session-policy.test.ts tests/integration/vault-session.test.ts tests/integration/action-queue.test.ts --maxWorkers=1`
  passed **12/12** tests across three files at the reviewed checkpoint.
- Idle and hidden deadlines are checked before activity can reset them. Hidden
  events cannot repeatedly restart a hidden deadline. The controller revokes
  synchronously and clears timers before awaiting lock completion.
- Only trusted pointer/keyboard events extend the PWA session. Synthetic activity
  regression passes. Listener disposal protects replacement sessions.
- Backoff uses a monotonic timer and survives close/reopen of the same vault in
  one page through a per-factory/name state map. Reloads or other devices can
  reset it; it does not claim protection against offline guessing.
- Identity diagnostics expose fixed stage labels, not native exception data or
  cryptographic values, and do not add retry loops or weaken signature handling.
- Existing vault storage guards reject use after session revocation, including
  a guard after an asynchronous transaction handler. This review found no new
  persisted-plaintext path in the session changes.

## Contract boundary

The chosen policy matches **F16.S02.M01**: 15-minute default, 1–60-minute range,
five-minute hidden lock, and backoff after three failures capped at 60 seconds.
The canonical F07 session spec differs (1–480-minute range and backoff after five
failures capped at 900 seconds), while the offline spec mentions a five-minute
default. Record this as a bounded key-lifecycle implementation, not completion
of all canonical identity/session contracts. The owner was informed.

## Next reviewer

Run the full vault/identity/integration and browser suites on the final head.
Browser test discovery is not a pass. Root's local Chromium attempt failed
before assertions because the host prohibits the required socket; that must
remain an external qualification gap unless another host supplies evidence.
The known WebKit cryptography defect is not fixed by improved diagnostic labels.

## Next milestone: bounded listing maintenance

Implemented only `apps/pwa/src/listing-maintenance.ts` and
`tests/integration/listing-maintenance.test.ts`; the integration owner owns all
main-entry wiring, timers and visible status. This is the next dependency-ready
slice from the lifecycle team's handoff, not a change to the lifecycle domain.

`createListingMaintenance({ command, isActive, onStatus, now? })` returns
`run()` and `dispose()`. The command port dispatches only
`bazaar.listing.sweep` with `{ limit: 100, cursor? }` through the current vault's
owner-authorized bus. The domain command already owns its owner-scoped queries;
the runner adds no privileged read or cross-vault actor.

- Each pass processes at most five pages, sharing a single promise across
  overlapping calls. A status callback cannot start another overlapping pass.
- Cursor and confirmed counts resume immediately on the next activity/pass.
  Completed full scans wait 60 seconds before starting over. Counts reset for a
  new full scan, not between passes of the same scan.
- A failed page preserves prior confirmed counts and its input cursor; status is
  `failed` with `pending: true`, never completed. Malformed counts and repeating
  cursors also fail without an unbounded loop.
- Every post-await result checks the session before updating status or proceeding.
  Disposal prevents later work and callbacks from an old vault.
- Signed envelopes returned by the sweep are neither sent nor downloaded nor
  included in status. The domain retains withdrawal evidence for explicit later
  download through the owner publication query.

Status includes `phase` (`idle`, `running`, `pending`, `complete`, `failed`,
`stopped`), `processed`, `expired`, `archived`, `pages`, `pending` and optional
`nextCursor`. Counts describe confirmed command responses, not peer delivery.

Verification:
`corepack pnpm exec vitest run tests/integration/listing-maintenance.test.ts --maxWorkers=1`
passed **9/9** tests. This includes real bazaar bus integration: signed listing
expiry produces a retained withdrawal; a later 30-day sweep archives the listing
without replacing its withdrawal CID. Other tests cover bounds/resumption,
throttle, partial failure, concurrency, malformed responses, repeated cursors,
lock/disposal and absence of automatic envelope export.

Integration must bind `isActive` to the exact session object, dispose on lock,
invoke `run` through the application action queue on startup/activity/timer,
and show pending/failed status without claiming peer delivery or full deletion.
