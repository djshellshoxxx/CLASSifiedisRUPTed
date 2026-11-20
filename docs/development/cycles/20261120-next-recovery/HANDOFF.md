# Consolidation continuation: notification and barter recovery

## Current checkpoint

This continuation follows published draft PR #58 at
`25b4708191f04516cab74371c84a15663cc6f6a6` without changing that pending
source again. The local integrated source is
`796c16520365c57562c1328a73d313f3fa614ae4`, tree
`07a135e30d47c5284d120d4dad76f648c26e8444`.

The new branch is `codex/classrup-recovery-next-20261120`. Publish its final
reviewed tree as a separate draft against fresh main, retaining PR #58's
head as its actual parent. This allows combined ancestry qualification while
the predecessor remains stable. Record the actual publication commit and
workflow IDs in the new PR; local and connector-created commit IDs differ.

Last inspected main was `137d88e36cc6b1611b062daa33cf84c3d29c86b3`.
Only PR #58 and preserved draft #8 were open before this publication.
Refresh all heads, PRs and worker activity before a write. Do not overwrite
concurrent work or assume a stale main/check result is still current.

## Completed work

- Added notification acceptance using the production codec registry, actual
  local handlers, encrypted recovery/reopen and continued inbox operations.
  It populates six notification types and 18 records. See the
  [worker handoff](../20261120-notification-recovery/HANDOFF.md).
- Bound barter backup keys to the signed want CID and coordination subject,
  matching ordinary storage writers and the existing shared preflight.
- Preserved `restore_requires_review` through repeated reconstruction while
  keeping replayed terminal outcomes authoritative and clearing the local
  commitment verdict. Recovered trades are not recommitted automatically.
- Added the signed barter lifecycle acceptance and six explicitly limited
  view fixtures. The user sees the supplied freeze reason and can download
  evidence; existing action gates are unchanged. See the
  [barter worker handoff](../20261120-barter-recovery/HANDOFF.md).
- Recorded independent worker-policy, fresh integrated-correctness and
  report/evidence reviews. Source acceptance and executed results remain
  separate from outstanding hosted qualification.

## Qualification

The integrated source passed full TypeScript and 127 selected cases across
21 distinct files, with zero failed/skipped/pending/todo cases. The selection
covers both new suites, surrounding mutiny/notification behavior and existing
backup recovery. Specification, dependency-boundary, registry, setup and build
checks also passed. See [QUALIFICATION.md](QUALIFICATION.md) for commands,
scope, exact source and all retained records.

The initial notification compiler failure from shared dependency symlinks is
preserved. Real pinned offline installs fixed worktree resolution without
source changes. Each new worker suite then passed, followed by the combined
qualification above. Never link another worktree's whole `node_modules`;
use a real `pnpm@10.28.0` frozen install in each checkout.

The preceding checkpoint's complete 811-case suite, 27 tooling tests and
46 local CLI cases belong to that earlier source. They do not qualify new
production changes. Local browser launch remains unavailable; no workaround
was attempted. The candidate still needs actual current-source hosted full
domain, selected native-browser and applicable CLI checks.

## Integration gate and continuation

1. Resolve the new PR by branch name and read its actual head, base, checkouts,
   runs and later review comments. At this writing point PR #58's current
   Alpha `44688571289` and CLI `44688571305` were queued.
2. Preserve each pending source. Do not restart an unchanged queue or replace
   evidence from failed/cancelled/older-source attempts.
3. Keep the new PR draft until its actual current-source gates pass. If a
   predecessor merges first, re-evaluate the candidate's current merge tree
   and appropriate checks against fresh main before integrating it.
4. Merge ordinarily with an expected-head check only after qualification and
   review. Compare actual and tested merge trees, then inspect main-push
   qualification. Preserve every original source branch and original PR #8.

A fresh source review confirmed an older, bounded presentation/state issue:
repeat reconstruction can relabel `reservation_expired` and
`local_reservation_lost` as `conflicting_promise`. The current candidate fixes
only the recovery marker. A separate worker may repair those two documented
local reasons using ordinary repeated-refresh/normalization lifecycle cases.
Keep its source and evidence separate; do not silently fold it into a waiting
published checkpoint.

The three production-reader scenarios now cover the union of all 15
registered record types in separate archives. Attachment/blob references,
kernel outbox/inbox/idempotency/leases/delivery state, identity rotation,
whole-database rollback, interrupted-device recovery and load acceptance
remain open. Native WebKit existing-key import compatibility remains open.

No release, deployment, force push, branch deletion, paid external execution
or change to unrelated/paused automations is part of this continuation.
