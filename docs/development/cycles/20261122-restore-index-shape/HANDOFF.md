# ClassRup — restore index-shape validation and successor review handoff

Checkpoint: 2026-11-22 UTC. Bounded source hardening; draft candidate, no merge/release/deployment.

## Frozen base and ownership

- Repository: `djshellshoxxx/CLASSifiedisRUPTed`; observed main `449a619f1ae7b66cb42d9cab43dd5493bfe42c2e`.
- Isolated published source base: PR [#107](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/107) head `fff9e11b0cf70127a495c68569a3a6f029a5b0a8`; that branch remained unchanged at candidate creation.
- New branch: `codex/classrup-restore-index-shape-validation-20261122`. Test-first commit `a63675691fd23889fca655390b152859e1fcd72d`; implementation commit `0357b6819e87102e2b55cec22932a75a38cfc534`. Record the final documentation commit/tree and hosted jobs separately after creation.
- Source scope: `packages/kernel/src/storage/contract-suite.ts`, `packages/kernel/src/storage/tx.ts`, this handoff only. No v1 archive/signature/key changes or changed timeouts/product caps.

## Source-confirmed issue and bounded correction

`tx.records.restore(rec, idx)` checked the record revision but assumed the TypeScript four-element index tuple existed at runtime. An untyped/imported caller could supply a three- or five-element array, sparse array, wrong-type element or array-like object. The previous absent-row path copied only the first four entries and silently dropped extras; short or malformed tuples could reach adapter-specific behavior. The identical-record branch could also accept tuples without validating that source input had four own string/null fields.

The new boundary rejects non-arrays, lengths other than four, holes and any element not a string or null with `TypeError`, **before** driver read/write or idempotence comparison. It preserves valid null/empty-string index values and exact legacy v1 four-field tuples. It does not attempt to replace the higher-level signed-record, codec, tenant, or archive preflight.

The shared contract regression exercises seven malformed cases against both absent and existing rows, requiring unchanged durable record and indexed query, plus a genuine identical positive control. This suite is imported by the memory, SQLite and fake IndexedDB adapter tests. It was committed before the fix but **was not executed RED or GREEN** against the repository.

## Actual qualification and original failures

- **Local host:** `git ls-remote` fails `Could not resolve host: github.com`; no checkout, isolated local worktree, full project typecheck, Vitest or browser run took place for this candidate.
- A standalone manually extracted **TypeScript predicate** compiled with `tsc --strict --target es2022 --module esnext --noEmit` and executed under Node 22; one valid and seven malformed samples behaved as expected. **This is not a repository test.**
- PR #107 direct base exact-head hosted Alpha [44977753516](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44977753516) and CLI [44977753514](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44977753514) were inspected and **both completed successfully**; domain/CLI jobs succeeded. These are **parent** results, not new candidate gates.
- PR #105 Alpha [44968879520](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44968879520) remains **FAILED** on one Firefox checkbox interaction despite 873 domain assertions passing. PR #106 and #107 later pass but cannot retroactively change that result. Historical PR #56 main-push Alpha cancelled and CLI succeeded; November 19 full local domain suite exited 137 without report. Preserve these separate histories.

## Three review lanes for fresh successor workers (assignments, **not completed audits**)

1. **Code review:** checkout the current published head in an isolated worktree; compare all three adapter representations, `IndexValues` and the canonical key/index pipeline. Review the exact four-slot/own-property rule, legacy tuple compatibility and test compile. Record source SHA/tree and genuine command results.
2. **Functional bug hunt:** run the test-first commit and implementation commit in isolation for explicit RED and GREEN where possible; run serial focused memory/SQLite/fake-IDB contract suites, full typecheck, project gates, and the normal parent browser journey. Inspect the original PR #105 Firefox artifact only if a targeted changed condition exists. Also inspect whether `tx.records.put()` separately needs equivalent runtime index admission, without silently widening this candidate.
3. **Source-focused defensive security:** review untrusted archive index shape, prototype/sparse tuple behavior, normalization and tenant/identity boundaries. Verify that malformed input fails before mutation and read-only paths do not leak. This is defensive hardening only; do not revive interrupted offensive reproduction follow-ups.

No independent review approval is claimed. A static author review and standalone predicate probe are **not** independent product or security qualification. The environment has no separate worker executor in this invocation. Subsequent workers must record exact sources, tests, failures, confirmed findings, remaining work and next handoffs.

## Integration and next features

After publication, verify actual PR head/tree, current-source hosted Alpha and CLI checks and genuinely independent reviews. Keep this candidate draft while ancestor integration gates remain unresolved. Do not turn successful child CI into a historical pass for PR #105. Merge only qualifying ancestors and candidate in order, with actual merge-tree and main-push verification.

The mixed production-codec encrypted backup restore/reopen milestone is already implemented on main via PR #63. Remaining next P1 slices include attachment/reference portability, delivery/lease recovery, rotation/device interruption and native WebKit identity import. Draft #8 is incompatible and must not be merged wholesale. No force push, branch deletion, release, deployment, paid API or unrelated automation change is authorized.
