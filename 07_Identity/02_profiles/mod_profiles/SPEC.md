# F07.S02.M02 — Profiles

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F07.S02](../SPEC.md). **Process IDs:** PS-056-01…PS-056-10. **Code:** `packages/identity/src/profiles/profiles`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

The user's own public profile (pseudonym, avatar, bio, languages and an L1 or L2 region) with per-field visibility (public, contacts, private), published as the signed statement classrup.identity.profile/v1, plus cached profiles of other people received as signed statements. It also owns the block list, a private P3 vault list of DIDs the user refuses to interact with. Blocks are enforced inside the user's vault - blocked DIDs' statements are dropped, and every module checks the block port before acting - and are never sent to relays or to the blocked person.

## Responsibilities

- Own Profile records for the local principal and for received profiles (read-only mirrors with provenance), applying per-field visibility when composing statements.
- Compose and sign the profile statement with only fields marked public (published to selected relays) or contacts (sent end-to-end encrypted to conversation participants).
- Own BlockEntry records and expose the block port isBlockedEither(a, b) and filterBlocked(list of up to 500 DIDs) used by every module before acting and by search for result filtering.
- Drop statements from blocked DIDs silently at intake so the sender cannot learn of the block from this vault.
- Keep avatar and bio within strict size and content limits (avatar WebP at most 128 by 128 px and 24 KiB, metadata stripped).

## Not responsible for

- Reputation and reviews (F07.S03.M01) and attestations (F07.S03.M02).
- The signed identity document and device keys (F07.S02.M01, F07.S01.M01).
- Global bans or relay-wide takedown; relay operators may hide a profile on their relay under hosting policy, and users may subscribe to advisory feeds (Future).
- Future: shared block lists via signed advisory feeds, verified-link fields, profile themes.

## User stories

- As a user, I write a short bio, add an avatar and choose which fields are public, shared with my conversation partners only, or private.
- As a user, I block someone and they can no longer message me, make offers or appear in my search results, and they are not told.
- As a buyer, I view a seller's public profile as a signed statement with its provenance.
- As a user, I can export my blocks to move to a new device.

## Edge cases

- Avatar upload is a 3 MB JPEG with GPS EXIF; it is re-encoded to WebP 128 by 128 under 24 KiB and metadata is stripped; if the result is still too large it is rejected.
- Bio contains links; allowed as plain text but rendered without auto-linking, and the UI shows a warning on tap-out.
- Profile statement from a blocked DID arrives; dropped silently with no quarantine entry visible to the sender.
- A user blocks someone mid-conversation; open drafts and pending outbox statements to that DID are cancelled with reason blocked, and active shares end (events consumed elsewhere).
- The user blocks 1 001 DIDs; the 1 001st is refused with IDENTITY_BLOCK_LIMIT.
- A received profile claims a pseudonym that is confusable with a known contact; shown with the confusable warning from F07.S01.M01.
- Two devices edit the profile concurrently; revision conflict surfaces CONFLICT_REVISION and the user chooses; no last-writer-wins.
- A relay hides a profile under its hosting policy; the profile is unavailable via that relay but the owner's other relays and direct peers still serve it.
- The user blocks themselves or a DID that is not a valid did:key; rejected.

## UX and accessibility

- Edit profile: pseudonym (read-only, change in Identity), avatar picker with crop, bio (500 chars with counter), languages, region level selector linked to location settings, per-field visibility segmented control (Public, Contacts, Private) with a preview 'what a stranger sees' and 'what a contact sees'.
- Blocked people: list with pseudonym, DID fingerprint, date, optional private note, Unblock.
- Other person's profile: pseudonym with DID fingerprint, avatar, bio, region badge, provenance line ('from relay X, received <time>'), Block and Report-to-relay actions.

**States:** loading; empty; saved; pending-offline; conflict; hidden-by-relay; blocked; error

**Accessibility:** Avatar has alt text field and fallback initials; bio counter announces remaining characters politely at 450, 490 and 500.; Visibility controls are radio groups with 44 by 44 px targets and a text description of each level.; Block and Unblock require an accessible confirmation dialog naming the person.

## Owned data

- `Profile` (classrup.identity.profile/v1, P0, RET-STANDARD)
- `BlockEntry` (classrup.identity.block_entry/v1, P3, RET-STANDARD)

## Interfaces

- Commands: `identity.profile.update`, `identity.profile.publish`, `identity.profile.receive`, `identity.block.add`, `identity.block.remove`
- Queries: `identity.profile.get`, `identity.block.list`
- Emits: `identity.profile.updated`, `identity.block.added`, `identity.block.removed`
- Consumes: `identity.account.created`, `identity.pseudonym.changed`, `discovery.location.updated`, `moderation.action.applied`, `federation.tombstone.applied`, `privacy.deletion.completed`

## Dependencies

F07.S01.M01, F07.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-UX-001, CTR-FLG-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-056-01 | [Domain schema](domain_schema.md) | 3 |
| PS-056-02 | [Validation rules](validation_rules.md) | 3 |
| PS-056-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-056-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-056-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-056-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-056-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-056-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-056-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-056-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/identity/src/profiles/profiles/index.ts`.

## Acceptance criteria

- All tests T01-T14 pass in CI.
- The block list never appears in any statement, relay payload, log or event class below P3 (privacy suite).
- A blocked DID's statements are dropped on intake in every module that consumes the block port.
