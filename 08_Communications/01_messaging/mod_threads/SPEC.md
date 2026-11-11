# F08.S01.M02 — Conversation threads

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F08.S01](../SPEC.md). **Process IDs:** PS-061-01…PS-061-10. **Code:** `packages/comms/src/messaging/threads`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Conversation threads bound to a context (listing, proposal, cycle, booking, rental or a direct conversation) with a fixed participant set, living in each participant's local vault (ADR-0016). The threadId of a thread is derived deterministically from its context (and, for one-to-one contexts, the sorted DID pair), so every vault and every concurrent create arrives at the same thread without a coordinator. The initiator's vault sends a signed thread-open statement; receiving vaults check the signer's entitlement per context type through the context owner's ThreadContextPort, and senders they do not know yet land in a message request that the user accepts or declines. The module keeps the roster in step with context events, enforces only the local principal's own blocks (the blocked party's vault is never told), supports per-participant mute and archives threads when their context ends. Message content lives in F08.S01.M01; this module owns only who may talk where. No relay is the authority for any thread.

## Responsibilities

- Own the Thread record, its context binding (type and ID), derived threadId, participant roster, request state and archive lifecycle.
- Derive the threadId of every thread as a UUIDv8 from SHA-256('classrup.comms.thread.v1', contextTenantId, contextType, contextId, sorted DID pair for one-to-one contexts, generation), so every vault and every concurrent create gets the same thread and no superseding is needed for concurrent creates.
- Keep participants in step with context events such as mutiny.party.joined and mutiny.party.left, capped at 12 participants.
- Enforce the local principal's own blocks at thread creation and on block events (direct threads archive in the blocker's vault, group threads hide the blocked party from the blocker); nothing changes and nothing is signalled in the blocked party's vault.
- Store per-participant mute settings (off, 1 h, 8 h, 24 h, until unmuted) that notification routing reads.
- Produce and verify the signed thread-open statement classrup.comms.thread_open/v1, check the signer's entitlement per context type, and hold statements from unknown senders as message requests with status request until the user accepts or declines them.
- Apply a remote participant's departure from a verified classrup.privacy.deletion_notice/v1 statement and register the F10 privacy ports for the local user's own threads (N6).

## Not responsible for

- Message storage, encryption and delivery (F08.S01.M01).
- The context records themselves (listings in F01, proposals and cycles in F02, bookings in F03, rentals in F05); each context owner registers a ThreadContextPort {exists, isParty, roster, isClosed} for its context type, and F03.S02.M01, F05.S01.M01 and F05.S02.M02 are not listed in depends_on because they already depend on this module through F08.S01.M01 (port registration avoids the cycle).
- Blocking itself (F07.S02.M02 owns block lists; this module only enforces the local principal's own blocks).
- Notification delivery (F13); mute is data that F13.S02.M04 and F13.S01.M03 read through the thread query.
- Producing the deletion notice (F10.S01.M04 owns classrup.privacy.deletion_notice/v1); this module only applies a verified one.
- Future: threads spanning federated peers, thread-level retention overrides, message pinning.

## User stories

- As a buyer, I can start a conversation from a listing and the seller sees it in their inbox bound to that listing.
- As a participant of a cycle, I am automatically added to the cycle thread and removed when I leave the cycle.
- As a member, I can mute a noisy thread for 8 hours without leaving it.
- As a member who blocked someone, I no longer see their new threads, and the blocked person is not told.
- As a seller, I see a first message from a buyer I do not know in my message requests and can accept, decline or block it.

## Edge cases

- Two buyers click Message at the same moment on the same listing; each gets their own thread because the pair differs; the same buyer clicking twice, or buyer and seller creating the pair thread concurrently on their two vaults, derive the same threadId, so both statements describe one thread and nothing is superseded.
- A party blocks the other while a direct thread is active; the blocker's vault archives the thread with reason blocked and drops later statements silently; the blocked party's vault state and responses stay exactly as in an unblocked thread (its sends commit locally and reach transport acknowledged).
- A cycle participant leaves; they can no longer fetch new messages but keep what was already delivered to their device.
- A cycle grows beyond 12 participants; the 13th join is refused with COMMS_THREAD_PARTICIPANT_LIMIT and the cycle owner module decides how to react.
- Listing is archived or removed; threads stay open for 14 days for pending questions then archive automatically.
- A participant deletes their account; their vault sends a signed classrup.privacy.deletion_notice/v1 before its keys are destroyed and receiving vaults set leftAt and show a deleted-member label; without a notice the participant simply stays silent.
- A, B and C join cycle X in different orders; each vault derives the same threadId from (contextTenantId, cycle, X, generation 1) on its first mutiny.party.joined, so their messages decrypt and verify in each other's vaults.
- A archived the listing thread locally and opens a new one while a message from B for the old thread is in flight; A's new thread has generation 2, B's vault archives generation 1 with reason superseded, and the in-flight message is re-homed into the new thread instead of dropped.
- An unknown DID sends 6 thread-open statements and 120 other unknown DIDs send one each; the receiving vault keeps 5 requests per unknown DID and 100 in total and drops the rest silently.

## UX and accessibility

- Inbox: list of threads sorted by latest activity with context chip (listing, cycle, booking, rental), unread indicator and mute icon.
- Thread header: context summary card, participant list, mute menu (1 h, 8 h, 24 h, until unmuted) and archive action.
- Start conversation sheet launched from listing or proposal pages with a single Send message button.
- Message requests: first statements from unknown senders with context, sender pseudonym and key fingerprint, and Accept, Decline and Block buttons; declining sends nothing.

**States:** loading; empty-inbox; active; request; muted; archived; blocked-hidden; offline

**Accessibility:** Inbox rows are a list with one accessible name per thread including context title, unread count and mute state.; Mute menu is operable by keyboard and each option is a button of at least 44 by 44 px.; Archive and mute changes are announced in an aria-live polite region.

## Owned data

- `Thread` (classrup.comms.thread/v1, P2, RET-STANDARD)

## Interfaces

- Commands: `comms.thread.create`, `comms.thread.archive`, `comms.thread.mute`, `comms.thread.accept_request`, `comms.thread.decline_request`
- Queries: `comms.thread.list_mine`, `comms.thread.get`
- Emits: `comms.thread.created`, `comms.thread.archived`
- Consumes: `mutiny.party.joined`, `mutiny.party.left`, `mutiny.cycle.cancelled`, `mutiny.cycle.completed`, `services.booking.cancelled`, `services.booking.completed`, `rentals.rental.closed`, `bazaar.listing.archived`, `identity.block.added`

## Dependencies

F07.S02.M02, F07.S01.M01, F01.S01.M01, F02.S01.M01, F02.S01.M02, F16.S02.M02, F16.S02.M03, F11.S01.M01, F11.S02.M01, F15.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-UX-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-061-01 | [Domain schema](domain_schema.md) | 5 |
| PS-061-02 | [Validation rules](validation_rules.md) | 4 |
| PS-061-03 | [Workflow state machine](workflow_state_machine.md) | 4 |
| PS-061-04 | [Commands, queries and events](commands_queries_events.md) | 5 |
| PS-061-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-061-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-061-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-061-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-061-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 4 |
| PS-061-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/comms/src/messaging/threads/index.ts`.

## Acceptance criteria

- All tests T01 to T21 pass in CI.
- A blocked party can never learn from any response or state in its own vault that a block exists.
- Roster after arbitrary event replay equals the roster after ordered replay, and every vault derives the same threadId for the same context.
