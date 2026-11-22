# ClassRup — sync retry attempt admission and successor handoff

Checkpoint: 2026-11-22 UTC. Isolated bounded P1 storage/delivery-state correction; **no merge, release or deployment**.

## Fresh-source identities and ownership

- Repository: `djshellshoxxx/CLASSifiedisRUPTed`.
- Parent draft PR #109, branch `codex/classrup-record-put-index-shape-20261122`, verified remote head `a94694cb79964762403d99c4b81290589605762f` unchanged immediately before this branch was created.
- Isolated branch `codex/classrup-sync-attempt-admission-20261122` created from that exact remote SHA; do not merge local-only review commits into their published counterparts.
- Test-first commit `c6ab94719b03e0c01f30c93ace03d5a3646fd2bd` changes `packages/kernel/src/storage/contract-suite.ts`.
- Source correction commit `e88881823a2d9d44598c429e1edc768dce858518` changes `packages/kernel/src/storage/tx.ts`.
- This handoff is documentation only. After publication, retrieve the actual final head/tree and record exact PR/CI source identities separately.
- No independent worker claimed ownership of these two paths in the inspected current PR #109 or review listings. The existing PR chain remains draft and must not be rewritten.

## Source-identified defect and repair

`tx.sync.transition(id, event, patch, now)` previously persisted `patch.attempts ?? row.attempts` without runtime integer validation. A caller bypassing TypeScript could provide a negative, fractional, non-finite, unsafe or nonnumeric retry count, potentially leaving inconsistent durable delivery state across memory, SQLite and IndexedDB. The ordinary sync retry path exercises this transition. This is a source-confirmed input-admission gap; no external exploit is asserted.

The shared transaction boundary now rejects a supplied `attempts` value unless it is a nonnegative safe integer, **before reading or changing a delivery row**. Undefined preserves the existing count; zero and ordinary positive values remain valid. No state-machine edges, delivery scheduling, signed statements, archive versions, canonical keys, identities, encryption, limits, crypto vectors or timeouts change.

The test-first shared contract adds one cross-adapter case covering eight invalid runtime values, unchanged stored entry after each rejection, accepted zero, and normal increment to one. Existing memory, SQLite and fake-IndexedDB suites import the shared contract. **The test-first commit was not executed RED**, and the repository suite was not run locally.

## Evidence and restrictions

- At fresh inspection, PR #109 exact published head `a94694cb79964762403d99c4b81290589605762f` had **Alpha run 44987033921 SUCCESS** (typecheck, static gates, full domain job, production build and browser journeys all succeeded), and **CLI run 44987033943 SUCCESS** (two Ubuntu Node 22/24 jobs). These are parent-source runs and do **not** qualify this child.
- PR #109 had zero submitted GitHub reviews. PR #108 also had zero submitted reviews when inspected.
- PR #105 Alpha `44968879520` remains **FAILED** in Firefox browser checkbox interaction, although its other domain/static/build steps succeeded. Its CLI `44968879523` succeeded. Later descendant success does not rewrite this historical failure. The 2026-11-19 complete local domain run exited 137 without a report; PR #56 main-push Alpha cancellation and other prior setup failures remain preserved.
- This host still reports `fatal: ... Could not resolve host: github.com` from `git ls-remote`; no genuine local worktree, full compiler, Vitest, SQLite, IndexedDB or browser test executed. A separate Node 22 copy of the guard logic accepted four expected valid/default values and rejected eight malformed samples. This is **standalone predicate evidence only**, not product qualification.
- Before considering merge, verify current-source hosted Alpha and CLI through job steps, exact final PR head/tree, genuine independent review, qualified ancestors in order, actual merge tree and main's **separate** push runs. Never restart unchanged queued or resource-killed checks merely to obtain green results.

## Three successor review assignments — **not executed independent reviews**

1. **Fresh code-audit worker:** In an isolated worktree at the exact published head, inspect `SyncTransitionPatch`, `syncStore.transition`, all callers, the memory/SQLite/IndexedDB paths, and the new shared test. Verify zero/undefined semantics, genuine compatibility, and no unintended state-machine change. Record source SHA/tree, commands, findings and exact test evidence.
2. **Fresh functional bug-hunt worker:** Run the test commit on its original pre-fix source for RED where possible and current fix for GREEN; serialize all three storage contract suites, normal repository typecheck/static/build and required hosted/browser qualifications. Verify rollback/unchanged durable state and normal delivery retry. Do not interpret a setup failure or a standalone predicate as an executed product test. Investigate #105's failed Firefox checkbox journey only with a targeted new condition or reproduction.
3. **Fresh defensive security-review worker:** Review input-trust boundaries of sync transition counters, tenant/destination scope, statement authenticity, retry scheduling and invalid runtime values for fail-closed state preservation. Review/harden defensively without offensive reproduction follow-ups. Independently document exact source, executed vs static-only scope and prioritized confirmed findings.

When these reviewers genuinely finish, reconcile their evidence, integrate only qualified repairs, and pass an exact handoff to the next fresh set. The current tool context does not expose a distinct worker executor, so this document is an assignment, **not** a claim that three workers were launched or approved.

## Next P1 work and integration boundary

Mixed production-codec encrypted restore/reopen is already merged via #63. The next bounded P1 milestones remain attachment/reference portability, queue/delivery/lease recovery, rotation and interrupted-device acceptance, and native WebKit existing-key import compatibility. Preserve existing v1 signatures, signing identities, encryption and test limits. Do not indiscriminately merge incompatible draft #8.

Do not merge this draft while current-head qualification, independent review or ancestor gates remain unresolved. No release, deployment, force push, branch deletion, paid external API or modification of unrelated/paused automations is authorized. The credit balance is not observable; a GitHub queue or failed DNS lookup does not establish budget exhaustion.
