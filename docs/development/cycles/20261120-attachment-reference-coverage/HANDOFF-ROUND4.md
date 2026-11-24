# ClassRup attachment reference coverage — round 4 boundedness repair / review handoff

Date: 2026-11-20. Repository `djshellshoxxx/CLASSifiedisRUPTed`, draft PR #68, branch `codex/classrup-attachment-reference-coverage-20261120`.

## Exact source identities at this checkpoint

- Remote `main` observed at `449a619f1ae7b66cb42d9cab43dd5493bfe42c2e`; baseline tree `8fe1965ae60c385042f09c690eabe7d0828b36e8`.
- Incoming branch head: `259f84204561c82d1138f252771564a02ea5916c` (round-three test and handoff).
- Production boundedness repair: `d91807be1e9776d73ab7110d16465a5d9c982fdd`.
- Contract-corrected rollback/lifecycle test: `4b835119772d92d83388d37f52d3e5dbb125a998`.
- IndexedDB reopen regression test: `6b484a6523448f0c742c83970f07039ed2363e18`.
- This handoff's publication adds a separate commit. Freeze current remote branch SHA/tree again before testing or reviewing.

## Confirmed source observations and bounded change

The previous memory-adapter `referenceCoverage(tenant, limit)` loop traversed `state.table('blob_refs').values()` including every other tenant, even when the requested tenant had no rows or its allowed 10,000 holder rows had been examined. Its returned counts were capped, but its work was not bounded by the requesting tenant's rows. This is a source-demonstrated performance limitation, **not an observed exploitation or benchmark**.

The memory and IndexedDB working-set adapter now maintains `blobRefKeysByTenant` on `MemoryState.write()`, including inserts, replacements and deletions. `ungroup()` removes old rows, and existing undo/snapshot load paths call `write()`, so rollback and encrypted snapshot hydration rebuild the index through the same path. `referenceCoverage()` checks a tenant set's cardinality first; when over the unchanged limit it emits the same null-count overflow result, and otherwise reads only that tenant's indexed keys. The SQLite implementation is unchanged and already selects only tenant rows with SQL `LIMIT (limit + 1)`. No blob IDs/bytes/holder labels are returned.

The prior round-three integration test incorrectly asserted that the blob survives detaching its last holder. The production `blobStore.detach` contract explicitly deletes a blob whose last holder is removed. That assertion is corrected rather than changing production lifecycle semantics. Added source-specific tests for transaction rollback of reference counts across memory/fake-IndexedDB/SQLite and IndexedDB close/reopen reconstruction of tenant indexes. These tests **have not executed successfully** and may require follow-up repair after exact-source CI reports.

Preserved contracts: no v1 backup wire changes, signature, signing identity, encryption, key derivation, product caps, test timeout, SQLite schema, workflow, release or deployment modification. Holder strings are unauthenticated and portable attachment backup remains unavailable.

## Test and review qualification — do not overstate

At inspection before these changes, incoming head `259f8420...` had newly queued Alpha run `44767198716` and CLI run `44767198886`; neither was a pass. Earlier Alpha run `44749698450` **failed** on TS2741 missing `UnlockedVault.attachmentCoverage` fixtures, and its downstream product tests were skipped. Earlier original-source CLI `44749698540` completed selected Ubuntu Node 22/24 jobs successfully. The two fixture stubs were fixed in prior `84b3431...` but require changed-source verification. The historic full local suite exited 137 with no final report; preserve all original evidence.

This round could not use a local Git worktree because `git ls-remote` failed `Could not resolve host: github.com`. GitHub connector updates succeeded; no exact-head TypeScript, Vitest, browser, Alpha or CLI execution is claimed. Current PR #68 had zero submitted independent reviews at inspection. Do not substitute this static source read for independent code/security review. Do not rerun queued or old killed suites just to force a green status.

## Three independent next-worker lanes

1. **Code audit (fresh worker, isolated remote worktree):** Freeze actual PR #68 SHA and tree. Check `MemoryState.blobRefKeysByTenant` invariants under attach, replace, detach, write rollback, failed IndexedDB commit, snapshot load and storage close. Inspect cross-tenant boundaries, group index consistency, SQLite join/query and any residual whole-database scan. Identify a concrete reproduction before changing code.
2. **Normal bug hunt (fresh worker):** Check `corepack pnpm typecheck`; serially run `tests/integration/attachment-reference-coverage.test.ts`, plus related transaction/blob-lifecycle suites. Cover the amended last-holder deletion assertion, committed/uncommitted counts, overloaded tenant, fake IndexedDB reopen and actual native-browser scenario. Record exact command, exit, tests, failure logs and any setup problems separately; avoid parallel heavy suites.
3. **Defensive security review (fresh worker):** Read-only/source-focused assessment of scope spoofing, arbitrary holder strings, index cardinality and memory potential, stale index on rollback/commit error, leakage of refs/bytes, overflow behavior and UI completeness claims. Hardening/remediation only; do not resume interrupted exploit reproduction follow-ups.

Each independent worker should leave source SHA/tree, code/test evidence, remaining findings and a fresh successor handoff. Wait for all three reviews and required current-source hosted Alpha/CLI gates before ordinary merge; verify merge tree and separate main-push qualification if eventually merged.

Keep PRs #64–#67 and incompatible draft #8, older paused automations and unrelated tasks untouched. No release, deployment, force push, branch deletion, paid API or change to reference-limit policy is authorized. Owner credit balance is unobservable; only pause for an explicit exhausted-budget report.
