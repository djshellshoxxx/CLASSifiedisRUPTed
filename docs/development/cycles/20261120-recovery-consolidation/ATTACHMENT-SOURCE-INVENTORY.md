# Phase A attachment source and authority inventory

## Source and conclusion

Inventory source: `29daa061b4ad8b2899f6a8eaa910d12c80c93671`, complete tree `014ab768f786b9170ed4885cb849b85b46117bb1`. This is the initial combined PR #64–#68 source on qualified main `449a619f1ae7b66cb42d9cab43dd5493bfe42c2e`.

The fresh code-review worker inspected tracked runtime code under `apps`, `packages` and `tools`, traced the storage and repository call paths, and read every currently registered production record schema relevant to attachment linkage. Searches were repeated against the frozen Git commit, rather than relying only on a mutable working tree. Test fixtures, generated feature titles and specification declarations were kept separate from production composition. No tests, compiler, browser, network probe or mutation of product code was performed for this inventory.

**The current production composition has a blob storage primitive and a holder-count diagnostic, but no production domain repository declares an attachment extractor and no PWA/domain command invokes the scoped blob writer or reader. None of the 15 registered production record codecs declares a first-class attachment-reference field.** Generic envelope payloads, extension values or free text can contain opaque strings; that possibility does not make those strings authenticated attachment references.

Consequently, a holder count cannot establish which authenticated record revision authorizes a blob. Portable attachment recovery needs that domain contract before it can derive an authoritative reference closure. This inventory supplies source evidence for the [earlier Phase A specification](../20261120-attachment-recovery/SPEC.md); it does not approve a new wire format or complete the attachment feature.

## Actual storage schemas

| Store or representation | Fields and keys | Authority supplied |
|---|---|---|
| `BlobRow` | `tenant`, `ref`, `bytes`, `size`, `contentType`, `privacy`, `encrypted`, `createdAt`; physical key is tenant plus reference | Storage scope and metadata. The reference is a digest of the supplied stored bytes. There is no parent record, signed revision or authorization field. |
| `blob_refs` | `tenant`, `ref`, `holder`; key is the full triple | A caller-supplied holder label. There is no foreign key to a domain record and no signature, record type/version or revision binding. Missing bytes are permitted. |
| `BlobInfo` / `MediaBlob` | Metadata and holder count; `MediaBlob` also carries bytes | Reader output for an explicitly supplied tenant/reference. A holder count is not validation of the labels. |
| Encrypted durable row | Format, nonce and ciphertext; the decrypted value contains logical key and row | Storage authentication and address binding. This authenticates persistence, not the domain meaning or authority of an arbitrary holder label. |

Sources: [driver.ts](../../../../packages/kernel/src/storage/driver.ts), [memory-driver.ts](../../../../packages/kernel/src/storage/memory-driver.ts), [sqlite-schema.ts](../../../../packages/kernel/src/storage/sqlite-schema.ts), [tx.ts](../../../../packages/kernel/src/storage/tx.ts) and [encrypted-storage.ts](../../../../packages/vault/src/encrypted-storage.ts).

`blobRefOf` hashes the bytes supplied to storage and returns `blob:sha256-<base64url>`. `put` snapshots inputs, checks the existing 5-MiB blob limit and metadata shape, computes the address, and deduplicates by tenant/reference. Its contract expects metadata-stripped image bytes, or ciphertext for encrypted attachments; the kernel writer does not invoke the image sanitation library. SQLite refuses non-public plaintext according to its existing relay storage policy. These controls do not prove that a caller owns an authenticated parent record.

## Production readers, writers and supporting ports

| Source | Executable operation | What it establishes and what remains absent |
|---|---|---|
| [storage/tx.ts](../../../../packages/kernel/src/storage/tx.ts), `blobStore` | `put`, `get`, `info`, `attach`, `detach`, `referenceCoverage`, `collectOrphans`, `shredded` | Low-level blob and holder operations. `attach` validates reference syntax and allows absent bytes. `detach` deletes bytes at the last holder; `shredded` identifies encrypted blobs deleted within the current transaction. It does not resolve holder labels to records. |
| [storage/scope.ts](../../../../packages/kernel/src/storage/scope.ts), `readBlobs` / `scopedBlobs` | Tenant-bound readers and writes for domain handlers | The wrapper fixes tenant and clock from the handler scope rather than accepting replacements through metadata. Holder labels remain caller supplied. No current production domain handler uses these media operations. |
| [storage/repo.ts](../../../../packages/kernel/src/storage/repo.ts), `RepoDef.blobs` / `syncBlobRefs` | Optional reference extraction during repository `put`, `remove` and `restore` | A configured extractor can synchronize labels of the form `recordType/recordId`. The current production repository definitions do not configure one. Direct `attach` can also create any label, so the textual shape itself cannot establish provenance. |
| [storage/memory-driver.ts](../../../../packages/kernel/src/storage/memory-driver.ts) | In-memory row mutation, holder groups and count query | Shared working-set semantics. Snapshot load and rollback reuse `MemoryState.write`. This initial source's diagnostic examines the full holder map before tenant filtering; later cost repairs require separate qualification. |
| [storage/sqlite.ts](../../../../packages/kernel/src/storage/sqlite.ts) | Tenant-scoped SQL reads, mutations and count query | Physical storage operations with `(tenant, ref)` joins. No domain parent foreign-key relationship is supplied. |
| [storage/indexeddb.ts](../../../../packages/kernel/src/storage/indexeddb.ts) | Snapshot loading, atomic change persistence and writer fencing | Persists kernel rows and uses the memory driver as the working set. It is not a portable attachment manifest. |
| [vault/encrypted-storage.ts](../../../../packages/vault/src/encrypted-storage.ts) | Row serialization, encryption, address validation and authenticated inventory | Serializes blob bytes as base64url; binds durable addressing/encryption to database name, table and physical key. Raw ciphertext is not a portable named-vault backup. |
| [vault/vault.ts](../../../../packages/vault/src/vault.ts), `attachmentCoverage` | Principal-bound holder counts only | Exposes no blob/reference/holder identifiers or bytes, and declares authority unverified and attachment data excluded from v1. No attachment export or restore occurs. |
| [metadata/image.ts](../../../../packages/privacy/src/security_boundaries/metadata/image.ts) and [metadata/import.ts](../../../../packages/privacy/src/security_boundaries/metadata/import.ts) | `stripImage`, `verifyImageClean`, `sanitizeImportedImage` | Pure image sanitation and quarantine helpers. No production PWA/domain media-admission call path connects them to blob storage. |
| [apps/pwa/src/main.ts](../../../../apps/pwa/src/main.ts), `download` | Constructs a browser `Blob` from JSON for download | A browser file-download wrapper, unrelated to kernel `blobs` and `blob_refs`. It does not implement attachment recovery. |

The only production call of the new `referenceCoverage` port is the unlocked-vault diagnostic. `collectOrphans` is mutating cleanup and must not be substituted for coverage or export enumeration. Repository and storage contract tests exercise media behavior, but those fixtures are not production listings or messaging handlers.

## All 15 production codec types and their relevant reference fields

The membership source is [the shared PWA codec registry](../../../../apps/pwa/src/backup-codecs.ts), including the local notification, location and barter factories. The following table names every registered type exactly once.

| Record type | Existing field/reference meaning | Attachment linkage at this source |
|---|---|---|
| `bazaar.listing` | Owner, kind, title/description, category, condition, tags, locale, coarse region, value, private notes, publication CID and lifecycle/inventory fields | No media field or `blobs` extractor. The create/edit inputs use the same declared fields. |
| `bazaar.listing_revision` | Listing ID and revision, owner/editor, changed fields, canonical public snapshot and its hash | Snapshot derives from the listing schema; no attachment closure. |
| `bazaar.publication` | Signed envelope and listing ID; the envelope's CID is the canonical record key | Signed listing/tombstone evidence. Its current public payload schema declares no media references. |
| `bazaar.archive_record` | Listing ID, lifecycle times, close reason and optional close target `{ type, id, verified: false }` | The close target denotes a deal/proposal/cycle/giveaway request, not media authority. |
| `bazaar.inventory_hold` | Listing ID, owner, coordination subject, revision hash, expiry and hold state | Reservation linkage, not a blob holder or attachment. |
| `discovery.retained_listing` | Remote owner/listing, revision, CID, up to two envelopes, validated public projection and conflict evidence | Retained signed peer listing evidence. It neither copies peer media nor grants owner attachment authority. |
| `discovery.location_setting` | Owner, coarse home/public location, entry mode and local change-window data | No attachment field. |
| `mutiny.want` | Owner, signed want envelope and receive time; want payload selects offered/requested listing CIDs | Statement references, not blob addresses. |
| `mutiny.coordination` | Owner, proposal, participants/legs, listing/want CIDs, signed evidence, consent/reservation CIDs and local state | Coordination and signed-statement references, not attachment parentage. |
| `notify.notification` | Local owner, category/template, optional `{ type, id }` subject, source event IDs, counters and read state | An inbox navigation reference. Allowed reference types are domain subjects, not blobs. |
| `notify.preference` | Owner/category, channel flags, defaults/mirror version and update time | No attachment field. |
| `notify.notification_seen` | Notification ID or null, and timestamp | Domain deduplication pointer, not media. |
| `notify.notification_day` | Count | No attachment field. |
| `notify.notification_diag` | Created/collapsed/read/dropped/hidden/total counts | No attachment field. |
| `notify.pref_counter` | Count | No attachment field. |

Schema and validation sources: [listing model](../../../../packages/bazaar/src/listings/model.ts), [listing history](../../../../packages/bazaar/src/listings/history.ts), [listing commands/publication validation](../../../../packages/bazaar/src/listings/index.ts), [archive](../../../../packages/bazaar/src/listings/archive.ts), [discovery/public listing](../../../../packages/discovery/src/search/index.ts), [location](../../../../packages/discovery/src/geoprivacy/location/index.ts), [barter repositories](../../../../packages/mutiny/src/trade_proposals/repository.ts), [want admission](../../../../packages/mutiny/src/cycle_matching/admission.ts), [local notification codec composition](../../../../packages/notify/src/local.ts), [inbox schema](../../../../packages/notify/src/delivery/inapp/index.ts), [inbox routes](../../../../packages/notify/src/delivery/inapp/routing.ts) and [preferences](../../../../packages/notify/src/preferences/in/index.ts).

The [communications package](../../../../packages/comms/README.md) supplies an optional signed-consent core; its runtime does not yet provide messaging or message attachments. A generated feature catalog entry titled “Message attachments” is registry metadata, not an attachment writer, reader or recovery implementation. Likewise, a string in free text or an opaque signed envelope extension must not be discovered by substring scanning and treated as permission to export referenced bytes.

## Authority distinctions

1. **Tenant isolation:** a query or write stays in one storage namespace. The scoped wrapper and new diagnostic provide this boundary.
2. **Storage integrity:** encrypted rows and their inventory are authenticated under the storage key and address scheme. This does not authenticate a holder's asserted relationship to a domain record.
3. **Content addressing:** a digest identifies the bytes supplied to the blob writer. It neither identifies their rightful publisher nor grants reuse/export authority.
4. **Domain parentage:** a trusted extractor must resolve a supported canonical record and revision, validate ownership/participant authority under that domain's rules, and derive its exact referenced bytes. This relation is not currently implemented for the 15 production codecs.
5. **Portable recovery authority:** a future signed/versioned manifest must preserve the established domain relation and distinguish owner-local content from retained peer evidence. Neither a holder label nor a matching digest alone supplies that relation.

## Concrete prerequisites before portable attachment recovery

| Prerequisite | Required implementation or decision |
|---|---|
| A real owning domain | Select the accepted listing/media or messaging slice, define its first-class reference fields and schema/version, implement normal user commands and readers, and connect an authoritative extractor. Do not infer fields from placeholder labels such as `listing/1`. |
| Canonical parent closure | Resolve each supported parent by canonical record key and revision; validate its ownership and applicable signature/participant rules; derive exact refs from that schema. Classify arbitrary, missing, stale and foreign labels explicitly. |
| Content and privacy admission | Connect existing image sanitation to the real writer where required. Verify actual byte length and digest for export/restore, define privacy transitions, and handle per-object ciphertext/key ownership without treating `encrypted: true` as proof of a complete key-recovery scheme. |
| Versioned portable contract | Choose a new explicit authenticated attachment manifest/version and its owner, parent, reference, byte-length and digest bindings. Preserve issued v1 record-backup semantics; determine how future media-bearing records disclose exclusions when using v1. |
| Bounded transport | Define aggregate byte/reference limits, encoding overhead and any streaming/chunking protocol independently. Preserve the current 5-MiB blob, 16-MiB v1 manifest and 32-MiB encrypted-row limits; the holder-count cap is not a binary-transfer budget. |
| Consistent export and atomic destination | Collect the authoritative closure in a consistent source operation. Preflight records, bytes and relationships before committing identity and data. Re-encrypt for the destination's storage identity/address scheme, with all-or-nothing persistence and retry after failure. |
| Retention and deletion compatibility | Preserve last-holder deletion, rollback and crypto-shred behavior. Define how archive/restore/purge and backed-up references interact; never fabricate missing bytes or resurrect content merely from a surviving label. |
| Actual acceptance | Qualify the new ordinary producer, reader, export, restore and reopen path. Include missing and excluded content, rollback, compatible older backups and native-device interruption/quota behavior where claimed. Library helpers and fake IndexedDB do not complete those native gates. |

The immediate Phase A diagnostic can be qualified separately while keeping `holderAuthorityVerified: false` and `includedInV1Backup: false`. Its bounded count results do not authorize portable attachment export. Attachment completeness, identity/device recovery, delivery/lease recovery and whole-database rollback remain separate open work.

## Reproducible source-search scope

The review used `rg` to locate runtime references, followed by frozen-commit `git grep` and direct source reads. Searches covered `blobs`, `blob_refs`, `BlobRow`, `MediaBlob`, `blobRef`, `putBlob`, `getBlob`, `attachment`, `attachments`, `stripImage`, `verifyImageClean` and `sanitizeImportedImage` under tracked `apps`, `packages` and `tools`. Production call sites were distinguished from `.test.*`, `.spec.*`, the shared adapter contract suite, synthetic image fixtures and generated registry labels. This is a bounded static inventory of the reviewed repository source, not a claim about untracked extensions, external consumers or arbitrary values inside opaque payloads.

## Selected source identities

The following Git blob IDs bind central observations to the reviewed commit. Later source repairs may change the corresponding working-tree files.

| Path | Git blob at reviewed source |
|---|---|
| `packages/kernel/src/storage/driver.ts` | `1457e9ebb9fe32ea6c6f7d793e8ed0fa7759ed1d` |
| `packages/kernel/src/storage/memory-driver.ts` | `f5be83f91c78469d0059c9bf12b35dd654df3927` |
| `packages/kernel/src/storage/sqlite.ts` | `f9b30c65248d37fc0cdeaabd7126da8013c997b7` |
| `packages/kernel/src/storage/tx.ts` | `a22169550c042cd637cf66201917077666d1eb80` |
| `packages/kernel/src/storage/repo.ts` | `dd1c65d035ed592eee5e62beef9f9f77e774919b` |
| `packages/kernel/src/storage/scope.ts` | `e616cb110f3913615b3bf7569c7d2cad4887f969` |
| `packages/vault/src/encrypted-storage.ts` | `8059fb936ed5262c88e7a6a9580e69dc8918346a` |
| `packages/vault/src/vault.ts` | `6f1b28556be694d945dac6de5eda0e4cad069f1f` |
| `apps/pwa/src/backup-codecs.ts` | `84f1a70276b9e9610ecbeb0818c8b06a2c3a89e7` |
| `packages/bazaar/src/listings/model.ts` | `dab49fcd3898268e063d38066e3c1f181ccb0ae6` |
| `packages/discovery/src/search/index.ts` | `49e248538798fbc0c3699306c7b1c6f5f3debc0c` |
| `packages/mutiny/src/trade_proposals/repository.ts` | `0554e07aa0cead3ac61b44e75faa34dba5452a9b` |
| `packages/notify/src/local.ts` | `2ffe755d9769455c3636b763e631dafafe7c2673` |
| `packages/privacy/src/security_boundaries/metadata/image.ts` | `00803d6c0e87819f3241558b1887c41ab646d82d` |
