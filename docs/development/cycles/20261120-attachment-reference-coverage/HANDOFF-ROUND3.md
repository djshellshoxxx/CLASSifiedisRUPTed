# ClassRup attachment reference coverage — round 3 continuation

Date: 2026-11-20. Isolated candidate draft PR #68, branch `codex/classrup-attachment-reference-coverage-20261120`.
Observed remote base `main`: `449a619f1ae7b66cb42d9cab43dd5493bfe42c2e`.
Observed preceding head: `84b343104738767217f789b38f4879c09cd4292d`.
This round added test-only commit `c2dc0428115b6852bc2b5999602f1479f40dc2f8` (one changed file). Check the current remote ref and tree anew before continuing.

## Work performed
Reviewed the head's kernel storage driver, memory, SQLite, vault, and tests through GitHub read-only file access. The production API continues to count tenant-scoped holder references and signals overflow with unavailable totals, without returning holder strings, reference IDs, or blob bytes. Holder authority remains unverified; orphan/unheld blobs are outside this diagnostic, and the signed/encrypted v1 backup remains record-only.

Added one lifecycle regression case per memory, fake-IndexedDB and SQLite adapter to test empty state, stored-but-unheld data exclusion, repeated attachment of the same holder, detachment, and non-deletion of blob bytes. No production code, identity, signature, encryption, schema, limits, build configuration, or CI workflow was changed in this round.

## Verification distinction
GitHub comparison reported remote branch three commits ahead and zero behind `main` after the test commit. **The new tests have not executed.** No current-head Alpha, CLI or local domain success is claimed. The previously recorded original Alpha run 44749698450 failed with TS2741 fixture errors, downstream Alpha tests skipped; the original-source CLI run 44749698540 passed its selected Ubuntu jobs. The preceding repair commit 84b3431 added two test-fixture stubs; its source still requires exact-head qualification. Do not relabel earlier runs as proof for this commit or repeatedly restart unchanged runs.

No independent audit workers were executed or assigned through a worker runtime in this invocation. GitHub PR #68 had zero submitted reviews at inspection.

## Next fresh worker scopes
- **Code review:** freeze exact remote head/tree; inspect memory referenceCoverage full-map scan versus bounded output, SQLite grouping and tenant equality, IndexedDB memory snapshot and read-transaction semantics, and production API exposure. Do not confuse capped result size with bounded cost.
- **Functional bug hunt:** run `corepack pnpm typecheck` then `tests/integration/attachment-reference-coverage.test.ts` serially on the exact head, including the new lifecycle test. Inspect duplicate attach/detach, rollback, overflow boundaries, and session lock; record setup failures separately from product assertions.
- **Defensive security:** static/source-focused audit of tenant cross-contamination, missing refs, arbitrary holder labels, absent bytes/ref output, potential DoS on whole-map scans and UI completeness interpretation. No interrupted exploit reproduction follow-ups.

Wait for all independent worker evidence and current-head required hosted qualification before integration. If a reviewed defect is confirmed, repair on a compatible isolated remote branch and requalify the changed source. Leave draft #8 and PRs #64–#67 unchanged. No release, deployment, force push, branch deletion, workflow restart or paid external API.
