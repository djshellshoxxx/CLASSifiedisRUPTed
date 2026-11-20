# Final independent code review — recovery consolidation

Date: 2026-11-20. Review lane: independent static code review.

**Disposition: no new blocking correctness or integration finding in the reviewed production delta.** The candidate preserves the incoming tenant-index implementation and the contributions from PRs #64–#68. This conclusion applies to the exact source identified below. It does not substitute for the separate functional, defensive, hosted, or native-browser qualification lanes.

## Exact source and review boundary

| Item | Identity |
|---|---|
| Reviewed commit | `d55bb48117c0f9e4579b01fd6c12030585601d68` |
| Reviewed tree | `7c2a8e3c341498f54e57489a31b2711c9034d3e5` |
| Main comparison commit | `449a619f1ae7b66cb42d9cab43dd5493bfe42c2e` |
| Main comparison tree | `8fe1965ae60c385042f09c690eabe7d0828b36e8` |
| First merge parent | `bd6f59cb49a72583dcba3ca7925a6be3e82bc584` |
| Incoming PR #68 parent | `7a3a962400e44a3d7bb2a6834c869f97bae88ee4` |
| Final memory-driver blob | `56d93ed22056f8cd215882df97a3732ea1b5b213` |

The comparison was `git diff 449a619f1ae7b66cb42d9cab43dd5493bfe42c2e...d55bb48117c0f9e4579b01fd6c12030585601d68`. Main is an ancestor. All six changed production files were reviewed, together with their unchanged storage, encryption, lifecycle, schema, and caller context:

- `packages/kernel/src/storage/driver.ts`
- `packages/kernel/src/storage/memory-driver.ts`
- `packages/kernel/src/storage/sqlite.ts`
- `packages/kernel/src/storage/tx.ts`
- `packages/vault/src/index.ts`
- `packages/vault/src/vault.ts`

This is 93 production insertions and one replaced export line. Source reads used the frozen Git objects. The working tree contained documentation work by other lanes; runtime and test files matched the frozen commit when checked. This reviewer executed no compiler, test suite, application, benchmark, vulnerability reproduction, or remote mutation. The only file written by this lane is this report.

## Standards

**No documented-standard violation or actionable code-smell finding was identified in this bounded delta.**

The changes respect the isomorphic-core/Node-adapter boundary in `planning/adr/ADR-0016.md:15–18`: the memory/transaction/vault additions introduce no Node-only dependency, and the SQL implementation remains in the existing SQLite adapter. The new index is derived working-set state; no database migration is necessary because the persisted tables, keys, and rows are unchanged (`packages/kernel/src/storage/sqlite-schema.ts:59–71`; `memory-driver.ts:22–37`).

The review follows the repository's requirement to distinguish candidate-specific evidence from earlier results and to check both ancestry and content when integrating contributions (`docs/wiki/Developer-Guide.md:61–77`). Source assertions are reported as test coverage present in the candidate, not as executed passes. The duplication between memory and SQL counting loops is small and keeps adapter-specific data access behind the established port; no speculative shared abstraction is requested.

The required additions to `DriverTx.blobs` and `UnlockedVault` are intentional interface extensions. Every checked-in driver implementation and both affected structural vault fixtures have the method. This is not a claim that external implementations of these interfaces would compile without adding the new member.

## Spec

**No missing or incorrect Phase A requirement was identified.** The applicable scope is the read-only diagnostic in `docs/development/cycles/20261120-attachment-recovery/SPEC.md:14–26` and the executable scope in `docs/development/cycles/20261120-attachment-reference-coverage/HANDOFF.md`. The later portable-attachment proposal is explicitly separate work.

| Requirement | Static review result and source |
|---|---|
| Bounded tenant-specific holder inventory | The public transaction method validates an integer limit in `1..10000`; memory reads one tenant's key set; SQL filters the tenant and requests at most `limit + 1` rows. `tx.ts:518–521`, `memory-driver.ts:301–316`, `sqlite.ts:207–219`. |
| Distinct held references, holder rows, and missing references | Both implementations count unique refs independently from holder rows and check presence under the same tenant. Unheld blobs are outside the input set. `memory-driver.ts:304–316`, `sqlite.ts:209–219`. |
| Unavailable totals on overflow | Both adapters return all three counts as `null` with `limitExceeded: true`; the vault also propagates `null` for present-but-excluded references. `driver.ts:144–149`, `vault.ts:207–219`. |
| Principal- and session-bound public diagnostic | `attachmentCoverage()` accepts no caller-supplied tenant and uses the active identity's principal through the existing guarded storage read. `vault.ts:184–219`. |
| No identifiers, labels, bytes, or ownership certification | The public result contains only counts and fixed flags. `holderAuthorityVerified` and `includedInV1Backup` are both literal `false`; the result is frozen. `vault.ts:33–42,207–219`. |
| Preserve v1 backup and storage contracts | The exporter, restore admission/transaction, encrypted storage implementation, SQL schema, IndexedDB version/table list, signatures, and identity implementation are unchanged. `vault.ts:221–250,303–334` and the zero-diff checks below. |

### Tenant index, mutation, and recovery invariants

`MemoryState.write()` remains the single mutation path. It removes the previous row's group and tenant-index membership before deleting or installing a row, then adds the new row's memberships (`memory-driver.ts:63–78,96–104`). An ordinary repeated attachment uses the same composite key and replaces membership without increasing cardinality. Removing the final holder deletes the empty tenant set; detaching an absent row leaves the index unchanged.

The new index stores keys, not copies of rows. Coverage resolves each indexed key from `blob_refs`, deduplicates by `ref`, and checks `blobs` with the requested tenant. The normal attachment writers create their row internally, and the state class is not exported. No new path was found that mutates reference rows while bypassing `MemoryState.write()`.

The same path also covers the cases most likely to leave a derived index stale:

- Snapshot loading calls `state.write()` for every stored row (`memory-driver.ts:342–344`). Plain IndexedDB reopening uses the resulting memory driver (`indexeddb.ts:189–196`). Encrypted unlocking authenticates and decodes a snapshot before constructing that driver (`encrypted-storage.ts:139–208`). The tenant index therefore reconstructs without an on-disk index or migration.
- Every transactional write records its previous row before calling `state.write()` (`memory-driver.ts:161–166`). Both explicit rollback and a rejected persistence promise restore journal entries in reverse order using `state.write()` (`memory-driver.ts:352–383`). This restores reference membership along with any last-holder blob deletion.
- Changes persisted to IndexedDB are still the original table/key/row changes. The new map is neither serialized nor included as an additional physical table (`memory-driver.ts:346–349`; `indexeddb.ts:78–103`). The existing encrypted change and authenticated-inventory paths remain unchanged.

For the checked-in valid row model, these paths preserve equality between a tenant's set and its actual `blob_refs` keys. No stale-index path was found under successful writes, duplicate attachments, deletions, rollback, persistence rejection, or reopening. This is a source-level conclusion, not an executed fault-injection result.

### Bounds and count semantics

The public `Tx.blobs.referenceCoverage()` rejects zero, negatives, fractions, non-finite values, unsafe integers, and values above 10,000 before entering a driver (`tx.ts:519–521`). Its default is 10,000. The vault supplies its fixed 10,000-holder limit. Raw driver ports continue the existing architecture of receiving validated internal parameters; the new method is not an independently validated untrusted-input API at that lower layer.

The memory implementation checks `Set.size` before looping. Overflow therefore requires no traversal of the tenant's holder rows, and an accepted read visits at most the allowed number of keys. It does not iterate the whole `blob_refs` table or any other tenant's set. The additional index is maintained on writes and reconstructed during the existing whole-snapshot hydration; this change does not make vault opening a constant-work operation.

The SQL query constrains `r.tenant = ?`, orders by `r.ref, r.holder`, and joins with both tenant and ref. The existing `blob_refs` primary key is `(tenant, ref, holder)`, and the `blobs` primary key is `(tenant, ref)` (`sqlite-schema.ts:62–70`). Those keys support the requested tenant range, order, and unique presence lookup. At most `limit + 1` result rows are materialized; the extra row detects overflow. No runtime query plan or timing was executed by this reviewer.

For an accepted inventory, `referenceCount` is the number of distinct held refs, `holderCount` is the number of reference-holder rows, and `missingCount` is the number of distinct refs without a blob in that tenant. The vault's `excludedStoredReferences` is `referenceCount - missingCount`, so it counts present held refs, not holder rows. Multiple holders do not multiply a missing reference. A matching digest stored only by another tenant does not make an owner's reference present. The read never calls a blob-byte getter, orphan collection, attach, detach, or persistence.

### Transaction, session, and interface compatibility

`createStorage()` binds every method of both the driver and public transaction stores through the existing lifetime guard (`storage.ts:45–84`). The new enumerable method is included automatically. Extracting `tx.blobs.referenceCoverage` therefore does not bypass revocation, and a retained method cannot become valid again in a later transaction. Reads remain serialized and always rolled back (`storage.ts:28–42,94–111`).

The vault diagnostic mirrors `backupCoverage()`: it checks the session before starting, uses the guarded storage read, and checks again after the await (`vault.ts:184–219`). The storage wrapper also checks before and after callback work. A lock begins by revoking the session and closing the vault; queued diagnostic work cannot publish counts through the public method after those guards fail. The returned object holds primitives only and is frozen, so it exposes no mutable internal collection or callback.

The `BlobReferenceCounts` port is implemented by memory and SQLite. Both plain and encrypted IndexedDB working sets reuse memory. `Tx` is inferred from `createTx()`, so the new member is present without a second stale interface definition. `AttachmentCoverage` is exported from the vault package entry point. Both checked-in `UnlockedVault` object fixtures add explicit out-of-scope stubs (`tests/integration/barter-want-intent.test.ts:35–40`; `production-barter-recovery.test.ts:448–455`). No additional concrete driver or vault implementation was found in the source search.

The candidate adds no PWA caller or completeness message. Arbitrary holder strings remain unauthenticated. Presence means that a stored blob row exists; this diagnostic does not establish digest integrity, canonical parent-record authority, availability of unheld data, or portable attachment recovery.

## Parent and merge preservation

`git merge-base --is-ancestor` returned exit 0 for each exact source below against the reviewed commit. Content comparisons were performed in addition to ancestry checks.

| Contribution | Exact source head | Content result |
|---|---|---|
| PR #64 — future-codec rejection | `f598dc52937449764703b5048ba71a77239c9ded` | Both handoffs are unchanged. The mixed-backup positive control, older-registry rejection, and assertions that the destination is uninitialized after reopening remain. The only test changes add saved-record capture and successful retry/reopen of that same destination with a compatible registry. |
| PR #65 — downgrade-export preservation | `5a742b5c4f1068f8bbd51d84de6a3de054df57e7` | Test and handoff are byte-identical. |
| PR #66 — foreign-codec isolation | `5bae3058bffec53c0fe04700c84232b8d7a5a84a` | Test and handoff are byte-identical. |
| PR #67 — attachment recovery design | `d1dcd44e839c7c28a33b94553f5cb3270ffc6d6c` | Specification and handoff are byte-identical. |
| Latest PR #68 — attachment reference coverage | `7a3a962400e44a3d7bb2a6834c869f97bae88ee4` | All six production files, four handoffs, and two existing fixture repairs are byte-identical. Attachment acceptance retains the incoming corrected last-holder behavior, rollback check, and IndexedDB reopen case, with the documented stronger assertions and added scenarios. |

The final merge's complete difference from its first parent `bd6f59cb49a72583dcba3ca7925a6be3e82bc584` is the incoming memory implementation plus `HANDOFF-ROUND4.md`. **All final test files are byte-identical to that first parent.** The alternative first-parent memory implementation's index update/removal logic is retained semantically; the selected incoming implementation uses the exact requested blob, with a `Set.size` overflow check instead of iterating up to a sentinel. No first-parent test contribution was lost in conflict resolution.

The last-holder assertion is consistent with the existing production contract: `blobStore.detach()` removes the blob after its last holder is removed (`tx.ts:478–484,529–530`). Changing the old survival expectation strengthens the test's correctness without changing runtime deletion behavior.

## Evidence and qualification limits

Static evidence collected for this review includes:

- Exact commit/tree resolution, full commit range, changed-path inventory, and the entire production diff.
- Parent ancestry checks, per-contribution content diffs, and the complete first-parent/final diff.
- Exact memory blob identity from `git ls-tree`.
- A zero-diff check from main to the candidate for SQLite schema, IndexedDB implementation, encrypted storage, identity, federation, `apps`, `.github`, `package.json`, and `pnpm-lock.yaml`.
- A zero-diff check from the frozen candidate to the working runtime/test/configuration paths while other lanes were editing documentation.
- Static inspection of the new test assertions covering tenant separation, exact/small-limit overflow, invalid limits, duplicate/final-holder behavior, error rollback, retained transaction methods, rejected persistence and retry, encrypted reopen, record-only recovery, queued lock, and plain IndexedDB reopen (`attachment-reference-coverage.test.ts:32–413`).

No passing runtime result is claimed by this report. The parent coordinator owns the separate candidate-specific execution and required hosted qualification evidence. The presence of fake-IndexedDB or memory-persistence tests is not native browser, quota, interruption, or device acceptance. Main's prior qualification and historical branch results do not qualify a later source automatically.

The 51 historical findings remain OPEN exactly as recorded in `planning/SECURITY_FINDINGS_TRACKER.md`; this bounded code review closes none of them. Portable attachment admission, authenticated holder-parent linkage, operational-state recovery, and the later design acceptance matrix remain outside this Phase A implementation.

Review findings: Standards **0**; Spec **0**; no new blocking production finding for the exact reviewed source.
