# Attachment/reference recovery — bounded P1 engineering specification

Status: **draft design checkpoint, not implemented or accepted** (2026-11-20).
Source baseline: `main` commit `449a619f1ae7b66cb42d9cab43dd5493bfe42c2e`, tree `8fe1965ae60c385042f09c690eabe7d0828b36e8`.
Owners of open candidates #64, #65 and #66 retain those separate branches.

## Confirmed existing boundary

- `packages/vault/src/vault.ts` exports the current principal's registered **record** codecs via a signed, passphrase-encrypted `classrup.vault.alpha_backup/v1` envelope. The current registry has 15 production record types. Export rechecks same-snapshot coverage and rejects unsupported owner types, oversized inventories and invalid record preflight; restore admits one empty destination and commits identity plus normalized records transactionally.
- `backupCoverage().excludedStores` names `blobs`, `blob_refs`, `outbox`, `inbox`, `idempotency`, `leases`, `dead_letter`, `sync_outbox`, `schema_migrations` and `meta`. The existing backup is **not** a complete database snapshot. The outbox/inbox stores here are infrastructure stores; delivered notification domain records are distinct.
- `packages/vault/src/encrypted-storage.ts` serializes binary blob bytes as base64url before encrypting rows. Durable row addresses and AES-GCM additional authenticated data are tied to storage name/table/key; copying raw IndexedDB ciphertext into a second named vault is therefore **not** a supported recovery strategy. The storage-wide authenticated inventory covers physical rows but is not a portable backup format.
- Current v1 records, signatures, identities, key material, wire bytes, encryption/KDF settings, admission caps, timeout and browser selection must remain unchanged.

## Phase A: attachment contract and referential inventory (next implementable slice)

### Source inventory completed in this review round

The actual kernel port is now known (not inferred). In `packages/kernel/src/storage/driver.ts` at blob `7a38661ae28a4130489777b2785a45d80110d9ce`, `BlobRow` contains `tenant`, content-addressed `ref` (`blob:sha256-<base64url>`), `bytes`, `size`, `contentType`, `privacy` (`P0`–`P3`), `encrypted`, and `createdAt`. In `packages/kernel/src/storage/memory-driver.ts` at `54bc3502b1577da617a1a02e4f23c5596636cb60`, a `blob_refs` row has only `tenant`, `ref`, `holder`; `attach` persists the holder by composite key and `holders` returns a count. The field `holder` is a caller-supplied string, not an authenticated record pointer.

In `packages/kernel/src/storage/tx.ts` at `f876565e45853ee7d1a6ca90b2d88cd2441296d7`, the public `tx.blobs` interface supports `put`, `get`, `info`, `attach`, `detach`, `collectOrphans` and `shredded`, **but no tenant-wide read-only enumeration**. `attach` can create a reference when bytes are absent and returns `present: false`; this is a legitimate missing-blob case to detect. `collectOrphans` is a **mutating purge**, and the lower `DriverTx.blobs.orphans` method enumerates unheld entries across all tenants, not a tenant-scoped complete reference graph. Neither can be repurposed as a safe coverage query. `info` can check only a **known** ref; it cannot discover unknown refs.

**Concrete implementation dependency:** add a bounded, deterministic, tenant-scoped read-only enumeration port for attachment references/holders (with an overflow sentinel) across the kernel driver interface and its memory/IndexedDB/SQLite adapters, then expose a principal-guarded vault diagnostic. Audit whether current `holder` strings resolve to present canonical domain records; do not count a holder row as proof of authorization. Avoid returning bytes, filenames, cross-tenant refs or arbitrary diagnostic samples. An inventory generated only from known PWA fields is incomplete unless every writer is audited; this must be explicit in its result. Existing limits stay unchanged.

Before inventing a portable attachment format, inspect the actual kernel `blobs` and `blob_refs` row schemas and every production reference reader/writer; produce a source-path/field inventory and classify which domain record types can hold a live attachment reference. Do **not** infer ownership or an attachment's authority from a secondary index, a filename, a peer-provided URL or an untrusted MIME string. Establish the principal and each reference's authenticated parent using normal domain validation.

The first executable change should expose a **read-only, session-bound** reference-coverage diagnostic with explicit counts of referenced, missing and excluded items, with no decrypted bytes, keys, filenames or cross-principal metadata returned. Keep its transaction-lifetime and lock guards identical to `backupCoverage()`; use current storage APIs rather than bypassing them. This is a proposal for an isolated code/test PR, not an assertion that the diagnostic already exists. Do not silently change `v1` export to include blobs.

Define decision outcomes per reference:
1. Owner-authorized local blob, integrity checked, included only in a future explicitly versioned portable manifest.
2. External/peer-owned content or an unverified reference, excluded with explicit diagnostics rather than copied as trusted owner data.
3. Missing or orphaned local reference, flagged for repair/manual action; never declare a complete backup or fabricate bytes.
4. Delivery/lease/idempotency or other operational state, **out of scope** of attachment recovery until its own policy is accepted.

No backup claim may imply attachment completeness from record-codec coverage alone. A record referencing missing blobs must not be silently presented as fully usable on a restored device.

## Proposed later portable-attachment admission (requires separate wire-format decision)

A new versioned **authenticated** manifest, not modifications to existing v1 meaning, must bind subject, canonical reference/record keys, source provenance, supported schema/version, exact byte length, content digest and ownership authority. Determine actual manifest fields from source schemas before implementing them. Reject duplicate keys, ambiguous ownership, digest mismatch, reference cycles and missing referents. Keep encryption and signing identity requirements unchanged.

Transfer plaintext only inside an unlocked, authenticated vault operation. Re-encrypt bytes under the destination vault's own storage key/address scheme. Do not export raw IndexedDB ciphertext as if portable. Bound byte count, number of references, quota behavior and memory consumption independently of current 10,000-record/256-type limits; do not raise existing 16-MiB decrypted-manifest or 32-MiB per-row guards as an expedient fix. If supported attachments cannot fit a chosen format, fail visibly or require a separately designed streaming/chunked protocol.

Preflight **all** records and portable references before committing identity or any domain row. In one authenticated destination transaction, install the identity, normalized records and validated blob/ref closure atomically, or leave the destination uninitialized and reusable after failure/reopen. Check ordinary reader behavior and identity signatures after reopen. Device power-loss, quota and multi-tab races require actual native IndexedDB coverage; fake-indexeddb is not evidence for these conditions.

Older receivers must reject an explicitly newer unsupported manifest before materializing identity or referenced bytes, while previously issued v1 backups remain valid under their documented existing scopes. No new public CID/signature, address, consent or key-rotation authority may be implied by recovering an attachment. Delivery/lease recovery, copy/rotation semantics and whole-database rollback policy remain separate P1 tasks.

## Acceptance matrix (gates for later implementation)

| Scenario | Expected outcome |
|---|---|
| Existing signed v1 without attachments; old/new registries | Unchanged restore, identity signatures and normal record readers |
| Owner-owned record plus verified linked blob | Restore/reopen byte-for-byte and reference resolution in a future approved format |
| Unsupported reference or unsupported manifest version | Fail closed with no partial identity/rows, including after reopen |
| Missing blob, mismatched digest, duplicate ref, forged tenant association | Reject or explicitly classify as incomplete; never silently certify completeness |
| Same physical DB containing another tenant's blob | No leak, no mutation, no poisoning of the owner's completeness inventory |
| Lock during asynchronous preflight, wrong password, storage quota/transaction abort | No late artifact and no partially initialized destination |
| Low-memory/large attachment and supported browser devices | Enforced existing caps; separately measured native resource budgets |
| Operational outbox/lease state | Still excluded; never claimed reconstituted |

Execute targeted tests serially first, then full current-source typecheck, immutable tooling/static/build and GitHub-hosted Alpha/CLI gates. Distinguish static schema review, fake IndexedDB, native Chromium/Firefox/WebKit and actual device-interruption tests. Do not lift product caps or timeouts. No implementation is qualified by this specification.

## Open decisions and engineering dependencies

- Exact kernel blob/ref schemas, parent record linkage, authorization and actual readers must be source-audited before choosing manifest fields.
- Decide complete-vs-partial policy for references to unavailable external media, independent of records-only v1 success.
- Decide bounded binary transport/chunking and atomic persistence within native storage budgets before extending `restoreBackup`.
- Obtain independent code, functional and defensive-security reviews of the eventual implementation, including retained historical failed/incomplete evidence. The interrupted security reproduction follow-ups remain out of scope.

This document is a design/evidence checkpoint only. It authorizes no release, deployment, force push, branch deletion or paid external API usage.
