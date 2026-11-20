# Final independent defensive source review

## Source, scope and disposition

Reviewed frozen source **`d55bb48117c0f9e4579b01fd6c12030585601d68`**, complete
tree **`7c2a8e3c341498f54e57489a31b2711c9034d3e5`**, against main
`449a619f1ae7b66cb42d9cab43dd5493bfe42c2e`. The final merge preserves the
consolidation repair parent `bd6f59cb49a72583dcba3ca7925a6be3e82bc584` and the
concurrent PR #68 head `7a3a962400e44a3d7bb2a6834c869f97bae88ee4`.

**No blocking defensive source finding was established in this reviewed delta.**
The principal-bound diagnostic, same-tenant presence lookup, count-only output,
transaction/session revocation, repaired tenant index and unchanged v1 exclusion
are consistent with the declared Phase A scope. The initial review's lifecycle
oracle, traversal limitation and two acceptance gaps have corresponding source
changes in this frozen candidate. Their executed qualification is a separate
gate owned by the consolidation coordinator.

This review used local Git diffs, committed source reads, schema inspection,
consumer searches and static inspection of acceptance tests. It performed no
test run, compiler/build invocation, browser/device action, network test,
vulnerability reproduction, product-code edit, commit or remote mutation. The
only authored file is this report. Source references below identify the frozen
commit, including when working documentation is added later.

The current working `BACKUP_SCOPE.md` and this cycle's
`ATTACHMENT-SOURCE-INVENTORY.md` were assessed as documentation claims, separately
from committed executable source. Their reviewed SHA-256 values were:

| Document | Reviewed working-content SHA-256 |
|---|---|
| `docs/development/BACKUP_SCOPE.md` | `08fdc358726e9ce545b7e467eba090c89d2c6fdbff88acb1a3d76480f3b20799` |
| `docs/development/cycles/20261120-recovery-consolidation/ATTACHMENT-SOURCE-INVENTORY.md` | `66cb5eb9b48e47e436ece366d578e5d447ab0cbe3a422565cc78a170cc9316c4` |

**All 51 historical security findings remain OPEN.**
`planning/SECURITY_FINDINGS_TRACKER.md` and the preserved security-planning
snapshot are unchanged by this delta. This source disposition closes none of
those historical design/readiness findings and supplies no release or native
device-recovery approval.

## Earlier consolidation observations and current source

The [initial defensive review](DEFENSIVE-REVIEW-INITIAL.md) remains evidence for
`29daa061b4ad8b2899f6a8eaa910d12c80c93671`, not for this later implementation.

| Initial observation | Current source disposition |
|---|---|
| The lifecycle test expected bytes to remain after detaching the last holder. | The test now distinguishes coverage preserving unheld bytes from explicit last-holder deletion. It checks bytes before attaching/detaching, then expects deletion and absent blob metadata. See `tests/integration/attachment-reference-coverage.test.ts:110–148`; production deletion remains `packages/kernel/src/storage/tx.ts:478–484`. |
| Memory coverage scanned the entire holder table before tenant filtering. | `blobRefKeysByTenant` replaces that traversal. Cardinality is checked before scanning the selected tenant's set; accepted scans visit at most the requested holder limit. Snapshot construction and both rollback paths maintain that same index. See `packages/kernel/src/storage/memory-driver.ts:53–105`, `301–316`, `342–355`, `369–382`. |
| The owner-missing reference case did not have matching bytes only in another tenant. | The ordinary adapter fixture now stores those bytes only for the foreign tenant while asserting the owner still reports one missing reference. The encrypted reopen fixture repeats this distinction. See `attachment-reference-coverage.test.ts:37–75`, `277–307`, `328–333`. |
| Unsupported restore checked identity absence but did not establish destination reusability. | The future-codec case now reopens the same rejected destination with the compatible registry, restores the same backup, compares both complete stored records and identity signatures, and repeats after encrypted reopen. See `tests/integration/production-future-codec-rejection.test.ts:133–171`. |

These are source-level resolutions and acceptance assertions inspected in code;
this report does not independently claim that any test executed or passed.

## Standards and defensive control assessment

### Principal scope and presence lookup

`UnlockedVault.attachmentCoverage()` has no caller-supplied tenant or reference
argument. It takes the principal from the activated identity and calls
`tx.blobs.referenceCoverage(identity.principal, MAX_REFERENCE_HOLDERS)` within
the session's guarded read operation. See `packages/vault/src/vault.ts:184–219`.

Memory coverage selects `state.blobRefKeys(tenant)` and checks presence with the
compound blob key `k(tenant, row.ref)`. SQLite filters `r.tenant = ?` and joins
both `b.tenant = r.tenant` and `b.ref = r.ref`. Consequently, the inspected lookup
does not count another tenant's matching digest as local byte presence. See
`packages/kernel/src/storage/memory-driver.ts:301–316` and
`packages/kernel/src/storage/sqlite.ts:207–219`.

This is a scoped diagnostic guarantee. The underlying kernel storage port still
accepts an explicit tenant because it is a lower-level composition interface;
the addition does not convert every storage call into an authorization API.
The ordinary handler media wrappers continue to fix the handler tenant and
clock in `packages/kernel/src/storage/scope.ts:66–84`.

### Output minimization and honest meaning

The public result is a frozen object containing exactly four numeric/null
counts and three booleans. It returns no principal, tenant, holder label, blob
reference, filename, MIME type, record payload, key or byte sample. The counts
have these meanings:

| Field | Meaning at this source |
|---|---|
| `referencedBlobs` | Distinct references represented by the principal's holder rows, including references with absent bytes. |
| `missingBlobs` | Distinct held references with no blob row in that same tenant. |
| `excludedStoredReferences` | Distinct held references with a blob row, calculated as references minus missing references; these remain excluded from v1. |
| `holderRows` | Count of holder rows, so multiple holders of one reference contribute separately. |
| `limitExceeded` | The holder-row cap was exceeded and all counts are unavailable. |
| `holderAuthorityVerified` | Always `false`; holder labels are not authenticated parent-record authority. |
| `includedInV1Backup` | Always `false`; the diagnostic does not admit attachments into the backup. |

Unheld stored blobs are outside this inventory. Presence is a storage-row
existence check, not a new byte-integrity check, proof of content ownership,
authenticated attachment closure or completeness certificate. The code does
not infer those stronger meanings. See `packages/vault/src/vault.ts:33–42`,
`207–219`, and the two driver implementations above.

### Lifetime and lock revocation

The new public and driver methods inherit the generic `bindLifetime()` wrappers.
Every method is bound with its guard, so retaining or destructuring the new
coverage callable does not remove transaction revocation. `runTx()` invalidates
the handle before persistence or rollback. See
`packages/kernel/src/storage/storage.ts:45–85`.

The vault checks the session before and after the awaited diagnostic read. Its
storage wrapper checks again when a queued callback actually runs and after the
callback settles. `lock()` marks the session inactive and locks the identity
before awaiting connection closure. There is no further asynchronous operation
between the diagnostic's final guard and constructing the returned counts. See
`packages/vault/src/vault.ts:137–141`, `184–219`.

Acceptance source now includes retained-call checks within a later transaction
and a queued diagnostic rejected once lock starts:
`attachment-reference-coverage.test.ts:195–214`, `357–383`. These assertions
support the intended coverage of the existing guards; no execution is claimed
by this review.

### Read-only behavior, bounded traversal and index consistency

The coverage methods issue no write, attach, detach, orphan sweep or retention
operation. Memory uses blob-map membership rather than `get()`, avoiding the
blob-byte copy performed by that reader. SQLite selects only `r.ref` and
`b.ref`, with no blob byte column. `storage.read()` uses read mode, which always
rolls back at the transaction wrapper. See `storage.ts:80–82`, `105–111`,
`memory-driver.ts:294–316`, and `sqlite.ts:207–219`.

The public kernel method accepts only safe integer limits from 1 through
10,000; the vault uses 10,000. Memory checks the tenant set's exact size first.
An overflowing tenant returns immediately without enumerating holder keys; an
accepted query visits at most `limit` keys. SQLite returns at most `limit + 1`
holder rows and uses the additional row only to identify overflow. Both return
every driver count as `null` on overflow, and the vault preserves that state in
all four public counts. See `tx.ts:518–521`, `memory-driver.ts:301–316`,
`sqlite.ts:207–219`, and `vault.ts:207–219`.

The index is derived from the same `MemoryState.write()` operation used for
ordinary attachment mutations, snapshot loading and reverse-order journal
undo. Replacing a row removes its old index membership before inserting the
new membership; deleting the final tenant key removes the empty tenant set.
Both callback rollback and rejected persistence call the same undo path.
Plain IndexedDB and encrypted IndexedDB construct their working set through
`createMemoryDriver`, so reopening reconstructs this index from persisted rows.
See `memory-driver.ts:63–105`, `342–382`,
`packages/kernel/src/storage/indexeddb.ts:112–121`, and
`packages/vault/src/encrypted-storage.ts:173–208`.

SQLite's query order matches the existing `(tenant, ref, holder)` primary key;
blob presence uses the `(tenant, ref)` key. This is a source/schema observation,
not a measured SQLite query-plan or latency result. See
`packages/kernel/src/storage/sqlite-schema.ts:62–70`.

The repaired bound concerns this diagnostic's holder traversal. It does not
bound all stored index memory, encrypted unlock/decryption, complete snapshot
loading, retention work or device resource use. Encrypted storage still loads
and authenticates its durable working set during unlock. The current
`BACKUP_SCOPE.md` correctly preserves this distinction.

## Spec and recovery-acceptance assessment

### Existing v1 and codec compatibility

The compatibility candidates add acceptance cases without changing the identity
or encryption implementation, production codec registry, wire version or
restore/export admission code. In the final production delta, the vault change
is the additional diagnostic and its type/cap; v1 still signs only principal,
protected identity, declared record types and captured records.
`excludedStores` continues to contain both `blobs` and `blob_refs`. See
`packages/vault/src/vault.ts:19`, `221–250`.

The current implementation rejects unsupported declared record types at signed
manifest scope admission, before unlocking the destination signing identity,
calling `unlockStorage`, or opening the identity/domain write transaction.
Supported records still undergo owner/metadata/schema/key/normalization
preflight before that transaction. See `vault.ts:303–334`.

Export inventories actual principal-owned types in the same read transaction
that captures records. Unsupported owner types block export before a signed
artifact is returned; unknown foreign-tenant types do not enter that inventory
or the record queries. No attachment coverage result authorizes or bypasses
this export check. See `vault.ts:115–124`, `227–245`.

The inspected tests exercise the intended distinctions through real signed
export and encrypted storage composition:

| Acceptance source | What its assertions establish if executed successfully |
|---|---|
| `production-future-codec-rejection.test.ts:24–171` | The mixed current/future backup is valid under the compatible registry, survives restore/reopen there, is rejected by the older registry before initialization, and can subsequently restore into that same rejected destination with both complete records and identity preserved after another reopen. |
| `production-downgrade-export.test.ts:25–106` | Opening a newer encrypted vault with an older codec registry does not allow a lossy export; both known and unknown owner data remain available after returning to the compatible registry. |
| `production-foreign-codec-isolation.test.ts:25–116` | An unknown type belonging to another tenant neither blocks the owner's export nor enters the recovered destination; the foreign source row remains present. |
| `attachment-reference-coverage.test.ts:267–355` | The count diagnostic reconstructs across encrypted reopen, coverage/export preserve the source bytes, and v1 restores the record/signing identity while leaving both owner and foreign blob stores absent. |

These cases use `fake-indexeddb` and direct storage fixtures for the synthetic
future records, archive rows and holder labels. They are useful storage/codec
acceptance. They do not establish an ordinary production attachment producer or
reader, native IndexedDB interruption recovery, quota behavior, target-device
performance or portable attachment recovery. The pre-existing legacy-registry
and transaction-interruption cases remain distinct evidence.

### Attachment inventory and current product claims

The new [source inventory](ATTACHMENT-SOURCE-INVENTORY.md) explicitly identifies
the initial combined source `29daa061b4ad8b2899f6a8eaa910d12c80c93671`. Its
description of that source's whole-map memory traversal is historical and
accurately labeled; it must not be read as the implementation at `d55bb481`.
The only intervening production-code change is the memory tenant-index repair;
the other intervening changes are documentation and acceptance tests.

Fresh frozen-source searches and reads support the inventory's substantive
authority boundary. The 15 production codecs' declared record schemas contain
domain subjects, listing/statement CIDs, notification subjects and local state,
but no first-class attachment-reference contract. None of their repositories
configures `RepoDef.blobs`; the optional extractor mechanism is in
`packages/kernel/src/storage/repo.ts:11–37`, `153–191`. No production PWA/domain
handler calls the scoped media writer or reader. The only new production call
of `referenceCoverage` is the unlocked-vault diagnostic.

Schema review included listing/publication/hold definitions, listing history
and archive, public/retained listings, coarse location, want/coordination
records, notification inbox/preferences/counters, and the shared registry
composition. Opaque signed-envelope payloads/extensions and free text may carry
strings; that does not make those strings authorized attachment references.
The generated feature title “Message attachments” supplies no executable media
workflow or parent linkage.

The current `BACKUP_SCOPE.md` accurately describes counts, missing versus
present-but-excluded references, unheld-blob exclusion, explicit unverified
authority, v1 exclusion and the repaired traversal limit. Its earlier
full-registry record acceptance remains record acceptance. Claims about hosted
runs and prior main qualification must be backed by the coordinator's actual
execution receipts; they are not independently verified by this source review.

Portable attachment recovery still requires an owning domain/schema, trusted
parent-reference extraction, content/privacy admission, an explicitly versioned
authenticated portable contract, separate binary transport/resource budgets,
atomic destination installation and appropriate native qualification. The
diagnostic implements none of those later milestones and does not claim them.

## Remaining gates

- Run and record ordinary qualification on the exact frozen source; later
  executable changes need fresh review and qualification.
- Keep source-inspected assertions, local executed tests, hosted results,
  native-browser results and actual device/interruption results distinct.
- Preserve the initial review and historical failed/incomplete evidence with
  their original source identities.
- Keep attachment completeness, native recovery, operational delivery/lease
  recovery and whole-database rollback work open; all **51 historical security
  findings remain OPEN**.

Standards axis: **0 blocking findings established** in the reviewed defensive
controls. Spec axis: **0 blocking findings established** for this bounded,
principal-scoped diagnostic and the inspected compatibility acceptance; later
portable attachment and native-device milestones remain outside acceptance.
