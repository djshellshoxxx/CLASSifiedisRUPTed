# ClassRup continuation — raw record-query limit admission

Date: 2026-11-22 UTC. Draft-only stacked candidate. No release or integration.

## Frozen source, ownership and changes

- Repository: `djshellshoxxx/CLASSifiedisRUPTed`.
- Parent is existing open draft [PR #118](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/118), branch `codex/classrup-outbox-event-id-guard-20261122`, observed immutable published head `83b39ae55a1a668bae912352f98e0c1e62bdc9a3`. Do not merge unpublished local commit equivalents, rewrite that branch or claim parent integration.
- Child branch: `codex/classrup-record-query-limit-admission-20261122`, created from that exact published parent SHA in GitHub, without a local checkout.
- Test-first commit `8c8df90ab49b6c0312d490bc1509cb3607248d22` changes only `packages/kernel/src/storage/contract-suite.ts`.
- Repair commit `83777244c28c52d68b8903574d59af0c032caea7` changes only `packages/kernel/src/storage/tx.ts`.
- This handoff is a third commit. Inspect final published head/tree and exact-source CI after it lands. No production interface, record data shape, identity, signature, encryption, PWA cap, domain limit, or test time limit was changed.

## Confirmed discrepancy and bounded repair

`tx.records.query(q)` forwarded `q.limit` directly to the adapter. The public typed repository already constrains caller-visible pagination to 1..500, but direct kernel callers can bypass that front-end. Memory's `slice(0, -1)` returns nearly all rows; SQLite treats `LIMIT -1` as unbounded. Fractional, nonfinite, string and unsafe limits can fail differently per adapter. The shared boundary now checks `Number.isSafeInteger(q.limit) && q.limit >= 0` before performing a driver read. This follows the existing `outbox.pending`, `sync.list` and `deadLetters.list` lower-level limit convention. Zero, all safe nonnegative integer limits and typed repository pagination retain their prior behavior. No new arbitrary upper bound is imposed on existing internal consumers.

A single shared contract regression was committed first to test memory, SQLite and IndexedDB adapters with two records; malformed negative/fractional/NaN/infinite/unsafe/nonnumeric/null values must throw RangeError. Zero must yield no rows, limits one and two must return the expected ordered IDs, and the ordinary typed repository query remains functional. This is **source-confirmed** behavior analysis. The new test was **not executed against pre-fix code**; local `git ls-remote` still fails resolving `github.com`, so no RED/GREEN, local typecheck, local Vitest, browser or build claim exists.

## Actual qualification and historical evidence

- Parent #118 exact head `83b39ae55a1a668bae912352f98e0c1e62bdc9a3`: [Alpha #45029588927](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/45029588927) **completed success**; plan, full domain/test/typecheck, static/build and browser jobs completed successfully. [CLI #45029588937](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/45029588937) **completed success**, including Ubuntu Node 22.18.0 and 24.x clean-install/browser-smoke jobs. These are **parent-only**, not qualification of this child.
- Parent #118 had **zero** submitted PR reviews at inspection. This new child also requires independently submitted reviews and exact-head required CI before integration.
- Preserve #116's original Alpha #45019120389 **failure** (905 passed, one currency concurrency test failed, other downstream jobs skipped), even though the corrected descendant #117 passed.
- Preserve #105's original Firefox checkbox failure, the 2026-11-19 local full-domain exit 137 before its report, #56's cancelled historic main-push Alpha and every original skipped/partial/setup result. #56 and #57 are already merged; do not try to merge them again.
- At inspection main was `449a619f1ae7b66cb42d9cab43dd5493bfe42c2e`; the long draft chain following it remains not independently approved/integrated. Do not treat a passing descendant as approval of ancestors.

## Successor worker assignments — not executed or approved

1. **Fresh independent code auditor:** freeze the child's published head and tree; compare only against #118; inspect `recordStore.query`, typed `runQuery` 500+1 pagination, and each adapter's LIMIT/slice handling. Confirm zero and large safe integer behavior and avoid changing product caps. Record exact source SHA, findings and actual tests.
2. **Fresh normal bug hunter:** check out the test-first commit in an isolated remote-ref worktree, run the affected contract tests to establish RED, then test the repaired exact head across memory/SQLite/fake IndexedDB, focusing on malformed runtime limits, valid zero/1/2 and typed page cursors. Run required compiler, static/build, full domain, browser and CLI gates **serially** under host resource constraints. Record failed setup separately from executed tests.
3. **Fresh defensive security reviewer:** audit resource-exhaustion and tenant-isolation consequences of direct record queries, bounded public pagination and no-regression on record types/indexes. Keep scope source-focused, review/hardening only; do not resume interrupted reproduction follow-ups. Document any supported repair with focused regression and exact source identity.

No independent agents were launched in this environment, so none of these assignments counts as a review or approval.

## Next integration and feature work

Read the child's actual PR, commit/tree and hosted workflow jobs at its current head. Repair confirmed CI failures; do not blindly rerun queued jobs or killed full suites. Require genuine independent review and qualified ancestor integration before ordinary merge; after merging verify actual merge tree and separate main-push qualification. The mixed-production-codec-set encrypted backup/reopen slice and full-registry acceptance already exist in the draft chain. Remaining P1 work includes attachment/reference manifests, delivery-state/lease recovery, key rotation, full rollback/interrupted device acceptance and WebKit existing-identity import. Do not treat acceptance fixtures as complete device recovery or merge incompatible draft #8.

No merge, deploy, release, force push, branch deletion, paid API or unrelated automation mutation is authorized. No credit-exhaustion report is present, and the owner's balance is not observable.
