# Independent functional review — persisted restore-rejection proof

Date: 2026-11-20. Review scope: the test-only change from published PR #69 to the frozen follow-up source.

| Identity | Reviewed value |
|---|---|
| Frozen source | `53aa9fe93c8599c41c0b9b2df4f438b969f14ce9` |
| Frozen tree | `81a97a7be19975fe653bce41bda5d7e0991efcbb` |
| Parent PR #69 head | `6d4f6ea7ba9bcf886ae69edd0f167a621308d4b2` |
| Changed test blob | `ebc626830218ec8a05f2ed1669530be4134bb441` |

**Disposition: no blocking functional or test-oracle finding in this delta.** The new assertions directly observe persisted destination state at the rejected-restore boundary while retaining the valid-backup positive controls and compatible recovery. This is a static review; execution qualification belongs to the coordinator.

## New persistence assertions

The [integration test](../../../../tests/integration/production-future-codec-rejection.test.ts) still exports one real signed, encrypted backup containing a production archive record and a future record type. A compatible receiver restores that same backup and reopens it before the older registry attempts rejection. The negative input retains this positive control for validity.

| Observation point | Functional meaning |
|---|---|
| Fresh destination | Captures all object-store keys and opaque values; requires an empty records store. Missing records storage cannot satisfy `toEqual([])`. |
| Immediately after rejection | Requires equality with the complete baseline, including the writer row. Durable additions, removals or value changes would fail the comparison. |
| After close/reopen | Requires the same payload after excluding only `meta['writer']`. Headers, authenticated inventories and every other row remain observable. |
| After compatible retry | Requires populated records through the same observer and destination name, confirming that it sees installed data. |

The existing semantic assertions run after compatible retry and again after encrypted reopen. They compare complete stored records, revisions, timestamps, principal, signatures and coverage. The raw positive control establishes observer validity; it does not replace those stronger checks or pin an internal metadata-row count or ciphertext value.

## Observer validity and writer metadata

The observer's database prefix matches `openVault()` in [vault.ts](../../../../packages/vault/src/vault.ts). One `destinationName` variable is used for rejection, reopening, compatible retry, final reopening and all observations. The test uses a fresh `IDBFactory`; source and compatible-control databases have distinct names.

Direct `factory.open()` observes the existing destination without invoking the production connection-opening wrapper. An unexpected `upgradeneeded` event aborts the transaction, closes the opened handle and leads to rejection. A misspelled absent database therefore cannot silently become an empty successful observation. An always-empty observer would fail the post-retry positive control. An existing populated source/control database could not satisfy the initial empty-record assertion.

All store names come from the opened database. Keys and values are queued in one read-only transaction, paired in their returned order and checked for equal lengths. The helper awaits both reads and transaction completion. Request failure, transaction error or abort rejects, and the connection closes in `finally`. The observer calls no mutating storage or vault operation.

The normalization follows [indexeddb.ts](../../../../packages/kernel/src/storage/indexeddb.ts): `openIndexedDbConnection()` claims a new random writer token on each open, and the logical snapshot loader excludes exactly that operational row. `withoutWriterFence()` filters only key `writer` in store `meta` and constructs a new result. It neither mutates the baseline nor hides the whole metadata store. The immediate post-rejection comparison uses no normalization, so an unexpected writer change during the attempt remains visible.

## Preservation and qualification limits

The exact commit comparison changes only the integration test. An independent normalized-line multiset comparison found **25 original lines containing `expect(`, all preserved**, plus four new expectation starts. The earlier “26 expectation-bearing lines” description is ambiguous because a literal `expect` search also includes its import. Manual inspection confirms the rejection matcher and all multiline assertion behavior remain. The case limit is still **30,000 ms**. Runtime, schema, format, dependency, workflow and configuration files are unchanged.

The new comparison observes settled persisted state in fake IndexedDB. It does not establish native crash, power-loss, quota or multi-tab behavior, or absence of transient uncommitted work. The existing restore code rejects unsupported manifest scope before storage unlocking and its committing transaction; the added oracle checks that outcome directly. Earlier fixture-cleanup limitations outside the changed section remain unchanged.

The [parent qualification record](../20261120-recovery-consolidation/QUALIFICATION.md) retains its focused pass and full-run outcomes: 832 passed, three failed and four pending entries. The future-codec case's earlier focused pass and later timeout remain separate observations. This follow-up adds reads within the same limit; its own execution record must remain distinct from that history and cannot resolve the earlier timing cause by itself. This review supplies no hosted qualification.

This lane ran no compiler, application test, browser or remote action. Runtime/test working-tree content matched the frozen source during inspection. Only this review document was written.
