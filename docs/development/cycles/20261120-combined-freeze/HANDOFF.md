# Consolidation continuation: combined freeze recovery

## Current candidate

Use branch `codex/classrup-combined-freeze-20261120` as the combined integration
candidate. It preserves the independently developed PR #60 and PR #61 histories,
their complementary tests and both original handoffs. Publish its complete
reviewed tree as a separate draft against fresh main, with PR #61 as first
parent and final PR #60 as second parent. Resolve the actual published head and
workflow identities from the PR body and live refs before further work.

| Checkpoint | Exact source |
|---|---|
| Last inspected qualified main | `137d88e36cc6b1611b062daa33cf84c3d29c86b3` |
| PR #58 | `25b4708191f04516cab74371c84a15663cc6f6a6` |
| PR #59, parent PR #58 | `86cd564e0692e8c777538200675dc20f2651ab51` |
| PR #61, parent PR #59 | `759f5e2c17eb127db152eb3070557afefe3c64e7` |
| Final PR #60, descended from PR #59 | `8d8d64d1fafe52977a124ce1c49c9c8ac372ef1e` |
| Tested combined local merge | `d629b4e14dc7d7dea7e32d80ab358b5060f5e69f` |

The tested combined tree is `b30b157efe2f91fbac04ebfcc0568ce43c467d8e`.
Later closeout changes are documentation/evidence only. Connector publication
produces a different commit identity; verify complete local/remote tree equality
and both actual parents before describing the branch as published.

## Preserved work and new qualification

The preceding candidates added the shared production backup registry, ordinary
listing/location recovery, notification recovery, signed barter recovery and
selective PR #8 secret-field log filtering. All 15 registered codec types are
populated across separate realistic archives. These remain bounded recovery
scenarios rather than a complete database/device recovery guarantee.

PR #61 fixes local freeze-reason drift and includes persistence/reopen and
normalization assertions. PR #60 independently fixes the same production block
and adds useful ordinary hold-release, peer-expiry and signed-withdrawal
acceptance. The merge keeps PR #61's production bytes, both test files and both
handoffs. The reason preservation remains conservative: it cannot authorize
consent, turn a restored cache into a fresh verdict or recommit a frozen exchange.

The combined source passed full TypeScript, 39 selected persistence/recovery
cases across five files, setup and build. The PR #60 test additions have now
actually executed in this combined tree. Its unchanged copied handoff records
that worker's earlier no-checkout limitation, not the current combined result.
See [qualification](QUALIFICATION.md), [merge provenance](MERGE-RECEIPT.json)
and the independent reviews linked from qualification.

The [51-row readiness reconciliation](../20261120-readiness/READINESS-RECONCILIATION.md)
is retained unchanged. All original findings stay OPEN; original audit bytes,
severities, provisional gates and owner roles are preserved. Implemented helper
and alpha behavior is distinguished from complete product or operating controls.

The [pre-publication source snapshot](SOURCE-PRESERVATION.json) preserves exact
remote observations and verifies all 57 original non-main heads unchanged.
It is timestamped evidence, not a claim about later refs. New candidate refs
are additions; no original ref is deleted or rewritten.

## Next actions

1. Read this handoff, current PR bodies, remote heads and worker state. A separate
   worker produced PR #60 during the prior continuation; inspect shared state
   before any change. Preserve both original branches and the local worker
   branch that happens to share PR #60's remote branch name.
2. Prioritize actual current-head hosted results. All four predecessor candidates'
   Alpha and CLI runs were queued at this checkpoint. Do not restart unchanged
   queues, relabel earlier passes, or repeatedly push cosmetic changes to a
   pending source. Record the combined candidate's actual runs in its PR body.
3. Keep the combined candidate draft until its actual full Alpha/domain/browser
   and applicable CLI jobs pass and the independent review dispositions are
   complete. If main or a predecessor integrates meanwhile, re-evaluate ancestry,
   fresh merge-tree identity and the qualification that applies to that result.
4. Integrate ordinarily with an expected-head guard only after those gates.
   Preserve both source parents and verify the actual resulting tree. Inspect
   actual main-push checks. Do not close predecessors early or assume a queued
   result will pass. Combining preserved ancestry does not require force pushes
   or deletion of either source.

The 811, 127 and each 39-case result describe different source snapshots and
overlapping selections. Do not add them. Original killed/interrupted/failed or
cancelled attempts remain visible, including the earlier monolithic domain
attempt and the corrected cross-worktree TypeScript environment failure.

The local browser environment previously denied launch before a page opened;
no bypass or repeat was attempted. The native WebKit existing-key import issue
remains distinct. Attachment/blob and delivery/lease recovery, key rotation,
whole-database rollback, interrupted-device/load acceptance, root/device recovery
authority and canonical federation are separate milestones in
[remaining work](../../REMAINING_WORK.md).

No release, deployment, force push, source-branch deletion, paid external
execution or change to unrelated or paused automations is included.
