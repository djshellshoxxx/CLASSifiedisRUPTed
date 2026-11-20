# Full-registry oracle follow-up: independent evidence review

## Result and source identity

**The final source has a verified local full-TypeScript pass and nine passed
cases across exactly three selected recovery files.** All three preceding
killed compiler attempts remain present and correctly report that no domain
test ran. No discrepancy was found in the execution receipts, archived bytes,
source identity or preservation of the original qualification.

This review inspected recorded execution and source artifacts. It performed
no compiler, domain-test, setup, build, CLI or browser rerun and supplies no
hosted qualification or integration approval.

| Identity | Independently verified value |
|---|---|
| Final executed source | `4a693cba0483b92b0df2459f8c9794be202b7c9a` |
| Final executed tree | `bccd3e4c94abfc05f2c39d0072264e6f14a9df6b` |
| Immediate parent, original full-registry source | `99cce1075e066acaefd863d59d23a6fea51f988c` |
| That parent's parent, published PR #62 | `4fc8e9c8aab75dec89d77677b4b25c50bd749632` |
| Final test Git blob | `e20a7a52747d2c483ffddb3ca652dd744459f832` |
| Final test SHA-256 | `b1288b48efa8259e82fca9b73960b334056e32c513e9040f0db8c3ed889f22f8` |

Local Git resolves the stated trees and parent chain. The complete diff from
the immediate parent is the single added dedupe-payload assertion in
[production-barter-recovery.test.ts](../../../../tests/integration/production-barter-recovery.test.ts).
Removing that exact line reproduces the parent's test bytes. No production,
application, tool, workflow, dependency, TypeScript/Vitest configuration or
other test changes accompany the follow-up. The relevant working-tree paths
still matched the executed source during this review.

The [follow-up source review](SOURCE-REVIEW-ROUND2.md) separately assesses the
assertion's meaning. The new local pass belongs to this final test blob; the
first-round pass remains attached to the earlier blob and source.

## Every follow-up attempt is preserved

Each summary and standalone compiler receipt identifies the same final
source/tree and exact command:
`node node_modules/typescript/bin/tsc -p tsconfig.json --noEmit`.
Every compiler process retains a 300-second outer limit.

| Raw/archive directory suffix | Node heap option | Compiler outcome | Domain outcome |
|---|---|---|---|
| `round2` | 1,024 MiB | `-9`, 2.889 s, empty log | Not started |
| `round2-retry` | 1,024 MiB | `-9`, 10.921 s, empty log | Not started |
| `round2-lowheap` | 512 MiB | `-9`, 2.436 s, empty log | Not started |
| `round2-native` | 1,024 MiB | Exit 0, 13.447 s, empty log | Nine passed, exit 0, 24.760 s |

The full directory prefix is `g11-full-registry-recovery-`. For each failed
attempt, the raw directory contains exactly a compiler log, its receipt and
the summary. There is no domain report or domain receipt. Its summary contains
only the failed compiler check, zero reported files and assertion counts,
all three intended test paths listed as missing, and both completion flags
false. These are failed validation attempts, not partial domain successes.

The successful attempt has exactly the compiler and selected-domain checks.
Its standalone receipts equal the respective summary entries. Every command,
source/tree value, exit result, duration, timeout, log size and log digest was
compared with the corresponding raw and archived artifacts.

## Final selected-domain recount

The complete final Vitest JSON was independently decompressed, parsed and
recounted from individual assertion records.

| Actual reported file | Passed cases |
|---|---:|
| `tests/integration/production-barter-recovery.test.ts` | 7 |
| `tests/integration/production-notification-recovery.test.ts` | 1 |
| `tests/integration/production-recovery-readers.test.ts` | 1 |
| **Total** | **9** |

All three suites and all nine assertions have status `passed`; report success
is true. Failed, pending and todo counts are zero and there are no skipped
assertions. Actual absolute report paths resolve to the exact selected
repository-relative paths. The selected, reported and receipt manifests
agree with no missing, unexpected or duplicate file. All nine pairs of file
path and full case name are unique.

The domain command retains the same three explicit test files,
`--pool=forks --maxWorkers=1 --fileParallelism=false --reporter=json`, and its
own recorded report destination. Its outer limit remains 900 seconds. The
expanded lifecycle took `7970.310722` milliseconds, approximately 7.970
seconds, within the unchanged 30-second case limit.

The [successful summary](evidence-round2/g11-full-registry-recovery-round2-native/summary.json)
contains only this compiler and selected recovery run. No new full-domain,
setup, build, tooling, CLI or browser execution is claimed. The nine cases
overlap the original nine and preceding 39/127/811-case selections; their
counts must not be added together as distinct passing cases.

## Native runtime controls and diagnostic limits

Both successful receipts explicitly record:

```text
NODE_OPTIONS=--max-old-space-size=1024
GOMAXPROCS=1
GOMEMLIMIT=384MiB
```

The inspected runner applies those values to the compiler and test processes
without changing their source, selected files, compiler configuration,
assertions or timeouts. These environment controls do not replace a compiler
check with a partial include list.

The [native executable receipt](evidence-round2/g11-native-compiler-inspection.json)
matches the actual installed Linux x64 executable: 24,101,026 bytes, SHA-256
`4f2de678286401759b3fb4475bafe35b8f32b4b3a07d92642bbf37eadc9b34a4`.
Independent byte inspection confirms the recorded `go1.26.4` version string
and runtime-control names. The earlier read-only inspection also established
that the installed TypeScript launcher executes this native binary; its
current bytes match the earlier passing worktrees. A Node V8 heap setting
does not itself bound that native executable's memory.

The linked [Go 1.26.4 runtime documentation](https://pkg.go.dev/runtime@go1.26.4)
was opened and checked. It describes `GOMAXPROCS` as limiting simultaneous
execution of Go code, and `GOMEMLIMIT` as a soft runtime memory limit that
excludes some process memory. Thus 384 MiB is not a hard RSS cap or an observed
peak-memory measurement.

The successful runner records
`resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss`, with value
**728,624 KiB** in both receipts. That is a cumulative child-process maximum
available to the runner, not an isolated per-test memory profile. The repeated
number must not be added or relabeled as two separate measured peaks.

All three killed compiler logs are empty. Their `-9` results, the simple
assertion type shape and the later successful run do not prove any particular
cause for the kills. This review does not diagnose memory exhaustion or a
compiler defect. The cause remains unconfirmed, as stated in
[VALIDATION-ATTEMPTS.md](VALIDATION-ATTEMPTS.md).

## Archive verification

Every payload in both manifests was independently checked against stored
bytes, decompressed original bytes and the corresponding raw workspace file.

| Archive | Entries | Original bytes | Stored bytes |
|---|---:|---:|---:|
| [Original archive](evidence/archive-receipt.json) | 6 | 9,488 | 5,610 |
| [Follow-up archive](evidence-round2/archive-receipt.json) | 16 | 16,022 | 12,203 |
| **Combined evidence-file totals** | **22** | **25,510** | **17,813** |

All original/stored lengths and SHA-256 digests agree. Every gzip header has
timestamp zero. Each raw payload has exactly one listed counterpart; there
are no missing, extra or duplicated archive entries. The follow-up's 16
entries account for three files in each of the three killed attempts, six
files in the successful attempt, and the separate executable inspection.
These are evidence-file counts, not unique test-case counts.

| Manifest | SHA-256 |
|---|---|
| Original, unchanged | `eb57936bdd64d3e983a5b56bacb5ac21b4549608c2c38da407da3c5475f5c5cc` |
| Follow-up | `a49e49a157362e4bc71848dce8f44881d9707d5d62c1246d96224fd52f4ebdb9` |

The original manifest matches the digest recorded in the first evidence
review, and all its payloads still match those unchanged manifest digests.
The initial nine-case report and compiler receipt retain source `99cce107…`;
none has been relabeled as qualification for the added assertion.

## Original documents and closeout claims

The round-one qualification and handoff copies match the exact original
document hashes recorded in the [first evidence review](INTEGRATION-REVIEW.md).
That review itself remains byte-identical to this reviewer's earlier recorded
digest. The original source review matches its preserved digest recorded by
the follow-up source reviewer.

| Preserved document | Verified SHA-256 |
|---|---|
| `QUALIFICATION-ROUND1.md` | `dcc8f4634d2e27b06510b6d9bccb4729500430751779e122a4fc5966ec66667a` |
| `HANDOFF-ROUND1.md` | `ff6e062e4b1e8d8050df01f5e8e6216ca231d2ed0dc108a32bfe3e69aced6e24` |
| `INTEGRATION-REVIEW.md` | `44891689e3c11f29b02cb8ed830bb83b96024153240626b2a3b39e782f179610` |
| `SOURCE-REVIEW.md` | `164c9cc087fa0954fe269ee9fa8dc78a616bfdafb5da1cb3327314ca9d9c124f` |

The updated [qualification](QUALIFICATION.md), [handoff](HANDOFF.md) and
validation-attempt record were compared with the final receipts and source.
Their final source/tree/blob, per-file counts, times, all-attempt history,
archive totals and runtime-control qualifications agree. They retain the
original source's independent result, explicitly disclose the three kills
and do not claim their cause is known. They preserve the distinction between
one populated archive of the 15 registered domain types and broader database,
queue, device and external-delivery recovery.

All 23 relative links in those three closeout documents resolve. Their sole
external documentation link is the Go runtime page checked above. The inspected
document identities are:

| Updated document | SHA-256 |
|---|---|
| `QUALIFICATION.md` | `78cf5df908c522acffb00d4acce54bc40746e6583ad3a738e7be3bc119850611` |
| `HANDOFF.md` | `3a1b15a46f2611b6b4554df845a69cd3cf2b43d35072191db780dd5dad91f423` |
| `VALIDATION-ATTEMPTS.md` | `fea3413eafbc5db685b581511496d45777d603c210a2ba59d2dd0e0cf2da2b8e` |

Actual current-head hosted Alpha/domain/browser and applicable CLI results
remain separate requirements. This review did not query those remote runs,
make remote writes, change runtime/test files, modify the original evidence,
launch a browser, close historical readiness findings or approve a release.
Publication must still verify its actual complete tree and preserved parent
against the reviewed closeout and tested executable bytes.
