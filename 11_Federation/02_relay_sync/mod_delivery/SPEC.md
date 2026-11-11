# F11.S02.M01 — Relay delivery

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F11.S02](../SPEC.md). **Process IDs:** PS-088-01…PS-088-10. **Code:** `packages/federation/src/relay_sync/delivery`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Moves signed statements (CTR-FED-001 envelopes) to their destinations and tells the truth about how far each one got. On a relay it owns PeerOutbox, the relay-to-relay push of public records accepted from devices the relay hosts to allowlisted peers (one hop, never re-forwarding what came from a peer), behind flag F11. In the vault it routes each locally authored statement into the F15.S01.M01 sync outbox, which owns the vault-side states and limits, and provides the transport adapter that outbox calls: batching to the user's selected relays over POST /fed/v1/inbox with RFC 9421 device-key signatures, delivery of participant statements as sealed wrappers through the MailboxPort backed by F08.S01.M01 comms.mailbox.put (with a sender put proof), fetch and ack, and verification of classrup.platform.relay_receipt/v1 receipts and of recipients' signed acknowledgements. Public statements end at the relay that received them (F15.S01.M01 state completed, shown with the shared catalog key sync.state.completed); only a verified recipient acknowledgement reaches peer_accepted (sync.state.peer_accepted), and this module has no wording of its own. Batches hold at most 100 envelopes and 4 MiB, retries use exponential backoff with full jitter, and pull catch-up uses a cursor. Delivery is never claimed beyond the state actually reached.

## Responsibilities

- Own relay-side PeerOutbox entries, limited to relay-to-relay forwarding (destinationKind peer_relay), one per (envelope cid, canonical F15.S02.M01 relayId of the peer), created when the relay accepts a public record or author tombstone from a hosted device key, flag F11 is on and F10.S01.M01 privacy.consent.relay_check grants the author's federation_publish consent for public records.
- Route each statement authored in the vault into F15.S01.M01 outbox entries per destination (selected relays for public statements, recipient mailboxes for participant statements), after privacy.consent.check(federation_publish) for public ones.
- Provide the FederationTransportPort adapter used by F15.S01.M01 platform.outbox.deliver (batching, RFC 9421 request signing with tag classrup/relay-request/v1, classrup.platform.relay_receipt/v1 verification) and the MailboxPort {put, fetch, ack} route for recipient mailboxes and the user's own mailboxes, which F08.S01.M01 implements with comms.mailbox.put (with a sender put proof signed by this device's key), comms.mailbox.fetch and comms.mailbox.ack, bound at composition because F08.S01.M01 depends on this module.
- Verify relay receipts and recipients' signed acknowledgements (classrup.federation.ack/v1, signed by F11.S01.M02 receive in the recipient's vault) and report them to F15.S01.M01 platform.outbox.record_peer_ack with the verification facts {signerDid, keyId, keyStatus, checkedAt} that F11.S01.M02 recorded.
- Retry PeerOutbox entries with CTR-IDM-001 IDM-4 backoff and scheduled rounds, pause and resume them with peer and flag events and the F16.S03.M03 federation_off containment sentinel, resend them when a verified relay restore announcement covers their receipt, and emit federation.delivery.failed when a relay or vault federation entry fails or expires.
- Provide cursor-based pull catch-up so a vault or relay that was offline fetches public envelopes it missed from the relays listed in an author's portable identity document.
- Re-resolve a recipient's mailbox after the recipient moves, from the recipient's updated portable identity document or the mailbox hint of their public projection (N15).

## Not responsible for

- Vault outbox states, expiry, attempt limits, the per-statement status chips and their text (F15.S01.M01 owns OutboxEntry, its lifecycle and the shared catalog keys sync.state.<value>; this module supplies the transport adapter and maps its transport outcomes to F15.S01.M01 states, whose text comes only from those keys).
- Envelope verification, storage and signing of acknowledgements on receipt (F11.S01.M02).
- Peer allowlist, keys and quota values (F11.S03.M01).
- Block rules (F11.S03.M02).
- Mailbox storage, mailbox ids and sealing keys (F08.S01.M01 MailboxEnvelope); this module calls the MailboxPort bound at composition, keeps no mailbox store of its own, pulls the user's own mailboxes only through MailboxPort.fetch and ack, and never posts participant statements to /fed/v1/inbox.
- The containment sentinel contract (F16.S03.M03), read through the injected ContainmentPort of the relay process; no depends_on edge because F16.S03.M03 depends on F08.S01.M01, which depends on this module.
- End-to-end encryption of participant payloads (the source domain module encrypts the payload; F08.S01.M01 seals the wrapper).
- Content-free Web Push to wake a device (F13 notifications).
- Future: peer-to-peer WebRTC direct delivery between vaults and gossip fan-out beyond one hop.

## User stories

- As a seller on a train, I publish a listing offline and later see it move from sync.state.prepared ('Saved on this device only, waiting to send') to sync.state.sending and then sync.state.completed ('Delivered to relay <display name>, no peer confirmation needed') once my relay signs a receipt; a public listing never claims more than that.
- As a buyer, I send an offer and see sync.state.peer_accepted ('Confirmed by peer') only after the seller's vault signed an acknowledgement of exactly that offer, and the sync.state.transport_acknowledged text ('Delivered to relay <display name>, peer has not confirmed') if it never does.
- As a user whose relay is down, I see delivery unknown rather than delivered, and I can retry or choose another relay.
- As a relay operator, I can see per-peer queue depth, failures and quota use.

## Edge cases

- Relay returns a receipt but the buyer's vault never sends an acknowledgement; the F15 entry stays transport_acknowledged and after 30 days ends expired with expiredOutcome unconfirmed, still shown with the sync.state.transport_acknowledged text, never as failed.
- Destination relay returns 429; the entry waits for retryAfterMs and does not burn an attempt.
- Peer is suspended while 500 PeerOutbox entries are queued; those entries are paused, none are sent, and they resume on federation.peer.reinstated or are cancelled on federation.peer.removed.
- A tombstone is queued behind its target record for the same peer; the tombstone is sent after the record unless the record is still prepared, in which case both are cancelled and the tombstone is sent only if the record had already reached that peer.
- Recipient moved to a new relay (federation.account.moved); the mailbox route is re-resolved from the recipient's updated portable identity document or public-projection mailbox hint, and if none is found the entry waits with FEDERATION_RECIPIENT_UNRESOLVED instead of being sent to the old mailbox.
- A relay receives a public record from peer R2 (not from a hosted device); it is stored but never forwarded to another peer.
- Batch of 101 pending entries; split into batches of 100 and 1 with separate batchIds.
- The user withdraws federation_publish consent for relay R while public statements are queued; prepared entries to R are cancelled and author tombstones are requested for statements R already received.
- The containment sentinel federation_off appears while 300 PeerOutbox entries are prepared; they move to paused with pausedReason federation_killed, stay queued until expiresAt (7 days) and resume when the sentinel is removed, while vault deliveries to the relay are unaffected.
- Peer R2 publishes a verified classrup.platform.relay_restore/v1 whose lost window covers a receipt R2 gave for a buffered record; that transport_acknowledged entry returns to prepared and is resent under the same cid, and a delivered entry it covers is re-queued as a new prepared entry.
- A hosted author has no federation_publish consent registered with this relay; privacy.consent.relay_check returns granted false, so the record is indexed nowhere beyond this relay and no PeerOutbox entry is created, while the author's tombstones are still forwarded.
- A participant statement's vault entry expires in F15.S01.M01 without a receipt; federation.delivery.failed is emitted once with reason expired so F08.S01.M03 can delete the referenced attachment blob.

## UX and accessibility

- Delivery wording map for federation statements, pointing only to the shared catalog keys sync.state.<value> that the F15.S01.M01 status chip and F14.S01.M02 spokenSync use (no module-local strings): statement stored but not yet enqueued = sync.state.local_committed; F15 prepared = sync.state.prepared; sending = sync.state.sending; verified relay receipt for a participants statement = sync.state.transport_acknowledged; verified relay receipt for a public statement (final) = sync.state.completed; verified recipient acknowledgement (participants only) = sync.state.peer_accepted; conflict = sync.state.conflict; failed = sync.state.failed; expired with expiredOutcome unconfirmed = the sync.state.transport_acknowledged text; expired unsent = sync.state.expired; discarded = sync.state.discarded; {transport} names the relay display name; times labelled as relay time or your device time.
- Sync settings: selected relays with health, queue depth from F15.S01.M01, last success, buttons 'Retry now' and 'Remove relay'.
- Relay operator peers view: PeerOutbox queue depth, paused count, failure ratio and quota use per peer.

**States:** loading; empty; prepared; transport-acknowledged; delivered; paused; failed; cancelled; recipient-unresolved

**Accessibility:** Delivery chips use text plus icon and take their accessible name from the same sync.state.<value> key as their visible text (for example sync.state.transport_acknowledged 'Delivered to relay <display name>, peer has not confirmed'), identical to the F14.S01.M02 spokenSync string.; State changes are announced through an aria-live polite region, at most one announcement per 5 s.; Retry and remove buttons are ≥ 44×44 px with names that include the relay name.

## Owned data

- `PeerOutbox` (classrup.federation.peer_outbox/v1, P1, RET-SHORT)

## Interfaces

- Commands: `federation.outbox.enqueue`, `federation.outbox.retry`, `federation.outbox.cancel`, `federation.outbox.acknowledge`, `federation.outbox.dispatch`
- Queries: `federation.outbox.list`, `federation.outbox.pull`
- Emits: `federation.delivery.failed`
- Consumes: `federation.record.accepted`, `federation.tombstone.applied`, `federation.peer.added`, `federation.peer.suspended`, `federation.peer.reinstated`, `federation.peer.removed`, `federation.account.moved`, `identity.portable_doc.published`, `privacy.consent.withdrawn`, `platform.flag.changed`

## Dependencies

F11.S01.M01, F11.S01.M02, F11.S01.M03, F11.S03.M01, F11.S03.M02, F07.S02.M01, F15.S01.M01, F15.S02.M01, F15.S04.M02, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-IDM-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-OBS-001, CTR-PRV-001, CTR-IOX-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-088-01 | [Domain schema](domain_schema.md) | 5 |
| PS-088-02 | [Validation rules](validation_rules.md) | 7 |
| PS-088-03 | [Workflow state machine](workflow_state_machine.md) | 5 |
| PS-088-04 | [Commands, queries and events](commands_queries_events.md) | 8 |
| PS-088-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-088-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-088-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-088-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-088-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-088-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/federation/src/relay_sync/delivery/index.ts`.

## Acceptance criteria

- All tests T01–T31 pass in CI.
- The UI never shows a delivery state beyond the one recorded, renders delivery text only from the sync.state.<value> catalog keys, and a public statement never shows sync.state.peer_accepted (e2e and unit tests).
- A relay cannot cause peer_accepted without a recipient's signature, and every PeerOutbox entry is terminal by its expiresAt (abuse and property tests).
