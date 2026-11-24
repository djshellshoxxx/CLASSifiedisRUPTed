# ClassRup — persist-failure rollback of final attachment holder and blob

2026-11-21 UTC. Bounded P1 attachment-reference recovery **test-only** continuation, not portable-attachment backup, not a release, and not an independently completed code/security audit.

## Exact remote source and ownership

- Repository: `djshellshoxxx/CLASSifiedisRUPTed`.
- Frozen upstream: draft PR **#87**, `codex/classrup-reference-persist-rollback-20261121`, published SHA `b3b2f676a617a4795351948695922fe6a3ed28e9`. GitHub compared this SHA to its current branch ref and returned **identical, 0 ahead / 0 behind** before forking.
- New child: `codex/classrup-reference-delete-persist-rollback-20261121`, created directly from that SHA. Test implementation commit: `ba8ff73f9a7f35dd0ef57c6b93d637b8a951bf3d` (only `tests/integration/attachment-reference-coverage.test.ts` changed). This handoff is a later documentation commit; inspect actual live ref, commit and tree rather than assuming no concurrent changes.
- Ancestor attachment PR #68 is still a separate draft. The vault codec preflight series #79–#86 has different ownership, and was not modified. Main's mixed 15-production-codec encrypted restore/reopen acceptance is already in the merged #63 history; do not duplicate it.
- No original local-only history, conflicting draft #8 work, or unrelated branch is being integrated.

## Newly added acceptance

PR #87 already tests a failed asynchronous durable persist **when adding** holder rows, then checks both tenant indexes roll back and an owner-only retry commits. The complementary removal path was untested: when a transaction removes a stored blob's final holder, the lifecycle code also stages deletion of the blob's bytes. A failed persist must undo both the reference rows and the blob row without confusing another tenant's references to the same content address.

The new 30-second integration test:
1. Seeds an owned P0 blob and two owned holders; a second tenant references the same content address without owning bytes. One successful persist is required.
2. Attempts to remove both owner holders (the last removal stages blob deletion) and the foreign holder, then rejects from the asynchronous `createMemoryDriver({kind:'indexeddb',persist})` callback.
3. Verifies owner counts remain exactly one present reference/two holders/no missing bytes, the foreign reference remains one missing reference/one holder, the owner's blob bytes and holder metadata survive, and no foreign blob was created.
4. Accepts a subsequent successful removal of only one owner holder, verifies persisted attempt count and both tenants' final counts, and leaves the remaining owned holder intact.

This is the journalled working-set persistence injection used by the IndexedDB adapter, **not** a real IndexedDB transaction abort or native device crash. No production function, signed/encrypted backup v1 format, identity, cryptography, index rule, record type/size cap, test timeout, workflow selection or dependency was changed. A baseline failing test was **not** executed; this is an additional positive acceptance, not a demonstrated repair.

## Observed qualification and limits

- PR #87 exact commit `b3b2f676...`: Alpha verification [44877695479](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44877695479) completed **success**. Its domain job [136766707332] reported **828 passed, 0 failed/pending/skipped/todo** domain assertions and 27 tooling tests. Its browser task ran **26 Chromium journeys passed** on this source. Do not import the separate 78 three-engine journeys from unrelated PR #86.
- PR #87 CLI [44877695476](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44877695476) completed **success** with Ubuntu Node 22.18.0 and 24.x jobs. Inspected Node 22 log reports 46 CLI tests, zero skipped, and dev/preview Chromium smoke success.
- Source inspection of `packages/kernel/src/storage/memory-driver.ts` confirms `commit` calls `persist(changesOf(state,journal))` and on rejection invokes reverse-order `undo(state,journal)`. `MemoryState.write` also updates `groups` and `blobRefKeysByTenant`. `tx.ts` explicitly removes stored bytes on final-holder detach. These are static code observations.
- Local `git ls-remote` failed `Could not resolve host: github.com`. No actual isolated local worktree, pinned pnpm install, local TS/Vitest/browser product test or fresh native IndexedDB abort test was possible. **This child has not yet completed its own required hosted CI or independent reviews.**
- The historical November 19 full domain exit 137 without final JSON report, original failed/cancelled main-push outcomes and skipped jobs remain original evidence; no reruns were requested.

## Pending fresh, distinct review lanes (not completed by this document)

1. **Code audit:** isolated worktree on exact child SHA; compare to #87; prove seed and failed persist perform real staged writes/deletions and reverse journal restoring both `blob_refs` and `blobs`. Check `MemoryState.write`/index cleanup, change ordering and liveness under churn. The source `ungroup` does not delete empty `groups` entries; determine whether this is a meaningful memory-retention defect under bounded workload before proposing a code change.
2. **Functional bug hunt:** separate worktree, frozen dependencies and serial `corepack pnpm typecheck`, focused `tests/integration/attachment-reference-coverage.test.ts`, blob lifecycle and storage rollback tests; evaluate baseline vs child, then native fake IndexedDB failed commit and recover/reopen. Inspect exact-child hosted Alpha and CLI job logs, count actual assertions/skips and report setup failure distinctly.
3. **Defensive security review:** read-only/source-focused checking that failed last-holder deletion cannot falsely shred bytes, that cross-tenant holder cardinalities remain isolated, that no refs/bytes leak via diagnostics, and that interrupted persistence cannot result in an unacknowledged deletion. Do not resume interrupted reproduction follow-ups.

Each independent worker must publish its actual frozen source SHA/tree, commands, observations, failed/passing evidence, remaining findings and a fresh successor handoff. Written assignments are not spawned or approved workers.

## Integration and next feature

Keep this child and its upstream PR #87/#68 **draft** until current exact-head required Alpha/domain/browser and CLI gates, actual independent reviews and qualified ancestor order are complete. Verify prospective and actual merge tree and main-push qualification on any future ordinary merge. Follow-on P1 attachment work needs a versioned authenticated manifest, holder provenance/authority, missing/foreign blob admission, cross-device and interruption guarantees; excluded `blobs`/`blob_refs` remain out of v1. Main already contains the mixed production-codec encrypted restore/reopen slice.

No release, deployment, force push, branch deletion, paid API, unrelated automation change, or claim of observable credit balance. If an explicitly reported budget exhaustion occurs, stop and preserve its exact message; DNS failures and queues do not establish exhaustion.
