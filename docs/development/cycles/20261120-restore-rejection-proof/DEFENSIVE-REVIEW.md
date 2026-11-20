# Independent defensive source review — rejected restore persistence

Date: 2026-11-20. Scope: the ordinary compatibility acceptance extension.

**Disposition: no blocking defensive source finding was identified in this test-only delta.** The observations check persisted state without changing production admission, storage authority, encryption or recovery behavior. This source review supplies no passing execution result.

## Exact review boundary

| Identity | Reviewed value |
|---|---|
| Frozen source | `53aa9fe93c8599c41c0b9b2df4f438b969f14ce9` |
| Frozen complete tree | `81a97a7be19975fe653bce41bda5d7e0991efcbb` |
| Published PR #69 baseline | `6d4f6ea7ba9bcf886ae69edd0f167a621308d4b2` |
| Changed test blob | `ebc626830218ec8a05f2ed1669530be4134bb441` |

The complete committed difference contains only [production-future-codec-rejection.test.ts](../../../../tests/integration/production-future-codec-rejection.test.ts). Review used frozen Git objects and the unchanged [IndexedDB adapter](../../../../packages/kernel/src/storage/indexeddb.ts), [vault restore implementation](../../../../packages/vault/src/vault.ts), and [encrypted storage implementation](../../../../packages/vault/src/encrypted-storage.ts). The working difference outside documentation was empty when checked.

No application test, compiler, browser, vulnerability reproduction or new attack input was executed or created by this lane. Only this report was written; no commit or remote action was performed.

## Observer authority and completeness

The helper opens the already-created fixture database directly through its supplied fake IndexedDB factory. Its prefix matches the production vault composition. It does not invoke the higher-level connection opener, whose normal behavior claims a new writer token. The observer therefore does not supersede the destination's writer merely to inspect it.

An unexpected creation or upgrade aborts the opening transaction and closes that connection; the error path identifies the missing expected database. A misspelled name cannot silently supply an empty comparison database. The subsequent empty-record assertion also requires the records store to be present.

For an existing database, the helper enumerates all object stores and reads each store's keys and opaque values within one read-only transaction. It waits for requests and transaction completion, rejects unequal key/value lengths, propagates request or transaction failures, and closes the observer in a finally block. It performs no writes, decrypts no rows and invokes no production admission bypass. These helpers remain local to the integration test; no production API, telemetry or export path exposes the collected data.

## Writer-fence exception and rejection ordering

The immediate post-rejection comparison retains **every** captured key and value, including the writer token. It occurs before the intentional close/reopen boundary. Unexpected committed domain or identity rows, changed metadata, or changed writer state would differ from the baseline.

The reopened comparison removes only the entry whose store is exactly `meta` and whose key is exactly `writer`. This matches the adapter's documented open-time writer claim and its existing exclusion of that operational row from logical snapshots. The function constructs a new result without modifying the original baseline. It does not omit the metadata store, encryption header, authenticated inventory, another store's similarly named key, or an unknown object store.

The encrypted storage implementation uses separate header and inventory metadata; both remain visible to the comparisons. The test does not pin random tokens, ciphertext, nonces, or internal metadata row counts.

The valid backup and older receiver registry remain the original compatibility fixture. The unchanged restore implementation rejects unsupported manifest scope before identity unlocking, record preflight, storage unlocking and the committing transaction. The new checks observe the settled persisted result rather than substituting a mocked return value or asserting internal call order.

## Compatible recovery and unchanged controls

The same rejected destination is subsequently restored using the compatible registry and the same encrypted backup. The physical positive control requires populated records after that retry; an observer that always returned empty records would fail it. Existing complete-record, revision/timestamp, principal, deterministic-signature and coverage comparisons remain, including the final encrypted reopen.

All prior expectation calls and the rejection matcher are retained. The explicit **30,000 ms** case limit is unchanged. The sole source change is this test: runtime code, schemas, manifest bytes and meaning, signing and encryption policy, dependency versions, product caps, workflow selection and production exposure are unchanged.

## Qualification limits

This checks one settled ordinary rejection and compatible recovery using fake IndexedDB. It does not establish absence of transient in-process writes, native crash durability, quota handling, device interruption or concurrent browser behavior. The writer-token exception deliberately makes no assertion about token equality across a legitimate reopen.

The added reads require their own executed qualification. The [parent qualification record](../20261120-recovery-consolidation/QUALIFICATION.md) retains the earlier source's mixed focused/full/isolated outcomes. This review does not relabel those failures or incomplete entries, or provide their cause.

The unchanged [historical findings tracker](../../../../planning/SECURITY_FINDINGS_TRACKER.md) still contains **51 OPEN rows**. This review closes none of them and supplies no release or merge qualification. Actual current-source test and hosted outcomes remain the coordinator's separate gate.
