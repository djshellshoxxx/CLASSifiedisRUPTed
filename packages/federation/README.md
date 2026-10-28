# @classrup/federation (F11)

Opt-in federation of public records between independently operated relays. Area `federation`, factory `createFederation(deps, ports)`.
Records are signed by their author (context `federated-record`) and countersigned by their origin relay (`relay-countersign`); batches are signed by the sending relay (`federation-batch`). The relay never holds author keys.

## Module map

| Module | Code |
|---|---|
| F11.S01.M01 portable | `src/protocol/portable.ts` (opt-in marks, publish, export, labels) |
| F11.S01.M02 records | `src/protocol/records.ts` (envelope v1, payload schemas, privacy scan, 32KB) |
| F11.S01.M03 signatures | `src/protocol/signatures.ts` |
| F11.S02.M01 delivery | `src/sync/delivery.ts`, `src/sync/outbox.ts` |
| F11.S02.M02 dedup | `src/sync/dedup.ts`, `src/sync/inbound.ts` |
| F11.S02.M03 conflicts | `src/sync/conflicts.ts` |
| F11.S03.M01 trust | `src/interop/trust.ts` |
| F11.S03.M02 blocklists | `src/interop/blocklists.ts` |
| F11.S03.M03 migration | `src/interop/migration.ts` |

## Operations (24)

| Operation | Kind | Permission |
|---|---|---|
| federation.record.mark_federated | command | federation.record:mark (authenticated) |
| federation.record.publish | command | federation.record:publish (authenticated) |
| federation.record.publish_label | command | federation.record:label (moderator, admin) |
| federation.record.export | query | federation.record:export |
| federation.record.get | query | federation.record:read (public) |
| federation.delivery.send_due | command | federation.delivery:send (system) |
| federation.delivery.requeue / status | command / query | federation.delivery:manage (admin) |
| federation.sync.receive | command | federation.sync:receive (actor kind `relay` or system) |
| federation.sync.purge_expired | command | federation.sync:purge (system) |
| federation.peer.register / transition / rotate_key / set_limits / get / list | command / query | federation.peer:manage (admin) |
| federation.blocklist.add / remove / review / import / export / list | command / query | federation.blocklist:manage (admin) |
| federation.migration.submit | command | federation.migration:submit (authenticated; admin may submit for any relay) |
| federation.migration.resolve | query | federation.migration:resolve (public) |

## Events

`federation.record.opt_in_changed|published|imported|tombstoned|rejected`, `federation.conflict.recorded`, `federation.delivery.sent|retry_scheduled|dead_lettered|requeued`, `federation.peer.registered|status_changed|key_rotated|limits_changed`, `federation.blocklist.added|removed|reviewed|imported`, `federation.migration.verified`. Payloads carry ids, hashes and counters only.

## Rules

- Opt-in: only records whose author turned `federate` on and who still holds federation consent are published; withdrawing needs a signed tombstone.
- Privacy: listing/profile payloads are strict schemas with `regionCell` of at most 5 characters; any key such as lat/lng/address/email/phone at any depth, and email or coordinate pairs in strings, reject the record.
- Conflicts (total order, arrival-order independent): higher revision wins; at equal revision a tombstone wins; then the smaller content hash. The author key must match the original author or a migration-proven successor.
- Inbound: peer must be `trusted`; batch signature checked against the pinned key; nonce via `ReplayGuard` on the `federation_nonces` collection; per-peer record rate and daily byte quota; 25 consecutive rejections suspend the peer.
- Delivery: batches of at most 100, backoff 30s doubling to 1h plus up to 20% jitter, dead letter after 8 attempts.

## Ports

Consumed (`src/ports.ts`): `FederationTransportPort` (default `retry`), `ListingLookup`, `AccountLookup`, `ConsentPort.hasConsent(accountId, 'federation')` (default deny), `RelayIdentity {relayId, keys}`, `random()` for jitter (default 0.5).
Provided: `markFederated(accountId, recordId, federate)`, `receive`, `blocklists.isBlocked`, `migration.isSameAuthor`.
System sweepers to schedule: `federation.delivery.send_due`, `federation.sync.purge_expired`.

## Collections

`federation_peers`, `federation_peer_stats`, `federation_records`, `federation_seen`, `federation_nonces`, `federation_conflicts`, `federation_deliveries`, `federation_marks`, `federation_blocks`, `federation_migrations`.

## Limits

- Records are accepted only from their origin relay (no transitive forwarding).
- Key rotations on another relay reach this relay through an operator submit; relay moves propagate through redirect tombstones.
- Destination-side import of migrated records is not implemented.
- Signatures evidence who asserted a record, not that it is true; moderation labels are relay statements.
