# Static defensive security review — generation 4

## Outcome and limits

The review identified a pre-existing publication CID-key omission alongside the
known retained-listing key omission. **Both corrections received the supplemental
static review below, with no blocker found in those diffs.** The reviewed storage
and shared recovery-preflight changes establish the boundaries below; no
additional blocker was identified in those changed paths. These conclusions are
limited to the pinned integration and two separately pinned repair commits.

This is a source review, not runtime, native-browser, dependency, complete-product,
or release security qualification. No application code, test, predecessor evidence
script, runtime probe, package installation, external scan, or remote operation
was executed. The stopped G3 security follow-up was not resumed, and its
interruption supplies no security conclusion. This worker changes only this
handoff; normal functional gates belong to the integration/repair owners.

## Pinned source and historical evidence

- Integration reviewed: `eeee923adbd4dee3634898d035c74072803ea2f0`.
- Integration tree: `cfba987c4fc0f9de5d291568a113892cc52dc492`.
- Comparison base: `e63a7ecf0c7f15c2ce8ffa17793799caa0e62d3c`.
- Review branch: `codex/classrup-static-security-g4`.
- Isolated worktree: `classrup-static-security-g4`.

Read [G1 security](security-audit-g1.md), [G2 security](security-audit-g2.md),
[G3 preflight code](preflight-code-g3.md), [G3 coverage UI](coverage-bug-g3.md),
[G3 storage](storage-review-g3.md), and
[the backup scope contract](../../BACKUP_SCOPE.md). Their executions and totals
remain historical evidence, not G4 results. A separate read-only storage reviewer
checked the same integration source; its static observations are incorporated
here without adding runtime evidence.

## Established source properties

References in this section are to the integration commit above.

| Boundary | Source-backed result |
|---|---|
| Scoped blob authority | `packages/kernel/src/storage/scope.ts:75–85` supplies the scope's tenant, explicit bytes, and scope clock. Only `contentType`, `privacy`, and optional `encrypted` come from metadata. Additional metadata fields cannot replace the authority-bearing fields through spread. |
| Blob admission | `packages/kernel/src/storage/tx.ts:449–455,491–508` captures metadata, normalizes encryption to literal Boolean `true`, checks the byte limit, and creates a fresh `Uint8Array` before asynchronous hashing. Hashing, deduplication, privacy changes, and persistence use that snapshot, including for Node `Buffer` input. |
| Record/migration copies | `tx.ts:130–148,166–171,537–542` copies all four index slots on put and absent-record restore, and the three scalar migration fields on insert/list. Those copies cover the declared primitive-field models in `driver.ts`. Record data is serialized and returned as separately parsed data. Existing restore conflict/identity behavior is preserved. |
| Adapter/lifetime composition | `memory-driver.ts:275–280` copies blob bytes on get/upsert; IndexedDB continues using the memory working set. `storage.ts:45–85` guards public and driver transaction methods, including inventory and driver calls after asynchronous hashing. |
| Tenant inventory | `tx.ts:122–124` limits the public request to safe integers from 1 through 10,001. Memory compares exact tenants; SQLite binds tenant and limit and uses binary ordering (`memory-driver.ts:159–162`, `sqlite.ts:95–96`). Counting does not deserialize record payload JSON. |
| Coverage/export admission | `packages/vault/src/vault.ts:98–110,187–217` derives tenant from the active identity and freezes count/scope results. The 257th inventory entry is an overflow sentinel; only 256 are exposed. Export repeats coverage in the same read callback that collects rows. Unsupported types and record/type overflow reject export; an earlier preview does not authorize it. |
| Shared preflight | `vault.ts:136–168` checks record fields, tenant, declared/registered types, ID and revision/timestamp shape, and duplicate type/ID pairs. It parses detached data, rebuilds indexes through the codec, and checks keys when `recordId` exists. Normalized data is parsed and its indexes/key rebuilt/rechecked; validators receive separate clones. |
| Export/restore distinction | `vault.ts:156–165,217–222,275–306` validates original data before export normalization when a normalizer exists. Export discards normalized return values and signs the collected records. Restore retains normalization-before-final-validation behavior, completes preflight before identity/domain writes, and writes identity plus records transactionally. Signature, scope, and identity-principal checks remain present. |
| Session gating | `vault.ts:173–221` checks active state around storage work, asynchronous codec callbacks, and final export return. Closing revokes identity/session. The PWA binds coverage to its accepting session and uses `runForSession`; download separately checks that same session (`main.ts:154–158,452–461`, `vault-session.ts:11–18`, `action-queue.ts:12–16`). |
| UI disclosure/teardown | `backup-coverage.ts:4–11` produces counts and fixed messages without stored type identifiers. `main.ts:348–377` clears coverage and passphrase and hides private views before awaiting close. Coverage uses `textContent`; markup explains exclusions. These are source observations, not native-browser ordering results. |

## Canonical-key findings and supplemental repair review

### Retained listing

At the integration snapshot, `main.ts:58` registers retained signed-evidence
validation without `recordId`. Normal retention keys records by
`ownerId/listingId` (`packages/discovery/src/search/index.ts:66–78`).
`validateRetainedRecord` validates evidence, author, subject, revision, conflict
state, and projection; it does not receive the outer storage ID. This was the
known pending composition repair when G4 began.

**Supplement reviewed:** `5c916f7e7779119d9230fd13f5297d67b78e7640`, tree
`395fb2d7dc41bbb29f901aff93020b03786f6955`, parent equal to the integration pin.
The extracted production `retainedBackupCodec` supplies `recordId` through
`retainedListingId`. Normal retention now calls the same helper, which returns
the exact existing key representation. The discovery barrel already re-exports
it. The signed-evidence validator remains unchanged. No blocker was found in
this static diff review. Existing canonical keys and envelope/signature formats
are preserved by the source change; runtime compatibility remains separately
qualified.

The added test source describes normal signed retention followed by encrypted
backup/restore, checking metadata, key, evidence, rebuilt owner index, and signing
identity. Key-contract tests describe the existing representation and distinct
normal owner/listing pairs. These assertions were read, not executed here.

### Publication

The integration's publication codec at `main.ts:49` similarly has validation
without `recordId`. Normal publication writes use the signed CID as the key,
and subsequent sequence/publication reads look up that CID
(`packages/bazaar/src/listings/index.ts:43–46,103,131,147–154,173`).
`validatePublicationRecord` checks signed author/subject consistency but has no
outer-record ID argument (`index.ts:205–217`). This establishes a missing
composition check in source, not a claim that an ordinary application flow
creates inconsistent rows, an external attack path, or a measured runtime impact.

**Supplement reviewed:** `19a3b5985fa8afa4a75187586d061b010201a878`, tree
`e33bf57c19dc6df3df56cc7f2beb34c876dce965`, directly atop the retained-listing
repair. The extracted production `publicationBackupCodec` returns the parsed
envelope's CID from `recordId`, and `main.ts` uses it. The exact existing
`validatePublicationRecord(input, verifyEnvelope)` call remains. The shared
preflight compares the key and completes signed-evidence validation before
writing; accepting a CID string does not replace signature verification. No
blocker was found in this static diff review.

The added test source describes valid signed listing, tombstone, and reservation
publication rows using their existing CID keys, followed by encrypted
backup/restore with evidence, metadata, listing index, and identity assertions.
It is a normal-data compatibility case, not an execution result from this worker.
Neither supplemental patch changes the vault helper, storage implementation,
signature format, or wire envelope.

## Trust assumptions and unverified limits

- **Codecs are trusted executable composition.** The registry captures/fixes
  callable references and binds the original receiver (`vault.ts:88–100`); it
  does not freeze private state or closures. Detached normalizer/validator inputs
  do not sandbox arbitrary parsers or index callbacks. Export already parses
  collected rows before preflight, so preservation against arbitrary parser
  transformations or nondeterminism is not promised.
- **Domain checks remain codec-specific.** Generic preflight checks record
  tenant; payload ownership, signed evidence, canonical IDs, and cross-record
  invariants require the applicable codec. Indexes are rebuilt by trusted code,
  not independently proven correct. Optional key hooks do not establish a
  universal canonical-key guarantee for every registered domain.
- **Drivers and scope construction remain trusted.** Copies cover declared
  scalar models. Lower-level memory snapshot/persistence seams retain existing
  reference behavior. This review does not promise confinement against arbitrary
  adapters, mutated scope options, getters, or nonconforming JavaScript objects.
- **Inventory caps bound output, not total work.** Memory scans records, builds
  the tenant type-count map, sorts it, then slices. SQLite's result limit likewise
  does not establish bounded counting work. Device-scale memory/time and encrypted
  IndexedDB behavior need separate qualification.
- **Promise settlement keeps its documented limit.** `storage.ts:15–18` revokes
  asynchronous access when the wrapper observes settlement; already queued
  microtasks can run first. Callers must await transaction work. This review
  does not strengthen that contract into instantaneous revocation.
- **Recovery remains partial.** Blobs/references, outbox/inbox, idempotency,
  leases, dead letters, sync delivery state, migration metadata, and other listed
  stores are excluded. Complete database recovery, key rotation, rollback
  protection, and interrupted migration recovery remain separate milestones.

Existing tests were read as specifications only. No passing test count or
exhaustive security assurance is claimed. Final integration requires its own
functional qualification on the actual combined source.

## Exact reviewed source blobs

These primary review entries belong to
`eeee923adbd4dee3634898d035c74072803ea2f0`.

| File | Git blob |
|---|---|
| `packages/kernel/src/storage/driver.ts` | `7a38661ae28a4130489777b2785a45d80110d9ce` |
| `packages/kernel/src/storage/indexeddb.ts` | `fc1913208df8f8b02f821a88ceb2b3dc1a58d892` |
| `packages/kernel/src/storage/memory-driver.ts` | `54bc3502b1577da617a1a02e4f23c5596636cb60` |
| `packages/kernel/src/storage/scope.ts` | `e616cb110f3913615b3bf7569c7d2cad4887f969` |
| `packages/kernel/src/storage/sqlite.ts` | `e74752486b21696f787f692654ef2fb8d88c24ab` |
| `packages/kernel/src/storage/storage.ts` | `a165e70a7653c0ecd15b747ebf671a5a5a6095d5` |
| `packages/kernel/src/storage/tx.ts` | `f876565e45853ee7d1a6ca90b2d88cd2441296d7` |
| `packages/vault/src/vault.ts` | `8d133151f348cf8213d923cf7098ca9928481f98` |
| `packages/vault/src/index.ts` | `85e956f31a8afbdcddc41aef5bd792b4912e5ee4` |
| `apps/pwa/src/main.ts` | `26595d77976819925cc362de14e61b4722c8e581` |
| `apps/pwa/src/backup-coverage.ts` | `e5dd2bc2ad60d660965b342db1117c58a9ba1d5e` |
| `apps/pwa/src/action-queue.ts` | `ca7132ab9b13f641e171b13d8058e7e2d92e20a2` |
| `apps/pwa/src/vault-session.ts` | `240d8c30774f78fb9c72dff92dab21dbd8f2dfaf` |
| `apps/pwa/src/archive-backup.ts` | `123c58f7d3623dbd60641826911939f48fd1f288` |
| `apps/pwa/index.html` | `428ee98ebdcd8552304b6299322c2ffff4c47f5d` |
| `packages/discovery/src/search/index.ts` | `3c45e136ba33853302554609d368ec33f881fab0` |
| `packages/bazaar/src/listings/index.ts` | `640d4eda6f1fb39c5b39cc59979ff7bf79b85c83` |
| `apps/pwa/src/barter-runtime.ts` | `00a7b548251bb53fe238bedf536eac1ca356b3a5` |
| `packages/discovery/src/geoprivacy/location/index.ts` | `12272a0329562275bd7f1a07bcd3851d739a54bd` |
| `packages/notify/src/local.ts` | `2ffe755d9769455c3636b763e631dafafe7c2673` |

Supplemental retained-key source at
`5c916f7e7779119d9230fd13f5297d67b78e7640`:

| File | Git blob |
|---|---|
| `apps/pwa/src/main.ts` | `b29a21c068ba090e6301d549beaba55d134da2ff` |
| `apps/pwa/src/retained-backup.ts` | `9931ad8ea8120702b648a89803edd3754677539e` |
| `packages/discovery/src/search/index.ts` | `49e248538798fbc0c3699306c7b1c6f5f3debc0c` |
| `packages/discovery/src/search/retained-key.test.ts` | `a226142af757e45044f95bfb0f98f514574a8820` |
| `tests/integration/retained-backup.test.ts` | `5b15b34275ac8491abf787a4e12fd6a53bad58e5` |

Supplemental publication-key source at
`19a3b5985fa8afa4a75187586d061b010201a878` (retained codec/search blobs above
remain unchanged):

| File | Git blob |
|---|---|
| `apps/pwa/src/main.ts` | `884b664f31678b3ca96bc23f7735ef5b709b6b0b` |
| `apps/pwa/src/publication-backup.ts` | `04e6127c842cf915273bb75eeb50db4b81b53b50` |
| `tests/integration/publication-backup.test.ts` | `6ddddf2db63688dfc1a35f463b96ea835b9dc645` |
