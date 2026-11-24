# ClassRup continuation — bounded Firefox notification fault-injection stabilization

Date: 2026-11-22 UTC. **Draft test-only candidate, not merged.**

## Exact source and ownership

- Source repository: `djshellshoxxx/CLASSifiedisRUPTed`.
- Observed `main`: `449a619f1ae7b66cb42d9cab43dd5493bfe42c2e`. Reinspect before integration.
- Frozen parent: draft [PR #122](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/122), `codex/classrup-sync-list-filter-admission-20261122`, exact remote head `fd7afa541d09e3a35e261b88a9abc3afd1464433` and tree `ea8cef6b97d0d1749173467f31233c35fcabd277`.
- Isolated branch: `codex/classrup-notify-fault-hook-determinism-20261122`, created from that **remote** head. No ancestor branch modified and no local-only history imported.
- Single test edit commit: `c975739deaf21f029a5c6cde91a2241fb6d4b6ec`, tree `a1b45ae16dde63747f40d2f211e95dc29d5b66b5`. Its parent is exactly PR #122's head; comparison reports **1 ahead, 0 behind**, modifying only `tests/browser/alpha.spec.ts`.
- This handoff is committed separately. Resolve the branch's final head/tree after publication.

## Evidence-first finding and test-only correction

[PR #120 Alpha 45040608987](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/45040608987) ran 78 Playwright browser cases: 77 passed and **one Firefox barter-cycle test failed** at `tests/browser/alpha.spec.ts:606`. The test expected `#notification-delivery-status` to report a locally failed notification, but it remained empty. The exact job's log records this failure; no product defect was proven from that observation alone. Its CLI run 45040608993 passed. Preserve both results.

Source inspection found two nondeterministic conditions in the test's former one-shot monkeypatch:

1. It threw on the **first** readwrite IndexedDB transaction containing `inbox`, without checking whether the transaction was actually the notification delivery write (which also mutates `records`). An unrelated inbox write could consume that one opportunity.
2. The production retry uses full jitter with `Math.floor(random()*ceiling)`, so **zero-millisecond delay is permitted**. If a one-shot failure is immediately retried, the warning may legitimately clear before the assertion. This is a possible explanation, **not a proven root cause of the observed Firefox failure**.

The test now targets the `records` + `inbox` delivery commit, counts actual injected failures, and **holds** its fault until a pending-delivery warning and zero unread notifications have been observed. It permits the inbox-only failure bookkeeping transaction to commit. After observing the pending state it disables the hook, advances the existing virtual clock and retains the original retry/recovery assertions. The modified assertion also verifies that the intended fault hook actually fired. No product files, crypto, signing, storage schema, timeout, worker count or product limits changed.

The changed code requires exact-source browser CI. There is **no local RED/GREEN, TypeScript, Vitest, domain, build or browser execution**, because this host's `git ls-remote` still fails with `Could not resolve host: github.com`. Source reasoning alone does not establish a passing Firefox fix or executed application security review.

## Current qualification and blockers

- Frozen parent #122 exact-head [Alpha 45051763621](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/45051763621) and [CLI 45051763600](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/45051763600) both **completed success**. Alpha domain, compiler, static, tooling, build and browser jobs succeeded. These results qualify **#122 only**.
- Obtain **this new candidate's** exact-head Alpha/CLI check jobs and their actual assertion outcomes. No historical success substitutes for this run.
- Draft ancestors have **no independent submitted reviews** as observed on #122. In particular, #120's original Firefox failure remains failed historical evidence even if this descendant succeeds.
- Preserve #116's original 905-pass/1-fail Alpha, #105's Firefox failure, #56's cancelled main-push Alpha (its CLI passed), and the initial full local domain runner exit **137** without a final report. Do not reclassify or silently rerun them.

## Separate fresh assignments for succeeding workers (not executed)

1. **Code audit:** compare this exact new branch to `fd7afa54...`; inspect the test hook's store classification, mutation/restoration, browser realm and concurrency scope, and ensure normal retry behavior remains tested. Record frozen source/tree, actual local/hosted evidence and independently submitted findings.
2. **Functional bug hunt:** with a working remote checkout and isolated worktree, execute a focused Firefox 2-principal Playwright test at the original and changed source; inspect hook count, persistent inbox retry state, diagnostic DOM and post-recovery unread state. Then run serial Alpha/browser checks without parallel heavy suites. A failure to inject is distinct from an injected write followed by premature recovery.
3. **Defensive security review:** source-review only the failure atomicity of notification writes and persisted retry/seen records, tenant scoping and exception containment. No exploit, aggressive penetration work or previously interrupted reproduction follow-up. Report verified remediation candidates separately.

These are **assignments**, not completed external or independent reviews; no worker-spawn mechanism is available in this invocation. The test edit had only a same-invocation source inspection.

## Next bounded feature and integration gates

Once current qualification is examined, proceed with the highest-priority unowned P1 feature (attachment/reference recovery or delivery/lease state recovery) rather than endlessly producing admission guards. Previous full production-codec archive tests do not establish copied-vault attachment recovery, key rotation or device interruption acceptance. Preserve current v1 signatures, signing identities, encryption and product limits; do not blindly merge incompatible draft #8.

Keep this candidate draft. No ordinary merge until its **own** successful required checks, real independent reviews and qualified ancestor resolution, especially the #120 Firefox finding. After an authorized merge verify the actual merge tree and separate `main`-push qualification. No release, deployment, force push, branch deletion, paid API, unrelated automation mutation or inference of credit exhaustion.
