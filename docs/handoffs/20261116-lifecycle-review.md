# Fresh listing lifecycle review — November 16, 2026

## Reviewed checkpoint

- Working branch: `codex/parallel-completion-20261116`; base `560b328dd335aebdc12de01ec339c43ebd164be3`.
- Read the preceding inventory handoff, actual lifecycle implementation, listing/archive/history schemas, signed-publication validator, repository cursor implementation, production archive backup codec and F01.S01.M04 specification.
- Review covered `packages/bazaar/src/listings/{lifecycle,archive,index,model,history}.ts` and their focused tests. It does not qualify subsequent UI edits, a remote candidate SHA, or a production release.
- This reviewer modified no runtime files and made no remote writes.

## Findings and disposition

No additional high-confidence domain defect was found in the reviewed expiry/closure/archive implementation. Owner authorization, optimistic revision checks, publication signature/chain checks, page-atomic mutation, immutable first end date, exact restore-window calculation and explicit unpublished restore are supported by the inspected code and focused execution evidence.

One integration boundary remains material: `releaseHolds: true` changes local inventory holds, but does not generate the corresponding signed Mutiny withdrawal or transition the related coordination record. The current barter UI handles that separate signed withdrawal when the owner explicitly withdraws from an exchange. A listing closure must not be presented as cancelling a peer's commitment or completing a trade. Prefer the product close/archive actions without hold release until the owner withdraws in barter; any exposed local release must explain this limitation. This issue was sent to the implementation team and root for UI integration.

`packages/bazaar/ALPHA_SCOPE.md` still described automatic lifecycle sweeps as absent at review time. The final documentation pass should distinguish the new implemented local sweep from the remaining canonical lifecycle work.

## Executed verification

`corepack pnpm exec vitest run packages/bazaar/src/listings/lifecycle.test.ts packages/bazaar/src/listings/listings.test.ts tests/integration/archive-backup.test.ts --maxWorkers=1`

Result: **42 tests passed across 3 files**. This covers existing listing compatibility, close reasons, owner/stale-revision refusal, hold-release rollback, expiry boundaries, sweep pagination, offline catch-up, repeat safety, signed statement re-download, corrupt publication rejection and encrypted archive backup validation.

Two additional independent Node executions used the actual test kernel, production identity signing and envelope verification:

1. Published listing expired; owner closed it; the 30-day sweep archived it; restore exactly at the 90-day deadline succeeded; republishing continued the signed chain at sequence 3. All transitions succeeded and the restored state remained unpublished until explicit publication.
2. A two-listing expiry sweep signed/staged the first withdrawal, then the signer rejected the second. The command failed, both listings remained published at revision 2, no archive evidence persisted and no events escaped. This checks rollback after staged earlier work, not merely failure on the first item.

The Node checks were inline review probes, not committed regression tests. Browser acceptance and final combined-tree tests remain the parent team's responsibility.

## Remaining feature scope

This is a safe local alpha lifecycle slice, not full F01.S01.M04 completion. Remaining requirements include content/evidence purge and account-deletion integration, signed reservation-release coordination, quantity/sold-out automation, renewal/reminder contracts, canonical relay tombstone delivery, lifecycle abuse limits, comprehensive retained-evidence recovery and manual/browser performance qualification. Existing alpha per-subject signed chains and local wall-clock claims remain explicit compatibility limits.

## Next handoff

1. Integrate startup/periodic owner sweeps with session guards and visible failure status; do not let a maintenance failure destroy otherwise readable vault access.
2. Expose expiry/closure status and an explicit way to download retained withdrawal evidence without automatic external delivery.
3. Preserve owner-only backup validation for the new ended record shapes and test the final app composition.
4. Run final combined type/build/domain/CLI checks, then record browser and OS evidence for the exact candidate SHA.
5. Keep purge, cross-party withdrawal and other incomplete contracts pending; never infer their completion from these passing lifecycle tests.
