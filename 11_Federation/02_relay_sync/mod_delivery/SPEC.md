# F11.S02.M01 — Relay delivery

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F11.S02](../SPEC.md). **Process IDs:** PS-088-01…PS-088-10. **Code:** `packages/federation/src/relay_sync/delivery`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Delivers signed statements (CTR-FED-001 envelopes) from a sender to chosen destinations and tells the truth about how far each one got. In the browser vault it is the sync outbox toward the user-selected relays and directly addressed recipient mailboxes; on a relay it is the relay-to-relay push to allowlisted peers. Each entry moves local committed (the record exists) to prepared, transport_acknowledged (a relay receipt) and peer_accepted (a signed peer acknowledgement). Batches hold at most 100 envelopes and 4 MiB, retries use exponential backoff with full jitter, and pull catch-up uses a cursor. Relay-to-relay delivery stays off unless flag F11 is on. Delivery is never claimed beyond the state actually reached.

## Responsibilities

- Own PeerOutbox entries, one per (envelope cid, destination), created when a locally authored statement is committed or a relay holds a public record to forward.
- Send batches via POST /fed/v1/inbox signed by the vault device key or relay key, honoring per-destination quotas from F11.S03.M01 and block rules from F11.S03.M02.
- Retry with CTR-IDM-001 IDM-4 backoff and then scheduled rounds, and emit federation.delivery.failed when an entry is abandoned.
- Record relay receipts (transport_acknowledged) and signed peer acknowledgements (peer_accepted) and expose the highest reached state to the UI.
- Provide cursor-based pull catch-up so a vault or relay that was offline fetches envelopes it missed.

## Not responsible for

- Envelope verification and storage on receipt (F11.S01.M02).
- Peer allowlist, keys and quota values (F11.S03.M01).
- Block rules (F11.S03.M02).
- End-to-end encryption of participant statements (the source domain module encrypts; this module moves ciphertext).
- Content-free Web Push to wake a device (F13 notifications).
- Future: peer-to-peer WebRTC direct delivery between vaults and gossip fan-out beyond one hop.

## User stories

- As a seller on a train, I publish a listing offline and later see it move from saved on this device to delivered to my relay and then accepted by the buyer's vault.
- As a user whose relay is down, I see delivery unknown rather than delivered, and I can retry or choose another relay.
- As a relay operator, I can see per-peer queue depth, failures and quota use.

## Edge cases

- Relay returns a receipt but the buyer's vault never sends an acknowledgement; the entry stays transport_acknowledged and the UI says relay received, recipient not confirmed.
- Destination relay returns 429; the entry waits for retryAfterMs and does not burn an attempt.
- Peer is suspended while 500 entries are queued; those entries are paused and resume or fail by peer decision, none are sent.
- A tombstone is queued behind its target record for the same destination; the tombstone is sent after the record unless the record is still prepared, in which case both are cancelled and the tombstone is sent only if the record had already reached any destination.
- Recipient moved to a new relay (federation.account.moved); queued entries are redirected to the new relay once the signed move record verifies.
- Batch of 101 pending entries; split into batches of 100 and 1 with separate batchIds.
- User deletes the account while entries are queued; pending entries are cancelled and replaced by tombstone delivery.

## UX and accessibility

- Per-statement delivery chip: 'Saved on this device', 'Queued', 'Relay received', 'Recipient confirmed', 'Failed - retry' with timestamps labelled as relay time or your device time.
- Sync settings: selected relays with health, queue depth, last success, buttons 'Retry now' and 'Remove relay'.
- Relay operator peers view: queue depth, failure ratio and quota use per peer.

**States:** loading; empty; local-committed; prepared; transport-acknowledged; peer-accepted; paused; failed; cancelled

**Accessibility:** Delivery chips use text plus icon and an accessible name such as 'Relay received, recipient not yet confirmed'.; State changes are announced through an aria-live polite region, at most one announcement per 5 s.; Retry and remove buttons are ≥ 44×44 px with names that include the relay name.

## Owned data

- `PeerOutbox` (classrup.federation.peer_outbox/v1, P2, RET-SHORT)

## Interfaces

- Commands: `federation.outbox.enqueue`, `federation.outbox.retry`, `federation.outbox.cancel`, `federation.outbox.acknowledge`, `federation.outbox.dispatch`
- Queries: `federation.outbox.list`, `federation.outbox.pull`
- Emits: `federation.delivery.failed`
- Consumes: `federation.record.accepted`, `federation.tombstone.applied`, `federation.peer.added`, `federation.peer.suspended`, `federation.account.moved`, `privacy.consent.withdrawn`, `platform.flag.changed`

## Dependencies

F11.S01.M02, F11.S01.M03, F11.S03.M01, F11.S03.M02, F07.S02.M01, F15.S01.M01, F15.S04.M02, CTR-FED-001, CTR-IDM-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-OBS-001, CTR-PRV-001, CTR-IOX-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-088-01 | [Domain schema](domain_schema.md) | 3 |
| PS-088-02 | [Validation rules](validation_rules.md) | 3 |
| PS-088-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-088-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-088-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-088-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-088-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-088-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-088-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-088-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/federation/src/relay_sync/delivery/index.ts`.

## Acceptance criteria

- All tests T01–T17 pass in CI.
- The UI never shows a delivery state beyond the one recorded (e2e and unit tests).
- A relay cannot cause peer_accepted without the recipient's signature (abuse test).
