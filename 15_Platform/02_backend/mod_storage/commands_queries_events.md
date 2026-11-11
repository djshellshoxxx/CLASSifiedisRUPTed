# PS-119-04 — Commands, queries and events: Storage

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S02.M03 Storage](SPEC.md) · **Scope:** MVP · **Code:** `packages/kernel/src/storage` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-119-04.R01** Storage exposes transaction(fn) that commits records (including OutboxEntry records of F15.S01.M01), outbox events, inbox entries, idempotency records, leases, dead-letter changes and blob references atomically when fn returns ok and rolls back on err or exception.
- **PS-119-04.R02** Repo<T> per type offers get, require, put with expectedRevision, remove, restore and query by up to four indexed fields with equality and range filters, ordering and opaque cursors.
- **PS-119-04.R03** The outbox dispatcher delivers to subscribers registered per event type in (aggregate, revision) order per aggregate and deduplicates by (consumer, eventId) in the inbox.
- **PS-119-04.R04** Storage holds no sync outbox - no sync_outbox table or object store, SyncOutboxEntry machine, sync sender, SyncTransport port or recordPeerAck - and F15.S01.M01 keeps OutboxEntry rows as records of type platform.outbox_entry in the vault's single IndexedDB database, enqueued inside the caller's transaction(fn) so they commit or roll back with the domain record (N24).
- **PS-119-04.R05** Blob storage offers put (with optional expectedRef), get, info, attach and detach, applies the TenantPort size limit and the relay image verifier on put, and repositories that declare blob refs keep reference counts in step with record writes.
- **PS-119-04.R06** Dead letters offer list(consumer?, limit), requeue(consumer, eventId), the 7-day and disabled-consumer return to dead run by the dispatcher, and purge(before) that deletes dead letters whose dead_at is before the cutoff and whose event is not currently requeued; F15.S03.M03 platform.deadletter.replay and its purge schedule use them.
- **PS-119-04.R07** Storage treats relayId and destination values as opaque strings in the canonical form F15.S02.M01 defines (relayId 'relay:' plus 26 lowercase base32 characters of SHA-256 of the genesis key; destinations '<relayId>', '<relayId>/mailbox/<mailboxId>', '<relayId>/index/<indexName>', '<relayId>/auction/<auctionId>' or 'direct:<did>') and never derives, normalizes or rewrites them in data or index values.

## Specification

### Commands

_None._

### Queries

_None._

### Events produced

_None._

### Events consumed

_None._

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| PLATFORM_STORE_MIGRATION_DRIFT | 500 | no | a recorded kernel migration checksum differs from the code; the relay refuses to start |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Library module with no commands of its own. Every caller is a vault command, a relay command or a consumer running through the F15.S02.M02 bus. F15.S01.M01 owns the vault sync outbox (OutboxEntry records of type platform.outbox_entry, their state machine, sender and peer acknowledgements, N24) and uses only repositories and transaction(fn) from storage. Dead-letter replay is platform.deadletter.replay owned by F15.S03.M03 using the list, requeue and purge primitives. TenantPort (F15.S04.M03) and the relay image verifier (F10.S02.M03 verifyImageClean) reach storage by inverted registration at composition; their error codes (PRIVACY_METADATA_GPS_PRESENT of F10.S02.M03) pass through unchanged.

### Example

```
const offers = defineRepo({ type: 'bazaar.offer', schema: Offer, indexes: { listing: (o) => o.listingId, status: (o) => o.status } });
await storage.transaction(async (tx) => {
  const r = scope(tx).repo(offers).put(id, offer, { expectedRevision: 0 });   // revision 1
  if (!r.ok) return r;                                                       // CONFLICT_REVISION / NOT_FOUND
  tx.outbox.append(envelope);                                               // same transaction
  outboxPort.enqueue(tx, entry);   // F15.S01.M01 writes a platform.outbox_entry record, destination 'relay:7k3mqxw2a9b4c5d6e7f8g9h0jk/mailbox/mbx_9f2'
  return ok(r.value);
});
repo.query({ where: { listing: lid, status: 'made' }, orderBy: 'status', limit: 50, cursor })
→ ok { items: StoredRecord[], nextCursor? }
relay: scope(tx).blobs.put(bytes, { contentType: 'image/webp', privacy: 'P0', expectedRef })
→ ok { ref: 'blob:sha256-Qm3…' } | err PAYLOAD_TOO_LARGE (tenant maxUploadBytes) | err PRIVACY_METADATA_GPS_PRESENT
F15.S03.M03: tx.deadLetters.requeue('search.indexer', eventId) → replay_count 1, last_replayed_at now
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-119-09.T01 | contract | PS-119-01.R01, PS-119-01.R03, PS-119-02.R01, PS-119-02.R02, PS-119-04.R02, PS-119-09.R01 | create, duplicate create, stale update, remove, equality, range, ordered and cursor queries on memory, SQLite and IndexedDB | identical results; CONFLICT_REVISION with currentRevision; NOT_FOUND; VALIDATION_FAILED for bad cursor or limit |
| TEST-PS-119-09.T02 | contract | PS-119-04.R01 | err and exception after writing records, a platform.outbox_entry record, outbox, idempotency and lease rows and a dead-letter requeue, then a commit | nothing persists after err or exception; everything persists after ok |
| TEST-PS-119-09.T04 | integration | PS-119-01.R02, PS-119-03.R01, PS-119-04.R03, PS-119-06.R03, PS-119-09.R02 | two aggregates with a failing first delivery, duplicate delivery, eight failures, requeue; pending query semantics per adapter | per-aggregate order kept; duplicate skipped; dead letter at attempt 8; requeued events delivered |
| TEST-PS-119-09.T05 | contract | PS-119-01.R05, PS-119-03.R02, PS-119-04.R06, PS-119-07.R02 | dead-letter an event, requeue it, fail 8 more times, requeue again, requeue twice in a row, disable the consumer of a third requeued event, leave a fourth undelivered 7 days, deliver a fifth, purge at dead_at + 30 days | replay_count 1 then 2 with last_replayed_at kept on re-dead-lettering; second requeue CONFLICT_STATE; FEATURE_DISABLED and EXPIRED returns keep replay_count; delivered row deleted; purge removes only dead rows older than 30 days |
| TEST-PS-119-09.T17 | contract | PS-119-01.R04, PS-119-02.R04, PS-119-04.R05, PS-119-05.R02, PS-119-07.R04 | put, dedupe, oversize, bad type, plaintext P2 on relay, shared photos across two listings, rollback, last removal, encrypted detach, orphan sweep, privacy lowering on each adapter | content address format; refcounts 2 then 1; blob deleted with last holder; shred true; relay rejects plaintext P2 |
| TEST-PS-119-09.T18 | contract | PS-119-04.R04 | enqueue a platform.outbox_entry record inside a domain transaction that then fails, then one that commits; inspect adapter tables, object stores and the storage public API | entry and domain record roll back and commit together; no sync_outbox table or object store, no sync sender, SyncTransport or recordPeerAck exported |
| TEST-PS-119-09.T19 | contract | PS-119-02.R04, PS-119-02.R05, PS-119-04.R05, PS-119-07.R04 | relay tenant maxUploadBytes 3 MiB with a 4 MiB P0 photo, vault maxLocalAttachmentBytes 1 MiB with a 2 MiB photo, no TenantPort with a 5 MiB photo; relay image puts that the verifier reports clean and not clean, a put whose bytes differ from expectedRef, an image put with no verifier registered | PAYLOAD_TOO_LARGE, PAYLOAD_TOO_LARGE, stored; clean bytes stored byte-identical with ref equal to expectedRef; PRIVACY_METADATA_GPS_PRESENT with nothing stored; VALIDATION_FAILED; INTERNAL; no re-encode call exists |
| TEST-PS-119-09.T22 | contract | PS-119-04.R07 | store records whose data and index values hold canonical relayId and destination strings on each adapter, query by destination and round-trip through export and restore | byte-identical strings, UTF-8 binary order kept, nothing derived or rewritten |

## Dependencies

Module depends on: F15.S03.M01, CTR-ID-001, CTR-SCH-001, CTR-IDM-001, CTR-EVT-001, CTR-ERR-001, CTR-PRV-001, CTR-IOX-001, CTR-FLG-001, CTR-OBS-001, CTR-TST-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
