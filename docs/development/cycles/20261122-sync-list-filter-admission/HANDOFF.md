# ClassRup continuation — sync-list filter admission

Date: 2026-11-22 UTC. **Draft candidate, not merged.**

## Exact remote ancestry and ownership
- Repository: `djshellshoxxx/CLASSifiedisRUPTed`.
- Observed default `main`: `449a619f1ae7b66cb42d9cab43dd5493bfe42c2e` (inspect again before any integration).
- Frozen parent: draft [PR #121](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/121), `codex/classrup-indexed-null-cursor-admission-20261122`, remote head `c32c926e10e8eef3164abf78d12107df658ca4a5`, tree `1b892c714327d8f936634b94bba54981bb9e336f`.
- This isolated branch `codex/classrup-sync-list-filter-admission-20261122` was created **from that exact published remote ref**, not from an unmapped local review commit. No ancestor or active worker branch was modified.
- Test-first commit `b86681de0f3b31bb695cde0deffce2c8946c4985` changes only `packages/kernel/src/storage/contract-suite.ts`.
- Fix commit `64cdc769e6964aa60a46e3697e1d79b1b1613ca6` changes only `packages/kernel/src/storage/tx.ts`; its tree is `ba240c490ed8bc62224d4d5adf5b9b9bce2c4884`.
- This handoff commit follows those two. Resolve the published final commit and tree, PR diff and head-specific workflows before qualification.

## Source finding and bounded implementation
The raw `tx.sync.list` API accepted runtime filters outside its `Partial<SyncListQuery>` type, including `tenant: null`, numeric `tenant`, Boolean `destination`, object `ref`, and unsupported or non-string `state`. `memory-driver.ts` silently performs strict equality comparisons and returns an empty result; SQLite passes runtime values into its bound parameters, potentially producing empty reads or a binding error depending on the value. No remote exploit, data leak or SQL injection has been established; this is a **runtime admission / cross-adapter result-contract inconsistency**.

The common kernel list boundary now checks optional tenant, destination and ref are primitive strings, and that optional state is one of `prepared`, `transport_acknowledged`, `peer_accepted`, `failed`, before invoking the driver. Omitted optional filters, empty valid strings and all declared states are preserved. Earlier limit admission is untouched. No wire, v1 signature, signing identity, encryption, rotation, storage schema, production cap or test-timeout change.

Added one shared, test-first contract regression across memory, SQLite and fake IndexedDB. It exercises **nine malformed selectors**, unchanged durable listing after each rejection, and full valid four-field filtered queries plus the valid empty `failed` result. This is an additional focused case in an existing shared suite, not nine independently executed tests per adapter.

## Verification evidence and original failures
- **Only a standalone Node 22 guard check was run locally:** 9/9 invalid representatives rejected and 6 valid representatives admitted. This check executes an isolated copy of the predicate, **not repository product tests**.
- Container checkout remains blocked: `git ls-remote ...` failed with `Could not resolve host: github.com`. Product RED/GREEN, typecheck, full domain, browser and build **were not executed locally**. The test-first commit is not proof of an executed failing RED test.
- Parent PR #121 **actual published-head Alpha** [45046690474](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/45046690474) and **CLI** [45046690437](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/45046690437) completed success. Alpha's domain and browser jobs succeeded. Those outcomes qualify **#121 only**; current child requires fresh CI.
- Ancestor #120's unchanged Alpha [45040608987](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/45040608987) **FAILED** one Firefox notification fault-injection expectation (77 passing, one failing browser test); CLI [45040608993](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/45040608993) passed. This is not resolved merely by #121's successful run. Investigate injection consumption, notification queue/drain and durable warning state before replacing assertions, changing timeouts or rerunning unchanged CI.
- Original #116 failed Alpha, #105 Firefox failure, PR #56 separate cancelled main-push Alpha #44658477772 and the initial local complete-suite **exit 137 without a final report** remain failed/incomplete historical evidence; do not overwrite their facts.

## Static inspection and independent review assignments
This invocation inspected `tx.ts`, `driver.ts`, both SQLite and memory list implementations, the existing cross-adapter contract suite, browser fault-injection code, and PWA notification drain. These were **same-invocation source-only inspections**, not independent worker submissions or runtime audits. No independent reviews were submitted on #121 or #120 as inspected.

Fresh successor workers, each using an independent isolated checkout/worktree at the published final head:
1. **Code auditor:** check allowed states and raw/typed callers; confirm all four filters, default/no-filter reads, limit 0, TypeScript and main/parent API compatibility; record exact source/tree and executable evidence. Pay attention to lists with forged runtime objects and unexpected null, not speculative work.
2. **Normal functional bug hunter:** execute the test-first commit against the parent for RED and the repaired commit for GREEN across all three adapters; serially run typecheck, affected tests, normal domain and browser suites. Investigate the distinct #120 Firefox error using its artifact and exact notification lifecycle. Preserve setup failures and inconclusive results.
3. **Source-focused defensive security reviewer:** verify no cross-tenant read semantics changed, no dynamic SQL fragments are introduced, no sensitive errors leak and malformed input is rejected before storage access; focus on defensive hardening only. Do not resume interrupted security reproduction follow-ups.

Worker spawning/review approval is not available in this tool environment. The three assignments are documented **but unexecuted**; independent acceptance is pending.

## Integration and next bounded feature
Keep the draft stacked behind #121; no merge until the **child's own** completed Alpha and CLI checks, submitted independent reviews, and qualified ancestor resolution, including #120's Firefox failure. Verify eventual merge tree and separate `main` push runs. Production codec mixed-record encrypted restore/reopen is covered by earlier unmerged candidates, but P1 attachment/reference recovery, delivery/lease persistence, key rotation and interrupted-device acceptance remain separately open. No blind PR #8 merge.

No release/deployment, force push, branch deletion, paid API, unrelated or paused automation mutation, or inference about credits is authorized.
