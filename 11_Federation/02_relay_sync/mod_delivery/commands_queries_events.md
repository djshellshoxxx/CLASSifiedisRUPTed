# PS-088-04 — Commands, queries and events: Relay delivery

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S02.M01 Relay delivery](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/relay_sync/delivery` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-088-04.R01** The module exposes vault-local enqueue, retry and cancel commands, a relay pull query, and send and acknowledge handlers with the signatures below.
- **PS-088-04.R02** Commands that send data produce no new signed statement except the signed request itself and the acknowledgement statement; the statements delivered were signed earlier by their authors.
- **PS-088-04.R03** The module consumes record, tombstone, peer, migration and consent events to keep the queue consistent with policy.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `federation.outbox.enqueue` | federation.outbox.enqueue | [vault-local or relay-local command, driven by federation.record.accepted and federation.tombstone.applied events] { cid, destinations: Destination[1..10] } | { entries: [ { id, destinationId, state: prepared } ] } | NOT_FOUND, FEDERATION_PEER_NOT_ALLOWED, FEDERATION_DESTINATION_INVALID, VALIDATION_FAILED |  | yes (Idempotency-Key) |
| `federation.outbox.retry` | federation.outbox.retry | [vault-local command] { entryId, expectedRevision } | { entryId, revision, newEntryId } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, FEDERATION_QUOTA_EXCEEDED |  | yes (Idempotency-Key) |
| `federation.outbox.cancel` | federation.outbox.cancel | [vault-local command] { entryId, expectedRevision } | { entryId, revision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE |  | yes (Idempotency-Key) |
| `federation.outbox.acknowledge` | federation.outbox.acknowledge | [vault-local command; consumes a signed acknowledgement statement classrup.federation.ack/v1] { cid, ack: Envelope } | { entryId, state: peer_accepted } | NOT_FOUND, FEDERATION_RECEIPT_INVALID, CONFLICT_STATE |  | yes (Idempotency-Key) |
| `federation.outbox.dispatch` | federation.outbox.dispatch | [vault-local and relay-local worker command] { destinationId, limit ≤ 100 } | { sent, receipts, failed } | FEDERATION_QUOTA_EXCEEDED, FEDERATION_BATCH_TOO_LARGE, DEPENDENCY_UNAVAILABLE, FEATURE_DISABLED | federation.delivery.failed | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `federation.outbox.list` | federation.outbox.read | { state?, destinationId?, cid?, cursor?, limit ≤ 50 } | { items: PeerOutbox[], nextCursor? } |  |
| `federation.outbox.pull` | federation.outbox.pull | [relay query under relay policy, GET /fed/v1/outbox] { since: cursor, limit ≤ 100 } | { envelopes: Envelope[≤100], nextCursor } | FEDERATION_PEER_NOT_ALLOWED, RATE_LIMITED, FEATURE_DISABLED |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `federation.delivery.failed` | P2 | { entryId, cid, destinationKind, destinationId, reason, attempts } |

### Events consumed

| Type | Effect |
|---|---|
| `federation.record.accepted` | when local is true, enqueue entries for the selected relays and, for participants audience, the recipients' mailboxes |
| `federation.tombstone.applied` | enqueue the tombstone to every destination that received the target; cancel still-prepared entries for the target |
| `federation.peer.added` | start pull catch-up from the new peer relay and enable queued public entries for it |
| `federation.peer.suspended` | pause entries to the peer |
| `federation.account.moved` | redirect queued entries for the old relay to the new relay after verification |
| `privacy.consent.withdrawn` | cancel prepared federation entries for the withdrawn purpose and request tombstones for delivered ones |
| `platform.flag.changed` | pause peer_relay entries when F11 turns off; vault to relay entries are unaffected |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| FEDERATION_PEER_NOT_ALLOWED | 403 | no | destination or sender is not a selected relay, listed mailbox or active allowlisted peer |
| FEDERATION_BATCH_TOO_LARGE | 413 | no | more than 100 envelopes or body over 4194304 bytes |
| FEDERATION_QUOTA_EXCEEDED | 429 | yes | destination quota exceeded; retryAfterMs set |
| FEDERATION_NOT_ACCEPTED | 422 | no | destination refused by local policy; reason intentionally generic |
| FEDERATION_DESTINATION_INVALID | 422 | no | destination kind does not match the statement audience or flag state |
| FEDERATION_RECEIPT_INVALID | 422 | no | receipt or acknowledgement signature or cid check failed |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
federation.outbox.enqueue { cid: "sha256-Qm...", destinations: [ { kind: "selected_relay", id: "relay:home.example" } ] }
-> { entries: [ { id: "0192f3c0-...", destinationId: "relay:home.example", state: "prepared" } ] }
dispatch -> POST https://home.example/fed/v1/inbox (batch of 1) -> receipt -> state transport_acknowledged ("Relay received")
recipient vault later sends classrup.federation.ack/v1 -> federation.outbox.acknowledge -> state peer_accepted ("Recipient confirmed")
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-088-09.T01 | integration | PS-088-01.R01, PS-088-01.R02, PS-088-04.R01 | enqueue a committed listing statement for R1 and dispatch | entry prepared then transport_acknowledged with verified receipt; payload not copied into the entry |
| TEST-PS-088-09.T06 | integration | PS-088-04.R02, PS-088-04.R03 | tombstone for a delivered record; account moved; consent withdrawn | tombstone queued to every destination that received the record; entries redirected; prepared entries cancelled |
| TEST-PS-088-09.T07 | contract | PS-088-04.R01, PS-088-04.R02, PS-088-09.R02 | each command and the pull query | inputs, outputs and the delivery.failed event validate against registry schemas |

## Dependencies

Module depends on: F11.S01.M02, F11.S01.M03, F11.S03.M01, F11.S03.M02, F07.S02.M01, F15.S01.M01, F15.S04.M02, CTR-FED-001, CTR-IDM-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-OBS-001, CTR-PRV-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
