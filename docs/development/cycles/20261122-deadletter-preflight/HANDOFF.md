# ClassRup — dead-letter preflight atomicity and next-worker handoff

Checkpoint: 2026-11-22 UTC. Draft stacked candidate; **not merged or released**.

## Remote source, ownership and published lineage

- Repository: `djshellshoxxx/CLASSifiedisRUPTed`.
- Latest observed open parent: draft PR #115 on `codex/classrup-inbox-error-code-admission-20261122`, remote head `36d9e60c423b869f18778668c92ec78cad164e5b`, tree `813c9e748c69808e239c7ae11b1592f7cdcb0c9e`. No independent PR reviews were present when inspected. Other open drafts form a long chain back through the recovery/storage slices; do not merge those by inferred ancestry or substitute local-only history.
- New child branch `codex/classrup-deadletter-preflight-20261122` was created from that **remote** SHA via GitHub connector; no previous ref was force-updated.
- Test-first commit: `2ded1168be7b75fb789cddccd46693dde56aa642`, changing only `packages/kernel/src/storage/contract-suite.ts`.
- Production repair commit: `1b2d1d8d688dc38354ec509e00dd75954ccdfd0e`, changing only `packages/kernel/src/storage/tx.ts`.
- Read current PR head/tree, exact GitHub Actions IDs and compare after publication. These pre-publication IDs are not substitutes for the final published source.

## Source-confirmed functional defect and scope

The previous `tx.inbox.markDead` wrote the durable inbox row **before** JSON-serializing the full envelope for the dead-letter row. A runtime envelope with a non-serializable payload (such as `bigint`) throws after the first write. If an application catches that exception *inside* the storage transaction and returns success, an inbox row can be persisted as `dead` while its dead-letter entry is absent. This is a source-ordering correctness defect; no live exploit or external reproduction is asserted.

Similarly, `tx.deadLetters.requeue` removed the dead letter before converting its due timestamp. `NaN` or another unrepresentable timestamp throws after removal; a caller handling that exception within the same transaction could commit removal while leaving the inbox status `dead`.

The bounded repair builds the inbox and dead-letter rows, including envelope JSON and canonical date, **before either markDead write**. Requeue now canonicalizes the due time **before** removing the letter. Normal valid transition semantics, v1 signatures, principal/signing identity, encryption and product caps are unchanged. This is admission ordering rather than an assurance that all driver-level writes are atomic when arbitrary storage errors are swallowed.

Shared cross-adapter regression added for memory, SQLite and fake IndexedDB:
1. Retry a valid event and capture persisted state.
2. Call `markDead` with an envelope containing a non-JSON `bigint` payload, assert the expected TypeError **inside** a successful transaction, and assert unchanged inbox/no dead letter after commit.
3. Perform ordinary valid `markDead` and capture the dead row and letter.
4. Catch a `requeue(..., NaN)` RangeError **inside** a successful transaction, assert both persisted objects unchanged.
5. Confirm ordinary valid requeue still removes the letter and puts inbox into immediately eligible retry with attempts reset.

The tests were committed before the fix, but **RED was not executed**. Repo checkout and local product tests were blocked by `git ls-remote`: `Could not resolve host: github.com`. Connector-based source reading and edits are static inspection, not executed product QA; no local Vitest/TypeScript/browser claims. Do not retry killed full local suites without a concrete changed condition.

## Exact parent qualification

At parent PR #115 head `36d9e60c423b869f18778668c92ec78cad164e5b`, the current run's verified [Alpha #45014112166](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/45014112166) **completed success**: plan and domain jobs; the domain job's actual typecheck, specification/dependency/registry checks, tooling, full domain runner, setup, build and browser steps all completed success. [CLI #45014112061](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/45014112061) **completed success**: plan plus Ubuntu Node 22.18.0 and 24.x clean-install jobs, including repeat setup, build and dev/prod browser smoke. These qualify **only the frozen parent**; this new child requires its own exact-head runs.

Preserve PR #105's historical failed Firefox checkbox Alpha #44968879520, the 2026-11-19 complete local suite exit 137 before report, PR #56's separate cancelled main-push Alpha and earlier setup failures. Later green descendants cannot retroactively change those results. No reported credit exhaustion, and owner balance is not observable.

## Distinct fresh successor workers — assignments, NOT executed

**Code auditor (new independent reviewer):** check exact current published head/tree, compare with parent, trace `markDead` and `requeue` callers, validate both pre-write exception checks, and inspect possible adapter-specific partial writes. Review TypeScript type suitability and normal zero/error-code transitions. Record source identity, evidence, findings and next handoff; a static-only check is not product testing.

**Normal functional bug hunter (separate worker):** if checkout works, execute committed test-first source `2ded1168be7b75fb789cddccd46693dde56aa642` against the unfixed parent for RED without changing existing caps; execute current child GREEN across memory/SQLite/IndexedDB; check catch-inside-transaction behavior, retry/dead-letter replay, commit/rollback and ordinary browser workflows. Run focused suites before broader serial static/build/CI; distinguish setup failures from tests.

**Defensive source security reviewer (separate worker):** review non-serializable event-envelope inputs, consumer/tenant scoping, dead-letter/inbox consistency, replay/receipt persistence and state corruption risks. Remediate only source-confirmed defensive defects with minimal regression; do not resume interrupted attack reproduction or perform invasive exploit work. Record exact source/results and next-worker handoff.

The available GitHub connector exposes repository read/write and CI inspection but **no independent subagent executor**. No independent worker reviews or approvals are claimed for this child; do not label these unexecuted assignments as completed.

## Next engineering and integration

Inspect child PR's exact-head Alpha and CLI **required steps**; preserve all failures, cancellations, skips and queues. Obtain genuinely independent reviews before considering any merge, reconcile qualified stacked ancestor PRs without blind history merging, verify any actual merge tree and inspect distinct main-push qualification. Do not merge only on success of a descendant.

The previously requested mixed production-codec-set encrypted restore/reopen acceptance exists among earlier production-codec recovery candidates (including a 15-codec combined archive); do not reimplement it without a current-source gap. Priority remaining work in `docs/development/REMAINING_WORK.md`: attachments/references recovery, durable delivery/lease state portability, key rotation and device interruption/load checks, native WebKit existing-key import.

No release, deployment, force push, branch deletion, paid API or unrelated/paused automation changes are authorized. Do not infer exhausted credits from CI queue, DNS failure or killed processes.
