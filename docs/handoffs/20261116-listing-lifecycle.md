# Listing lifecycle milestone — November 16, 2026

Base: PR #41 `560b328dd335aebdc12de01ec339c43ebd164be3`. Work is in the shared
`codex/parallel-completion-20261116` candidate. This milestone implements the
local end-of-listing workflow; it does not close every F01.S01.M04 requirement.

## Implemented

- `bazaar.listing.close` requires owner and expected revision, validates the
  listing kind's close reason, and stores an optional deal/trade reference as an
  explicitly unverified owner assertion. Published listings receive a verified
  chained signed withdrawal in the same transaction. The public closed event
  carries the reason enum, without the private reference.
- `bazaar.listing.expire` ends published listings at their local expiry deadline.
  Repeating expiry returns the existing evidence without another event or signed
  withdrawal. Moving the clock backward never reopens an expired listing.
- `bazaar.listing.sweep` processes owner-scoped pages of at most 100 listings.
  It expires overdue publications and archives expired/closed records after
  30 days. One transaction covers a page; signing failure rolls back all changes.
  Continuation uses `nextCursor` with a fresh command idempotency key.
- Explicit `releaseHolds: true` on close/archive releases local inventory holds
  in the same transaction. Scheduled operations never release active holds.
- Ended evidence is promoted to an archive record while retaining the original
  end date and owner reason/reference. The recovery window starts when the
  listing is actually archived. Restore remains unpublished and later publication
  continues the signed sequence chain.
- `bazaar.listing.publication {listingId}` returns `{envelope}` for the verified
  current owner publication/withdrawal. It accepts no arbitrary CID, rejects
  foreign owners and corrupt evidence, and refuses to label a legacy archive's
  retained live publication as a withdrawal.

## Changed files

- `packages/bazaar/src/listings/lifecycle.ts` — close, expiry, archive and bounded sweep.
- `packages/bazaar/src/listings/archive.ts` — ended-record schema, unique active
  evidence checks, archive promotion and compatible restore.
- `packages/bazaar/src/listings/index.ts` — definition composition and current
  publication query; reused exact signer/sequence verification.
- `packages/bazaar/src/listings/model.ts` — closed and expired listing states.
- `packages/bazaar/src/listings/history.ts` — shares the canonical listing status
  schema for history events.
- `packages/bazaar/src/listings/lifecycle.test.ts` — command-path and adversarial
  regression tests, injected-clock transitions and signed-export recovery.

## Verified checkpoint

`corepack pnpm exec vitest run packages/bazaar/src/listings tests/integration/archive-backup.test.ts --maxWorkers=1`
passed **42/42 tests** across three files. This includes existing archive/history
tests and the existing production archive backup tests.

`GOMEMLIMIT=256MiB GOMAXPROCS=2 corepack pnpm typecheck --singleThreaded` passed.
`git diff --check -- packages/bazaar/src/listings` passed.

## Integration contract for the next agent

- Root owns PWA changes. Run sweep at unlock and every five minutes while
  unlocked; complete all pages. Bind queued work to its original vault session.
  A sweep signs withdrawals but does not deliver them remotely. Expose the
  verified current-envelope query so a user can download them later; do not
  silently claim relay delivery or trigger unwanted downloads on a timer.
- Close input:
  `{listingId, expectedRevision, closeReason, closedWithRef?, releaseHolds?}`.
  Reasons: `sold | given | traded | fulfilled | other`. Giveaways only permit
  `given | other`, wanted listings only `fulfilled | other`.
  Reference input is `{type: deal|proposal|cycle|giveaway_request, id}` and rejects
  caller-provided `verified`. Output includes `archiveRecordId`, `listingStatus`,
  `tombstoneQueued: false` and, when a publication ended, `envelope` and
  `delivery: local-file-exchange`.
- Sweep input: `{cursor?, limit?: 1..100}`; output:
  `{processed, expired, archived, envelopes, nextCursor?}`.
- Archive evidence status now includes `expired` and `closed`; archive/recovery
  dates are absent in those states. Existing archived/restored backup rows remain
  schema-compatible. Root should add production backup coverage for new states.

## Remaining requirements and honest limits

- Automatic content purge/account deletion is **not implemented**. Publication
  history, idempotency replay bodies, cross-domain evidence and deletion-tombstone
  retention require a coordinated deletion protocol; removing only the listing
  row would misrepresent deletion and can break backup/replay integrity.
- Signed reservation releases are not implemented; confirmed release changes
  local inventory only, and remote peers must not infer a global lock release.
- The sold-out timer needs quantity inventory depletion/restock events, which
  are not present in the current single-item alpha.
- Renewal, three-day expiry reminder, 100/hour lifecycle quota, five-restore cap,
  trusted receipt clock bounds, canonical relay outbox delivery and complete
  requirement traceability are not provided by this milestone.
- Owner closure is an assertion, never verified payment, trade completion,
  delivery, or reputation. The clock remains device-local.
- Browser tests and final combined candidate qualification belong to root's
  integration step; the targeted passes above do not establish release readiness.

Fresh review should examine archive-state invariants and signature/hold rollback,
then verify PWA scheduling, backup compatibility and final-head tests. No remote
branch has been changed by the lifecycle worker.
