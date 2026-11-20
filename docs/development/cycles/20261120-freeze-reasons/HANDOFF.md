# ClassRup engineering continuation — local freeze reason preservation

## Exact ownership and source

This isolated bounded change is stacked **on** the published draft PR #59 source:
`86cd564e0692e8c777538200675dc20f2651ab51` (tree `ca413cdad0612f8e602f1ec98e499fd589d68906`).
It does not modify PR #58 (`25b4708191f04516cab74371c84a15663cc6f6a6`), PR #59, main or preserved draft #8.

New source/test checkpoint before this documentation file:
`cfa652e075190c27c3947ef65bed30b922e77d5b`;
tree `0ef1185cf68c3fe749365017b2612ddc896c5842`.
Its parent production commit is `db39909a98602ded0ab1b5448cd0d8ba2f5490fb`.
The published branch is `codex/classrup-freeze-reasons-20261120`.

The frozen reason drift is explicitly recorded in
`docs/development/cycles/20261120-next-recovery/HANDOFF.md` and
`CORRECTNESS-REVIEW-G6.md`: ordinary repeated reconstruction could overwrite
persisted `reservation_expired` and `local_reservation_lost` reasons with
`conflicting_promise`.

## Implemented bounded source change

`packages/mutiny/src/trade_proposals/repository.ts` now keeps those two
specific locally persisted freeze reasons when verified signed-evidence replay
reaches `proposed` or `committed`. It retains PR #59's separate
`restore_requires_review` behavior, including clearing its cached local
commit verdict. If signed replay yields a terminal state instead, that result
wins over the cached local reason. All other fallback behavior continues
through `freezeConflict`.

This modifies no signed envelope, signature, v1 backup format, identity,
proposal schema, product cap, timeout or CI selection. The local reason is
*not signed proof* of a remote reservation outcome. Frozen status remains
terminal; this change does not recommit or resolve it.

`tests/integration/production-barter-recovery.test.ts` adds replay checks
for both local reasons using the genuine signed lifecycle evidence already
constructed by the existing test, then exercises an ordinary
`bazaar.inventory.release` followed by two normal
`mutiny.coordination.refresh` calls. The repeated refresh must retain
`local_reservation_lost`. The manufactured cached-reason portion is
explicitly a local-state fixture, not a real expiry or native interruption.
This test remains under its existing 30-second limit.

## Qualification / limitations

This cycle had **no executable local repository checkout**: the container
could not resolve `github.com` to clone. No local TypeScript, domain,
browser or security test has been executed against this new source. The
source was changed through GitHub's contents API, read back and compared
against the parent. The required current-source hosted Alpha/domain/browser
and CLI jobs must execute before merge.

At this checkpoint, PR #58's Alpha `44688571289` and CLI `44688571305`,
and PR #59's Alpha `44689824044` and CLI `44689823917`, each exposed a
queued `plan` job and no passing source qualification. Do not restart
unchanged queues; do not count earlier source qualification for this change.

Preserve the predecessor's original local successes and failures, including
PR #58's 811-case sharded pass and killed monolithic attempt, and PR #59's
127-case selected pass and fixed symlink-related compiler failure. They are
not results from this new source.

## Required fresh independent review lanes

1. **Code audit:** review the exact changed source and test, reason precedence,
   signed terminal state behavior, repeated reconstruction and consistency
   of historical `committedLocallyAt` fields. Leave reviewed commit/tree,
   exact findings and test evidence; do not count static inspection as tests.
2. **Functional bug hunt:** execute the ordinary hold-release and refresh case
   with a pinned isolated checkout. Add an ordinary clock-expiry case that
   exercises `reservation_expired` without synthesizing a cached reason.
   Confirm recovery-review marker, signed withdrawal/terminal precedence and
   existing fixtures remain unchanged.
3. **Defensive security review:** trace verified signed evidence, owner
   identity, cached reason trust boundary and the normal hold-release policy.
   Confirm no restored cache can authorize consent/recommit; use source-focused
   defensive review and remediation only. Do not resume the interrupted
   reproduction follow-ups.

Fresh reviewers must report exact source/commit, test commands, log/exit
results, original failed or interrupted runs, outstanding findings, and
handoff instructions for the following set. These are assignments, **not
completed reviews or worker runs**. Do not merge before independent reviews
and current-source gates pass.

## Integration sequencing

Keep this PR draft. PR #58 and PR #59 are separate unmerged predecessors;
do not merge this stacked branch ahead of either. When the predecessors are
qualified and integrated normally, re-check main, ancestry, the exact
prospective merge tree and whether a fresh PR source qualification is needed.
After any authorized merge, verify actual merge tree and main's own push
qualification. No release, deployment, force push, branch deletion,
paid external API or changes to unrelated automations.
