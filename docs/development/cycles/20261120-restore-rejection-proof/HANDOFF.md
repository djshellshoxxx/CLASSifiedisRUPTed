# Persisted restore-rejection proof — handoff

Date: 2026-11-20. Repository: `djshellshoxxx/CLASSifiedisRUPTed`.
Branch: `codex/classrup-restore-rejection-proof-20261120`.

## Current outcome

This test-only follow-up adds direct persisted-state observations to the existing future-codec rejection scenario. The strengthened case passed at its unchanged 30-second limit. Full TypeScript, specification, dependency and strict-registry checks passed, followed by **27 tooling tests**, **46 CLI tests**, non-interactive setup and the production build.

The change retains [PR #69](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/69) as its source parent. It is prepared as a separate follow-up targeting main, so its hosted checks can qualify the complete proposed tree while PR #69's published branch remains stable. A new publication head and PR number have not been assigned in this snapshot. The coordinator owns those identities and current-head hosted qualification; the local targeted pass does not qualify a complete domain suite or native browser.

## Exact source

| Identity | Value |
|---|---|
| Reviewed and executed source | `53aa9fe93c8599c41c0b9b2df4f438b969f14ce9` |
| Executed complete tree | `81a97a7be19975fe653bce41bda5d7e0991efcbb` |
| Parent PR #69 head | `6d4f6ea7ba9bcf886ae69edd0f167a621308d4b2` |
| Parent complete tree | `ccd65c24112ae97c8ee7bf28a4bc5c9e560ede35` |
| Follow-up test blob | `ebc626830218ec8a05f2ed1669530be4134bb441` |

The [source receipt](evidence/g16-source.json) binds the change to these identities. Before documentation, the only changed path is [production-future-codec-rejection.test.ts](../../../../tests/integration/production-future-codec-rejection.test.ts). Runtime, dependencies, workflows, schemas, encryption and backup formats are unchanged. Publication must retain the parent history and verify that subsequent documentation has not altered the tested code.

## What the acceptance now proves

The original fixture creates one valid signed, encrypted backup containing a production archive record and a future type. A compatible receiver restores and reopens that same backup before the older production registry rejects it. Previously, the negative phase checked an uninitialized identity and later successful compatible reuse; it did not directly enumerate persisted rows between rejection and retry.

The new observer opens the existing destination database directly through the supplied fake IndexedDB factory. It rejects unexpected creation or upgrade, reads every discovered store's keys and opaque values in one read-only transaction, awaits completion and closes its connection in `finally`. It avoids the higher-level connection opener, which would itself claim a writer token. The database prefix and shared destination name match the normal vault composition.

| Point in the scenario | Added observation |
|---|---|
| Before rejected restore | Capture the complete stored state and require an empty records store. |
| Immediately after rejection | Require exact equality with the baseline, including the writer row. |
| After close/reopen | Compare the same stored payload while excluding only `meta['writer']`. |
| After compatible retry | Require populated physical records through the same observer. |

The writer exception follows the adapter's normal open-time behavior: reopening replaces that operational token. No other metadata is excluded. Encryption headers, inventories, domain rows, unknown stores and their keys remain observable. The immediate comparison applies no exception. The positive observation prevents an always-empty reader from satisfying the negative checks.

All **25 original `expect(` starts remain**, with four added starts for **29 total**; these are assertion-call sites, not additional test cases. The same backup, destination, positive controls and compatible retry remain, as do complete-record comparisons, revision/timestamp preservation, principal and signature checks, and final encrypted reopen. No ciphertext value or internal metadata-row count is pinned. This is a fake-IndexedDB post-failure persistence check, not native power-loss, quota or multi-tab evidence.

## Executed local qualification

Every check below is attached to source `53aa9fe9` and its complete tree in the [execution summary](evidence/g16-final/summary.json). The targeted report contains **one passing case in one file**, with no failed or pending entry. Its case duration is **13,258.777438 ms**; the full command took **14.547 seconds**.

| Check | Outcome | Command duration | Receipt or report |
|---|---|---:|---|
| Strengthened future-codec case | 1 passed, exit 0 | 14.547 s | [Receipt](evidence/g16-final/future-codec-receipt.json), [report](evidence/g16-final/future-codec.json.gz) |
| Full TypeScript | Pass, exit 0 | 15.258 s | [Receipt](evidence/g16-final/typecheck-receipt.json) |
| Specification check | Pass, exit 0 | 1.615 s | [Receipt](evidence/g16-final/spec-receipt.json) |
| Dependency boundaries | Pass, exit 0 | 0.167 s | [Receipt](evidence/g16-final/deps-receipt.json) |
| Strict registry check | Pass, exit 0 | 1.032 s | [Receipt](evidence/g16-final/registry-receipt.json) |
| Tooling | 27 passed, exit 0 | 4.964 s | [Receipt](evidence/g16-final/tooling-receipt.json), [log](evidence/g16-final/tooling.log.gz) |
| CLI | 46 passed, exit 0 | 25.585 s | [Receipt](evidence/g16-final/cli-receipt.json), [log](evidence/g16-final/cli.log.gz) |
| Non-interactive setup | Pass, exit 0 | 0.115 s | [Receipt](evidence/g16-final/setup-receipt.json) |
| Production build | Pass, exit 0 | 0.468 s | [Receipt](evidence/g16-final/build-receipt.json) |

Tooling and CLI each report zero failed, cancelled, skipped and todo cases. No command reached its outer 900-second watchdog. The existing case limit remains 30,000 ms. No complete domain-suite execution, native browser run or device acceptance is claimed for this follow-up.

The [toolchain record](evidence/g16-toolchain.json) identifies Node v24.22.3, pnpm 10.28.0, TypeScript 7.0.2 and Vitest 5.1.0. The targeted Vitest command uses one fork worker with serial file execution. Check receipts record `GOMAXPROCS=1`, `GOMEMLIMIT=384MiB` and `NODE_OPTIONS=--max-old-space-size=1024`, matching the parent settings. These are recorded settings, not a causal explanation for any earlier timeout. The [offline frozen-lockfile install](evidence/g16-setup/install-receipt.json) passed in 7.348 seconds. The lockfile remains SHA-256 `d72caa3b730141025fcbb083eedea8d5c1bf6774c5f2b7ed3e8e145f10308773`.

## Archive and independent reviews

The [archive receipt](evidence/archive-receipt.json) indexes **28 members**, representing **142,855 original bytes** in **137,463 stored bytes**. Its SHA-256 is `66497eaf72bc290cd0e2882045e8cab6e7f9c0d1b48a6937873cda571e27c631`. Logs and the full Vitest report are stored losslessly with gzip; receipts, source/toolchain observations, parent evidence and harness sources retain their original bytes. Each member has original/stored sizes and digests.

Fresh [code](CODE-REVIEW.md), [functional](FUNCTIONAL-REVIEW.md) and [defensive](DEFENSIVE-REVIEW.md) reviews found no blocking finding in their declared test-only scope. Their source conclusions remain separate from executed outcomes. The [runner](evidence/run_g16.py) and [archiver](evidence/archive_g16.py) preserve validation provenance.

## Parent results and source preservation

The [parent qualification](../20261120-recovery-consolidation/QUALIFICATION.md) remains unchanged: its full run collected **839 assertions across 95 files: 832 passed, three failed and four pending**. The failures were the existing Mutiny budget case, existing vault composition case and the earlier version of this future-codec case, each at its retained limit. The parent's focused selection passed 20 cases; its isolated Mutiny selection failed with 15 intentionally filtered cases, while its isolated vault file passed six cases. These overlapping selections remain distinct. The new targeted pass neither rewrites those results nor establishes their timing cause.

The saved [hosted observation](evidence/g16-parent-hosted-observation.json), at **2026-11-20 16:56:53 UTC**, records PR #69 as open and draft at `6d4f6ea7`. Its [Alpha run 44775792417](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44775792417) and [CLI run 44775792011](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44775792011) were queued, with no conclusion. Main was `449a619f1ae7b66cb42d9cab43dd5493bfe42c2e`. Those are dated observations, not a new pass or a promise of unchanged remote state.

The [post-publication preservation receipt](evidence/publication-g12-post-preservation.json), observed at 16:42:49 UTC, verifies PR #69's complete tree, ordered parents and preserved histories. It recorded **75 branches**, all prior **74 refs unchanged**, and all **57 original non-main refs unchanged**. This count precedes publication of this follow-up; refresh it when publishing.

## Continuation and remaining scope

Publish the separate follow-up with PR #69's head retained as its parent and main as its PR target. Record the actual new head, tree and PR number, and verify the complete remote tree against the reviewed local content. Keep the parent source stable and preserve all prior branches and evidence.

Then inspect the actual current-head Alpha and CLI runs, including their checkout or synthetic-merge identity and executed outcomes. Required hosted qualification must cover the complete proposed tree. Record any eventual main merge and its separate main-push qualification; local publication is not merge completion.

All **51 historical findings remain OPEN**. This change implements no owning media domain, attachment admission or portable attachment format. The inherited count-only diagnostic still certifies neither holder authority nor v1 attachment inclusion. No release, deployment, branch deletion, force push, paid job or automation change is part of this follow-up.
