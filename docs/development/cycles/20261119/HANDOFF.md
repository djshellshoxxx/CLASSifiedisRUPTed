# ClassRup engineering continuation and fresh-worker handoff

## Scope and current integration

The owner requested consolidation, continued incomplete-feature implementation,
separate code/bug/security workers, and successive fresh review rounds. This is
new authorization beyond the earlier finite consolidation closeout. Continue
useful engineering while access and execution budgets permit; there is no tool
that exposes the owner's remaining credits or guarantees unlimited execution.

Canonical repository: `djshellshoxxx/CLASSifiedisRUPTed`.
Integration branch: `codex/classrup-engineering-20261119`.
The repository remains a development alpha; the [remaining-work register](../../REMAINING_WORK.md)
is the feature and release backlog. No release, deployment, force push, branch
deletion or paid external API is part of this continuation.

## Completed consolidation

[PR #56](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/56) merged normally
at `e63a7ecf0c7f15c2ce8ffa17793799caa0e62d3c`. Its corrected head was
`3aa7a17b28ee07ebec4336b49c3527743510bc16`; the tested PR merge was
`0e890e7ad2dffe10d65466f5f16f2595bb19f928`. Tested and actual merge trees both equal
`92a6452b4241fbcafe13b334a154765bbac63c3e`.

All nine PR jobs passed: Alpha run `44510361239`, CLI run `44510361244`, 748 domain
assertions, 27 tooling tests, 75 Chromium/Firefox/WebKit journeys, and all six
Ubuntu/Windows/macOS × Node 22/24 CLI jobs. Each CLI job discovered 46 assertions;
Windows jobs each explicitly skipped the one POSIX-only case. The [qualification
receipt](evidence/pr56-qualification.json) preserves exact jobs, counts, all nine
complete gzip logs and decoded/compressed SHA-256 hashes.

Main's separate push workflows `44658477772` and `44658477821` remained queued at
the latest inspection. A successful PR run is not a main-push result. Inspect
those actual jobs when resuming; do not count queued jobs or conditional artifact
steps as successful tests.

The unique documentation/evidence branch
`docs/classrup-feature-qualification-20261119`, head
`7619ba839a7bcbb38428d6429ab5362c5c18d095`, was integrated with ancestry preserved.
It contained five unique documentation commits and 44 files, with no runtime
delta. Its original failures, screenshots and queued checkpoints remain intact.
This handoff supersedes its old pending status. Incompatible draft PR #8 and
historical reference branches remain preserved for selective complete slices.

## Implemented candidate behavior

### Backup coverage and recovery checks

`backupCoverage()` inventories only the unlocked principal's populated record
types and counts. The PWA offers an explicit coverage check, explains omitted
storage categories and clears counts and the backup passphrase on lock.
`tx.records.listTypes` supplies tenant-exact UTF-8 ordering on memory, IndexedDB
and SQLite and expires with its transaction. The 256-type/10,000-record limits
bound results and admission; they do not bound all work needed to count rows.

Export repeats coverage admission within the same read snapshot used to collect
records. Unsupported types now block export instead of silently disappearing.
Export and restore share structural/schema/key/index/recovery admission. Export
checks detached copies and retains the original signed records; restore persists
normalized copies. Foreign owner evidence and a normalization that changes the
canonical key fail before an export artifact. Closing the session during an
awaited preflight prevents a late artifact. A failed encrypted restore remains
uninitialized after reopening.

The accepted codec registry captures method references with their original
receiver, preserving class prototype methods and private state even if callers
later replace array entries or method properties. Trusted codec closure state
is not frozen. The existing v1 backup format, principal and signing identity
remain unchanged. See [BACKUP_SCOPE.md](../../BACKUP_SCOPE.md) for exact scope.
Attachments, blob references, queue/delivery/lease state, rotation and complete
database recovery remain separate work.

### Repairs from independent workers

- Blob scope now explicitly admits supported metadata fields, preventing extra
  metadata properties from overriding the tenant or bytes supplied by the scope.
- Blob admission snapshots bytes and scalar metadata before asynchronous hashing;
  Buffer aliasing and mutable privacy/tenant/clock inputs cannot change the
  captured write. SQLite private admission requires `encrypted === true`.
- Record index tuples and migration rows cross the storage API by value, so
  retained arrays or returned rows cannot alter committed state without a write.
- Barter submission captures both selected CIDs before queuing/reading, validates
  the captured records freshly, and signs the submitted selection. A later valid
  selection cannot replace an original selection that became unavailable.
- Transaction documentation and tests state the precise asynchronous lifetime:
  revocation happens when the wrapper observes settlement; callers still must
  await work queued inside an asynchronous callback.
- Retained-listing backup admission now uses the same owner/listing compound key
  as normal retention. Publication backup admission uses the signed envelope CID
  used by existing publication writers and readers. Both headless production
  codecs retain their original signed-evidence validators and valid key formats.

## Independent worker generations

Each linked review records exact source identities, actual commands, original
failures, limits and next-worker instructions. Repeated checks overlap and must
not be summed into one test total.

| Round / worker | Outcome and handoff |
|---|---|
| G1 code audit | Blob input snapshot repair and asynchronous lifetime clarification; [handoff](code-audit-g1.md) |
| G1 bug hunt | Submitted barter-selection repair; [handoff](bug-hunt-g1.md) |
| G1 security audit | Scoped blob metadata repair and dependency-advisory reconciliation; [handoff](security-audit-g1.md) |
| G2 code audit | Index and migration-row value isolation; [handoff](code-audit-g2.md) |
| G2 security audit | Class codec compatibility repair and eight independent bounded probes; [handoff](security-audit-g2.md) |
| G2 fresh barter review | No additional finding; 11 focused cases passed; [handoff](barter-review-g2.md) |
| G3 storage review | No blocker; 12 reference-isolation cases, three-adapter reviewer probe, one explicitly filtered migration case; [handoff](storage-review-g3.md) |
| G3 recovery code review | No demonstrated source regression; five real-crypto probe groups including transactional conflict rollback and retry; [handoff](preflight-code-g3.md) |
| G3 coverage bug hunt | No demonstrated UI defect; eight bounded production-fragment probes; [handoff](coverage-bug-g3.md) |
| G4 key-consistency repair | Retained/publication codec repairs; 14 focused tests passed; [handoff](recovery-key-g4.md) |
| G4 static security review | No additional blocker after source review of the combined changes and both key repairs; no runtime testing claimed; [handoff](static-security-g4.md) |
| G4 independent compatibility review | Four native positive groups, eight normal records, prior codec definitions through new codecs and another round trip; [handoff](codec-compatibility-g4.md) |

One attempted G2 general bug-hunt worker stopped at an automatic safety review
before producing work. It is not counted as a completed audit. The narrowly
scoped independent barter correctness review completed that lane separately.
The G3 recovery-security follow-up also stopped at automatic review; its
completed observations are retained in a [partial handoff](preflight-security-g3-partial.md),
not counted as a completed audit. G4 completed the defensive key-consistency
repairs and a strictly static security review. A separate fresh compatibility
worker exercised normal valid v1 round trips without reproducing the prior gap.

## Root verification and limits

[Root evidence](root-evidence/receipt.json) retains the original failed, killed
and passing runs with hashes. Coverage focused verification passed 12/12. Shared
preflight, archive, existing vault and class-codec verification passed 14/14 on
`2917cb4751786bd475df2b34441cb40e1dfbc43f`, with zero failed or pending cases.
The baseline foreign-owner export regression failed because export resolved
instead of rejecting. The first preflight candidate passed 13 cases and failed
one old call-sequence expectation; the final run includes its corrected sequence.

The original coverage baseline had six missing-API assertion failures and one
timeout. That timeout is not proof of the omission defect; a separate native
baseline/candidate observation distinguished omission from explicit rejection.
One candidate runner and three full TypeScript attempts were killed. Those are
incomplete gates, not passes. A later integration check identified and fixed the
barter fixture's missing new `backupCoverage()` method. Strict focused TypeScript
then passed for all 23 changed TypeScript files and their transitive imports.
The combined affected run then passed **126/126 across 15 files**, with zero
failed or pending cases. That run preceded the later key-codec repairs and is
not a complete repository suite.

The full repository TypeScript check now passes on the integrated candidate
after correcting two branded-ID errors in the new publication test fixture.
Specification, dependency-boundary and registry checks, independent money
vectors and bundle budget, all 27 tooling tests, setup and production build also
pass. The original compiler diagnostic failure remains preserved.

The complete local domain suite was killed with **exit 137 after 145.485 seconds**,
before producing its final JSON report. This was not the 1,200-second process
cap. There is no passing complete-suite result or partial assertion count from
that invocation. The [qualification record](QUALIFICATION.md) and hashed logs
keep it distinct from the successful focused tests. Full hosted Alpha/CLI and
native-browser qualification remains required before merge. Existing WebKit
fixed-width import limitations, large-device/load
acceptance, manual accessibility and broader product/release gates remain open.

## Resume procedure

1. Read fresh main, the current integration PR/head/checks, this handoff and all
   later worker handoffs. Check active workers before taking ownership of files.
2. Read the completed key-codec repairs and independent reviews, then
   finish the normal unchanged project gates. Preserve
   every failed or unfinished invocation without converting reruns into passes.
3. Publish a reviewable draft with source/tree identities and fresh qualification.
   Merge only after its required current-source checks and independent review
   pass; verify the actual merge tree and main's own push qualification.
4. Give a fresh code-audit, bug-hunt and defensive security worker the concrete
   resulting source and evidence. Wait for completion, integrate confirmed
   repairs, and leave an exact next-worker handoff.
5. Continue the next unblocked bounded feature in the [remaining-work register](../../REMAINING_WORK.md).
   The next backup slice should exercise the production codec set together through
   encrypted restore and reopen before extending attachments or delivery state.

Do not treat clean focused tests or absence of a finding as exhaustive security
assurance. Do not loosen timeouts, crypto vectors, product bounds or workflow
selection to obtain a green result. Keep the older finite and general ClassRup
automations paused; any new owner-directed continuation is a separate task.
