# ClassRup — inbox read isolation and next review handoff

Checkpoint: 2026-11-21 UTC. **Draft source correction; not merged, independently reviewed, released or deployed.**

## Exact parent, ownership and source

- Repository: `djshellshoxxx/CLASSifiedisRUPTed`; parent draft PR #97 branch `codex/classrup-shred-report-isolation-20261121`, observed remote head `2a2813d83d808aaa2418679beb2782d1851324c5` at fork. Its published parent tree was `d82f89c6317c7c460ddd02a7f91bec2b2271fce4`.
- Isolated **remote branch** `codex/classrup-inbox-read-isolation-20261121` started at that exact published parent. Test-first commit `e1ebc22359c2abc26b78369a7442aae6834881f6` modifies `packages/kernel/src/storage/contract-suite.ts`. Implementation commit `15d31d5ece626a7d31864e3712c599a2d1836a33` modifies `packages/kernel/src/storage/tx.ts`. This handoff itself advances the head: fetch the *live* branch identity, tree and source-specific checks before working.
- No local worktree was available: `github.com` DNS resolution failed from the execution host. The GitHub connector was used to read published source and write ordinary commits on a new remote branch. Do not claim a local isolated checkout, product test or independent agent review.
- Parent and older draft refs were not altered. PR #8 remains incompatible and preserved. Merged full-production-codec record restore/reopen (#63) should not be reimplemented; attachment/reference and delivery/lease backup remain separate future milestones.

## Source-confirmed finding and bounded repair

`tx.inbox.get(consumer, eventId)` returned `d.inbox.get(...)` directly. The memory driver's `inbox.get` returns an object from `MemoryState` without copying it; the IndexedDB adapter reuses that working set. A caller could retain the object from `storage.read` and later change its `status`, `attempts` or `nextAttemptAt` with normal JavaScript mutation, silently changing the in-memory delivery state **without a committed write or IndexedDB persistence**. SQLite already returns detached row objects. This is a source-level reference-isolation defect; no production exploitation or cross-user access was demonstrated.

The fix returns a detached shallow copy of the flat `InboxRow` object from the shared `inboxStore.get` adapter boundary, preserving its fields and on-disk format. The new shared contract test seeds a completed inbox row, retrieves it through the read-only API, mutates the exposed result after the transaction, then verifies the original committed status/attempts/next-attempt time remain unchanged. The suite instantiates the test for memory, SQLite and fake IndexedDB.

No v1 signatures, key identities, encryption constraints, record schemas, product caps, dependencies, workflow configuration or test timeouts were changed. The final-row copy is bounded and does not copy payloads.

## Evidence and qualification boundaries

- **Parent PR #97** own hosted Alpha `44926426959` completed **success**: the actual domain log reports **849 passed, 0 failed/pending/skipped/todo** and its browser run **78 passed**. Its own CLI run `44926426944` completed **success** with two successful Ubuntu Node 22/24 matrix jobs. This is **parent-only** evidence and does not qualify this changed source.
- A Node 22 standalone Map/object-alias reduction reproduced the language-level mutation of a stored row and confirmed that a detached object does not mutate the original. **Not a product test**.
- **Child**: new cross-adapter test was authored before the source repair. The product suite, target TypeScript, static/build, browser and native IndexedDB runtime were **not executed locally** due to GitHub DNS failure. No parent RED/full-product GREEN acceptance was performed. Read the child's own CI after PR publication; never inherit parent results.
- Historic November 19 domain suite exited **137 without final report**. Preserve all old failed, incomplete, queued and cancelled runs. PR #56 and PR #57 qualified mergers and main-push results are separately documented in the original cycle/remaining-work register.
- No independent reviewers have completed the new-source code-audit, functional bug-hunt or defensive-security reviews. Keep draft and do **not** merge until actual current-source required checks plus independent review are complete.

## Distinct next fresh-worker assignments (unexecuted)

1. **Code audit:** pin current child branch/tree in a separate checkout if access permits. Compare only the child diff to frozen parent #97 and review every inbound/outbound adapter field for further mutable row escape (especially inbox, dead-letter and idempotency paths). Confirm flat-row spread suffices, including concurrent retry/markDone and post-read mutation. Run targeted TypeScript and shared contract tests in a resource-bounded serial sequence. Publish exact tests, failed setup steps and source IDs.
2. **Functional bug hunt:** in another isolated checkout exercise the new inbox regression on memory, SQLite and fake IndexedDB; if possible observe parent RED/current GREEN specifically for this case. Test ordinary consumer pending/done/retry/dead and queued delivery after a read-only mutation attempt; check reopen behavior. Inspect **child's** Alpha/CLI runs, counts, logs and native browser selection; do not relabel a skipped engine as tested.
3. **Defensive security review:** static review of consumer-visible inbox transitions, tenant/consumer scope, mutation without write, rollback, durable IndexedDB state and key ownership. Do not resume interrupted exploit reproduction. Validate that invalid caller values cannot redirect another consumer, and distinguish speculative observations from confirmed defects. Report exact source, evidence and remaining risks.

After three *actual* independent reviews, repair confirmed issues in a new ordinary commit, requalify exact modified source, then consider qualified ancestor-by-ancestor integration; check actual merge tree and new main-push jobs. Keep new work to the next unblocked bounded feature from `docs/development/REMAINING_WORK.md`. Do not run concurrent heavy suites on a constrained host or repeatedly rerun unchanged killed jobs.

No release, deployment, force push, branch deletion, paid external API, unrelated automation update or assertion of credit exhaustion is authorized.
