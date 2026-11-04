# F08.S01.M02 — Conversation threads

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F08.S01](../SPEC.md). **Process IDs:** PS-061-01…PS-061-10. **Code:** `packages/comms/src/messaging/threads`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Conversation threads bound to a context (listing, proposal, cycle, booking, rental or a direct conversation) with a fixed participant set, living in each participant's local vault (ADR-0016). The initiator's vault creates the thread and sends a signed thread-open statement so other vaults can create a mirror after verifying that the signer is entitled to talk about that context; unknown contexts land in a message-request quarantine. The module keeps the roster in step with context events, enforces blocks by local filtering, supports per-participant mute and archives threads when their context ends. Message content lives in F08.S01.M01; this module owns only who may talk where. No relay is the authority for any thread.

## Responsibilities

- Own the Thread record, its context binding (type and ID), participant roster and archive lifecycle.
- Create at most one active thread per (context, participant pair) for one-to-one contexts and one thread per cycle or booking context for group contexts.
- Keep participants in step with context events such as mutiny.party.joined and mutiny.party.left, capped at 12 participants.
- Enforce blocks at thread creation and on block events (direct threads archive, group threads hide the blocked party from the blocker).
- Store per-participant mute settings (off, 1 h, 8 h, 24 h, until unmuted) that notification routing reads.
- Produce and verify the signed thread-open statement classrup.comms.thread_open/v1 and quarantine thread-open statements that the signer is not entitled to send.

## Not responsible for

- Message storage, encryption and delivery (F08.S01.M01).
- The context records themselves (listings in F01, proposals and cycles in F02, bookings in F03, rentals in F05).
- Blocking itself (F07.S02.M02 owns block lists; this module only enforces them).
- Notification delivery (F13); mute is data that F13.S02.M04 and F13.S01.M03 read through the thread query.
- Future: threads spanning federated peers, thread-level retention overrides, message pinning.

## User stories

- As a buyer, I can start a conversation from a listing and the seller sees it in their inbox bound to that listing.
- As a participant of a cycle, I am automatically added to the cycle thread and removed when I leave the cycle.
- As a member, I can mute a noisy thread for 8 hours without leaving it.
- As a member, I cannot open a new thread with someone who blocked me and I am not told that I am blocked.

## Edge cases

- Two buyers click Message at the same moment on the same listing; each gets their own thread because the pair differs; the same buyer clicking twice gets the same thread (idempotent on context plus pair).
- A party blocks the other while a direct thread is active; the thread is archived with reason blocked, the blocker's view hides it, and the blocked party sees it as archived without a reason.
- A cycle participant leaves; they can no longer fetch new messages but keep what was already delivered to their device.
- A cycle grows beyond 12 participants; the 13th join is refused with COMMS_THREAD_PARTICIPANT_LIMIT and the cycle owner module decides how to react.
- Listing is archived or removed; threads stay open for 14 days for pending questions then archive automatically.
- Participant account deleted; they are removed from the roster and their display is replaced by a deleted-member label.

## UX and accessibility

- Inbox: list of threads sorted by latest activity with context chip (listing, cycle, booking, rental), unread indicator and mute icon.
- Thread header: context summary card, participant list, mute menu (1 h, 8 h, 24 h, until unmuted) and archive action.
- Start conversation sheet launched from listing or proposal pages with a single Send message button.

**States:** loading; empty-inbox; active; muted; archived; blocked-hidden; offline

**Accessibility:** Inbox rows are a list with one accessible name per thread including context title, unread count and mute state.; Mute menu is operable by keyboard and each option is a button of at least 44 by 44 px.; Archive and mute changes are announced in an aria-live polite region.

## Owned data

- `Thread` (classrup.comms.thread/v1, P2, RET-STANDARD)

## Interfaces

- Commands: `comms.thread.create`, `comms.thread.archive`, `comms.thread.mute`
- Queries: `comms.thread.list_mine`, `comms.thread.get`
- Emits: `comms.thread.created`, `comms.thread.archived`
- Consumes: `mutiny.party.joined`, `mutiny.party.left`, `mutiny.cycle.cancelled`, `mutiny.cycle.completed`, `services.booking.cancelled`, `services.booking.completed`, `rentals.rental.closed`, `bazaar.listing.archived`, `identity.block.added`, `privacy.deletion.completed`

## Dependencies

F07.S02.M02, F07.S01.M01, F01.S01.M01, F02.S01.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-061-01 | [Domain schema](domain_schema.md) | 4 |
| PS-061-02 | [Validation rules](validation_rules.md) | 3 |
| PS-061-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-061-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-061-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-061-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-061-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-061-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-061-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-061-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/comms/src/messaging/threads/index.ts`.

## Acceptance criteria

- All tests T01 to T16 pass in CI.
- A blocked party can never learn from any response that a block exists.
- Roster after arbitrary event replay equals the roster after ordered replay.
