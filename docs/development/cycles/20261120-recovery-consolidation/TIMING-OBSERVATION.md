# Mutiny timing observation — source relationship and evidence limits

Date: 2026-11-20. Analysis lane: source inspection and review of existing result files only.

**Observed outcome:** the existing withdrawal-budget acceptance case exceeded its unchanged 60,000 ms case timeout twice on the frozen consolidation candidate. Shard 1 failed, and a single isolated selection of the same case also failed. The cause remains unresolved. This observation does not convert either run to a pass, establish an environmental cause, or identify a production regression.

**Source relationship:** the test, Mutiny logic, and the relevant domain/verification implementations are unchanged from qualified main. The normal fixture does not create blob-holder rows or invoke attachment coverage. The new tenant index therefore has no reference rows to maintain or traverse in this case. Some new generic adapter construction and branch overhead remains reachable, so the analysis cannot claim that none of the changed code executes or that its timing effect is exactly zero.

## Exact source

| Item | Identity |
|---|---|
| Candidate in both receipts | `d55bb48117c0f9e4579b01fd6c12030585601d68` |
| Candidate tree in both receipts | `7c2a8e3c341498f54e57489a31b2711c9034d3e5` |
| Qualified-main comparison | `449a619f1ae7b66cb42d9cab43dd5493bfe42c2e` |
| Test file | `tests/integration/mutiny-persistence.test.ts` |
| Test-file blob at both main and candidate | `6d1ac8b5851bc0884bd2cdf8f0e88e3a6ea288c7` |
| Case | `independent durable signed Mutiny verification keeps a withdrawal slot when repeated signed evidence exhausts the ordinary budget` |
| Case location and timeout | Test declaration at line 361; explicit `60000` timeout at line 399 |

This lane did not rerun main or the candidate. Main's qualification is the coordinator's separate baseline evidence, not a contemporaneous performance control produced by this analysis.

## Recorded execution evidence

Paths below are relative to `/workspace/scratch/e0ea2385d962/classrup-validation/`.

| Observation | Shard 1/8 | Single isolated case selection |
|---|---|---|
| Receipt | `g12-final-round1/domain-1-receipt.json` | `g12-isolated-budget/withdrawal-budget-receipt.json` |
| Vitest result | `g12-final-round1/domain-1.json` | `g12-isolated-budget/withdrawal-budget.json` |
| Plain log | `g12-final-round1/domain-1.log` | `g12-isolated-budget/withdrawal-budget.log` |
| Started, UTC | `2026-11-20T16:06:47.113265+00:00` | `2026-11-20T16:11:30.131501+00:00` |
| Command duration | 135.975 seconds | 63.812 seconds |
| Test outcomes | 61 passed, 1 failed; 62 total | 0 passed, 1 failed, 15 skipped; 16 collected |
| This case's reported duration | 60,219.712124 ms | 60,390.295496 ms |
| Failure | `Error: Test timed out in 60000ms.` | `Error: Test timed out in 60000ms.` |
| Process exit code | 1 | 1 |
| Outer runner timeout | 900 seconds | 180 seconds |
| Outer runner `timed_out` | `false` | `false` |

In shard 1, the failing file itself contains 15 passing cases and this one failed case. The JSON aggregate's two failed suite entries do not mean that two test cases failed. The isolated run's 15 skipped cases are the unselected cases in that file, not additional outcomes for the selected case. Both result stacks point to the existing test declaration at `mutiny-persistence.test.ts:361:3` rather than to a domain assertion mismatch or a measured operation inside the test.

Both receipts record `--pool=forks`, `--maxWorkers=1`, `--fileParallelism=false`, JSON reporting, and these environment values:

| Setting | Recorded value |
|---|---|
| `GOMAXPROCS` | `1` |
| `GOMEMLIMIT` | `384MiB` |
| `NODE_OPTIONS` | `--max-old-space-size=1024` |

The first command selected `--shard=1/8`. The second selected `tests/integration/mutiny-persistence.test.ts` and the exact case name with `-t`. Source, worker/pool settings, environment values, and the effective case limit match. Test selection, output path, and the outer watchdog differ; neither outer watchdog fired. The complete command arrays remain in the receipts and were not executed again by this lane.

The plain logs contain the report-written notices. The corresponding `summary.json` files retain the same source identities and command outcomes. These records provide durations and configuration, but no per-operation timestamps, CPU utilization, CPU-throttling, GC, memory-pressure, or profiling evidence.

## Source comparison with main

Git object comparisons establish that the following relevant sources are unchanged between main and the candidate:

- The complete `mutiny-persistence.test.ts` file, including its setup, workload, assertions, and 60,000 ms case limit.
- `packages/mutiny`, `packages/bazaar`, `packages/discovery`, `packages/notify`, `packages/identity`, and `packages/federation`.
- The command bus, repository implementation, storage serialization/lifetime wrapper, scoped transaction views, retention sweep, and IndexedDB adapter.
- `vitest.config.ts`, `package.json`, `pnpm-lock.yaml`, and `tsconfig.json`.

For additional content identity, both main and candidate have Mutiny tree `6676fb6f20ba350ab02990c0d94cdc320c56976d`, Bazaar tree `e20f5cace68e55e2a35a3a947288ecc873a54899`, Discovery tree `27070a41bc591d6da216e97182963d5901d7c50c`, identity tree `0d538273759f40df07cb5579fea934a969f1418f`, and federation tree `76a42b4446afdf9888ff41fa8c06c37c65433927`.

This is source equivalence, not evidence that two executions received identical runtime resources or must finish in identical elapsed time. The candidate still differs in the shared memory driver and transaction port, so an unchanged test file alone cannot establish causal independence from the consolidation.

## Normal fixture path and the new tenant index

The fixture creates real Ed25519 identities and opens ordinary fake-IndexedDB storage with `openIndexedDbStorage()` (`mutiny-persistence.test.ts:23–31,46–57`). It registers the existing Bazaar, Discovery, and Mutiny command definitions, dispatches commands through the kernel bus, and uses the generic record repository (`:58–115`). The case uses the same setup and existing reservation/coordination workflow (`:134–148,361–399`). It does not use `openVault()`, encrypted-storage unlocking, or the new `UnlockedVault.attachmentCoverage()` method.

`openIndexedDbStorage()` constructs a memory-backed working set from its snapshot and persists changes through the IndexedDB connection (`packages/kernel/src/storage/indexeddb.ts:188–203`). Thus the candidate's changed memory-driver module is on the fixture's path.

However, the state in this fixture is record and operational-table state, not blob-holder state:

- The Mutiny repositories define only schemas and ordinary indexes; neither declares a `blobs` accessor (`packages/mutiny/src/trade_proposals/repository.ts:25–27`). A source search found no blob API usage or repository blob declarations in the relevant Bazaar, Discovery, Mutiny, and notification packages or this test file.
- The generic repository synchronizer returns immediately when `def.blobs` is absent (`packages/kernel/src/storage/repo.ts:153–164`). Its calls from record put/remove therefore do not attach or detach blob holders for these repositories.
- The open-time retention sweep addresses dead letters, outbox, and idempotency rows, with no blob-holder operation (`packages/kernel/src/storage/maintenance.ts:31–39`).
- Fresh fixture databases start without blob-holder rows. Its ordinary writes and reopening do not introduce such rows. There is no normal source path here to `referenceCoverage()`, the tenant-set lookup, the holder loop, or an index-membership insertion/removal.

The new index remains empty in the source-described scenario. This rules out attributing the observed timeout to a growing tenant reference set or a coverage traversal performed by this case. It does not establish that the elapsed time is unaffected by every consolidation change.

Specifically, these changed operations remain reachable even without blob-holder data:

1. Each new memory state allocates the additional empty map (`memory-driver.ts:53–57`).
2. Ordinary writes and replacement/removal of previous rows evaluate the added `table === 'blob_refs'` branches before skipping their bodies (`memory-driver.ts:63–78,96–104`).
3. Each transaction constructs the new driver/public method alongside existing stores. The unchanged lifetime binder enumerates the added method and creates its wrappers even when callers never invoke it (`memory-driver.ts:301–317`; `tx.ts:518–521,550–561`; `storage.ts:45–66`).

No measurement in the supplied evidence quantifies the effect of these changes. Their limited source scope is relevant to attribution, but does not prove a zero-cost result.

## Existing work and limits of attribution

The unchanged normal ingestion path verifies incoming signed evidence, reconstructs saved coordination, checks feasibility and local reservations, writes the new record, and emits durable events (`packages/mutiny/src/trade_proposals/repository.ts:103–153`). Reconstruction verifies saved evidence and replays its transitions (`:42–79`). The fixture's feasibility callback also reads and validates the existing signed graph (`mutiny-persistence.test.ts:63–72`). The acceptance case repeats that already-established workflow before testing the reserved withdrawal behavior and reopening.

These are identifiable pre-existing work in the case, not measured explanations for the timeout. This analysis does not identify which operation was active when the case timer fired, how far the case progressed, whether a domain assertion would eventually pass, or which part dominated elapsed time. No profiling, benchmark, reproduction, instrumentation, implementation change, timeout change, or workload adjustment was performed or proposed.

The two failures establish that the candidate did not satisfy this existing case's time limit in either recorded selection. They do not by themselves establish CPU throttling, memory contention, scheduler delay, a crypto implementation slowdown, a product correctness defect, or a causal performance regression from the tenant-index change. An environmental explanation is unproven. Dismissing the result as harmless or calling the complete suite green would exceed the evidence.

## Qualification disposition

Preserve both failures and their original source/command/result files. The coordinator will retain the remaining seven shard outcomes separately; their completion cannot erase the failing shard or substitute a complete passing result for this observation. This lane adds no retry and changes no cap, case timeout, or test expectation.

Actual hosted Alpha and CLI qualification must be obtained for the consolidation candidate's published head, with exact source correspondence recorded. Prior main qualification, unrelated branch results, static review approval, and other passing focused cases do not qualify this failed local case. This document claims no hosted outcome and authorizes no merge or release by inference.

The 51 historical findings remain OPEN. The earlier static code-review disposition remains limited to source findings; the two timed-out executions are an additional unresolved qualification observation, not a contradiction that can be resolved by relabeling either kind of evidence.

## Appendix — completed shard inventory and later bounded observations

This appendix adds evidence available after the preceding observation. It preserves the earlier text, both Mutiny failures, the original recount, and each execution's separate outcome. All source comparisons and receipts discussed here still identify commit `d55bb48117c0f9e4579b01fd6c12030585601d68`, tree `7c2a8e3c341498f54e57489a31b2711c9034d3e5`.

### Eight-shard assertion inventory

The aggregate consists only of `g12-final-round1/domain-1.json` and `g12-remaining-round1/domain-2.json` through `domain-8.json`. The focused and isolated executions are not added to this aggregate. The expected inventory is `g12-final-round1/expected-domain-files.json`.

| Item | Recorded and independently recounted result |
|---|---:|
| Expected files | 95 |
| Reported file occurrences | 95 |
| Distinct reported files | 95 |
| Missing / unexpected files | 0 / 0 |
| Duplicate files | 0 |
| Assertion records | 839 |
| Passed | 832 |
| Failed | 3 |
| Pending | 4 |
| Repeated `(file, fullName)` keys | 1 |

All expected files are represented. This is complete file-inventory coverage, not completion or success of every assertion. Shards 1, 7, and 8 have process exit 1; shards 2–6 have exit 0. All eight receipts record `timed_out: false` for their 900-second outer watchdogs. Those receipt values do not override individual case timeouts or pending assertions.

The original `g12-remaining-round1/domain-recount.json` remains preserved, including `duplicate_cases: 1`. Its SHA-256 at this inspection is `52641c1c0ff5811df74dbe1c2eddf750b9ec213042630f412ca0b595eaa21e49`. A subsequent verified recount is separate evidence; the explanation below does not require subtracting a case or rewriting this original JSON.

### Exact failed and pending vault cases

The additional timeout in `g12-remaining-round1/domain-7.json` is the **second** declaration in `packages/vault/src/vault.test.ts`: `vault composition survives IndexedDB close/reopen, gates locked storage, and atomically restores signed encrypted records` (declaration line 27, explicit 30,000 ms timeout line 51). Its reported duration is `30027.558987000004` ms, and its failure is `Error: Test timed out in 30000ms.` The first backoff case at line 12 passed in that same shard, taking `8717.735411` ms.

The remaining four declarations are reported as pending, with `duration: null` and no failure message:

| Frozen-source declaration | Pending case under `vault composition` |
|---|---|
| Line 52 | restores older backups after registering additional codecs but rejects unsupported types |
| Line 67 | rejects corrupt restores before creating an identity and rolls back a lock during an awaited write |
| Line 88 | rejects noncanonical record keys during backup restore without initializing the destination |
| Line 101 | rechecks canonical keys after restore normalization before any records commit |

These are ordinary `it(...)` declarations, not intentionally skipped source cases. The records do not establish how much of each pending case ran. `domain-7.log` explicitly warns that some tests were still running when the JSON report was generated. Its following suggestion of a possible internal Vitest bug is generic reporter text, not a demonstrated diagnosis.

There is also a concrete counter inconsistency: `domain-7.json` has top-level `numPendingTests: 1`, while its assertion entries contain **four** pending cases. The assertion-level count is **139 = 134 passed + 1 failed + 4 pending**. The preserved aggregate correctly counts the assertion records. No pending record is relabeled as a pass or a timeout merely to reconcile the top-level counter.

Shard 7's receipt records start `2026-11-20T16:19:12.774710+00:00`, command duration 159.333 seconds, exit 1, and no outer watchdog timeout. Its pool/worker settings and recorded environment values match those documented above. The warning, pending records, and inconsistent summary counter make this execution incomplete evidence for the four pending cases.

### Separate isolated vault-file result

The coordinator subsequently executed one isolated selection of the complete `packages/vault/src/vault.test.ts` file. The independent evidence is `g12-isolated-vault/vault-composition-receipt.json`, `vault-composition.json`, and `vault-composition.log`.

The receipt records start `2026-11-20T16:26:00.731591+00:00`, duration **26.120 seconds**, exit **0**, and `timed_out: false`. Source/tree, fork pool, single worker, disabled file parallelism, and the recorded environment settings match the earlier candidate runs. The source case limits are unchanged.

This result contains **six passed, zero failed, zero pending** cases. The earlier timed-out close/reopen/restore case passed in **8,161.313711 ms**. The first backoff case, which had already passed in shard 7, passed here in **2,626.896356 ms**. All four cases that were pending in shard 7 have passing terminal results in this separate execution.

The isolated result establishes that this candidate's six vault cases completed successfully in that execution under their unchanged limits. It does not replace shard 7, repair its report, or prove why the earlier case timed out. The eight-shard aggregate remains **832 passed / 3 failed / 4 pending**.

### Future-codec focused pass and shard-8 timeout

The third failed aggregate case is `production backup compatibility with unknown future record types rejects a valid mixed future/current v1 backup without installing its supported records`, declared at `tests/integration/production-future-codec-rejection.test.ts:24`, with the explicit 30,000 ms timeout at line 173.

| Separate execution | Result for this case | Context |
|---|---|---|
| `g12-final-round1/focused-recovery.json` | Passed in `15608.777643000001` ms | Four selected recovery files; 20 passed, zero failed/pending; receipt exit 0, total command 51.084 seconds |
| `g12-remaining-round1/domain-8.json` | Timed out in `30014.938187` ms | Shard 8/8; 136 passed, one failed; receipt exit 1, total command 71.664 seconds |

The focused receipt started at `2026-11-20T16:05:49.458280+00:00`; the shard-8 receipt started at `2026-11-20T16:21:52.393644+00:00`. Both identify the same frozen source/tree, worker settings, environment values, and unchanged case timeout. Their test selections and timing contexts differ. Neither outer watchdog fired. The shard failure is a case timeout, not a recorded domain assertion mismatch.

The complete future-codec test is new relative to main. Relative to PR #64 head `f598dc52937449764703b5048ba71a77239c9ded`, this consolidation retains the original assertions and adds complete saved-record capture plus a compatible retry into the previously rejected destination, another encrypted reopen, and repeated record/signature/coverage assertions (`:133–171`). The 30,000 ms case limit is the same as at that PR head.

That strengthening adds real work inside a fixed acceptance budget and is a concrete source consideration for qualification. The supplied reports do not locate the timeout in the added portion or measure its cost; the earlier focused pass also remains valid for its own execution. Neither observation proves a test-workload cause, an environmental cause, or a production defect. No removal of assertions, limit increase, or further diagnostic retry is proposed here.

### Relationship of the additional cases to production changes

The complete `packages/vault/src/vault.test.ts` file is byte-identical to main, blob `b7c50c71506a25a08f4b001107154a681d53b52c`. The encrypted-storage implementation, session policy, identity implementation, and production backup codecs are unchanged. The production vault delta remains the added count-only attachment API; existing create, unlock, lock, export, and restore implementations are not edited by this candidate.

Both the close/reopen/restore fixture and the future-codec fixture use real vault encryption and record operations. Neither creates blob-holder rows or calls `attachmentCoverage()`/`referenceCoverage()`. They therefore do not exercise index growth or the new holder traversal. They do construct memory working sets, transaction method tables, and unlocked-session objects containing the new API. The shared allocation/branch/lifetime-wrapper observations above still apply, with an additional unused method created on each unlocked session.

No new blocking production-source defect was established by this follow-up. The extended future-codec scenario, the reporter's incomplete pending results, and the title collision below are concrete evidence/acceptance concerns. None identifies the cause of a measured timeout.

### Why `duplicate_cases: 1` is a title-key collision

The repeated key is confined to one result for `packages/platform/src/configuration/feature/feature.test.ts` in `g12-remaining-round1/domain-8.json`:

`registry queries through the kernel authorization and read boundaries rejects malformed query input for platform.feature.list_features`

That file has two **passed** assertion entries with this name, at zero-based assertion indexes **33 and 34**. Their recorded durations are `2.8117879999999786` ms and `0.4369209999999839` ms. They correspond to two distinct rows of the same parameterized declaration:

- Frozen line 290 supplies `platform.feature.list_features` with `{ featureId: '../secret' }`.
- Frozen line 291 supplies `platform.feature.list_features` with `{ includeFuture: 'true' }`.
- The `it.each` begins at line 289. Its title at line 295 is `rejects malformed query input for %s`, which interpolates only the shared query name, so it gives the two different inputs the same display title. Lines 296–300 apply the validation assertions separately to each row.

The file is unchanged from main, blob `035df8ba5b4f616b71b12007fb7b59d21bb17fd8`. There is one reported occurrence of the file and no duplicate file execution in the eight reports. The two assertion records are supported by two distinct source data rows. This is an ambiguity in the `(file, fullName)` counting key, not evidence that one declaration was accidentally executed twice. **Retain both assertions and all 839 aggregate records.** The original duplicate flag remains part of the preserved evidence, with this explanation alongside it.

### Updated qualification boundary

The recorded full-run outcome remains failed and partially unresolved at the assertion level. The later isolated vault success and earlier focused recovery success belong to their own selections and cannot be combined into a replacement all-passing full-run result. No further diagnostic retries are planned by the coordinator; this lane executed none and only appended this analysis.

Actual candidate-specific hosted Alpha and CLI qualification is still required. This appendix records no hosted outcome and makes no causal attribution to the environment, runner, cryptography, workload, or production delta. The source freeze, existing case limits, original reports, and all 51 open historical findings remain intact.
