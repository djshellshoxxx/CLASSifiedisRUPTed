# Freeze-reason continuation: independent evidence review G8

## Result and source

**No blocking evidence discrepancy found.** Independently recounting both raw
Vitest reports yields **39 passed cases across exactly five distinct files**,
with no other case status or missing, unexpected or duplicate file. Compiler,
setup and build receipts each record exit zero. All **19 archive entries**
match their recorded sizes/digests and the corresponding raw evidence bytes.

Reviewed runtime/test source:
`94a34723108cf60db3b9bab1c669f5c9b5c36cd3`, tree
`1c7f8a1c4be00b81a9d2098673eb4fc6ddff7fe4`.
Published parent: `86cd564e0692e8c777538200675dc20f2651ab51`.
All five execution receipts and the archive manifest identify this source and
tree; local Git independently resolves the same tree. Production blob
`0554e07aa0cead3ac61b44e75faa34dba5452a9b` and persistence-test blob
`6d1ac8b5851bc0884bd2cdf8f0e88e3a6ea288c7` remain unchanged.

This review reads existing evidence and local Git objects. It reruns no
product tests, compiler, setup, build, browser or remote query and leaves the
prior [correctness review](CORRECTNESS-REVIEW-G8.md) unchanged. Raw execution
files came from
`/workspace/scratch/e0ea2385d962/classrup-validation/g8-freeze-integrated`.
Their [archived summary and receipts](evidence/g8-freeze-integrated/summary.json)
match the raw files. Later documentation changes do not expand qualification.

## Independent case and selection accounting

Counts come from every `testResults[].assertionResults[]` entry, independently
of report totals and summary. Every reported file and case is `passed`;
every case has an empty `failureMessages` list. Names within each file are
unique. Recomputed counts agree with report totals, receipts and summary.

| Report | Exact selected and reported file | Passed |
|---|---|---:|
| Persistence/oracle | [mutiny-oracle.test.ts](../../../../tests/integration/mutiny-oracle.test.ts) | 12 |
| Persistence/oracle | [mutiny-persistence.test.ts](../../../../tests/integration/mutiny-persistence.test.ts) | 16 |
| Barter/backup | [mixed-production-backup.test.ts](../../../../tests/integration/mixed-production-backup.test.ts) | 1 |
| Barter/backup | [production-barter-recovery.test.ts](../../../../tests/integration/production-barter-recovery.test.ts) | 7 |
| Barter/backup | [production-codec-compatibility.test.ts](../../../../tests/integration/production-codec-compatibility.test.ts) | 3 |
| **Total** | **5 unique files** | **39** |

Paths extracted from each receipt's command exactly match its report and
receipt file arrays. Their union equals both summary selections. There are
zero failed, pending or todo cases. Vitest's `numTotalTestSuites` values,
five and six, count suite groups; they are not the physical file counts.

Both commands specify isolated forks, one worker, disabled file parallelism,
a 1,024 MiB Node heap cap and a 900-second outer process limit. Report times
confirm the first group's last file ended before the second group started.
This is the selected execution scope, not a new full-domain result.

| Raw report | Original bytes | Recomputed SHA-256 |
|---|---:|---|
| [persistence-oracle.json](evidence/g8-freeze-integrated/persistence-oracle.json.gz) | 12,018 | `e18b089bdae940f1ec3cd3355af42c88d92e6b5b999ff43df0236e66d9e2a7ec` |
| [barter-backup-regression.json](evidence/g8-freeze-integrated/barter-backup-regression.json.gz) | 5,776 | `b33bd61816675936aebb65faf083c66f69e274f3d1d3ac049750134653325d63` |

Both digests match the execution receipts and archive original-byte digests.
Stored gzip digests were checked separately.

## Receipt and log verification

Every standalone receipt exactly matches its object in `summary.json`.
Every raw log's byte length and SHA-256 match its receipt and archive entry.

| Check | Recorded exit | Seconds | Raw log bytes | Log observation |
|---|---:|---:|---:|---|
| `tsc -p tsconfig.json --noEmit` | 0 | 3.296 | 0 | Empty; captured exit status records success. |
| Persistence/oracle | 0 | 27.531 | 120 | Names the JSON report. |
| Barter/backup | 0 | 36.848 | 126 | Names the JSON report. |
| CLI `setup --non-interactive` | 0 | 0.116 | 63 | Reports local configuration creation. |
| CLI `build` | 0 | 0.466 | 53 | Reports the public asset output. |

These are qualification-run execution records. Digest agreement establishes
preservation and internal consistency, not independent host attestation or
replacement of hosted checks.

## All 19 archive entries

[Archive manifest](evidence/archive-receipt.json) SHA-256:
`4030d0f65aea1661648309514e1e40ed5a4394f3b47e46c73b8ecb34e0b39d7e`.
Its unique paths exactly match all files under the evidence directory,
excluding the manifest itself. There are no missing or extra members.

For every row, **match** means stored size/SHA-256, original size/SHA-256 and
direct equality with the corresponding raw `classrup-validation` file were
independently checked. All seven gzip members decompress and have zero header
modification time. Totals exclude the archive manifest.

| Archive entry | Original bytes | Stored bytes | Verification |
|---|---:|---:|---|
| [barter-backup-regression-receipt.json](evidence/g8-freeze-integrated/barter-backup-regression-receipt.json) | 1,212 | 1,212 | Match |
| [barter-backup-regression.json.gz](evidence/g8-freeze-integrated/barter-backup-regression.json.gz) | 5,776 | 1,134 | Match |
| [barter-backup-regression.log.gz](evidence/g8-freeze-integrated/barter-backup-regression.log.gz) | 126 | 130 | Match |
| [build-receipt.json](evidence/g8-freeze-integrated/build-receipt.json) | 428 | 428 | Match |
| [build.log.gz](evidence/g8-freeze-integrated/build.log.gz) | 53 | 70 | Match |
| [persistence-oracle-receipt.json](evidence/g8-freeze-integrated/persistence-oracle-receipt.json) | 1,036 | 1,036 | Match |
| [persistence-oracle.json.gz](evidence/g8-freeze-integrated/persistence-oracle.json.gz) | 12,018 | 2,006 | Match |
| [persistence-oracle.log.gz](evidence/g8-freeze-integrated/persistence-oracle.log.gz) | 120 | 126 | Match |
| [setup-receipt.json](evidence/g8-freeze-integrated/setup-receipt.json) | 453 | 453 | Match |
| [setup.log.gz](evidence/g8-freeze-integrated/setup.log.gz) | 63 | 79 | Match |
| [summary.json](evidence/g8-freeze-integrated/summary.json) | 5,065 | 5,065 | Match |
| [typecheck-receipt.json](evidence/g8-freeze-integrated/typecheck-receipt.json) | 474 | 474 | Match |
| [typecheck.log.gz](evidence/g8-freeze-integrated/typecheck.log.gz) | 0 | 20 | Match |
| [Branch RECONCILIATION.md](evidence/g8-branch-preservation/RECONCILIATION.md) | 5,326 | 5,326 | Match |
| [Branch audit.json](evidence/g8-branch-preservation/audit.json) | 24,050 | 24,050 | Match |
| [Branch github-observations.json](evidence/g8-branch-preservation/github-observations.json) | 2,928 | 2,928 | Match |
| [Branch remote-heads-receipt.json](evidence/g8-branch-preservation/remote-heads-receipt.json) | 482 | 482 | Match |
| [Branch remote-heads.stderr.txt](evidence/g8-branch-preservation/remote-heads.stderr.txt) | 0 | 0 | Match |
| [Branch remote-heads.txt](evidence/g8-branch-preservation/remote-heads.txt) | 5,844 | 5,844 | Match |
| **Total** | **65,454** | **50,863** | **19 of 19 match** |

## Branch snapshot and remaining gates

The branch evidence preserves remote reads from
`2026-11-20T06:45:02.707859Z` through `2026-11-20T06:45:07.949666Z`, followed
by its recorded API observation at `2026-11-20T06:45:20Z`. This review does
not extend that observation time.

The [baseline inventory](../../evidence/20261118/inventory.json) SHA-256 is
`fe755a265cc0fe925bf6f349e77dec43f8d8f78db7c994d3cf3cbaa899202034`, matching
the audit. Comparing it with archived remote-head text independently confirms
58 baseline names, all **57 original non-main heads unchanged**, 65 observed
names including main and seven added names. Expected-head checks agree.
Local Git ancestry recounts against the immutable observed hashes confirm
39 current non-main heads ancestral to observed main, 25 not ancestral and
zero errors; among the original 57, the split is 34/23. These history counts
do not establish missing features or authorize deletion.

The separate API snapshot matches the audit's embedded copy and records
draft PRs #8/#58/#59 at heads matching the remote-head text. PR #58/#59 tree
and parent values match local Git objects; PR #59's sole parent is exactly
PR #58's head. PR #8's older API base SHA remains historical metadata, not
the current main ref. This is a point-in-time source-preservation observation.

The [prior 127 selected cases](../20261120-next-recovery/QUALIFICATION.md)
belong to runtime/test source `796c16520365c57562c1328a73d313f3fa614ae4`;
the [prior 811 full-domain cases](../20261120/QUALIFICATION-ROUND4.md) belong
to `d92f20bcdba146cd5d3d482ee830210e2bdb1ae2`. Both selections overlap these
39 cases. Totals are not added or reassigned to this changed source.

Current-head full Alpha domain/browser and applicable CLI hosted checks remain
required. This review supplies no hosted or native-browser result. The prior
environment browser limitations and separate native WebKit existing-key import
compatibility issue remain outside this selected local qualification. The
[qualification record](QUALIFICATION.md) retains the outstanding publication
and merge gates. No release approval or historical finding closure follows.
