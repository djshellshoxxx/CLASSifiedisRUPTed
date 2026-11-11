# PS-119-07 — Privacy, retention and abuse: Storage

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S02.M03 Storage](SPEC.md) · **Scope:** MVP · **Code:** `packages/kernel/src/storage` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-119-07.R01** Storage copies record data only into its own row; logs, metrics labels, inbox rows and dead-letter rows carry IDs, types and error codes, never record data beyond the event envelope itself.
- **PS-119-07.R02** Outbox rows are pruned after 7 days and idempotency rows after 24 h; dead letters are purged 30 days after dead_at (RET-SHORT) by the purge primitive that F15.S03.M03 schedules, and a requeued event is not purged until it is delivered or dead again.
- **PS-119-07.R03** Dead letters and inbox rows store the error code only, never exception messages with payload content.
- **PS-119-07.R04** Relay blob storage accepts only P0 plaintext that the registered verifyImageClean reported clean (for images) or ciphertext, stores exactly the received bytes, and deletes a blob with its last reference so removed listings do not leave photos behind.

## Specification

**Data classification**
- StoredRecord: class of the owning module (up to P3 in the vault; relays hold only public projections, ciphertext and relay-local data).
- OutboxEvent: class declared per event type; local to one vault or relay.
- InboxEntry and dead letters: IDs, types, attempts, error codes, replay_count and last_replayed_at.
- MediaBlob: P0 public media, P2 as ciphertext, P3 only in the vault; metadata stripped before storage.
- IndexedDB pre-upgrade snapshot: a copy of the vault database on the same device with the same classes; never uploaded.

**Retention**
- OutboxEvent: 7 days after occurredAt (FLG-3 window), RET-SHORT.
- Dead letters: purged 30 days after dead_at, RET-SHORT; InboxEntry done rows pruned with their events.
- MediaBlob: RET-STANDARD, deleted with the last referencing record; encrypted blobs are crypto-shredded by the key owner.
- IndexedDB pre-upgrade snapshot: kept until the next version bump replaces it or the vault is erased.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Partial writes leaving events without state or state without events | one transaction for records (including OutboxEntry records), outbox and inbox rows; rollback on any failure |
| T02 | Cross-tenant reads on a multi-tenant relay | every scope is bound to the context tenantId; tenant is part of every primary key |
| T03 | Poison event blocking a consumer forever | per-aggregate hold only, dead letter after 8 attempts, requeue primitive with replay_count |
| T04 | Private photos leaking through a relay | relay accepts P0 plaintext or ciphertext only; verifyImageClean on receipt rejects GPS and metadata; bytes stored exactly, never re-encoded |
| T05 | Lease theft by a stale holder | compare-and-set on holder and expiry; fencing counter for downstream checks |
| T06 | Silent loss of WAL frames before archiving | wal_autocheckpoint=0 on every relay connection and no storage checkpoint while F15.S03.M02 is the registered checkpointer |
| T07 | Substituted media bytes under a signed listing ref | expectedRef check against SHA-256 of the received bytes; no re-encode path exists on a relay |

**Abuse controls**
- Blob size cap 5 MiB lowered by the tenant limit, and query limit 500, bound per-request work.
- Orphan blob sweep removes uploads that were never attached to a record.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-119-09.T05 | contract | PS-119-01.R05, PS-119-03.R02, PS-119-04.R06, PS-119-07.R02 | dead-letter an event, requeue it, fail 8 more times, requeue again, requeue twice in a row, disable the consumer of a third requeued event, leave a fourth undelivered 7 days, deliver a fifth, purge at dead_at + 30 days | replay_count 1 then 2 with last_replayed_at kept on re-dead-lettering; second requeue CONFLICT_STATE; FEATURE_DISABLED and EXPIRED returns keep replay_count; delivered row deleted; purge removes only dead rows older than 30 days |
| TEST-PS-119-09.T09 | contract | PS-119-07.R02 | idempotency rows before, at and after expiry, an outbox row older than 7 days, a dead letter 30 days after dead_at and a requeued one with an old dead_at | expired and old rows purged; current and requeued rows kept |
| TEST-PS-119-09.T10 | integration | PS-119-07.R01, PS-119-07.R03, PS-119-08.R03 | consumer fails 8 times for an event with a private name | inbox dead with code only; one warn log with consumer, type and code; no payload text in outbox logs |
| TEST-PS-119-09.T17 | contract | PS-119-01.R04, PS-119-02.R04, PS-119-04.R05, PS-119-05.R02, PS-119-07.R04 | put, dedupe, oversize, bad type, plaintext P2 on relay, shared photos across two listings, rollback, last removal, encrypted detach, orphan sweep, privacy lowering on each adapter | content address format; refcounts 2 then 1; blob deleted with last holder; shred true; relay rejects plaintext P2 |
| TEST-PS-119-09.T19 | contract | PS-119-02.R04, PS-119-02.R05, PS-119-04.R05, PS-119-07.R04 | relay tenant maxUploadBytes 3 MiB with a 4 MiB P0 photo, vault maxLocalAttachmentBytes 1 MiB with a 2 MiB photo, no TenantPort with a 5 MiB photo; relay image puts that the verifier reports clean and not clean, a put whose bytes differ from expectedRef, an image put with no verifier registered | PAYLOAD_TOO_LARGE, PAYLOAD_TOO_LARGE, stored; clean bytes stored byte-identical with ref equal to expectedRef; PRIVACY_METADATA_GPS_PRESENT with nothing stored; VALIDATION_FAILED; INTERNAL; no re-encode call exists |

## Dependencies

Module depends on: F15.S03.M01, CTR-ID-001, CTR-SCH-001, CTR-IDM-001, CTR-EVT-001, CTR-ERR-001, CTR-PRV-001, CTR-IOX-001, CTR-FLG-001, CTR-OBS-001, CTR-TST-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
