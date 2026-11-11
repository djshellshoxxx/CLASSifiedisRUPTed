# PS-061-04 — Commands, queries and events: Conversation threads

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S01.M02 Conversation threads](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/messaging/threads` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-061-04.R01** All commands are vault-local; create additionally produces the signed statement classrup.comms.thread_open/v1 and archive and mute never leave the device.
- **PS-061-04.R02** Roster changes made from context events are internal and are not a public command; they emit no extra events.
- **PS-061-04.R03** The module consumes context, block and identity events to keep threads consistent.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `comms.thread.create` | comms.thread.create | [vault command; produces signed statement classrup.comms.thread_open/v1] { contextType, contextId?, participantDids[] (other participants) } | { threadId, revision, existing: boolean } | VALIDATION_FAILED, BLOCKED_PARTY, COMMS_THREAD_PARTICIPANT_LIMIT, COMMS_THREAD_EXISTS, COMMS_THREAD_OPEN_REJECTED, RATE_LIMITED, NOT_FOUND | comms.thread.created | yes (Idempotency-Key) |
| `comms.thread.archive` | comms.thread.archive | [vault command, local only] { threadId, expectedRevision } | { threadId, revision, archivedAt } | NOT_FOUND, FORBIDDEN, CONFLICT_REVISION, CONFLICT_STATE | comms.thread.archived | yes (Idempotency-Key) |
| `comms.thread.mute` | comms.thread.mute | [vault command, local only] { threadId, duration: off\|1h\|8h\|24h\|forever } | { threadId, mutedUntil?, muteForever } | NOT_FOUND, VALIDATION_FAILED, CONFLICT_STATE |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `comms.thread.list_mine` | comms.thread.read_own | [vault query] { status?: active\|archived, contextType?, cursor?, limit ≤ 50 } | { items: Thread[], nextCursor? } |  |
| `comms.thread.get` | comms.thread.read_own | [vault query] { threadId } | { thread: Thread } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `comms.thread.created` | P2 | { threadId, contextType, contextId?, participantDids[], createdBy, origin } |
| `comms.thread.archived` | P2 | { threadId, contextType, contextId?, participantDids[], reason } |

### Events consumed

| Type | Effect |
|---|---|
| `mutiny.party.joined` | add the joining party to the cycle thread, creating the thread on first join; refuse beyond 12 |
| `mutiny.party.left` | set leftAt for the party on the context thread |
| `mutiny.cycle.cancelled` | archive the cycle thread 14 days later with reason context_closed |
| `mutiny.cycle.completed` | archive the cycle thread 14 days later with reason context_closed |
| `services.booking.cancelled` | archive the booking thread 14 days later with reason context_closed |
| `services.booking.completed` | archive the booking thread 14 days later with reason context_closed |
| `rentals.rental.closed` | archive the rental thread 14 days later with reason context_closed |
| `bazaar.listing.archived` | archive listing threads 14 days later with reason context_closed |
| `identity.block.added` | archive direct threads between the pair with reason blocked and hide the blocked party from the blocker in group threads |
| `privacy.deletion.completed` | set leftAt for the deleted actor in all threads and archive two-party threads with reason account_deleted |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| COMMS_THREAD_PARTICIPANT_LIMIT | 409 | no | thread would have fewer than 2 or more than 12 participants |
| COMMS_THREAD_EXISTS | 409 | no | an active thread already exists for this context and pair; params.threadId is returned |
| COMMS_THREAD_OPEN_REJECTED | 422 | no | thread-open statement signer is not entitled for the context or the signature is invalid; statement quarantined |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
vault command comms.thread.create
{ "contextType": "listing", "contextId": "0192f3a4-5b6c-7d8e-9f01-23456789abcd", "participantDids": ["did:key:z6MkExampleSeller"] }
-> { "threadId": "0192f3a4-0000-7000-8000-0000000000aa", "revision": 1, "existing": false }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-061-09.T05 | contract | PS-061-04.R01, PS-061-04.R02, PS-061-09.R02, PS-061-09.R03 | each command and query executes | outputs and event payloads validate against registry schemas |
| TEST-PS-061-09.T06 | integration | PS-061-04.R03, PS-061-06.R02 | replay mutiny.party.joined, party.left and block events in shuffled and duplicated order | final roster identical to ordered replay |
| TEST-PS-061-09.T16 | a11y | PS-061-04.R01 | inbox and mute menu with keyboard and screen reader | all controls operable, state changes announced, zero serious axe issues |

## Dependencies

Module depends on: F07.S02.M02, F07.S01.M01, F01.S01.M01, F02.S01.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
