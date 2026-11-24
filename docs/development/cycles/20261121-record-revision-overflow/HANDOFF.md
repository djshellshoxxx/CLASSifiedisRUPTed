# ClassRup — safe revision increment ceiling / engineering handoff

Checkpoint: 2026-11-21 UTC. This is a bounded draft candidate, **not** independent review approval or a local application-test report.

## Source identity and ownership

- Repository: `djshellshoxxx/CLASSifiedisRUPTed`.
- Frozen base: draft [PR #104](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/104), branch `codex/classrup-record-revision-safeint-20261121`, observed published head `31ec52aaa52536801051252aa4f6a08673fafc0e` at start of this slice. Parent branch was not modified.
- This isolated branch: `codex/classrup-record-revision-overflow-20261121`, created from that exact remote commit (no local-only commit ancestry replay).
- Test-first commit `9fdfa64491b643dac7e8094c4f746e0ea1bd9054`; implementation commit `ed8946f947e9ec1574d1bdc8641d08c68ed61560`; test-comment precision commit `b662e86f7ad364bc1d146c0a528b1228ba69772e`. Inspect final published head/tree after this handoff commit.
- Changed files: `packages/kernel/src/storage/contract-suite.ts`, `packages/kernel/src/storage/tx.ts`, and this handoff only.
- Main was observed at `449a619f1ae7b66cb42d9cab43dd5493bfe42c2e`, including merged mixed production-codec encrypted restore/reopen acceptance. Do not repeat that feature. The next broader outstanding recovery boundaries are attachment/reference restoration, delivery/lease state, key rotation and interrupted-device recovery.
- No releases, deployments, force pushes, branch deletion, paid external APIs or unrelated automation changes.

## Bounded source-confirmed correctness defect

Parent #104 changed the shared optimistic-concurrency input guard to `Number.isSafeInteger(expectedRevision)`. It still allowed a *valid* CAS at `Number.MAX_SAFE_INTEGER` on a row already at that revision; `recordStore.put` then calculated `cas.value + 1` without checking the result. JavaScript can represent 2^53 itself but cannot represent every adjacent integer beyond its safe integer limit, breaking the contract's exact revision identity.

The code now throws a `RangeError` before any upsert if successful CAS would increment `Number.MAX_SAFE_INTEGER`. Ordinary creation, 1→2 updates, missing-record and stale-CAS errors remain unchanged. It does not modify signed v1 bytes, identity, crypto, limits, runner selection or backup codecs.

The new shared storage-contract regression creates a row at the largest safe revision through the existing `tx.records.restore` API, checks a failed overflow update leaves the record unchanged, and preserves stale-CAS conflict semantics. This suite is shared by memory, SQLite and fake IndexedDB.

## Qualification and evidence

- Parent #104 **exact-head** GitHub Actions on `31ec52aaa52536801051252aa4f6a08673fafc0e`: [Alpha #44963838665](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44963838665) completed **success** (plan and domain jobs, typecheck, tests, setup/build, browser journeys all reported success). [CLI #44963838653](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44963838653) completed **success** (plan and both Ubuntu Node 22/24 clean-install jobs). These results qualify **only the parent**, not this new candidate.
- Parent #104 has zero submitted independent reviews at observed inspection. A green workflow alone does not authorize integration.
- A direct local GitHub checkout/worktree was attempted and failed with `Could not resolve host: github.com`. No local TypeScript, Vitest, browser tests or baseline RED test were performed. This is an **access/setup blocker**, not a product test failure.
- The new test was committed before the production correction, but was **not executed RED**. Inspect this final published source's own hosted Alpha, browser and CLI job steps, assertion counts, skips, and any failures. Do not assign the parent successes to this child. Do not restart queued CI or kill/restart unchanged full suites without a changed condition.
- Preserve historic November 19 local domain exit 137 without report; separate PR #56 main-push Alpha cancellation and CLI success; PR #57's qualified main-push successes; and all other historic failures/incomplete checks.
- Independent code review, normal functional bug hunt and defensive security review on **this source** are outstanding. The connected interface does not spawn separate autonomous workers; author self-review does not count.

## Three distinct successor review assignments

1. **Independent code audit:** on frozen published refs and separate worktrees where possible, review `records.put`/`records.restore` and all CAS callers for valid expected-revision ceilings, adapter integer bindings, `RangeError` behavior and compatibility with prior versioned record semantics. Review whether imported out-of-range revisions also need bounded admission. Run typecheck and focused contract tests serially; record exact commits/tree and logs.
2. **Normal functional bug hunt:** execute this new shared regression on test-only commit `9fdfa64491b643dac7e8094c4f746e0ea1bd9054` (expect RED) and exact final fix (expect GREEN) across memory, SQLite and fake IndexedDB. Check update rollback, reopen after failure, normal 0→1 and 1→2 transitions, stale MAX_SAFE-1 conflicts, and accidental acceptance of unsafe import revisions. Distinguish fixture/setup failures from actual application bugs.
3. **Source-focused defensive security review:** inspect the bounds of restored/signed record revisions, serialized integer round trips and authorization assumptions around CAS. Remediate genuine source-backed hardening gaps only. Do not resume interrupted offensive reproduction follow-ups; no penetration or external attacks are authorized here.

Every completed worker should publish source/tree identity, evidence, defects repaired, remaining gates and next-worker instructions. Maintain frozen parent ownership. Merge only after the child and each necessary ancestor passes its own required current-source checks and genuinely independent reviews; then verify the resulting main merge tree and separate push qualification.

The older paused ClassRup automations and unrelated engineering automation jobs remain unchanged. No owner credit balance is observable; no exhaustion claim.
