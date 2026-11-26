# BlindMatch local foundation

This experimental package implements owner-only local intents and bounded local
matching. Both catalog modules are `FUTURE` and default **off**. The PWA registers
the backup codec for compatibility but does not activate a BlindMatch screen or
matching workflow. No confidential provider, payment or automatic public
disclosure is implemented.

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

## Remaining activation gates

Complete the local editor/results UI, authenticated bounded discovery adapter,
current-session lifecycle wiring, help, accessibility and actual mobile
acceptance before user-facing activation. Confidential computation, external
disclosure consent and remote erasure retain separate review gates. Focused
unit/integration tests and the test-only native-browser harness qualify this
foundation, not those future features.
