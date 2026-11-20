# Independent integration and qualification review — round 4

## Reviewed source

Integrated runtime and test source:
`d92f20bcdba146cd5d3d482ee830210e2bdb1ae2`, tree
`0238e6ad6a9add7d712e3b5bf5ff0eabf993d870`.
The parent recovery candidate is PR #58 head
`38ada90037d8176b0e0e319651b712cc396cad5d`; the observed main base is
`137d88e36cc6b1611b062daa33cf84c3d29c86b3`.

This fresh lane inspected the integrated production/test diff, earlier
independent review notes, local qualification receipts, the configured test
manifest and the sequential shard runner. It did not author either runtime
change, run additional tests, modify production files or write remote state.
Documentation edits were the only uncommitted tracked changes during review.

No blocking integration defect was identified in the reviewed source. Final
independent reconciliation confirms **811 passing domain tests across all 89
configured files** at this source, using eight sequential shards. No failed,
pending, skipped or todo assertion statuses were present. This local result
does not replace the separate hosted, browser, CLI or build gates.

## Integration preservation

The reader acceptance file is byte-identical to the file reviewed at worker
commit `a2912f9a51baa5ecbd7db2b913b553e05501aab0`. The redactor and its test file
are byte-identical to worker commit
`f22e88507ac8f58487d7f125650dad8b0a6ac429`. Read-only diffs of these exact paths
between the worker commits and the integrated source were empty.

The original PR #58 registry extraction remains unchanged by either
continuation. Both PWA initialization paths still use the same extracted
production registry. The normal-reader scenario adds acceptance coverage
without changing backup, identity, storage or domain-reader behavior.

The only new production behavior after PR #58 is the reviewed expansion of
structured secret-field classification. No existing key or suffix rule is
removed. The redactor traversal, IP precedence, logger event-ID admission and
Error-detail removal remain unchanged. No generic key suffix or new sink,
scanner, relay dependency or protocol is introduced.

No changes appear in CI workflows, Vitest configuration, Playwright
configuration, package manifest or dependency lockfile. Existing test bodies,
cryptographic parameters, product caps and acceptance limits are not weakened.
The reader scenario uses the existing 30-second integration-test allowance;
the repository default remains 20 seconds. The new redaction cases assert
both suppression of credential fields and preservation of ordinary metadata.

## Verified local evidence

The following records are distinct and must remain distinct when publishing
the candidate:

| Source | Check | Independently inspected result |
|---|---|---|
| PR #58 `38ada900` | Focused recovery checks | Four passed, zero failed or pending in the saved JSON report. |
| PR #58 `38ada900` | One-process complete domain attempt | Process exit `-9` after 257.938 seconds, without a final JSON report. Incomplete; no completed-suite count is claimed. |
| Integrated `d92f20bc` | Repository TypeScript check | Receipt records exit 0 in 9.688 seconds. |
| Integrated `d92f20bc` | Focused reader/redactor/logger checks | Saved JSON independently recounts 11 passed tests and no other assertion status; report success is true and process exit is 0. |
| Integrated `d92f20bc` | Complete domain suite in eight sequential shards | 811 passed across all 89 configured files; eight successful process/report results and complete disjoint file coverage independently verified. |

The `-9` termination establishes that the earlier process was killed. It does
not, by itself, establish an out-of-memory diagnosis, a test assertion failure
or a passing result.

## Shard accounting review

The Vitest `list --filesOnly --json` manifest contains **89 unique test files**.
An independent comparison against the unchanged configured include patterns
(`packages/*/src/**/*.test.ts`, `tests/integration/**/*.test.ts` and
`tests/compat/**/*.test.ts`) found no missing, unexpected or duplicate paths.

The runner uses eight sequential invocations with `--pool=forks`,
`--maxWorkers=1`, `--fileParallelism=false` and the appropriate `--shard` value.
It changes process isolation and lifetime after the incomplete threaded run;
it does not change per-test limits, retry failed cases, select only passing
tests or modify the repository's normal CI commands.

Each receipt records source/tree, exact command, process result, duration,
reported files, assertion statuses and SHA-256 digests of its log and report.
Final accounting requires all eight exit codes and report-success flags to
pass, all 89 files exactly once, and no non-passing assertion status. These
checks prevent a subset's passing count from being reported as the complete
suite. Repeated attempts must retain separate output directories so stale
reports cannot be mistaken for a new run.

### Final independent reconciliation

All eight raw JSON reports, logs and receipts were inspected after the final
summary existed. Each receipt names the reviewed source `d92f20bc` and tree
`0238e6ad`, the correct shard index, the fork pool and one-worker execution.
Every process exited 0; every report and receipt has a successful result.

| Shard | Reported files | Passed tests | Other assertion statuses | Log and report SHA-256 |
|---|---:|---:|---:|---|
| 1/8 | 12 | 65 | 0 | Match receipt |
| 2/8 | 11 | 60 | 0 | Match receipt |
| 3/8 | 11 | 74 | 0 | Match receipt |
| 4/8 | 11 | 97 | 0 | Match receipt |
| 5/8 | 11 | 152 | 0 | Match receipt |
| 6/8 | 11 | 92 | 0 | Match receipt |
| 7/8 | 11 | 129 | 0 | Match receipt |
| 8/8 | 11 | 142 | 0 | Match receipt |
| **Total** | **89** | **811** | **0** | **All 16 hashes match** |

The counts above were recomputed from each raw report's `assertionResults`,
not copied from the aggregate summary. Every suite status is `passed` and each
report's top-level test totals agree with its recounted assertions. Each
receipt's sorted file list and assertion counts match its raw report.

The union contains all 89 configured manifest paths exactly once, with no
missing, unexpected or duplicate files. An independent recomputation also
matches every aggregate coverage/status field in `summary.json`, including
eight completed successful shards and `complete_pass: true`. The earlier
one-process killed attempt remains separately recorded as incomplete.

At reconciliation, the checkout still named the same reviewed commit and
tree; uncommitted tracked changes remained documentation only. This lane did
not run tests again or inspect the concurrently running static/CLI/build gate
pipeline. Those outcomes require their own evidence from the integration owner.

## Remaining qualification and scope

Current-source hosted Alpha, required browser engines and CLI checks remain
separate gates. Local forked/sharded execution does not retroactively make the
killed threaded attempt pass or qualify unavailable native-browser journeys.
Any published commit mapping must preserve the tested runtime/test blobs and
record later documentation-only differences explicitly.

The reader acceptance populates six record types with the complete registry;
it does not establish every registered codec's populated recovery. Native
browser/device persistence, interrupted encrypted commits, attachments,
delivery state, leases, key rotation and database-wide recovery remain outside
this acceptance. The redaction adaptation likewise does not complete PR #8's
incompatible runtime or unfinished secret-loading module.

Only this review document is owned by this lane. Final source identities,
hosted results and integration remain owned by the root lane.
