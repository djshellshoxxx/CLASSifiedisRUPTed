# Consolidation continuation: one full-registry recovery archive

## Current continuation

Branch `codex/classrup-full-registry-recovery-20261120` contains the next bounded
acceptance after combined PR #62. The only executable change extends one
existing production barter recovery lifecycle to include the full production
registry and actual notification routing. No production policy changes.

| Identity | Exact source |
|---|---|
| Last inspected qualified main | `137d88e36cc6b1611b062daa33cf84c3d29c86b3` |
| Published combined PR #62, sole parent of this source | `4fc8e9c8aab75dec89d77677b4b25c50bd749632` |
| Executed local source | `99cce1075e066acaefd863d59d23a6fea51f988c` |
| Executed local tree | `ba98ba4ef99f35a32068b1adc5725a4204c76ed9` |
| Executed test blob | `aa0078f19382a45842c7346a2173f161c79eb2d9` |

Publish the complete reviewed closeout tree as a separate draft against fresh
main, retaining actual PR #62 as its parent. Connector publication yields a
different commit identity; verify full local/remote tree equality and parent
identity. Resolve the actual published head and current workflow IDs through
the PR body and live ref before further work.

PR #62 already preserves PR #61 and final PR #60 as its two actual parents,
including their complementary tests and both handoffs. It in turn retains
PRs #59 and #58. This follow-on preserves that complete history and leaves all
pending source heads unchanged. See the
[combined source handoff](../20261120-combined-freeze/HANDOFF.md) for those
exact earlier identities and qualification boundaries.

## What the new acceptance establishes

The initial recovery scenarios populated all 15 codec types across separate
archives. The expanded lifecycle now populates all 15 together through ordinary
owner commands and genuine peer evidence, using the same module factories as
the PWA composition. The important additional interaction is real barter
observation → local notification → encrypted recovery → ordinary refresh.

The inbox's two source event IDs match accepted peer reservation/consent
observations. Complete record snapshots survive one export, restore and reopen,
with only the documented coordination-review and location-window normalization
exceptions. Repeated recovered refresh keeps the exchange frozen, releases the
local hold, and leaves the full inbox, domain dedupe and counters unchanged.
The production delivery-health helper confirms no outstanding notification work
or dead letters. Continued mark-read and archive restore/republish actions work
through ordinary handlers.

Full TypeScript and all nine cases in the three selected production recovery
files passed. The expanded lifecycle took 7.431 seconds within the unchanged
30-second limit. See [qualification](QUALIFICATION.md),
[implementation](IMPLEMENTATION.md) and the independent reviews linked from
qualification. All later closeout changes are documentation/evidence only.

The [source snapshot](SOURCE-PRESERVATION.json) verifies the original 57 non-main
branch heads and preceding candidate heads at its timestamp. It does not claim
later remote state. The historical
[51-row readiness reconciliation](../20261120-readiness/READINESS-RECONCILIATION.md)
is retained unchanged, and all original findings remain OPEN.

## Next action and integration guard

1. Refresh main, candidate PRs, refs, current workflow runs and worker activity.
   Inspect drift before any write. Preserve all existing local worktrees and
   source branches, including the independently developed PR #60.
2. Prioritize the actual current-head hosted gates. The preceding runs were
   still queued; do not restart unchanged queues or push cosmetic source
   changes merely to regenerate jobs. This continuation needs its own actual
   full Alpha/domain/browser and applicable CLI qualification.
3. Keep the new PR draft until those gates and independent review pass. If
   main or a predecessor integrates meanwhile, re-evaluate ancestry, the fresh
   prospective merge tree and the qualification that applies to it.
4. Integrate ordinarily with an expected-head guard only after qualification.
   Compare the actual and tested tree, preserve all source ancestry, then
   inspect actual main-push checks separately. Do not close predecessors early
   or treat queued jobs as either passes or failures.

The nine-case result overlaps previous 39/127/811-case selections. No totals
are additive, and no previous full suite or build is reassigned to this source.
Original failed, killed, cancelled and environment-blocked attempts remain
preserved. No new failure was hidden by a timeout change or skipped assertion.

This is the current alpha's registered domain-record recovery acceptance.
Attachments/blob references, kernel delivery/lease state, key rotation,
whole-database rollback, native interrupted-device/load behavior and full
identity/federation authority remain separate milestones. The native WebKit
existing-key import issue remains open; no local browser retry or bypass occurred.
Continue from [remaining work](../../REMAINING_WORK.md) after qualified
integration or another explicitly bounded, independent slice.

No release, deployment, force push, source-branch deletion, paid external
execution or change to unrelated or paused automations is included.
