# Consolidation completion and provenance

## Current state

The authorized runtime consolidation and both fresh qualification stages are
complete. PR #54 merged normally into main, and main's own Alpha and six-platform
CLI workflows passed. PR #55 carries the final documentation and evidence. Its
actual GitHub merge result supplies the final main commit after closeout.

If resuming while #55 is still open, only the documentation closeout and final
report remain. If #55 is merged and the recorded runtime/ancestry checks hold,
this task is complete: pause the finite consolidation continuation and do not
start unrelated product development. Leave the older paused general ClassRup
continuation and other automations untouched.

Canonical repository: `djshellshoxxx/CLASSifiedisRUPTed`.
The `classrupted` shorthand URL is not a separate repository.

## Source and merge identities

| Identity | Exact value |
|---|---|
| Initial main | `044c213d90d62f1f06edb8ca1b9c2141d3991c27` |
| Dedicated integration head | `a111eefb907a9f039f56777715e20b4976ea3d87` |
| Tested PR #54 merge | `101265f1fa9dee9e59d177174e4b55bd3ce3bf26` |
| Actual runtime merge into main | `d7c03a28c93db0d6a0b33a7127b35f10b6faa5a8` |
| Tested and merged runtime/source tree | `7a791921eb6a820bf4cd4d203e31a76f6fe5cd4a` |
| Preserved PR #53 source | `d81094688ac116c84c09f3105c7b3f6b4c472793` |
| Preserved PR #51 source | `7b729df38dddf59c4e60e245bdf1ca43546b1e7b` |

PR #54 merged at `2026-11-19 07:30:13 UTC`; GitHub automatically marked #53 and
#51 merged at `07:30:15` and `07:30:16 UTC` through their preserved ancestry.
The actual runtime merge has parents initial main and the dedicated integration
head. Its tree is byte-identical to the tested PR merge. Both original source
heads are ancestors of actual main; no separate #51/#53 merge calls were made.

## Completed qualification

| Stage | Alpha run | CLI run | Verified result |
|---|---|---|---|
| Combined PR #54 | `44474363888` | `44474363663` | All nine jobs passed on first attempts at tested merge `101265f1`. |
| Actual main push | `44480107217` | `44480107222` | All nine jobs passed on first attempts at main `d7c03a28`. |

Each stage independently passed 701 domain assertions, 27 tooling tests and all
72 Chromium/Firefox/WebKit journeys, with zero failed/skipped tests in those
suites. Each six-platform CLI matrix passed 190 repeated assertions with only
two intended Windows POSIX FIFO/device skips. Every required static, money,
setup, build, dev/preview smoke and clean tracked-file gate passed. Conditional
failure-screenshot uploads were skipped because their jobs passed; those are
not skipped tests.

Exact job identities, checkouts, counts, byte lengths, SHA-256 digests and all
nine complete raw logs per stage are preserved in
[evidence/20261118/pr54-ci/final-qualification.json](evidence/20261118/pr54-ci/final-qualification.json)
and [evidence/20261118/main-ci/final-qualification.json](evidence/20261118/main-ci/final-qualification.json).
No passing source or PR run is substituted for an actual main push result.

## Dispositions and preserved scope

Discovery and semantic review covered 58 original branch names and 53 historical
PRs. All 57 original non-main heads remained unchanged at reconciliation. There
are 34 original non-main heads ancestral to main (32 prior plus 2 new), six
histories integrated by content, 12 superseded/adapted historical references,
four preserved product/specification heads requiring development and one
preserved native diagnostic head, plus main itself. No new partial recovery or
source repair is counted; the PR #8 registry recovery was prior work through
PR #48. No additional safe drop-in runtime slice was established.

The 52 original cleanup candidates have exact unchanged heads and no open PR
source/base dependency. They remain a review list. After #55 merges, the two
new task branches can also be reviewed for cleanup, making 54 candidates across
60 live branch names if the refs remain unchanged. No branch deletion is part
of this task. Re-read current heads and worker/release needs before any later
separately authorized cleanup.

See [BRANCH_CONSOLIDATION.md](BRANCH_CONSOLIDATION.md), the immutable discovery
snapshots, the [original-ref reconciliation](evidence/20261118/final-reconciliation.md)
and [final pre-closeout ref check](evidence/20261118/closeout-ref-check.json).
The actual product priorities remain in [REMAINING_WORK.md](REMAINING_WORK.md).

## Closeout guards if PR #55 remains open

1. Refresh #55, main, rules, current checks and worker activity. Inspect any drift rather than overwriting it. Resolve the evidence branch by `docs/consolidation-qualification-20261118`.
2. Confirm the two actual main push runs above succeeded for `d7c03a28`, all current changes are documentation/evidence only, archive bytes and links match, and no later main runtime changed without qualification.
3. Mark the reviewed PR ready and merge ordinarily with its expected current head. Preserve source parents; never force-push or rewrite shared history.
4. Read GitHub's actual merge result and final main. Verify both preserved source heads remain ancestors and all differences from the qualified runtime main are documentation/evidence only. The existing workflows ignore those paths; do not claim absent final-documentation runs passed or change the ignore rules to manufacture a result.
5. Verify the final original-ref counts and source PR states. Record actual final integration/main SHAs in the PR body and final user report; the merge identity cannot be embedded into its own predecessor file content.
6. Deliver the requested count, branch-by-branch, CI, compatibility and priority report, then pause the finite consolidation continuation. Do not alter other automations.

No deployment, release, pre-existing branch deletion, unrelated feature work or
paid Codex/API work is authorized by this handoff.

## Local evidence and compatibility limits

[Local qualification](evidence/20261118/LOCAL_QUALIFICATION.md) preserves every
attempt. Typecheck, static gates, audit, setup/build, 27 tooling, 32 CLI and ten
additional adversarial probes passed. The full local domain invocation had
699 passes and two timeouts; both cases later passed individually at unchanged
20s/60s limits. The original invocation remains a failed full run.

Pinned local browser downloads were invalid ZIPs. System Chromium then aborted
before opening pages because the command sandbox denied its socket. All 24
cases failed at launch, with zero application journeys. The environment rejected
the standard escalation request; no restriction was bypassed. Hosted pinned
browser runs provide the product-browser qualification.

Separate native WebKit diagnostics retain valid leading-zero/all-zero key import
failures and intermittent generation errors. The pre-existing three-attempt
new-key-generation-only mitigation does not fix existing-key import. Do not
silently rotate an identity or close that compatibility issue based on green
product journeys. Wider identity, storage recovery, federation and product
work remains explicitly open in the remaining-work register.

## Publication mechanics

Git clone/fetch works through HTTPS here; shell push lacks credentials. The
GitHub connector published commits through Git data APIs while preserving
original source parents and verifying complete tree equality. Use expected-SHA
ref updates for later fast-forward writes. Archive raw bytes, including Windows
CRLF sequences, without newline translation; validate blob SHA, byte length and
SHA-256. Never print credentials or overwrite a moved head. The repository had
no Pages deployment and its two workflows only verified; recheck if configuration
changes before any future main write.
