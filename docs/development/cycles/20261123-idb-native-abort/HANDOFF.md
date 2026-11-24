# ClassRup: native IndexedDB transaction-abort acceptance — 2026-11-23

## Fresh source and scope
- Repository `djshellshoxxx/CLASSifiedisRUPTed`; live PR census at inspection contained 91 open PRs, newest #152. Parent #152 published head `1136069ba8c8cf8f4eb708c53afb518c679befb0`; GitHub compare with #151 `9d4eec5a6653195bf709bff8d1863d074550ee3a` showed one ahead, zero behind, exactly one added regression test and two evidence files.
- This isolated child branch is `codex/classrup-idb-native-abort-acceptance-20261123`, forked from the parent commit via connected GitHub; it does not mutate #152, older drafts, or main. Test first commit `c57ee87951f0cb5c23d36cae3b2582f01cadac15`, contract correction `6b2ea5e3147fe5d963905da350162ca05192e136`. Refresh remote HEAD, tree and PR base before any integration.
- Main previously contained the 15-production-codec encrypted restore/reopen acceptance. Do not duplicate it or imply that portable private attachment recovery exists.

## Qualification reconciled
- Parent #152 Alpha verification `45283496935` completed **success** and CLI setup `45283496989` completed **success** for published parent head, according to GitHub commit-associated workflow results. These are exact-parent CI outcomes only, not proof of this child's tests.
- PR #152 had zero submitted reviews. #150 Alpha run `45264062462` remained cancelled, while #151 Alpha/CLI passed at its own head. #56 main push Alpha `44658477772` cancelled, CLI `44658477821` succeeded. #57's historical complete local domain exit 137 has no final report. Preserve all original outcomes.
- Native local `git ls-remote` on this host still failed: `Could not resolve host: github.com`. No local repo checkout, dependency install, executed Vitest or real browser test occurred in this invocation. No independent worker executed. Credit exhaustion was not reported.

## Bounded new test
Added `tests/integration/indexeddb-native-attachment-abort.test.ts`. It uses a genuine `fake-indexeddb` `IDBDatabase` and the repository's `createIndexedDbDriver`, with a per-connection transaction proxy that schedules an actual IDB `readwrite` transaction `abort()` after writes are queued. It seeds P0 content-addressed bytes with two holder labels; aborts a stale-holder detachment; requires in-memory rollback and unchanged reference coverage; successfully retries; closes the adapter; reopens through `openIndexedDbStorage`; and verifies actual persisted bytes and exact holder membership from a fresh working set.

This exercises real fake-IDB transaction cancellation beyond #152's intentionally rejected memory-driver persist callback. It **does not** exercise full encrypted `openVault` restoration, power-loss/fsync durability, or the complete authenticated manifest importer. The test is authored but not yet executed against product. Do not classify it as passed or a confirmed defect fix. No production files, encryption, signatures, v1, caps, dependencies, CI selection or test timeout changed.

## Independent successor review lanes (assignments only)
1. **Code audit:** inspect this exact test and the native IDB driver (including `completion`, `persist`, driver rollback, and effect of `queueMicrotask` scheduling), confirm no post-abort write slips through and that the proxy does not alter unrelated transactions. Record exact tree, commands and outcome.
2. **Normal bug hunt:** create isolated worktree at fresh remote child ref. Run pinned installation, TypeScript and the focused new test *serially*. Verify pre/post abort states and persisted reopened state, then run the previous #152 memory-driver rollback and #151 encrypted reopen cases. If the injection fires too early or the test fails, repair the test or confirmed implementation issue in a separate qualified child. Do not turn setup failures into asserted product failures.
3. **Defensive security review:** read-only source review for writer-fence authority, orphan/holder integrity, failure rollback, cross-tenant behavior and private-attachment restrictions; do not resume interrupted reproduction follow-ups. Distinguish source risks from executed exploits.

Each real worker must leave an exact-source handoff of tests, findings and outstanding work before the next generation. None of these reviews has completed here.

## Integration and next P1 milestone
Wait for this exact child Alpha/CLI gates and independent reviewer evidence. Resolve older cancelled/failed qualification only with changed conditions and targeted remedies. Qualify ancestor chain in order; check prospective and actual merge tree plus separate main-push workflows. After actual IDB abort acceptance, proceed with authenticated deleted-parent detachment, final-holder retention policy and private attachment destination-key contract. No wholesale draft #8 merge, release, deployment, force push, branch deletion, paid API, or unrelated automation change.
