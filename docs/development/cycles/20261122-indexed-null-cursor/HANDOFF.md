# ClassRup continuation — indexed record-query cursor admission

Date: 2026-11-22 UTC. Isolated draft candidate, **not** integrated.

## Remote identity and ownership

- Repository: `djshellshoxxx/CLASSifiedisRUPTed`.
- Parent: open draft [PR #120](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/120), branch `codex/classrup-record-query-selector-admission-20261122`, observed frozen head `9e25673e9d3ffff8ba0d4febb131d2eef727d90c`, tree `38238ef97c8ff6e311a550010176e23bd3f7d37d`. Confirmed it had not moved before creating the child. Do not rewrite ancestors or cherry-pick its separately published local-only mapped history.
- New branch: `codex/classrup-indexed-null-cursor-admission-20261122`, from that exact remote commit, without modifying the parent.
- Regression first: `5301e396bffda902f83c5f7a0641a3003708eea0` (`packages/kernel/src/storage/contract-suite.ts`).
- Smallest production repair: `759281f4ab02d650d5b03c97be39d1e33ff5aea1` (`packages/kernel/src/storage/tx.ts`).
- This handoff is a separate final commit. Inspect final head and actual tree using the GitHub Git API, and obtain current-source qualification.

## Source-confirmed problem and bounded fix

`RecordQuery.after.value` is typed `string | null`; PR #120 accepts `null` for all order slots. An indexed query (`orderSlot` 1..4) excludes rows with null index values. The SQLite `recordQuerySql` implementation compares indexed values to `NULL`, so the cursor predicate evaluates to SQL UNKNOWN and returns no rows. Memory instead compares the cursor using `after.value ?? ''`, potentially returning rows after the empty string. This produces incompatible results for the same malformed raw kernel cursor. No remote exploit is claimed.

The shared `recordStore.query` boundary now rejects a non-ID-ordered cursor with null `value` using `TypeError` before driver access. It continues to permit null cursor values when `orderSlot = 0`, where the value is unused, and permits normal string-valued indexed cursors. It does not change adapter SQL, ordering or storage/wire formats.

The new shared contract regression exercises memory, SQLite and fake IndexedDB, including the rejected malformed indexed cursor, a valid indexed cursor and a valid ID-ordered null cursor. It was committed before the fix; **RED was not executed**. Exact repository tests, typecheck, build and browser were **not run locally** because this host still cannot resolve `github.com` for a checkout. This is code-path/source confirmation, **not executed product proof**. Keep existing v1 signature, identity, encryption, product bounds and test budget unchanged.

## Newly resolved qualification inspection — parent #120

The parent PR #120 at head `9e25673e9d3ffff8ba0d4febb131d2eef727d90c` had:
- [Alpha workflow 45040608987](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/45040608987): **failure** in browser journeys. Setup, install, typecheck, spec/dependency/registry gates, independent money vectors, tooling, domain test runner, build and browser install **passed**. Playwright reported **77 passed, 1 failed** of 78 after 13.9 minutes; Firefox `tests/browser/alpha.spec.ts:606` expected `#notification-delivery-status` to show “Some local updates could not be processed” after a one-shot IndexedDB notification commit failure, but it remained empty for 20 seconds. The reason the fault injection did not yield the expected persistent warning is **unconfirmed**; do not simply remove the assertion or relabel the failure as a pass. Artifact `browser-failures` ID `14761639608` is retained. Examine the failure context, injection consumption, notification delivery/backoff and queued refreshes before changing production or tests.
- [CLI workflow 45040608993](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/45040608993): **success**; both Ubuntu Node 22.18.0 and 24.x clean-install, build and browser smoke succeeded.
- Parent #120 independent submitted reviews: **zero** at inspection. Its Alpha failure blocks merge. Do not rerun unchanged CI without a concrete altered condition or a targeted remedy.
- PR #119's own Alpha `45035438867` and CLI `45035438873` passed, but they do **not** qualify #120 or this child.

Retain the initial 2026-11-19 full local domain-runner exit 137 without a final report, PR #116's original failed Alpha #45019120389, PR #105's older Firefox checkbox failure, and PR #56's separate cancelled main-push Alpha #44658477772 as distinct evidence, alongside subsequent successful validations. Do not call any killed, queued or historical result a success for changed code.

## Fresh successor workers — assignments, NOT completed reviews

1. **Independent code auditor:** check this exact child diff against frozen #120, cursor preconditions, typed repository cursor creation/compatibility, null handling in `recordQuerySql`, `memory-driver.ts` and IndexedDB. Confirm no changed valid ID/index pagination, and record exact head/tree plus actual executable tests.
2. **Functional bug hunter:** in isolated remote-derived worktrees on a functioning host, run the test-first SHA as RED and the exact repaired head as GREEN for all adapters, then serial full typecheck, targeted domain, normal domain, build and browser CI. Independently investigate Firefox failure #120 by inspecting `browser-failures` screenshot/error context and `tests/browser/alpha.spec.ts` plus notification dispatch/refresh. Do not run simultaneous heavy jobs, lengthen timeouts or suppress evidence.
3. **Source-focused defensive security reviewer:** check tenant isolation and cursor admission/SQL selection at storage boundary, failure atomicity, query result scoping and normal error handling. Report only supported findings; no interrupted reproduction follow-up or aggressive runtime exploit is authorized.

Independent worker spawning is not available in this environment; no worker execution, review approval or complete security audit is claimed. Future cycles should use separate fresh workers if available and preserve exact source identities and handoffs.

## Integration and bounded next work

Obtain this child's exact-head Alpha/CLI gates and actual independent reviews, then resolve #120's Firefox failure and the stacked draft chain before any ordinary qualified integration. Verify the real merge tree and **separate main-push** qualification. The next P1 unfinished feature remains attachment/reference restore, delivery/lease recovery, key rotation and interrupted-device acceptance; do not count completed full production-codec archive tests as complete end-to-end device recovery. Do not blindly integrate incompatible draft #8.

No merge, deployment, release, force push, branch deletion, paid external API, paused-task update, unrelated automation mutation or credit-balance inference is authorized.
