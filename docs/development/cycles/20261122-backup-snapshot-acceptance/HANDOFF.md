# ClassRup engineering continuation — three-adapter atomic inspection acceptance

Date: 2026-11-22 UTC. This **test-only** bounded continuation starts from observed published draft PR #125 head `9c348f88ec6ea9886b016135827e0a5667f50a51`, branch `codex/classrup-backup-atomic-inspection-20261122`, not from obsolete 2026-11-19 local-only commits. New isolated branch `codex/classrup-atomic-backup-snapshot-regression-20261122`. Initial published regression commit `d07247ec8f45bfe6cb08fcd48ca981b2a67557af`. Resolve actual current head/tree and workflow runs after publication.

## Implemented and why

The parent's product implementation provides a single principal-scoped record/attachment inspection snapshot, but its product-facing test only exercised the memory adapter and did not force a write between the storage read finishing and delivery of the result. This acceptance adds one shared three-adapter regression (`tests/integration/backup-inspection-atomic-snapshot.test.ts`) using **real memory, SQLite and IndexedDB storage instances** rather than substituting a fake backup-coverage result. A narrow read decorator commits one new record and one missing attachment holder **after** the inspection read transaction completes but **before** the result returns. The original preview must show one record and zero holders; a fresh subsequent preview must show two records and one missing holder. Asserts no identifier or private payload leaks and a locked session cannot inspect again.

The test intentionally checks that only one underlying read was needed for the first inspection; had record and attachment coverage been obtained in separate reads, the intervening mutation could produce a mixed snapshot. This verifies the existing feature rather than changing production code. No v1 wire, encryption, signing identity, restore admission, storage schema, product cap, timeout or deployment behavior changed. This does **not** implement portable attachment bytes/holder recovery or delivery/lease recovery.

## Qualification and history

The direct parent PR #125 exact-head Alpha #45068797796 and CLI #45068797718 completed successfully: Alpha plan and domain jobs (including domain assertions, typecheck, static/build and browser journeys), CLI plan and Ubuntu Node 22/24 jobs. These are **parent source only** and cannot qualify this new test commit. At authoring, no current-source local Vitest, TypeScript, browser, or build execution occurred: `git ls-remote` failed `Could not resolve host: github.com`. Obtain the new PR's actual current-head Alpha/CLI jobs and inspect individual steps; a queued/in-progress run is not a pass.

Preserve original #120 Firefox notification failure, #116 Alpha failure, #105 Firefox failure, cancelled #56 main-push Alpha, and the original complete local domain runner exit 137 as separate historical/incomplete evidence. No historical or parent result substitutes for this source. Current branch remains draft pending actual gates and genuine independent reviews.

## Three distinct successor lanes — assigned, not yet executed

1. **Independent code audit:** inspect the test's read decorator and transaction lifetime against real memory, SQLite and IndexedDB semantics, ensure no interleaving deadlock or false-positive behavior, and audit PR #125's atomic implementation, identity and v1 compatibility. Return exact head/tree, commands, failures and a successor handoff.
2. **Functional bug-hunt:** execute this new test plus `packages/vault/src/backup-coverage.test.ts`, `tests/integration/backup-coverage.test.ts` and `tests/integration/attachment-reference-coverage.test.ts` serially. Try optional diagnostic failures, lock during read, and subsequent reopen where supported; then existing unchanged full gates and browser engines. Do not widen timeouts or count partial/killed suites as passes.
3. **Defensive source security review:** inspect principal scoping, private blob/ref and payload non-disclosure, read-only isolation, session revocation and generic error handling. Limit to review/remediation, not interrupted exploitation/reproduction follow-ups; report static-only results separately from any executed tests.

No new independent workers can be launched by this GitHub-only environment. These three requests are **not** approvals or completed reviews; coordinate external worker ownership before editing their files. Next substantive P1 implementation after qualifying this regression remains an authenticated and compatible attachment/reference recovery slice, or delivery/lease-state recovery if that slice is owned/blocked; read `docs/development/REMAINING_WORK.md` and fresh handoffs again.

No release/deployment, merge, force push, branch deletion, paid API, change to older paused tasks or unrelated automation modification. Owner credit balance is not observable; do not infer exhaustion.
