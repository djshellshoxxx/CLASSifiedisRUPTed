# Final independent evidence and archive review

Date: 2026-11-20. Lane: independent evidence verification.

**Disposition: the archived evidence is internally consistent and reproduces the saved originals. The candidate does not yet have complete passing qualification.** The local full-domain run retains three failed and four pending assertion entries. Earlier-main success, focused passes and isolated passes do not replace them. Required hosted qualification for the published consolidation remains a separate gate.

## Scope and source binding

This review reads existing evidence; it does not execute application tests, rerun acceptance, launch a browser, obtain a new hosted job, or change runtime code, test assertions, test limits or configuration. The only file written by this lane is this report. No remote mutation was performed.

| Identity | Reviewed value |
|---|---|
| Frozen runtime/test source | `d55bb48117c0f9e4579b01fd6c12030585601d68` |
| Frozen complete tree | `7c2a8e3c341498f54e57489a31b2711c9034d3e5` |
| Earlier main | `449a619f1ae7b66cb42d9cab43dd5493bfe42c2e` |
| Earlier main tree | `8fe1965ae60c385042f09c690eabe7d0828b36e8` |
| Initial combined execution source | `29daa061b4ad8b2899f6a8eaa910d12c80c93671` |
| Initial combined tree | `014ab768f786b9170ed4885cb849b85b46117bb1` |

At inspection, `HEAD` resolved to the frozen source and tree. The tracked difference outside `docs/` was empty, and no untracked non-documentation file was present. Evidence from the initial source remains labeled with that earlier identity. The installation receipt records its commit, while the other 22 command receipts record both their commit and tree. This is a review of those recorded executions, not an independent execution of the commands.

## Archive integrity

Every entry in [archive-receipt.json](evidence/archive-receipt.json) was checked against its original file in the coordinator's validation directory. For every member, this lane recomputed original and stored byte lengths, original and stored SHA-256 hashes, and the decoded content. Gzip members were decompressed and compared byte for byte. The actual evidence-file set, excluding the manifest itself, contains exactly the 81 listed members: no missing or unlisted member was found.

| Archive property | Independently verified result |
|---|---:|
| Listed and present members | 81 |
| Original bytes represented | 717,746 |
| Stored member bytes, excluding the manifest | 247,812 |
| Size, digest or decompression mismatches | 0 |
| Process receipts with matching saved log size and digest | 23 of 23 |

Manifest SHA-256: `c4cac50b15b294a3dbc386feac2bd08acf223c1a6756e0cff20d125c1a09d595`.

The archive includes passing, failed and incomplete observations, the offline-install failure observation, the successful installation receipt/log, toolchain metadata, saved remote observations and decoded CI logs, and the validation harness sources. The CI log files preserve the connector's decoded UTF-8 content; they are not represented as original HTTP response bytes.

The recorded lockfile SHA-256 matches the checked-in file: `d72caa3b730141025fcbb083eedea8d5c1bf6774c5f2b7ed3e8e145f10308773`. The installed TypeScript and Vitest package metadata read 7.0.2 and 5.1.0, and the repository pins `pnpm@10.28.0`, consistent with the saved toolchain record. The recorded Node version and execution settings remain attributed to that record and the process receipts.

## Independent assertion recount

The full-run recount was repeated directly from the eight archived Vitest reports. All 95 expected files occur once, with no missing, unexpected or duplicated file. There are **839 individual assertion entries: 832 passed, 3 failed and 4 pending**. This agrees with the separate [verified recount](evidence/g12-remaining-round1/domain-recount-verified.json). The [original recount](evidence/g12-remaining-round1/domain-recount.json) remains unchanged.

| Selection | Source | Verified outcome |
|---|---|---|
| Initial four-file integration selection | `29daa061b` | 7 passed, 3 failed; 10 assertions across 4 files |
| Final focused recovery/attachment selection | `d55bb481` | 20 passed; 4 files, no failed or pending entries |
| Complete eight-shard domain selection | `d55bb481` | 832 passed, 3 failed, 4 pending; 839 assertions across 95 files |
| Isolated withdrawal-budget selection | `d55bb481` | 1 failed; 15 other cases intentionally filtered/skipped by the selected title |
| Isolated complete vault file | `d55bb481` | 6 passed; no failed or pending entries |
| Tooling | `d55bb481` | 27 passed; no failed, cancelled, skipped or todo cases |
| CLI | `d55bb481` | 46 passed; no failed, cancelled, skipped or todo cases |
| Full TypeScript, spec, dependency and strict-registry checks | `d55bb481` | Each recorded command exited 0 |
| Non-interactive setup and production build | `d55bb481` | Each recorded command exited 0 |

These selections overlap. No combined total is formed by adding focused, full, isolated, historical-source or hosted results.

The initial three failures are the memory, fake-IndexedDB and SQLite variants of the old final-holder survival assertion. They remain failures in the initial-source archive. The full final-source failures are the withdrawal-budget case at its retained 60-second limit, the existing vault composition case at its retained 30-second limit, and the strengthened future-codec case at its retained 30-second limit. Their process-level outer watchdogs did not fire. The isolated withdrawal-budget selection also failed its original case limit. The complete isolated vault file subsequently passed in 26.120 seconds, and the future-codec case had passed its earlier focused selection in about 15.609 seconds. Those separate outcomes do not convert the original full run to success or establish a cause for its timeouts.

### Reporting discrepancies retained

Shard 7 contains 134 passed, one failed and **four pending** assertion entries. Its top-level `numPendingTests` says one. The [archived log](evidence/g12-remaining-round1/domain-7.log.gz) warns that tests were still running when JSON reporting occurred. The four individual pending entries have no duration or failure message; they are unresolved execution entries, not intentional exclusions or passes. The runner's suggestion of an internal bug is preserved as its diagnostic, not adopted as an independently established cause.

The original recount's `duplicate_cases: 1` uses `(file, fullName)` as an identity key. The two colliding entries are distinct parameterized inputs in `packages/platform/src/configuration/feature/feature.test.ts`: the rows at lines 290–291 share the query name interpolated by the title at line 295. Both passed. The source file is byte-identical to earlier main, blob `035df8ba5b4f616b71b12007fb7b59d21bb17fd8`. Keeping both entries is correct; dropping one would undercount the actual assertions. There is no duplicated file execution in the eight reports.

## Harness interruptions and incomplete extra run

The [runner observations](evidence/g12-runner-observations.json) and archived harness sources preserve two separate orchestration events:

1. `finish_g12.py` produced all remaining domain reports and the original recount, then stopped because its title-uniqueness assertion failed. Its tooling/CLI/setup/build loop had not started. The known title collision explains that bookkeeping failure without changing any test result.
2. `complete_g12.py` successfully completed the six-case isolated vault selection. Its next phase name, `final-other`, accidentally matched the original runner's `startswith('final')` dispatch. The extra TypeScript command completed, and an additional focused selection began. The coordinator records interruption of that command with exit 130 before a focused result or receipt was emitted. The archive retains the extra TypeScript receipt/log, summary and zero-byte incomplete focused log. No domain pass, failure count or coverage is inferred for that interrupted extra run.

The corrected `run_auxiliary_g12.py` uses the non-dispatching `auxiliary` phase and explicitly runs only tooling, CLI, setup and build. Its four complete receipts and logs match the outcomes above. This sequence changes validation orchestration only; it does not relax a product cap, case timeout or assertion.

## Earlier remote results remain separate

The saved [main observation](evidence/g12-main-observation.json) records successful main-push Alpha run `44713847841` and CLI run `44713847763`, both at `449a619f1ae7b66cb42d9cab43dd5493bfe42c2e`. The [Alpha domain log](evidence/g12-main-domain.log.gz) records that exact checkout and explicitly reports **819 passed domain assertions**, zero failed/pending/skipped/todo assertions, **27 passed tooling tests**, and **78 passed browser test executions**. The saved CLI job metadata has six successful operating-system/Node matrix jobs plus a successful planning job; no per-case CLI total is inferred from those job outcomes.

The [PR #68 predecessor observation](evidence/g12-pr68-predecessor-observation.json) retains Alpha run `44767198716` as failed and CLI run `44767198886` as cancelled for the earlier head `259f84204561c82d1138f252771564a02ea5916c`. Its [failed Alpha log](evidence/g12-pr68-failed-domain.log.gz) checks out synthetic merge `5c22ed55d950655213461cf13ea9852c47c3cc0f`; the checkout message explicitly joins that PR head with main `449a619f1ae7b66cb42d9cab43dd5493bfe42c2e`. Downstream Alpha setup/build/browser steps were skipped. One successful CLI matrix member does not turn the cancelled workflow into success. No domain assertion count or specific failure cause is inferred from that failed hosted job.

Those observations do not qualify the later PR #68 successor or the current consolidated source. This lane made no fresh remote query and claims no new hosted result.

## Documentation verification

The finalized handoff and qualification documents were re-read at **2026-11-20T16:36:39.842803+00:00**. They retain the original failures and incomplete entries, the separate focused/isolated results, completed auxiliary checks, both harness interruptions and the remaining current-source hosted gate. They make no causal attribution for the timing failures or claim that the static reviews supply hosted approval. The initial references to temporary decoded-JSON wrappers were corrected to the actual archived `.log.gz` members and observation JSON, so the qualification record does not depend on those unarchived duplicates.

| Reviewed document | SHA-256 at this review |
|---|---|
| `HANDOFF.md` | `70bcd505ed53bece564f1c201735b24ca1aebf89fb247f84751a748b4ef15b73` |
| `QUALIFICATION.md` | `0d4070b602911de92ea534ca53dc10ac8845012cae628c510bda2303967b25aa` |

The coordinator subsequently normalized each document by removing one extra blank line at EOF. At **2026-11-20T16:38:02.682876+00:00**, this lane compared the staged original bytes with each current file and verified exactly `staged = current + one newline`, with no other byte changed. The hashes above identify the normalized files; their prose, links, counts and qualification boundaries are unchanged.

The final local-link check covered 230 relative file targets across 16 Markdown files: this cycle's reports and the three updated continuation/scope registers. Every target exists. This checks local file resolution; external pages and fragment anchors were not fetched. Later publication metadata may change document bytes and must preserve the underlying outcomes and source distinctions.

## Outstanding qualification

The evidence supports reviewable publication with the reported local failures intact. It does not establish complete passing qualification or permission to bypass required hosted checks. The coordinator must bind publication to the reviewed runtime/test bytes and inspect the actual Alpha and CLI outcomes for the new published candidate or its corresponding merge source. Any eventual main merge needs its own recorded source identity and main-push qualification.

No native-device or local-browser acceptance is claimed. The historical findings tracker still contains **51 OPEN rows** and is byte-unchanged from earlier main; this evidence audit closes none of them. Scope and implementation limits remain in [QUALIFICATION.md](QUALIFICATION.md), [HANDOFF.md](HANDOFF.md) and the source reviews.
