# Independent code review — persisted-state rejection proof

Date: 2026-11-20. Scope: static review of the test-only follow-up.

**Disposition: no blocking code or test-oracle defect identified in the reviewed delta.** The added observations directly check persisted state after rejection and reopen. This review does not establish a runtime, hosted, or native-browser pass.

## Exact source

| Identity | Reviewed value |
|---|---|
| Frozen source | `53aa9fe93c8599c41c0b9b2df4f438b969f14ce9` |
| Complete tree | `81a97a7be19975fe653bce41bda5d7e0991efcbb` |
| Published parent | `6d4f6ea7ba9bcf886ae69edd0f167a621308d4b2` |
| Changed test blob | `ebc626830218ec8a05f2ed1669530be4134bb441` |

The complete parent-to-source changed-path list contains only [production-future-codec-rejection.test.ts](../../../../tests/integration/production-future-codec-rejection.test.ts). Production implementation, dependencies, configuration, workflows, backup formats and product caps are unchanged. At inspection, the working-tree difference outside documentation was empty. This lane ran no tests, compiler, browser, application or remote action and wrote only this report.

## Observer and transaction correctness

The observer opens the same `classrup-vault:` database name used by [openVault](../../../../packages/vault/src/vault.ts), through the supplied fixture's `IDBFactory`. It does not call the production connection-opening helper. That distinction matters because [openIndexedDbConnection](../../../../packages/kernel/src/storage/indexeddb.ts) writes a new random `meta['writer']` token and fences earlier writers. The raw observation avoids changing that authority.

An unexpected creation or upgrade aborts the opening transaction and closes the opened connection; the request's error handler rejects with an explicit observation error. A misspelled database name therefore cannot silently produce a successful empty snapshot. The established [encrypted-storage tests](../../../../packages/vault/src/encrypted-storage.test.ts) already use direct object-store inspection as an adapter-level observation seam.

All discovered object stores share one `readonly` transaction. Each table queues its key and value requests together before awaiting them, and the helper checks that their lengths agree. This uses the same key/value pairing as the existing adapter snapshot while also retaining every discovered store. Completion, error and abort handlers are installed before requests are queued. The helper awaits both the request collection and transaction completion before returning. Read or transaction rejection reaches an attached aggregate handler; the connection closes in `finally`, including synchronous transaction-creation failure. No write, delete, schema change or writer-claim operation is issued on the normal observation path.

## Rejection and reopen observations

The fresh destination's records store must be empty. Immediately after the expected unsupported-scope rejection settles, the complete physical snapshot must equal that baseline, including the writer token. This catches persisted identity/domain rows or metadata changes that `isInitialized()` alone would not enumerate.

After the deliberate close/reopen, `withoutWriterFence()` excludes only the row whose table is `meta` and key is exactly `writer`. The [adapter](../../../../packages/kernel/src/storage/indexeddb.ts) explicitly replaces that operational token on open and excludes it from its logical snapshot. The normalizer preserves every other key, value and table, including encryption headers and authenticated inventories. It creates a new result without modifying the captured baseline. Excluding the whole metadata store would weaken the check; this implementation does not do so.

The scope error in [restoreBackup](../../../../packages/vault/src/vault.ts) precedes identity unlocking, record preflight, storage unlocking and the committing transaction. The test now observes the resulting stored state independently of that control-flow inference. Its raw positive control after the existing compatible retry requires populated records in the same destination. Together with rejection of accidental database creation, that makes an always-empty or wrong-database observation detectable.

## Preservation and limits

All **25 original `expect(` call sites** remain, along with their continued matchers, original mixed-backup fixture, compatible-receiver positive control, same-destination retry, complete record comparisons, principal/signature checks and encrypted reopen. The explicit **30,000 ms** case limit is unchanged. Existing earlier-fixture cleanup limitations outside the changed section remain; the new destination baseline capture is inside its closing `finally`.

The added oracle checks durable state visible after the settled rejection and after reopening. It does not prove that no transient write was attempted inside an ultimately aborted operation, nor does fake IndexedDB establish native power-loss, quota, multi-tab or device behavior. The additional reads also require their own execution evidence. The [parent qualification history](../20261120-recovery-consolidation/QUALIFICATION.md), including its focused pass and later full-run timeout, remains separate and must not be rewritten by this source review.

Findings: **0 blocking findings established** in this bounded test-only delta. Source-specific execution and hosted qualification remain the coordinator's separate responsibility.
