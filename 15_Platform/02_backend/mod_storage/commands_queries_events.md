# PS-119-04 — Commands, queries and events: Storage

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S02.M03 Storage](SPEC.md) · **Scope:** MVP · **Code:** `packages/kernel/src/storage` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-119-04.R01** Storage exposes transaction(fn) that commits records, outbox events, inbox entries, idempotency records, leases, sync-outbox entries and blob references atomically when fn returns ok and rolls back on err or exception.
- **PS-119-04.R02** Repo<T> per type offers get, require, put with expectedRevision, remove, restore and query by up to four indexed fields with equality and range filters, ordering and opaque cursors.
- **PS-119-04.R03** The outbox dispatcher delivers to subscribers registered per event type in (aggregate, revision) order per aggregate and deduplicates by (consumer, eventId) in the inbox.
- **PS-119-04.R04** The sync sender delivers signed statements per destination in creation order through a SyncTransport port and exposes recordPeerAck, the primitive behind platform.outbox.record_peer_ack (F15.S01.M01).
- **PS-119-04.R05** Blob storage offers put, get, info, attach and detach, and repositories that declare blob refs keep reference counts in step with record writes.

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

**Note:** Library module with no commands of its own. Every caller is a vault command, a relay command or a consumer running through the F15.S02.M02 bus. Signed statements enter the sync outbox only from definitions flagged deliveryEligible; peer acknowledgements are recorded by F15.S01.M01 platform.outbox.record_peer_ack through recordPeerAck; dead-letter replay is platform.deadletter.replay owned by F15.S03.M03 using the requeue primitive.

### Example

```
const offers = defineRepo({ type: 'bazaar.offer', schema: Offer, indexes: { listing: (o) => o.listingId, status: (o) => o.status } });
await storage.transaction(async (tx) => {
  const r = scope(tx).repo(offers).put(id, offer, { expectedRevision: 0 });   // revision 1
  if (!r.ok) return r;                                                       // CONFLICT_REVISION / NOT_FOUND
  tx.outbox.append(envelope);                                               // same transaction
  scope(tx).sync.enqueue('relay:https://relay.example', signedOffer);        // state prepared
  return ok(r.value);
});
repo.query({ where: { listing: lid, status: 'made' }, orderBy: 'status', limit: 50, cursor })
→ ok { items: StoredRecord[], nextCursor? }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-119-09.T01 | contract | PS-119-01.R01, PS-119-01.R03, PS-119-02.R01, PS-119-02.R02, PS-119-04.R02, PS-119-09.R01 | create, duplicate create, stale update, remove, equality, range, ordered and cursor queries on memory, SQLite and IndexedDB | identical results; CONFLICT_REVISION with currentRevision; NOT_FOUND; VALIDATION_FAILED for bad cursor or limit |
| TEST-PS-119-09.T02 | contract | PS-119-04.R01 | err and exception after writing records, outbox, idempotency, lease and sync rows, then a commit | nothing persists after err or exception; everything persists after ok |
| TEST-PS-119-09.T04 | integration | PS-119-01.R02, PS-119-03.R01, PS-119-04.R03, PS-119-06.R03, PS-119-09.R02 | two aggregates with a failing first delivery, duplicate delivery, eight failures, requeue; pending query semantics per adapter | per-aggregate order kept; duplicate skipped; dead letter at attempt 8; requeued events delivered |
| TEST-PS-119-09.T05 | contract | PS-119-03.R02, PS-119-04.R04 | FIFO heads per destination, retry_later, transport ack, undeclared transition, peer ack twice, sender with fatal, retryable and 7-day failures | declared states only; CONFLICT_STATE; idempotent ack; failed with VALIDATION_FAILED and EXPIRED |
| TEST-PS-119-09.T17 | contract | PS-119-01.R04, PS-119-02.R04, PS-119-04.R05, PS-119-05.R02, PS-119-07.R04 | put, dedupe, oversize, bad type, plaintext P2 on relay, shared photos across two listings, rollback, last removal, encrypted detach, orphan sweep, privacy lowering on each adapter | content address format; refcounts 2 then 1; blob deleted with last holder; shred true; relay rejects plaintext P2 |

## Dependencies

Module depends on: F15.S03.M01, CTR-ID-001, CTR-SCH-001, CTR-IDM-001, CTR-EVT-001, CTR-ERR-001, CTR-PRV-001, CTR-IOX-001, CTR-FLG-001, CTR-OBS-001, CTR-TST-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
