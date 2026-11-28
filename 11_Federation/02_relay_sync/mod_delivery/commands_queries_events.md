# PS-088-04 — Commands, queries and events: Relay delivery

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S02.M01 Relay delivery](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/relay_sync/delivery` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-088-04.R01** The module exposes enqueue, retry, cancel, acknowledge and dispatch commands, the relay pull query and the relay queue list, plus the vault transport adapter called by F15.S01.M01, with the signatures below.
- **PS-088-04.R02** Commands that send data produce no new signed statement except the signed request itself; acknowledgements are signed by F11.S01.M02 receive in the recipient's vault, and the statements delivered were signed earlier by their authors.
- **PS-088-04.R03** The module consumes record, tombstone, peer, migration, identity document, consent and flag events to keep the queue consistent with policy.
- **PS-088-04.R04** On a relay, only public records and author tombstones accepted from a hosted device key are forwarded to peers, one hop, and records received from a peer are never forwarded.
- **PS-088-04.R05** Recipient mailbox delivery goes through the MailboxPort implemented by F08.S01.M01 comms.mailbox.put, never through POST /fed/v1/inbox.
- **PS-088-04.R06** The vault pulls the user's own mailboxes only through MailboxPort.fetch, hands each envelope to F11.S01.M02 federation.record.receive with source mailbox and calls MailboxPort.ack after the receive committed; each put carries an RFC 9421 signature by the sender's per-relay request key and no device key, message ID or sender DID (V15).
- **PS-088-04.R07** federation.delivery.failed is emitted for relay PeerOutbox entries that fail or expire and for vault F15.S01.M01 federation entries that reach failed or expired, once per entry, so consumers such as F08.S01.M03 can delete attachment blobs of messages that were never delivered.
- **PS-088-04.R08** federation.outbox.acknowledge passes the verification facts {signerDid, keyId, keyStatus, checkedAt} that F11.S01.M02 recorded for the verified ack to F15.S01.M01 platform.outbox.record_peer_ack.
- **PS-088-04.R09** Author tombstones are forwarded from the delivery index, which holds a row for every peer that received the target by push or by pull, and federation.outbox.pull returns author tombstones in cursor order so a pulling peer receives them too; the vault routes its own tombstones to every active selected relay and every relay in the target's stored relayReceipts.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `federation.outbox.enqueue` | federation.outbox.enqueue | [relay-local command creating PeerOutbox entries, driven by federation.record.accepted and federation.tombstone.applied; vault-local command routing a locally authored statement into F15.S01.M01 platform.outbox.enqueue per destination with needsPeerAck = (audience participants)] { cid, destinations: Destination[1..10] } | { entries: [ { id, destination, state: prepared } ] } | NOT_FOUND, FEDERATION_PEER_NOT_ALLOWED, FEDERATION_DESTINATION_INVALID, FEDERATION_NOT_OPTED_IN, FEDERATION_RECIPIENT_UNRESOLVED, VALIDATION_FAILED, RATE_LIMITED, DEPENDENCY_UNAVAILABLE |  | yes (Idempotency-Key) |
| `federation.outbox.retry` | federation.outbox.retry | [relay command, operator] { entryId, expectedRevision } for a failed PeerOutbox entry; vault retries are F15.S01.M01 platform.outbox.resolve | { entryId, revision, newEntryId } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, FEDERATION_QUOTA_EXCEEDED |  | yes (Idempotency-Key) |
| `federation.outbox.cancel` | federation.outbox.cancel | [relay command, operator or system] { entryId, expectedRevision } | { entryId, revision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE |  | yes (Idempotency-Key) |
| `federation.outbox.acknowledge` | federation.outbox.acknowledge | [vault-local command, driven by federation.record.accepted for type classrup.federation.ack/v1] { ack: Envelope already accepted by F11.S01.M02, verification: {signerDid, keyId, keyStatus, checkedAt} from that event } -> verifies V06 and calls F15.S01.M01 platform.outbox.record_peer_ack { entryId, ackCid, verification } for the matching entry | { outboxEntryId, state: peer_accepted } | NOT_FOUND, FEDERATION_RECEIPT_INVALID, CONFLICT_STATE |  | yes (Idempotency-Key) |
| `federation.outbox.dispatch` | federation.outbox.dispatch | [relay worker command for PeerOutbox, paused while the containment sentinel federation_off exists; in the vault the same batching, RFC 9421 signing (tag classrup/relay-request/v1) and relay_receipt verification run inside the FederationTransportPort adapter that F15.S01.M01 platform.outbox.deliver calls, participant statements go to MailboxPort.put signed by the per-relay request key (V15), and own mailboxes are pulled through MailboxPort.fetch and ack] { destinationId, limit ≤ 100 } | { sent, receipts, delivered, failed } | FEDERATION_QUOTA_EXCEEDED, FEDERATION_BATCH_TOO_LARGE, FEDERATION_RECEIPT_INVALID, FEDERATION_NOT_OPTED_IN, DEPENDENCY_UNAVAILABLE, FEATURE_DISABLED | federation.delivery.failed | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `federation.outbox.list` | federation.outbox.read | [relay query, operator] { state?, destinationId?, cid?, cursor?, limit ≤ 50 } | { items: PeerOutbox[], nextCursor? } |  |
| `federation.outbox.pull` | federation.outbox.pull | [relay query under relay policy, GET /fed/v1/outbox] { since: cursor, author?, limit ≤ 100 } | { envelopes: Envelope[≤100] (public only; author tombstones are included in cursor order), nextCursor } and a delivery index row {cid, destinationId, pulledAt} is written for each returned cid | FEDERATION_PEER_NOT_ALLOWED, RATE_LIMITED, FEATURE_DISABLED |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `federation.delivery.failed` | P2 | { entryId, cid, destinationKind: peer_relay\|selected_relay\|recipient_mailbox, destinationId (canonical F15.S02.M01 destination string), reason: timeout\|unreachable\|server_error\|rejected\|retry_exhausted\|expired\|receipt_equivocation, code?, attempts, receiptSeen: boolean } — P1 on relays (peer_relay only); P2 in vaults because recipient mailbox destinations are participant routing data |

### Events consumed

| Type | Effect |
|---|---|
| `federation.record.accepted` | vault: federation.record.publish (N25) already enqueues the outbox entries of a locally authored statement in its own transaction through federation.outbox.enqueue; this consumer only repairs a local record that has no entry (audience public to every active selected relay after V09, audience participants to each recipient {relayId, mailboxId}) and, when type is classrup.federation.ack/v1, calls federation.outbox.acknowledge. Relay: when audience public, sourceKind hosted_device, flag F11 on, the record's forwarding opt-in true (payload.federationOptIn for listings; other portable types never) and privacy.consent.relay_check granted for the author (V12), enqueue PeerOutbox entries for active peer_relay peers with direction outbound or both, paused at once while the containment sentinel exists; never for sourceKind peer_relay |
| `federation.tombstone.applied` | author tombstones: relay enqueues the tombstone to every active peer in the delivery index for the target (pushed or pulled, kept for max(180 days, maxAgeOf of the target type) independent of PeerOutbox retention; consent-exempt) and cancels still-prepared target entries; vault routes own tombstones to every active selected relay and to every relay named in the target's stored relayReceipts (F11.S01.M02). relay_removal advisories are never forwarded to peers |
| `federation.peer.added` | relay: start pull catch-up from the new peer relay when direction is inbound or both |
| `federation.peer.suspended` | relay: pause PeerOutbox entries for that relayId (pausedReason peer_suspended) |
| `federation.peer.reinstated` | relay: move paused entries for that relayId back to prepared with nextAttemptAt = now |
| `federation.peer.removed` | relay: cancel every non-terminal entry for that relayId; vault: F15 entries for that selected relay are offered for re-route by F15.S01.M01 |
| `federation.account.moved` | for a moved recipient, re-resolve the mailbox of waiting recipient_mailbox entries from the recipient's updated portable document or public-projection mailbox hint (N15) and re-route them; if none is found the entries wait with FEDERATION_RECIPIENT_UNRESOLVED |
| `identity.portable_doc.published` | origin received: re-resolve waiting recipient_mailbox routes of that DID and refresh the catch-up relays used for its public records |
| `privacy.consent.withdrawn` | purpose federation_publish: cancel prepared public entries to the affected relays and request author tombstones through F11.S01.M02 for statements those relays already received |
| `platform.flag.changed` | relay: when F11 turns off pause peer_relay entries (pausedReason flag_off); when F11 turns on move them back to prepared; vault to relay delivery is unaffected |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| FEDERATION_DESTINATION_INVALID | 422 | no | destination kind does not match the statement audience or flag state, or a participants statement was offered to a relay inbox |
| FEDERATION_RECEIPT_INVALID | 422 | no | receipt or acknowledgement signature, signer or cid check failed |
| FEDERATION_RECIPIENT_UNRESOLVED | 409 | yes | no mailbox could be resolved for a moved recipient; the entry waits and is retried when a new portable document or mailbox hint arrives |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
vault: federation.record.accepted { cid: "sha256-Qm...", type: "classrup.bazaar.listing/v1", audience: "public", local: true }
-> federation.outbox.enqueue { cid, destinations: [ { kind: "selected_relay", relayId: "relay:home.example" } ] } -> F15 entry prepared (sync.state.prepared)
F15 deliver -> FederationTransportPort: POST https://home.example/fed/v1/inbox (batch of 1, RFC 9421 device-key signature) -> receipt outcome accepted -> F15 completed (sync.state.completed)
participants offer -> MailboxPort.put { mailboxId, wrapper: { v: 1, mailboxId, ciphertext, size, sentAt } } -> receipt -> F15 transport_acknowledged; seller vault signs ack -> federation.outbox.acknowledge -> F15 peer_accepted (sync.state.peer_accepted)
relay: PeerOutbox to relay:7k3mqxw2a9b4c5d6e7f8g9h0jk prepared -> relay_receipt {relayId, keyId, destination, digest = sentDigest, cid, receivedAt, epoch 0, seq 88122, sig} outcome accepted -> transport_acknowledged -> delivered
relay: sentinel federation_off created -> prepared entries paused (federation_killed) -> sentinel removed -> prepared -> dispatched
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-088-09.T01 | integration | PS-088-01.R01, PS-088-01.R02, PS-088-04.R01 | relay R1 accepts a public listing from a hosted device key and dispatches it to peer R2 | PeerOutbox entry prepared, then transport_acknowledged with verified receipt, then delivered; payload not copied into the entry |
| TEST-PS-088-09.T06 | integration | PS-088-04.R03 | author tombstone for a record delivered to R2; consent federation_publish withdrawn with entries prepared | tombstone queued to R2 only; prepared public entries cancelled and tombstones requested for delivered ones |
| TEST-PS-088-09.T07 | contract | PS-088-04.R01, PS-088-04.R02, PS-088-09.R03 | each command, the pull query, the transport adapter and the delivery.failed event | inputs, outputs, receipts and acknowledgements validate against registry schemas |
| TEST-PS-088-09.T14 | abuse | PS-088-04.R04 | relay receives a public record from peer R2, and a hosted record while F11 is off; 5001st queued entry from one hosted vault | the peer record is never forwarded; nothing enqueued with F11 off; the 5001st RATE_LIMITED |
| TEST-PS-088-09.T20 | integration | PS-088-02.R05, PS-088-04.R05 | participants statement to recipient Q; Q moves and publishes a new portable document with a new mailbox hint; Q moves with no resolvable mailbox | delivered through the MailboxPort stub, never /fed/v1/inbox; route re-resolved to the new mailbox; unresolved entries wait with FEDERATION_RECIPIENT_UNRESOLVED |
| TEST-PS-088-09.T23 | integration | PS-088-04.R02, PS-088-04.R03 | recipient vault's ack arrives as federation.record.accepted; an ack signed by a non-recipient | federation.outbox.acknowledge records peer_accepted in F15.S01.M01; no statement signed by this module; the non-recipient ack is refused FEDERATION_RECEIPT_INVALID |
| TEST-PS-088-09.T29 | integration | PS-088-04.R06 | vault pulls its own mailbox with 3 envelopes, F11.S01.M02 receive fails on the third; a participant offer is put to a recipient mailbox | fetch then ack for the first two only, the third is fetched again on the next pull; the put carries an RFC 9421 signature by the per-relay request key (tag classrup/relay-request/v1) covering @method, @target-uri, content-digest, created, keyid and nonce, and no device key, messageId or sender DID; no mailbox rows exist in this module |
| TEST-PS-088-09.T30 | integration | PS-088-04.R07 | vault participant entry expires in F15.S01.M01 without a receipt; another fails with retry_exhausted; a relay PeerOutbox entry fails | federation.delivery.failed emitted exactly once for each with reasons expired, retry_exhausted and the receiver code, destinationKind recipient_mailbox or peer_relay; the F08.S01.M03 consumer stub deletes the unsent blob |
| TEST-PS-088-09.T31 | contract | PS-088-04.R08 | recipient ack accepted by F11.S01.M02 with verification facts; ack event without facts | platform.outbox.record_peer_ack called with {entryId, ackCid, verification {signerDid, keyId, keyStatus active, checkedAt}}; without facts the acknowledge is refused FEDERATION_RECEIPT_INVALID |
| TEST-PS-088-09.T33 | integration | PS-088-01.R06, PS-088-04.R09 | author tombstone issued 45 days after delivery to a pushing peer R2 and to a pulling peer R3 (PeerOutbox rows already purged) | both are in the delivery index; the tombstone reaches R2 by push and R3 through federation.outbox.pull in cursor order and is applied within 24 h |
| TEST-PS-088-09.T34 | integration | PS-088-04.R09 | vault listing published to R1 and R3 and withdrawn on day 45 after its F15.S01.M01 entries were deleted | the tombstone is routed to both relays named in the stored relayReceipts |

## Dependencies

Module depends on: F11.S01.M01, F11.S01.M02, F11.S01.M03, F11.S03.M01, F11.S03.M02, F07.S02.M01, F15.S01.M01, F15.S02.M01, F15.S04.M02, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-IDM-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-OBS-001, CTR-PRV-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
