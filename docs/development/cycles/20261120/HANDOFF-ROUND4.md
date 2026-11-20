# ClassRup consolidation and recovery qualification — round 4

## Current integration source

This owner-requested continuation starts from draft PR #58 at
`38ada90037d8176b0e0e319651b712cc396cad5d`, tree
`8502bd83d5393a7513ee0a939df63d5d3665068d`. Its base is the actual PR #57
main merge `137d88e36cc6b1611b062daa33cf84c3d29c86b3`.

The integrated local runtime/test checkpoint is
`d92f20bcdba146cd5d3d482ee830210e2bdb1ae2`, tree
`0238e6ad6a9add7d712e3b5bf5ff0eabf993d870`. It combines the reader-acceptance
worker commit `a2912f9a51baa5ecbd7db2b913b553e05501aab0` and redaction worker
commit `f22e88507ac8f58487d7f125650dad8b0a6ac429` through local integration
commits `b0329a5c` and `d92f20bc`. Documentation closeout comes after that
source checkpoint. The PR's current head and publication receipt identify the
durable remote commit; do not assume local and connector-created commit IDs
are interchangeable. Compare trees and read fresh remote state.

## Work completed in this cycle

1. Reviewed the complete current branch inventory. There were 64 remote branch
   names including main. All 57 original non-main heads remain unchanged.
   The [reader handoff](../20261120-reader-recovery/HANDOFF.md) records the
   disposition counts. No additional wholesale branch merge is qualified.
2. Independently reviewed PR #58's production-registry extraction and rollback
   scenario. The registry literal is byte-identical to main. Both PWA vault
   entry points use it. See [code review](CODE-REVIEW-ROUND4.md) and
   [defensive review](DEFENSIVE-REVIEW-ROUND4.md).
3. Added normal-reader recovery acceptance using real owner commands, signed
   peer retention and six populated production record types. The scenario
   checks owner listing/detail, publications, paginated history, archives,
   peer search and public/private location views before export, after restore,
   and after reopen. It restores an archived listing and republishes through
   the recovered signing identity and existing CID chain. See the separate
   [functional review](../20261120-reader-recovery/FUNCTIONAL-REVIEW.md).
4. Selectively recovered PR #8's conventional secret-field vocabulary into
   the existing kernel log redactor, including both historical `RELAY_SECRET_*`
   and canonical `CLASSRUP_SECRET_*` names. Existing field dropping, IP
   truncation, event-ID-only messages and Error-detail removal are preserved.
   See [source provenance](PR8-REDACTION-RECOVERY.md) and
   [independent review](PR8-REDACTION-REVIEW.md). The incompatible PR #8 runtime
   is not merged, and the wider secrets/relay module remains unfinished.
5. Corrected the vault coverage link and generated-subset fixture wording.
   Updated the remaining-work register to distinguish qualified PR #57 from
   the current candidate. Earlier failed, cancelled and incomplete evidence
   remains intact.

## Executed qualification at this writing checkpoint

- Pinned dependency installation passed with pnpm 10.28.0 and Node 24.22.3.
- Original PR #58 head: complete TypeScript check passed; all four focused
  mixed-codec, subset-compatibility and rollback/retry cases passed.
- Original PR #58 full local domain invocation was killed by signal 9 after
  257.938 seconds. It produced no final report. The cause is not established;
  no test total or passing suite is claimed for that invocation.
- Integrated `d92f20bc`: complete TypeScript check passed. Eleven focused
  recovery/redactor/logger cases passed with zero failed or pending cases.
  The new recovery-reader case completed within its unchanged 30-second cap.
- Complete integrated domain qualification passed in eight
  sequential groups with isolated fork workers, one worker at a time and a
  1,024 MiB Node heap cap. This changes process isolation to address the killed
  monolithic run; it does not change test assertions or per-test limits.
  All 811 cases passed across exactly 89 configured files, each represented
  once, with no other case statuses. Independent review checked the reports
  and hashes. Tooling (27), CLI tests (46), static gates, setup, repeat setup,
  doctor and build also passed.
- Local pinned browser installation failed with HTTP 403 before any browser
  journey ran. System Chromium also aborted before opening a page because its
  singleton socket was denied. These are environment/setup results, not
  successful browser qualification.

Final gate results and receipts are in [QUALIFICATION-ROUND4.md](QUALIFICATION-ROUND4.md).
Any incomplete checkpoint above is superseded only by a separately identified
executed result, never by relabeling the original attempt.

## Hosted qualification and integration

Main's own PR #57 push workflows `44671014883` (Alpha) and `44671014863` (CLI)
completed successfully. They do not qualify the new candidate.

At the latest pre-publication inspection, original PR #58 head `38ada900` still
had Alpha `44683798145` pending and CLI `44683798168` queued. Its earlier source
runs remain historical cancelled observations. A changed published candidate
requires fresh current-head checks; record their actual IDs and status in the
PR. Do not restart an unchanged queue or repeatedly push cosmetic changes to
an otherwise stable candidate while qualification is pending.

Keep the candidate draft until its current-source Alpha domain and selected
browser journeys, required CLI jobs and independent reviews are complete.
Then integrate normally with an expected-head check, compare the actual merge
tree with the tested PR merge tree, and inspect main's own push qualification.
Do not substitute older PR/main results or local-only results for hosted gates.

## Next fresh worker

Read this handoff, final qualification, the current PR body, current remote
heads and any later handoff. Preserve existing worker ownership. Prioritize an
actual failed current-source gate or confirmed defect before adding source to
the stable candidate. Keep a further independently scoped slice on a separate
branch while its predecessor is waiting for CI, rather than repeatedly
cancelling unchanged qualification.

Notification/reservation/barter recovery reader coverage and actual encrypted
IndexedDB interruption handling remain distinct next acceptance slices.
Attachment/blob references, delivery/queue/lease state, key rotation, complete
database recovery and device/load acceptance remain outside this bounded
record backup. Native WebKit existing-key import compatibility remains open;
never rotate the identity or weaken the diagnostic vectors to hide it.

No release, deployment, force push, source-branch deletion or paid external
execution is part of this continuation. Existing unrelated and paused
automations remain unchanged.
