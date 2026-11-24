# Independent initial attachment coverage code review

## Source, scope and provenance

- Reviewer: fresh independent code-review worker `g12_attachment_code_review`.
- Reviewed integrated commit: `29daa061b4ad8b2899f6a8eaa910d12c80c93671`.
- Reviewed complete tree: `014ab768f786b9170ed4885cb849b85b46117bb1`.
- Main baseline: `449a619f1ae7b66cb42d9cab43dd5493bfe42c2e`.
- The integrated source preserves the current PR #64–#68 histories. This review focuses on PR #68's production attachment coverage additions, their interfaces and their new acceptance.

This is a preserved **read-only source review**. The reviewer read source, call sites, the attachment specification and all three original coverage handoffs. The reviewer performed no compiler, domain test, benchmark, browser, exploit reproduction or remote operation. The parent subsequently requested this written record; writing this file does not add runtime evidence. Source paths and line references below refer to the reviewed source. Later repairs and execution belong to separate records and must not overwrite these observations.

**Result: one blocking acceptance-test defect. No additional production correctness blocker identified in this bounded review. The memory driver's complete scan is not bounded by its matching-owner limit.**

## R1 — lifecycle assertion contradicts existing last-holder deletion

At the reviewed source, [attachment-reference-coverage.test.ts](../../../../tests/integration/attachment-reference-coverage.test.ts), lines 110–116, detaches the only holder and then expects blob information to remain defined. Existing [tx.ts](../../../../packages/kernel/src/storage/tx.ts), lines 478–484, deliberately deletes the blob after its last holder is removed. Its public contract at line 529 states this behavior. Existing [shared adapter acceptance](../../../../packages/kernel/src/storage/contract-suite.ts), lines 269–275, already verifies last-reference deletion and encrypted-key shredding.

The new oracle would therefore reject correct behavior on memory, IndexedDB and SQLite. This is an acceptance defect, not a production retention defect. No execution was needed or claimed to identify the contradiction.

Smallest repair: assert that coverage reads leave the bytes present **before** detachment, then assert the plaintext fixture's detachment returns `{ deleted: true, shred: false }`, coverage becomes empty and blob lookup is undefined. Preserve production deletion semantics.

## R2 — accepted owner count does not bound the complete memory scan

The new [memory driver](../../../../packages/kernel/src/storage/memory-driver.ts), lines 283–295, iterates every `blob_refs` row and checks its tenant before incrementing the holder limit. Accepted owner holders and temporary distinct-reference storage are bounded, but total rows examined are not. An owner with no references still requires examination of all foreign references. Both plain and encrypted IndexedDB reuse this memory working set.

The [SQLite query](../../../../packages/kernel/src/storage/sqlite.ts), lines 207–219, has a different cost shape: tenant-prefixed primary keys, a join on both tenant and reference, and selection limited to `limit + 1` rows. No measured query plan or throughput result is claimed here.

The original coverage handoff's statement that the read has a 10,000-row upper bound must not be repeated as a whole-scan guarantee. Its later round 2 and round 3 handoffs already acknowledge the limitation. One valid disposition is explicit scan-cost qualification. If a genuinely tenant-bounded query is required, maintain a tenant-to-holder-key index through `MemoryState.write`; snapshot loading and rollback already pass through that function. Such a production repair requires separate review and execution.

## Production checks completed by inspection

| Check | Observed behavior |
|---|---|
| Counts | Both drivers count distinct held references, holder rows and distinct missing references. Overflow returns all three totals as `null`, with `limitExceeded: true`. |
| Public limit | The transaction port rejects non-safe integers and values outside 1–10,000. The default is 10,000. |
| Presence isolation | Memory checks the combined tenant/reference key. SQLite joins both tenant and reference. Foreign bytes do not satisfy another tenant's missing reference. |
| Read-only behavior | The diagnostic invokes no write, purge, detach or blob-byte retrieval method and exposes scalar counts only. |
| Transaction lifetime | `bindLifetime` wraps both the driver and public method tables, including newly added or destructured methods. The new method uses the existing revocation mechanism. |
| Session lifetime | `attachmentCoverage()` uses the identity's principal and guarded session storage, then rechecks the guard after awaiting the read. |
| Report interpretation | The frozen vault report explicitly states `holderAuthorityVerified: false` and `includedInV1Backup: false`. Arbitrary holder labels are not promoted to domain authority. |
| Compatibility | No existing backup wire format, encryption, restore behavior, record codec or blob deletion behavior changes. The two `UnlockedVault` fixture additions supply the new required interface member. |
| Production consumers | No production PWA caller currently treats this diagnostic as attachment recovery or a completeness certificate. Existing tenant-scoped domain interfaces remain unchanged. |

The inspected lifetime and snapshot mechanisms are in [storage.ts](../../../../packages/kernel/src/storage/storage.ts), [indexeddb.ts](../../../../packages/kernel/src/storage/indexeddb.ts), [encrypted-storage.ts](../../../../packages/vault/src/encrypted-storage.ts) and [vault.ts](../../../../packages/vault/src/vault.ts). These source checks do not substitute for adapter execution or native-device qualification.

## Acceptance gaps observed at this source

The authored tests use plain fake IndexedDB plus a memory-backed vault. They do not yet establish the new diagnostic after encrypted `openVault` persistence and reopen, or rejection of a diagnostic already queued when locking begins. The foreign-tenant fixture also does not cover a missing owner reference whose bytes exist only under another tenant. The source implementations handle presence isolation correctly by inspection, but that ordinary parity case would strengthen acceptance.

After repairing R1, exact-source execution and the separate functional and defensive reviews remain necessary. This review is not an integration approval, portable attachment recovery claim or closure of historical readiness findings.
