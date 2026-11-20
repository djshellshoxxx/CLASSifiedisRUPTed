# Independent final functional review

Date: 2026-11-20. Review lane: ordinary functional correctness, acceptance
oracles and failure recovery. This is an independent source review of the
consolidated candidate, not an execution receipt.

## Exact source and review boundary

| Item | Identity |
|---|---|
| Reviewed source commit | `d55bb48117c0f9e4579b01fd6c12030585601d68` |
| Reviewed committed tree | `7c2a8e3c341498f54e57489a31b2711c9034d3e5` |
| Main comparison base | `449a619f1ae7b66cb42d9cab43dd5493bfe42c2e` |
| Initial consolidation | `29daa061b4ad8b2899f6a8eaa910d12c80c93671` |
| Initial consolidation tree | `014ab768f786b9170ed4885cb849b85b46117bb1` |
| Integrated incoming PR #68 head | `7a3a962400e44a3d7bb2a6834c869f97bae88ee4` |

The review inspected the four new integration files, the production paths
they exercise, the diff from main, the subsequent consolidation changes,
and the retained initial review and baseline receipts. `HEAD` and its tree
matched the identities above before and after inspection. Existing working
changes were documentation only. This lane ran no tests, compiler, build,
browser, product operation or remote action, and changed only this report.
The coordinator's final-source qualification is separate evidence.

**Disposition: no blocking production functional defect was identified in
the reviewed source. The original last-holder test-oracle blocker is fixed.
The strengthened tests have meaningful fixture-derived expectations and
cover the requested ordinary recovery and lifecycle behavior.** The
limitations below remain material to the scope of that conclusion.

## Resolution of the initial observations

The historical [initial functional review](FUNCTIONAL-REVIEW-INITIAL.md)
remains unchanged.

- **Initial F1, incorrect last-holder expectation: resolved.** The lifecycle
  test now requires `{ deleted: true, shred: false }` and absent blob metadata
  after the final detach. This agrees with the pre-existing
  [blob lifecycle implementation](../../../../packages/kernel/src/storage/tx.ts)
  at lines 478 and 529. Production deletion semantics were preserved.
- **Initial F2, foreign-only bytes at the owner's missing ref: addressed.**
  The cross-adapter fixture now stores the missing ref's bytes under the
  foreign tenant, verifies that those bytes exist, and still requires the
  owner's missing count to be one. The encrypted reopen fixture repeats
  this distinction. A tenant-blind presence check would contradict these
  explicit expectations.
- **Initial F3, whole-table traversal in memory coverage: repaired in source.**
  The per-tenant holder index replaces the original scan. Its maintenance,
  rollback and hydration paths were inspected independently below. Small
  fixtures establish result expectations; they are not a resource benchmark.

The retained baseline receipt in
`../classrup-validation/g12-baseline/new-integration-receipt.json`, relative
to the repository root, identifies the initial source and exit code 1. The
retained JSON report records seven passing and three failing baseline cases;
the initial review identifies the former detach expectation as their cause.
Nothing in this
report relabels that initial run as a pass or substitutes current-source
inspection for current-source execution.

## Attachment acceptance and implementation

The [attachment integration file](../../../../tests/integration/attachment-reference-coverage.test.ts)
defines 17 cases after expanding its three-adapter loops. The following are
source-level assessments of those cases, not claims that this lane ran them.

| Behavior | Independent expectation and assessed coverage |
|---|---|
| Owned, missing and foreign references | Lines 34–79 create two owner refs with three holders, including one ref whose bytes exist only for the foreign tenant. Explicit expected counts are owner `2/3/1` and foreign `2/2/0` for distinct refs/holders/missing refs. Separate `info` and byte reads verify the fixture distinction and holder preservation. |
| Bounded results | The same fixture accepts an exact three-holder limit, returns all-null counts at a two-holder limit, and rejects zero, negative, fractional, non-finite and greater-than-10,000 limits. This distinguishes holder-row limits from distinct-ref limits. |
| Empty and unheld state | Lines 110–152 first require zero counts, then put bytes without attaching a holder and require zero counts while those bytes remain readable. The test therefore does not mistake stored bytes for held references. |
| Duplicate attachment and last-holder deletion | Repeating the same attach leaves one holder. Final detach must delete the blob and clear the coverage counts. The assertions distinguish the read-only diagnostic from the explicitly mutating detach operation. |
| Transaction rollback and retry | Lines 127–131 cover an exception after attaching a reference. Lines 158–193 detach the final real holder and attach a different missing ref, verify the interim state, return `err`, and require original counts, original bytes and one original holder to return. Repeating the same edit with `ok` must commit the replacement. All three adapters are included. |
| Rejected persistence | Lines 218–265 reject the second `MemoryDriver.persist` call after an actual working-set edit. They require the original bytes and holder state to return, then require the same edit to commit on the third persistence call. The callback counter prevents an unexercised rejection fixture from looking successful. |
| Retained transaction handle | Lines 195–214 save the detached coverage method, require it to work within its originating read, and require it to throw after that read and during a later valid read. A fresh method still works in the later read. |
| Session lock | Lines 83–106 require principal-only reporting and rejection after lock. Lines 357–384 place a real read barrier ahead of the diagnostic, start session lock while the diagnostic is queued, release the barrier, and require rejection. The schedule uses explicit promises instead of timing sleeps. |
| Plain IndexedDB reopen | Lines 386–413 close one storage instance, open a fresh instance with the same factory/name, and require both tenants' separately scoped missing-reference counts to be reconstructed. |
| Encrypted vault reopen | Lines 267–355 write an ordinary archive plus owner/foreign blob references through `openVault`, lock, reopen and unlock, and require the same principal, signature, counts and bytes. The report is frozen, and it contains no principal, ref, holder or MIME identifiers. |
| Record-only v1 restore | The encrypted fixture exports before closing the source, restores into a distinct destination, requires the archive and signing identity, and requires zero holder counts and absent owner/foreign blob metadata at the destination. The reopened source still has its original coverage. |

These expectations are calculated from deliberate fixture writes and literal
counts. The tests do not simply compare one diagnostic call to another or
derive the expected result from the implementation's tenant index.

### Index consistency and read bounds

In [memory-driver.ts](../../../../packages/kernel/src/storage/memory-driver.ts),
`MemoryState.write` removes the prior holder key from its tenant index before
adding the replacement, and deletion removes an empty tenant set. Duplicate
attachments therefore remain one indexed row. All holder insertions and
deletions use this write path. Both snapshot loading and reverse-order
journal undo call the same method, including undo after rejected persistence.
No separate holder-table mutation path bypassing the new index was found.

`referenceCoverage` first reads only the requested tenant's set cardinality.
It returns null counts immediately above the requested limit; otherwise it
visits at most that many indexed holder rows, deduplicates refs, and tests
blob presence by the same tenant/ref key. It does not retrieve blob bytes.
The bound applies to this read after the working set has been loaded;
snapshot hydration and total database memory remain broader operations.

In [sqlite.ts](../../../../packages/kernel/src/storage/sqlite.ts), the new
query filters `r.tenant`, joins blobs using both tenant and ref, selects only
ref/presence fields, and uses `LIMIT limit + 1`. The existing compound primary
keys in [sqlite-schema.ts](../../../../packages/kernel/src/storage/sqlite-schema.ts)
match the tenant/ref/holder ordering and tenant/ref presence lookup. The
extra row is an overflow sentinel; it is not a partial count returned to the
caller. No SQLite schema or deletion behavior changed.

### Lifetime and persistence composition

The public [transaction API](../../../../packages/kernel/src/storage/tx.ts)
validates the 1–10,000 safe-integer limit before delegating. The existing
[storage lifetime wrapper](../../../../packages/kernel/src/storage/storage.ts)
binds every store method at both public and driver levels, so the added
method is revoked with its original transaction. It cannot acquire the
lifetime of a later transaction through a retained function reference.

The [vault diagnostic](../../../../packages/vault/src/vault.ts) chooses the
active identity's principal internally, executes through guarded
`storage.read`, checks the session again after awaiting that read, and
returns a frozen scalar report. `lock()` revokes the session before waiting
for storage close. The queued-lock assertion therefore exercises a real
ordering condition supported by the implementation.

Both [plain IndexedDB](../../../../packages/kernel/src/storage/indexeddb.ts)
and [encrypted storage](../../../../packages/vault/src/encrypted-storage.ts)
reconstruct their memory working set from snapshots through
`createMemoryDriver`. Consequently the new tenant index is rebuilt after a
fresh open rather than relying on state retained by the old handle.

The report's `excludedStoredReferences` counts present held refs excluded
from v1; missing refs are counted separately. Both remain outside v1.
`holderAuthorityVerified: false` and `includedInV1Backup: false` accurately
preserve the diagnostic's limited meaning. A holder label is not proof of a
live authorized domain record, and this API is not attachment recovery.

## Codec compatibility and recovery oracles

### Valid mixed future/current backup and same-destination retry

[production-future-codec-rejection.test.ts](../../../../tests/integration/production-future-codec-rejection.test.ts)
uses the real signed/encrypted exporter with the production registry plus
one explicit hypothetical codec. It first verifies that codec is absent
from the older production registry. Its positive control restores the same
backup under the compatible registry, locks, reopens and queries the known
archive through all four expected derived indexes; it also queries the
future record and compares both payloads and the signing signature. This
makes older-registry rejection meaningful: the encrypted fixture is known
to be acceptable to a compatible receiver.

The older receiver requires the specific unsupported-scope error and an
uninitialized destination both before and after close/reopen. The new retry
then opens **the same factory and destination name** under the compatible
registry. It compares both complete public `StoredRecord` values against
the values captured from the source writes, including tenant, type, ID,
revision, payload and creation/update timestamps. It also requires the
original principal and signature, exactly two covered records, no
unsupported types, and no limit flags. It repeats these checks after a fresh
encrypted lock/reopen. This directly qualifies ordinary destination reuse
and exact recovered public record metadata rather than merely restoring
some other empty vault.

The negative phase does not directly inspect encrypted domain-row emptiness.
Later exact recovery alone would not prove that no identical row had ever
been materialized: `records.restore` can skip an already identical row.
The no-write conclusion is independently supported by current
`vault.ts`: unsupported manifest-scope admission at line 314 occurs before
identity unlock, storage unlock and the identity/domain write transaction.
This is an evidence boundary, not a discovered partial-write path.

### Downgrade export

[production-downgrade-export.test.ts](../../../../tests/integration/production-downgrade-export.test.ts)
reopens the same encrypted database with the older registry, requires the
owner's future type to appear in unsupported coverage, and requires export
to fail with the intended unsupported-type error. It independently reads
the known and future payloads after rejection, reopens under the newer
registry, checks those payloads and the original principal/signature again,
and requires export to work. The failure cannot pass merely because the
older application fails to open the database.

The inspected exporter checks coverage and captures records in the same
read transaction, with every enumeration scoped to the active principal.
The coverage API's result is not trusted as an earlier cached admission
decision. Export is read-only with respect to domain rows.

### Foreign-codec isolation

[production-foreign-codec-isolation.test.ts](../../../../tests/integration/production-foreign-codec-isolation.test.ts)
places the unsupported type only under a different tenant, reopens the
original encrypted database with the older registry, and requires owner-only
coverage and successful owner export. The restored destination must contain
the owner's archive and signing identity and must not contain the foreign
row. The original database is subsequently reopened under the compatible
registry and must still contain that row. This tests exclusion and source
preservation together. It complements the owner's unsupported-type rejection
instead of weakening that rule.

## Cleanup, limits and residual limitations

- Attachment adapter cases close storage in `finally`. The encrypted
  attachment case tracks every opened vault and closes them in reverse
  order. The queued-lock case releases its barrier and settles outstanding
  work in cleanup, avoiding a stranded test queue. Plain reopen closes both
  connections.
- Codec cases close their successful sessions with `session.lock()`, which
  actually closes the connection under the inspected vault contract. Their
  rejected receiver handles are explicitly closed. A few setup/unlock
  operations, and the initial future-codec positive-control assertions,
  precede their cleanup `try/finally` blocks; an unexpected failure there
  can retain that case's isolated fake-IndexedDB connection until worker
  teardown. This is a nonblocking fixture-cleanup limitation, not evidence
  of product data loss or an ordinary-success leak.
- Existing limits remain 10,000 backup records, 256 registered record types,
  16 MiB of decrypted backup input and 32 MiB per encrypted storage row. The
  holder diagnostic retains its 10,000-row ceiling. No baseline test
  timeout, workflow, manifest version, schema, signature or key-derivation
  policy changed. The global Vitest timeout remains 20 seconds and the
  three existing codec cases retain their 30-second limits. The newly added
  encrypted attachment case has its own explicit 30-second limit.
- Overflow is asserted using a small custom holder limit. There is no new
  10,000/10,001-row load test or measured scan-cost benchmark in these four
  files. The read-cost conclusion above comes from source inspection.
- The injected persistence rejection exercises the memory driver's shared
  persist/undo seam. It is not an actual encrypted IndexedDB quota failure,
  browser transaction interruption or device power-loss test.
- The encrypted reopen fixture uses the production encrypted vault adapter
  over fake IndexedDB. Its blobs have `encrypted: false` at the individual
  blob layer; at-rest vault encryption still applies. It does not newly
  qualify per-blob `shred: true` key handling. The SQLite variants use an
  in-memory database rather than file-backed reopen.
- These tests do not establish native Chromium/Firefox/WebKit behavior,
  multi-tab interruption guarantees, attachment integrity or authority,
  portable attachment export, operational delivery/lease recovery, or
  whole-database rollback protection. Existing documented exclusions remain.

## Final disposition

The reviewed production change is a coherent bounded, read-only attachment
reference diagnostic, and the four integration files contain substantive
ordinary functional oracles for the consolidated behavior. The original
blocking detach assertion is repaired without changing production lifecycle
semantics. No additional production fix is requested by this review.

Proceed on this functional source-review lane, subject to the coordinator's
separate exact-source execution results and the other required independent
reviews and hosted gates. This report grants no test pass, hosted pass,
merge, release or deployment status.
