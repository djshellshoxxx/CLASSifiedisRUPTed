# PS-061-04 — Commands, queries and events: Conversation threads

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S01.M02 Conversation threads](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/messaging/threads` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-061-04.R01** All commands are vault-local; create additionally produces the signed statement classrup.comms.thread_open/v1, and archive, mute, accept_request and decline_request never leave the device.
- **PS-061-04.R02** Roster changes made from context events are internal and are not a public command; they emit no extra events.
- **PS-061-04.R03** The module consumes context, block and identity events and applies verified classrup.privacy.deletion_notice/v1 statements to keep threads consistent.
- **PS-061-04.R04** Statements are registered with F11.S01.M01 (N2): classrup.comms.thread_open/v1 { threadId, contextTenantId, contextType, contextId?, generation, participants[] } signed by a device key of createdBy; the module verifies classrup.privacy.deletion_notice/v1 owned by F10.S01.M04 (signer role principal: the envelope author is the departing DID per CTR-FED-001 FED-7 and ext.signerKey one of its device keys; the departure payload is exactly { requestId, signedAt, kind: departure, effectiveAt, recourse: none } and never repeats the DID), reads the departing DID only from the envelope author and applies a departure notice to every local thread in which that DID has an entry with leftAt unset, setting leftAt to the local receipt time and departedByNotice to the notice cid; a notice of kind commitment changes no thread.
- **PS-061-04.R05** The module registers ExportSectionPort (section comms.threads), DeletionPort (plan, execute, pseudonymize) and RetentionPurgePort with F10 (N6); DeletionPort.plan lists the counterparties of the local user's threads as noticeRecipients [{ did, mailboxId, relayId }] so F10.S01.M04 seals its single departure notice to each, DeletionPort.execute archives the user's threads with reason account_deleted and purges rosters while the keys still exist, and the module does not consume privacy.deletion.completed.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `comms.thread.create` | comms.thread.create | [vault command; produces signed statement classrup.comms.thread_open/v1] { contextType, contextId?, participantDids[] (other participants) } | { threadId (derived), generation, revision, existing: boolean } | VALIDATION_FAILED, BLOCKED_PARTY, COMMS_THREAD_PARTICIPANT_LIMIT, COMMS_THREAD_EXISTS, COMMS_THREAD_OPEN_REJECTED, RATE_LIMITED, NOT_FOUND | comms.thread.created | yes (Idempotency-Key) |
| `comms.thread.archive` | comms.thread.archive | [vault command, local only] { threadId, expectedRevision } | { threadId, revision, archivedAt } | NOT_FOUND, FORBIDDEN, CONFLICT_REVISION, CONFLICT_STATE | comms.thread.archived | yes (Idempotency-Key) |
| `comms.thread.mute` | comms.thread.mute | [vault command, local only] { threadId, duration: off\|1h\|8h\|24h\|forever } | { threadId, mutedUntil?, muteForever } | NOT_FOUND, VALIDATION_FAILED, CONFLICT_STATE |  | yes (Idempotency-Key) |
| `comms.thread.accept_request` | comms.thread.manage_request | [vault command, local only] { threadId, expectedRevision } | { threadId, revision, status: active } | NOT_FOUND, CONFLICT_STATE, CONFLICT_REVISION, BLOCKED_PARTY | comms.thread.created | yes (Idempotency-Key) |
| `comms.thread.decline_request` | comms.thread.manage_request | [vault command, local only; nothing is sent to the requester] { threadId, expectedRevision, block?: boolean } | { threadId, revision, status: archived } | NOT_FOUND, CONFLICT_STATE, CONFLICT_REVISION | comms.thread.archived | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `comms.thread.list_mine` | comms.thread.read_own | [vault query] { status?: active\|request\|archived, contextType?, cursor?, limit ≤ 50 } | { items: Thread[], nextCursor? } |  |
| `comms.thread.get` | comms.thread.read_own | [vault query] { threadId } | { thread: Thread } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `comms.thread.created` | P2 | { threadId, generation, contextType, contextId?, participantDids[], createdBy, origin } |
| `comms.thread.archived` | P2 | { threadId, contextType, contextId?, participantDids[], reason, supersededBy? } |

### Events consumed

| Type | Effect |
|---|---|
| `mutiny.party.joined` | add the joining party to the cycle thread, deriving the threadId from (contextTenantId, cycle, cycleId, generation 1) on the first join so every vault holds the same id; refuse beyond 12 |
| `mutiny.party.left` | set leftAt for the party on the context thread |
| `mutiny.cycle.cancelled` | archive the cycle thread 14 days later with reason context_closed |
| `mutiny.cycle.completed` | archive the cycle thread 14 days later with reason context_closed |
| `services.booking.cancelled` | archive the booking thread 14 days later with reason context_closed |
| `services.booking.completed` | archive the booking thread 14 days later with reason context_closed |
| `rentals.rental.closed` | archive the rental thread 14 days later with reason context_closed |
| `bazaar.listing.archived` | archive listing threads 14 days later with reason context_closed |
| `identity.block.added` | in the blocker's vault only: archive direct threads with the DID the local principal blocked (reason blocked) and hide that party from the blocker in group threads; nothing is sent and the blocked party's vault is unaffected |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| COMMS_THREAD_PARTICIPANT_LIMIT | 409 | no | thread would have fewer than 2 or more than 12 participants |
| COMMS_THREAD_EXISTS | 409 | no | an active thread already exists for this context and pair; params.threadId is returned |
| COMMS_THREAD_OPEN_REJECTED | 422 | no | thread-open statement signer is not entitled for the context, the threadId does not match its derivation, or the signature is invalid; statement quarantined |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
vault command comms.thread.create
{ "contextType": "listing", "contextId": "0192f3a4-5b6c-7d8e-9f01-23456789abcd", "participantDids": ["did:key:z6MkExampleSeller"] }
-> { "threadId": "5f3a9c1e-7b2d-8e4f-9a01-23456789abcd", "generation": 1, "revision": 1, "existing": false }
the seller's concurrent create for the same listing and pair derives the same threadId 5f3a9c1e-7b2d-8e4f-9a01-23456789abcd
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-061-09.T05 | contract | PS-061-04.R01, PS-061-04.R02, PS-061-09.R02 | each command and query executes | outputs and event payloads validate against registry schemas |
| TEST-PS-061-09.T06 | integration | PS-061-04.R03, PS-061-06.R02, PS-061-09.R03 | replay mutiny.party.joined, party.left and block events in shuffled and duplicated order | final roster identical to ordered replay |
| TEST-PS-061-09.T17 | integration | PS-061-01.R05, PS-061-04.R03 | three vaults A, B, C receive mutiny.party.joined for cycle X in different orders and then exchange messages | all derive the same threadId; C verifies and decrypts A's message bound to that threadId |
| TEST-PS-061-09.T20 | integration | PS-061-04.R04, PS-061-04.R05, PS-061-07.R04 | A's account deletion runs DeletionPort.plan and execute; later B's departure notice (envelope author B, payload without any DID) reaches C once signed by an active key of B and once after B's account_deleted revocation listing its cid in finalCids; a notice correctly signed by B whose payload adds a did field; a commitment-kind notice from B | A's plan lists A's thread counterparties as noticeRecipients and A's threads are archived account_deleted before keys are destroyed; C sets leftAt and departedByNotice for B, read from the envelope author, on every thread where B is a current participant, with a deleted-member label, for both deliveries; the notice with a did field is rejected VALIDATION_FAILED; the commitment notice changes no thread; registry lists thread_open with signer role |

## Dependencies

Module depends on: F07.S02.M02, F07.S01.M01, F01.S01.M01, F02.S01.M01, F02.S01.M02, F16.S02.M02, F16.S02.M03, F11.S01.M01, F11.S02.M01, F15.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
