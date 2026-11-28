# BlindMatch local foundation

This experimental package implements owner-only local intents and bounded local
matching. Both catalog modules are `FUTURE` and default **off**. The PWA registers
the backup codec for compatibility but does not activate a BlindMatch screen or
matching workflow. No confidential provider, payment or automatic public
disclosure is implemented.

The continuation implements a reusable private editor/results view in
`apps/pwa/src/blindmatch.ts` and an authenticated local discovery adapter in
`apps/pwa/src/blindmatch-candidates.ts`. The main application's literal
`ENABLE_LOCAL_BLINDMATCH_PREVIEW = false` keeps that composition unavailable in
normal builds. A same-origin native test fixture mounts the actual view under
the production CSP; that is component acceptance, not runtime activation.
See the [continuation handoff](../../docs/development/cycles/20261127-blindmatch-view/HANDOFF.md).

## Ownership and composition

`F19.S01.M01` owns `blindmatch.private_intent`. `F19.S02.M01` owns the pure local
matcher and ephemeral session coordinator. Discovery, vault, identity, consent,
money and public listing lifecycles retain their existing domain ownership.

Inject the current `UnlockedVault.storage`, its principal, a clock and an
`isCurrent` function bound to that specific unlocked session. Only an exact
`enabled: true` enables creation, revision, activation or matching. Inspection,
pausing and erasure remain available while disabled. The storage must be the
existing encrypted vault adapter; this package does not encrypt a raw adapter.

Intents have random UUIDv4 IDs, one current revision, criteria, expiry and
`draft`, `active` or `paused` state. Edits reset them to draft. Creation and
activation reject expiry. Updates and erasure require expected revisions; capacity is 50
live intents. There is no historical revision table.

The candidate loader receives only an abort signal and a limit, never private
criteria or intent identifiers. Its adapter must read an authenticated,
already-retained public snapshot through discovery without network requests.
Structural revalidation in the pure matcher cannot establish signatures.
The matcher admits at most 128 candidates and returns at most 128 public
owner/listing/revision/CID references in deterministic order. It rejects overflow
instead of dropping constraints. Text, category, kind, condition and coarse
region filters are local. Price filters compare exact integer minor units in
the same existing alpha currency code; there is no FX, confidential price
negotiation or completed currency-registry migration.

## Session and recovery contract

The application invalidates `isCurrent` and calls `cancel()` before locking,
switching accounts or disabling the view. New jobs supersede older jobs.
Cancellation settles even while a storage read or candidate loader is stalled.
After the final asynchronous read, result admission checks current session,
owner, mutation epoch, stored revision, active state, expiry and block policy.
No job restarts merely because a vault reopens. Nonlocal modes are unavailable.

A storage transaction that rejects is rolled back. If the session ends after a
successful commit, the API can return `FORBIDDEN` while concealing that committed
result. Inspect current state after unlocking before choosing a fresh action;
the return value does not authorize an automatic retry.

The mutation epoch is an ephemeral token, not durable replay evidence or a
deleted-object registry. Fresh random IDs are required for new intents. This
does not solve complete database rollback or the separately tracked storage
invalidation work.

Erasure removes the intent row without command-bus idempotency, events, outbox
messages, identifying hashes, tombstones or completion history. Results remain
ephemeral. Public withdrawal/archive operations are separate. This slice covers
local intents, not total account, media, message, external-backup, peer-copy or
forensic erasure.

`RET-OWNER-LIVE` in `CTR-PRV-001` is the specific retention rule for these
private intents. It takes precedence over legacy tombstone, audit, evidence and
legal-hold retention; this API creates none of those records.

The PWA backup registry includes the explicit intent codec. Admission binds the
owner and stored key. Restore always resets intent content to draft; backup
export does not change the live source. Legacy archives remain compatible.
An intentional old-backup import can restore old content but cannot restore
active matching authority. Unknown/malformed records retain the vault's
existing fail-closed behavior.

## Editor language

The gated editor follows the browser's preferred language and offers English,
German, French and Spanish. Its language menu applies to the open view. Reopening
the vault returns to the browser preference. Changing language preserves focus,
unsaved fields and exact price inputs. Labels, errors and the erase prompt are
translated locally. Listing identifiers and user-entered search text keep their
original values.

## Remaining activation gates

The editor, adapter and lifecycle wiring are implemented as a gated composition.
Each mounted opt-in creates fresh current-session instances. Saving or editing
produces a draft; matching, pausing and local erasure require explicit actions.
Cancellation, policy/retained-listing refresh and view teardown discard results;
disablement and vault lock also clear private forms and cards. No saved intent
runs merely because a view or vault reopens.

The adapter verifies canonical retained keys, real signatures and projection
bindings, then rejects a changed second snapshot. More than 128 total retained
rows, including withdrawn/conflicted rows, rejects the whole request. This cap
bounds admission and signature work, not the vault adapter's full snapshot cost.
Returned references describe an authenticated local snapshot, not continuing
availability, consent or trade authority.

Source-specific browser acceptance, actual mobile resource/latency checks,
manual screen-reader/accessibility and activation review remain required before
user-facing activation. Confidential computation, external disclosure consent
and cross-domain erasure retain separate implementation and review gates.
