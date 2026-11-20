# Security audit — generation 2, November 19–20, 2026

## Source and outcome

Repository: `djshellshoxxx/CLASSifiedisRUPTed`.
Reviewed baseline: `30526fb2745e8d6e2bb15efae5b8106bcdcf53d0`, tree
`0cc6dec4a1c84f5673f31bd845103f24622dc98a`.
Isolated branch: `codex/classrup-security-g2-20261119`.
Codec repair: `e50198007a5381402c10671aa53c564ced29f24c`, tree
`64c6b719c5057b9d46b238bd316b39507d45da4d`.

This generation reviewed the new backup coverage and type-inventory feature,
its same-transaction export admission check, and the integrated generation 1
scope/blob changes. It reproduced and repaired a valid-codec compatibility
regression. No new external attack path was demonstrated within this scope.
This is a bounded source review and focused verification, not complete product
or release security qualification. The worker performed no remote writes,
dependency changes, protocol changes, identity rotation, or deployment.

The predecessor handoff was read from commit
`bd272cba448c2771dc733f7a6b4e4f07dfb28d61`, at
`docs/development/cycles/20261119/security-audit-g1.md`. Its executed checks remain
predecessor evidence; none are added to this generation's counts.

## Reproduced and repaired: class codec methods were lost

**Assessment:** an API compatibility and backup availability defect introduced
by the codec-registry snapshot. The codec is supplied by trusted application
composition; this is not evidence of an untrusted archive gaining execution.

`BackupCodec` accepts ordinary TypeScript classes, including prototype methods
and methods that access private instance fields. The new registry snapshot used
`Object.freeze({ ...codec })`. Object spread copies enumerable own properties,
so it dropped class prototype methods. The real export path then failed with
`TypeError: codec.parse is not a function`.

The repair in `packages/vault/src/vault.ts` captures `type` and each required or
optional callable reference once, binds callables to the original receiver, and
freezes the accepted wrappers and registry. The optional `validate`,
`restoreData`, and `recordId` methods remain optional. Subsequent replacement of
the supplied array, type, or method properties does not alter the accepted
registry. Binding also preserves private class state. Arbitrary trusted closure
or receiver behavior is not deeply frozen and is not claimed to be immutable.
Duplicate-type validation compares against the copied registry length.

The regression in `packages/vault/src/backup-codecs.test.ts` constructs source
and destination vaults with a class codec whose schema and index are private
fields. It then changes the original type and every method property and empties
each supplied array. It exercises real identity creation, encrypted backup
export, backup restore, identity preservation, record lookup through a rebuilt
index, and invocation of all optional methods. Crypto is not mocked.

The unchanged regression failed **0 passed / 1 failed** against the baseline
implementation, with the specific export TypeError above. With the repair it
passed **1 passed / 0 failed / 0 pending** in 10.27 seconds. Both invocations
completed normally; the RED failure was not a timeout or process kill. The
source and test were frozen together in the repair commit before handoff.

## Coverage, tenant, and snapshot review

The inspected `backupCoverage()` implementation derives the tenant from the
active identity rather than accepting a caller-selected principal. It returns
frozen record-type/count metadata and frozen scope lists, without returning
record payloads or keys. The first 256 populated types are exposed; a 257th
inventory entry is used as the overflow sentinel. The record count is expressly
a lower bound if the type limit is exceeded. Export rejects either overflow and
retains the 10,000-record bound.

Export repeats coverage admission in the same storage read callback that
collects exported records. A previous UI preview therefore does not authorize
silently omitting a subsequently stored unsupported record type. The accepted
codec-type list is fixed at vault construction. Restore still requires supported,
sorted, unique declared types, and rejects out-of-scope records before persistence.
The alpha wire format and identity/signature checks are unchanged by this repair.

`records.listTypes(tenant, limit)` rejects non-integer, non-finite, zero,
negative, and excessive limits at the public transaction boundary. SQLite uses
bound parameters for both tenant and limit and orders grouped types with binary
collation. The memory driver compares exact tenant strings and orders type names
using its existing UTF-8 comparator. Neither driver deserializes record payloads
to produce the inventory. IndexedDB uses the existing snapshot/memory-driver
composition; no native IndexedDB execution was performed in this generation.

The limit bounds returned inventory entries, **not all counting work**. In
particular, the memory implementation still scans existing records and constructs
the type-count map before slicing. This feature does not establish a general
memory or time bound for a large persisted database. Native-browser and
large-vault qualification remain separate work.

## UI and composed storage boundaries

The coverage UI uses `runForSession` around the asynchronous operation and puts
the formatted result into `textContent`. Its unsupported-type message does not
interpolate the stored type identifier. Coverage and passphrase fields are
cleared by the existing lock flow, and the download path checks the originating
session. These are source-review observations; no live browser/session-race
qualification is claimed here. The isolated formatter probe confirms that a
hostile-looking unsupported identifier is absent from the returned text.

The integrated scope correction explicitly supplies authority-bearing tenant,
bytes, and clock values and copies only permitted metadata. The blob correction
captures metadata and copies the admitted bytes before asynchronous hashing;
hashing, persistence, privacy checks, and deduplication use those snapshots.
The memory driver also copies blob byte arrays at storage boundaries. No
additional composition defect was confirmed in this source inspection. The
generation 1 regressions were not rerun by this worker.

## Executed evidence

| Check | Result | Scope |
| --- | --- | --- |
| Class-codec regression on baseline | Exit 1; 0 passed, 1 failed | Specific `codec.parse` TypeError during real export |
| Same regression with repair | Exit 0; 1 passed, 0 failed, 0 pending | Real source/destination vault export and restore |
| Independent Node probes | Exit 0; eight named probes completed | Memory, SQLite, and the pure UI formatter |
| `git diff --check` | Exit 0 | Source and regression patch before commit |

The eight probes are recorded separately from Vitest test counts. On both memory
and SQLite they cover the 257-entry sentinel with 260 populated types, exact
tenant isolation including a SQL-looking literal tenant, payload-free counts,
transaction rollback, detached transaction-method rejection, and invalid limits.
The remaining probes check malformed-JSON inventory without deserialization and
the static unsupported-type UI message. The probe script imports the actual
source modules and is preserved for reproduction.

Commands, exact source identities, counts, evidence byte lengths, and SHA-256
digests are recorded in [security-g2/receipt.json](security-g2/receipt.json).
Raw JSON reports, logs, and the probe script are in the same directory. The
probe targets are unchanged by the codec repair. This generation ran no full
suite, typecheck, new dependency audit, hosted check, or browser test, following
the integration owner's shared-resource constraint. No result is inferred for
any unexecuted gate.

## Remaining work and fresh-worker handoff

1. Integrate the codec repair and run the combined, serial qualification against
   the final source tree. Earlier main/PR checks do not qualify subsequent
   feature or audit changes. Preserve the baseline failure evidence.
2. Root owns the next accepted recovery-preflight milestone: the current export
   path can still accept a record that restore-time domain normalization rejects,
   such as an archive with a foreign owner. This is an acknowledged existing
   recovery gap, not fixed or qualified by this codec patch. Review the final
   shared structural/schema/index/key/normalization/validation pipeline and its
   foreign-owner, normalization-isolation, async-lock, and old-restore cases on
   the next exact source. Export validation must not rewrite signed/source rows.
3. The class-codec test currently records the existing export/restore invocation
   sequence. Shared recovery preflight will intentionally invoke additional codec
   methods during export. Update that expected sequence with the behavior change
   while preserving the private-receiver and accepted-reference assertions.
4. Keep record-backup coverage distinct from complete database and delivery-state
   recovery. Blobs, references, delivery queues, leases, migration metadata, and
   the other explicit excluded stores remain outside this alpha record kit.
5. Continue with a concrete unreviewed boundary or final-source delta. Treat
   device-scale memory/time behavior and real browser settlement ordering as
   unqualified until their own evidence exists. Do not rerun completed checks
   merely to increase worker or test counts.

No production source edits are pending from this worker after
`e50198007a5381402c10671aa53c564ced29f24c`.
