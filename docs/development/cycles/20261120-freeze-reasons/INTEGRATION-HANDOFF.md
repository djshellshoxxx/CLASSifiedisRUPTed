# Consolidation checkpoint: stable freeze causes and readiness evidence

## Source chain

Preserve this chain and resolve each PR by its branch before further work:

| Checkpoint | Source identity | Branch |
|---|---|---|
| Last inspected qualified main | `137d88e36cc6b1611b062daa33cf84c3d29c86b3` | `main` |
| Published PR #58 | `25b4708191f04516cab74371c84a15663cc6f6a6` | `codex/classrup-mixed-codec-recovery-20261120` |
| Published PR #59, sole parent PR #58 | `86cd564e0692e8c777538200675dc20f2651ab51` | `codex/classrup-recovery-next-20261120` |
| Tested local freeze continuation | `94a34723108cf60db3b9bab1c669f5c9b5c36cd3` | `codex/classrup-freeze-review-20261120` |

The tested continuation tree is `1c7f8a1c4be00b81a9d2098673eb4fc6ddff7fe4`.
After documentation/evidence closeout, publish the complete reviewed tree as a
new draft against fresh main, retaining actual PR #59 head as its parent.
The actual remote head and run IDs belong in that PR body. Verify complete
local/remote tree equality; connector publication gives a different commit ID.

## Work completed

The preceding checkpoints added ordinary production-reader recovery, selective
PR #8 log-filter vocabulary, local notification recovery and signed barter
recovery. Their sources and exact qualification remain independently recorded.
All 15 production codec types are populated across separate realistic archives;
this does not establish one all-type or whole-database recovery.

This continuation fixes an older state/explanation drift: an expired signed
reservation and a missing actual local hold retain their distinct freeze causes
through reconstruction. It preserves replayed terminal results, reconstructed
live historical commitment metadata, recovery verdict clearing and existing
compatibility/action conditions. No automatic recommit is introduced.

Two existing genuine lifecycle tests now check another refresh, close/reopen,
another refresh, released holds and repeated normalization without mutating the
live state. Full TypeScript, 39 affected cases in five files, setup and build
passed. See [qualification](QUALIFICATION.md), the
[worker handoff](HANDOFF.md) and [fresh source review](CORRECTNESS-REVIEW-G8.md).

The [readiness reconciliation](../20261120-readiness/READINESS-RECONCILIATION.md)
adds a current source/evidence map for the 51 historical design/readiness rows.
All original findings remain OPEN; source audits, severities, provisional gates
and owner roles are unchanged. It distinguishes concrete alpha controls from
unfinished identity, federation, privacy, product and operational contracts.

The [branch audit](evidence/g8-branch-preservation/RECONCILIATION.md) independently
verified all 57 original non-main heads unchanged at its timestamp. It must not
be relabeled as a later remote snapshot after this branch is published.

## Required next action

1. Read this handoff, current PR bodies, actual remote heads and active worker
   state. Preserve unpublished work and inspect drift before any write.
2. Prioritize actual current-source hosted failures. At this checkpoint, both
   predecessor PRs' Alpha and CLI workflows were still queued; local checks do
   not replace them. Do not restart unchanged jobs or repeatedly push cosmetic
   commits to a stable pending source.
3. Keep the new candidate draft until its full Alpha domain/selected-browser and
   applicable CLI jobs pass with exact source/merge identities. If a predecessor
   merges first, re-evaluate fresh main, the current merge tree and qualification.
4. Integrate ordinarily with an expected-head check only after qualification and
   review. Compare actual and tested merge trees, then inspect actual main-push
   runs. Preserve all original source branches and draft PR #8's remaining work.

The local 811, 127 and 39 counts describe different sources and overlapping
suites. Do not combine them into a larger distinct test total or assign an
earlier complete suite to later production changes. Native-browser launch was
blocked locally before a page opened; no restriction was bypassed. The native
WebKit existing-key import issue remains open.

After current-source integration, use the readiness map and remaining-work
register to choose one bounded continuation. Attachment/blob and delivery/lease
recovery, key rotation, full database rollback protection, interrupted-device/load
acceptance, root/device recovery authority and canonical federation are separate
milestones. No finding is closed merely because a helper or specification exists.

No release, deployment, force push, branch deletion, paid external execution or
change to unrelated/paused automations is included.
