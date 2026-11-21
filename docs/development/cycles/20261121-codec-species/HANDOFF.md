# ClassRup — intrinsic Array.map @@species and sparse-registry admission

Checkpoint 2026-11-21 UTC. Bounded draft continuation. This is a source/test change, **not** a completed independent review or release.

## Exact source and ownership
- Repository `djshellshoxxx/CLASSifiedisRUPTed`.
- Parent draft PR #85 published SHA `796a80293881bd57716d353d9192a64d97e60a16`, tree to be checked from GitHub before integration. New remote branch `codex/classrup-codec-species-harden-20261121` created directly from this immutable parent SHA.
- Test-first commit `b09d267f2f24f103c64b1e0d6ab2d7cd65b95d57`; production correction `c8652e011fa09e268947df45b346d55b109aa631`. Re-read live head after this handoff/documentation commit; no ancestor branch or main was modified.

## Source-level defect and bounded remedy
The PR #85 helper uses `Array.prototype.map.call(codecs,...)`, which bypasses a shadowed `.map` but still uses `ArraySpeciesCreate`. A genuine array with a custom `constructor[Symbol.species]` that returns a proxy suppressing property definition can cause the intrinsic mapper to return a **zero-length array**, even while the input contains an invalid codec. Likewise, a sparse array can skip validation of its holes. Neither should acquire or replace a writer token through `openVault`.

The correction uses bounded indexed traversal and `Object.prototype.hasOwnProperty.call` to reject holes. It preserves the original receiver-bound snapshot, malformed-callable checks and generic error normalization; it enforces the already-existing 256 codec cap early and preserves duplicate/reserved-name validation. No encrypted v1 signature/wire bytes, identity keys, index rules, product caps, encryption algorithm, dependency, CI selection or 30-second test timeout changed.

The writer-fence regression adds species-masked and sparse-registry inputs, exercises both public composition paths and checks the existing original session can still commit after each invalid contender. This new test is authored, not yet executed in the application.

## Verification and historical qualification boundaries
- A standalone Node execution demonstrated that `Array.prototype.map.call` returned a zero-length array from the malicious species constructor despite a nonempty invalid input; a reduced indexed-traversal implementation rejected species-masked and sparse cases and accepted a valid codec. This is **not** a product reproduction, a Vitest run, or a TypeScript compile.
- Local GitHub checkout remains blocked by `Could not resolve host: github.com`, therefore no isolated local worktree, pinned dependency install, repository TypeScript, Vitest, full suite or native browser run occurred.
- PR #85 exact published SHA hosted CLI #44872853839 completed success with both Ubuntu Node 22 and 24 jobs; hosted Alpha #44872853840 was **in progress** at the last inspection, its domain browser step not yet complete. Do not classify it as success, restart it without changed condition, or substitute #84 / other-parent results for this child.
- PR #85 had zero submitted PR reviews. The old November 19 local full-run exit 137 remains incomplete, and historical failed/cancelled runs retain their original outcomes.

## Fresh independent review assignments — **not started/complete**
1. **Code audit:** isolated checkout of actual child remote head and exact #85 parent; inspect traversal semantics under arrays, proxies, sparse arrays, inherited indexes, getters, species, duplicate/reserved/cap parity, callable binding and double snapshot; inspect TypeScript inference. Record exact SHA/tree, commands, findings and actual executions.
2. **Functional bug hunt:** separate isolated checkout and pinned install; run typecheck, focused vault and IndexedDB writer-token regressions **serially**, then normal create/unlock, encrypted v1 export/restore, indexed reopening and stored record/index compatibility. Where practical prove prior #85 fails the new species case and current child passes. Inspect this child head's hosted Alpha, native browser and CLI jobs; preserve counts/skips, don't rerun killed unchanged full suites.
3. **Defensive security review:** separate source-focused review of arbitrary codec-array inputs and constructor/getter effects, writer-token revocation ordering, close-on-failure, tenant/identity isolation and error channels. Treat untrusted-codec trust boundaries as unproven pending product composition evidence; no interrupted reproduction follow-ups.

Each review lane must leave a new exact-source handoff with verified tests, failures, blockers and fresh successor instructions before being marked complete. These scopes alone do not constitute spawned workers or approvals.

## Next feature and integration gate
Main already carries mixed 15-production-codec encrypted restore/reopen coverage; do not duplicate. Subsequent bounded P1 scope may address excluded attachment/reference recovery or interrupted-device recovery only after versioning, owner authority and atomic semantics are agreed and current source inspected. Preserve v1 compatibility and exclusion policies.

Keep this child draft until its **own exact-source** Alpha/domain/browser and applicable CLI checks pass and independent reviews complete. Qualify stacked ancestors, compare prospective and actual merge trees and inspect main-push qualification before integrating. Do not merge draft #8 wholesale; no release, deployment, force push, branch deletion, paid API, unrelated automation edits or claim of credits exhaustion.
