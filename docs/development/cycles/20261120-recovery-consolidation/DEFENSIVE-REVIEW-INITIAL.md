# Initial independent defensive review

## Source identity, provenance and disposition

Reviewed exact integrated source **`29daa061b4ad8b2899f6a8eaa910d12c80c93671`**,
tree **`014ab768f786b9170ed4885cb849b85b46117bb1`**, against main
`449a619f1ae7b66cb42d9cab43dd5493bfe42c2e`. This source preserves the five
independent candidate heads from PRs #64–#68 as merge parents.

This is the initial, source-focused defensive review completed before the
subsequent consolidation repairs. File and line references below identify that
reviewed source. They are not conclusions about a later edited source.

Review provenance: static reading of the committed production changes, storage
and identity/session implementation, schema, compatibility tests, attachment
specification and handoffs, plus source searches for consumers. No code edits,
test executions, network probes, remote operations or vulnerability
reproductions were performed during the review. This document subsequently
preserves the completed review; it adds no execution claim.

**No new production tenant-isolation, identifier-disclosure or session-revocation
defect was established by this static review.** One incorrect test oracle must
be corrected before qualification. Two acceptance gaps and one boundedness
limitation should remain explicit.

## 1. Qualification blocker: lifecycle test contradicts existing last-holder deletion

**Location:** `tests/integration/attachment-reference-coverage.test.ts:116`.

The new lifecycle case detaches the only holder at line 111, then expects
`tx.blobs.info(...)` to remain defined. Existing production behavior deliberately
deletes a blob when its final holder is detached:

- `packages/kernel/src/storage/tx.ts:478` begins the detach implementation.
- Line 480 preserves a blob only while holders remain.
- Line 483 removes the blob after the last holder disappears.

This is an incorrect acceptance oracle, not a newly introduced deletion defect.
**Preserve established production deletion behavior.** Assert that coverage
itself leaves stored-but-unheld bytes intact before attaching/detaching, then
expect last-holder detach to remove the blob. The same faulty expectation
appears through the loop for all three adapters.

The original round-3 handoff's "non-deletion of blob bytes" statement also needs
a corrective follow-on explanation, while retaining the original evidence
unchanged.

## 2. Boundedness limitation: memory coverage limits owner counts, not total scanned rows

**Location:** `packages/kernel/src/storage/memory-driver.ts:287`.

The memory driver scans the complete `blob_refs` map, discarding foreign tenants
before incrementing `holderCount`. Consequently, its 10,000-holder cap bounds
counted owner rows and the distinct-ref set, but **does not bound total map
traversal** when unrelated tenants contain many rows.

Both ordinary IndexedDB and encrypted IndexedDB reuse this driver. Encrypted
vault unlock already loads/decrypts its working set; the new diagnostic
introduces no streaming or device-memory bound.

This limitation is acknowledged in the later PR #68 handoffs. The original
handoff's statement that "the read has an unchanged 10,000-row upper bound" is
too broad.

**Disposition:** document the actual limit precisely in the current
consolidation record. A future requirement for bounded tenant-local work needs
a tenant index or equivalent bounded iterator. Do not describe current behavior
as demonstrated denial of service or as a newly proven cross-tenant data leak.

SQLite has a stronger bounded query shape: tenant equality, `LIMIT limit + 1`,
and an order matching the `(tenant, ref, holder)` primary key. This is
source/schema inspection, not a measured query-plan or resource-budget result.

## 3. Acceptance gap: missing owner bytes versus present foreign bytes

**Location:** `tests/integration/attachment-reference-coverage.test.ts:23`.

The current case stores the shared digest in **both** tenants. Its owner-missing
digest is absent from both tenants. It therefore does not directly prove that
foreign-only bytes cannot satisfy an owner's missing reference.

The implementation is correctly scoped by inspection:

- Memory presence lookup uses `k(tenant, row.ref)` at `memory-driver.ts:294`.
- SQLite joins on both `b.tenant = r.tenant` and `b.ref = r.ref`, with
  `WHERE r.tenant = ?`, at `sqlite.ts:209`.

**Recommendation:** extend the existing ordinary adapter acceptance with an
owner reference whose bytes exist only under the foreign tenant. Owner
`missingCount` must remain unchanged. This is an acceptance improvement, not
evidence of a current isolation failure.

## 4. Acceptance gap: unsupported restore tests identity absence, not destination reusability

**Location:** `tests/integration/production-future-codec-rejection.test.ts:115`.

After rejection, the new case checks only `isInitialized() === false`, both
immediately and after reopen. That proves no identity was installed. Alone, it
does not independently prove that no supported domain row was partially
persisted or that the destination remains reusable.

Current production source rejects the unknown manifest scope at `vault.ts:314`,
before storage unlock and the identity/domain write transaction. No
partial-install defect was found.

**Recommendation:** include a successful compatible restore into the same
rejected destination after reopening, with expected record/identity checks, or
otherwise inspect the relevant destination state. Keep the narrower existing
evidence distinct from stronger atomicity claims.

## Confirmed controls

- **Principal binding:** `attachmentCoverage()` accepts no tenant argument and
  derives its scope from the unlocked identity at `vault.ts:209`.
- **Revocation:** vault guards run before and after the awaited read. The
  guarded storage wrapper also checks callback lifetime. Existing generic
  `bindLifetime()` wraps newly added methods, including retained/destructured
  calls.
- **Read-only implementation:** the new driver methods contain no writes. They
  return aggregate counts only. SQLite selects reference keys internally,
  never blob bytes; memory checks presence without copying blob bytes.
- **No identifier output:** the vault result is frozen and contains only
  numeric/null counts and fixed booleans. It returns no ref, holder, MIME type,
  tenant, bytes, filename or sample data.
- **Honest authority boundary:** `holderAuthorityVerified: false` and
  `includedInV1Backup: false` are explicit. Counts are not interpreted as
  authenticated parent-record linkage, content integrity or portable recovery
  admission.
- **Overflow:** both adapters return all unavailable counts as `null` with
  `limitExceeded: true`, avoiding apparently complete partial totals.
- **No new completeness consumer:** source search found no PWA or other
  production consumer treating this diagnostic as attachment-backup acceptance.
- **Compatibility changes:** the three codec candidates add tests; they do not
  modify v1 wire meaning, signing identity, cryptographic settings, restore
  admission or export filtering.

## Remaining qualification boundaries

**All 51 historical findings remain OPEN.** This review supports the scoped
source assessment above; it supplies no executed test, hosted, native-browser,
device-interruption or whole-database recovery qualification.

The subsequent repair source requires its own review and executed qualification.
Preserve this initial assessment and all historical failed/incomplete evidence
without relabelling them as results for that later source.
