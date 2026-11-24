# ClassRup engineering continuation — encrypted owner/codec boundary

## Source and work ownership

Bounded test-only slice based on observed main `449a619f1ae7b66cb42d9cab43dd5493bfe42c2e` (tree `8fe1965ae60c385042f09c690eabe7d0828b36e8`), independently of drafts #64 and #65. The executable change is `tests/integration/production-foreign-codec-isolation.test.ts`; this handoff is the other added file. No production, storage schema, signed v1 format, encryption/KDF, identity, limits, dependencies, workflows or 30-second test timeout is modified. This is a generated fake-IndexedDB fixture, not historical backup or a native-browser device test.

The test creates the current owner's normal archive record and an unrelated tenant's *future unknown codec* record inside the same encrypted vault using the complete production registry plus one simulated future codec. After a lock/reopen using only old production codecs, it requires the principal-scoped inventory to ignore the unrelated type and permits normal export. It restores the sealed kit into a fresh vault, checks signed identity and the owner's canonical archive record, asserts no foreign tenant record was imported, and reopens the original modern vault to show the foreign record was not erased by export.

This is deliberately different from PR #64 (incoming mixed future/current backup rejected before initializing an older receiver) and #65 (owning tenant's unsupported newer record makes a downgraded export fail closed). It exercises the other half of the scoping invariant: *unknown types belonging to another tenant cannot poison or leak through the owner's backup.*

## Validation and explicit limitations

GitHub DNS resolution failed for local `git ls-remote`; no checkout/worktree or local tests were available. This change is published using GitHub Git objects; the actual commit/tree and initial CI IDs must be recorded after publication. The new test is **not qualified** until its exact-head hosted Alpha (full domain/typecheck/tooling/build and selected browser) and CLI jobs finish successfully; previously passed PR #64 and #65 results are not transferable. The older full local suite exit 137, cancelled runs and other failed/unfinished evidence stay preserved. Do not restart unchanged queued CI, relax limits, or present static inspection as application execution.

At publication inspection PR #64 (head `f598dc52937449764703b5048ba71a77239c9ded`) had current-head Alpha #44706815089 and CLI #44706814923 completed successfully, but zero independent GitHub reviews. PR #65 (head `5a742b5c4f1068f8bbd51d84de6a3de054df57e7`) had exact-head Alpha #44724087255 and CLI #44724087247 jobs completed successfully; the Alpha domain log records 820 passed assertions and 26 selected Chromium journeys. Those are independent source states, and neither pending draft is approved for integration by these checks alone. Main's own post-#63 Alpha/CLI checks also passed.

## Fresh review lanes / next generation

- **Code audit:** verify exact published head/tree, inspect `packages/vault/src/vault.ts` coverage/export and `tx.records.listTypes`/query tenant predicates across encrypted IndexedDB. Audit transaction failure/cleanup, fixture archive key and signed-identity assertions. Record static-only scope separately from tests.
- **Functional bug hunt:** execute this test alone with unchanged 30-second limit, then typecheck and focused backup cases serially. Inspect hosted domain JSON and browser selection, verify that foreign type is absent after fresh restore and remains in origin. Try real/native IndexedDB separately when available. Record actual commands, times, failures and commit SHAs; do not count prior source passes.
- **Defensive security review:** inspect how principal/tenant is established for export and scope filtering and whether unknown foreign records can be leaked, deleted or induce a denial of export. Review only source/control behavior and remediation; do not resume interrupted security reproduction follow-ups. Preserve signing identity and fail-closed behavior for *own* unknown types.

No independent workers were spawned in this environment; the reviewer lanes remain pending. Keep the new PR a draft and unmerged until actual required current-head qualification and independent review. Check main/other PR drift before any integration. Preserve incompatible draft #8 and the paused older automations. No release, deployment, force push, branch deletion or paid API use is authorized.
