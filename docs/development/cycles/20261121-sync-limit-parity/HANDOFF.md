# ClassRup — sync query limit parity / engineering handoff

Checkpoint: 2026-11-21 UTC. This is a draft, unmerged child of PR #100; **no independent review approval is implied**.

## Source identity, isolation and ownership

- Repository: `djshellshoxxx/CLASSifiedisRUPTed`.
- Frozen remote parent: draft PR #100 `codex/classrup-deadletter-list-limit-20261121` at `59d07748b3468a9013f19d9391abf803e1569a1a`, tree `d2f2564df9c040b8d151e5a1ff329126e77a4af8`; verified unchanged before branch creation and after the two code commits.
- New child branch: `codex/classrup-sync-limit-parity-20261121`. Test-first commit `8fcffc364a41fd35fd30343fa2de6a091d539ad0`; production fix `d280b619674d710d3e40789f462cac60c443fd02`, tree `691a58137c95e650ae4d217725935f4f4e8386c0`. Fetch the latest branch head after this handoff commit.
- Connector compare of the two code commits against the parent: **2 ahead, 0 behind**, exactly `packages/kernel/src/storage/contract-suite.ts` (34 added lines) and `packages/kernel/src/storage/tx.ts` (14 additions / 2 deletions).
- The 2026-11-19 legacy local-only/published commit mapping is in the original handoff; do not blindly merge local-only commits or incompatible draft #8. Main was last observed at `449a619f1ae7b66cb42d9cab43dd5493bfe42c2e`.
- This work does not alter other branches, their worker ownership, v1 signature bytes, signing identities, encryption, the production codec set, product caps, existing test limits or deployment configuration.

## Source-confirmed finding and repair

`tx.sync.list({ limit })` and `tx.sync.heads(now, limit)` forwarded arbitrary numeric limits without checking them at the shared transaction boundary. The SQLite implementation uses `LIMIT ?` and the memory/IndexedDB working-set implementation uses `.slice(0, limit)`. A negative SQLite LIMIT returns *every* matching row while a negative memory slice selects most rows: unintended and inconsistent breadth. Unlike the separately repaired outbox/dead-letter API limits, both sync query entrypoints remained unvalidated at the observed parent source.

Standalone local demonstrations (not ClassRup product tests) with three rows: SQLite -1 and -2 returned all three; Node `[1,2,3].slice(0,-1)` returned two, and `slice(0,-2)` returned one. The repair uses one shared `Number.isSafeInteger(limit) && limit >= 0` check for both list and heads; the default 100 and explicit 0 remain supported. No new maximum cap was introduced.

The new shared contract regression instantiates each adapter through `storageContractSuite`, seeds two distinct destination/tenant prepared sync records, and checks seven malformed limits (negative, fractional, non-finite and unsafe integer), explicit zero, limits one/two, list default 100, stable ordering, and tenant filtering. The unchanged suite is wired into memory, SQLite and IndexedDB tests. It was authored first, but **no pre-fix RED product test executed**. Avoid describing the standalone reproductions as repository tests or demonstrating remote exploitability.

## Exact-head qualification and outstanding gates

- Parent PR #100's own Alpha workflow [44942756800](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44942756800) and CLI workflow [44942756852](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44942756852) were observed **completed/success** at the exact parent SHA. Alpha plan/domain jobs succeeded, with typecheck, domain assertion runner, tooling, build and browser steps successful. CLI plan and both Ubuntu Node 22/24 clean-install jobs succeeded. These are **parent-only qualification**, not qualification of this child.
- The child has no executed local TypeScript, Vitest, browser or full product suite: the local environment's `git ls-remote` failed `Could not resolve host: github.com`. No local remote-ref worktree could be created; GitHub connector isolated branch/commits instead. Do not call the test-first change a verified RED stage.
- After opening this draft PR, inspect **its own** Alpha/CLI at its current published SHA. Do not recycle queued, cancelled, killed or previous-head results. Do not restart unchanged queued/killed runs without changed conditions.
- Preserve historic 2026-11-19 domain runner exit 137 without a report, original pending/failing runs, and PR #56 separate main-push Alpha cancellation / CLI success. PR #57 is already merged; `REMAINING_WORK.md` records its subsequent qualified main push.
- **Independent code-audit, normal functional bug-hunt and defensive security-review workers did not execute in this invocation.** Their future work is a gate, not a signed review.

## Fresh worker lanes — separate source identities and evidence

1. **Independent code audit:** freeze live parent/child refs in isolated worktrees if network permits; examine limits, call-site default/sentinel compatibility, `sync.heads` FIFO (one head per tenant/destination), `sync.list` filtering and output mapping. Run compiler and focused cross-adapter cases serially. Report line-level defects and exact commands/source.
2. **Functional bug hunt:** independently reproduce parent RED and child GREEN in actual memory, SQLite and fake IndexedDB product tests; test zero, valid positive, unsafe/non-finite/negative values, FIFO, retry transitions, reopen and durable ordering. Inspect current hosted logs for skipped or incomplete jobs; distinguish standalone language demonstrations from executed product tests.
3. **Source-focused defensive security review:** inspect query breadth, possible untrusted-limit reachability, tenant/consumer authorization at callers and sorting/allocation behavior. Avoid attack reproduction follow-ups; remediate only confirmed defensive source findings. No assertion of remote exploitability based on query parity alone.

When reviews finish, integrate only confirmed repairs, refresh exact source SHA, requalify, then consider ordinary ancestor-by-ancestor merges with main-push verification. Do not merge a draft merely because Alpha/CLI succeed. The documented P1 encrypted mixed-registry backup restore/reopen is implemented in candidate history, but current-source acceptance and separate attachment/reference, delivery/lease, rotation, native WebKit and device-recovery gates remain distinct. Use `docs/development/REMAINING_WORK.md` rather than treating a passing storage query test as recovery completion.

No release, deployment, force push, branch deletion, paid external API, or unrelated automation modification is authorized. No report of exhausted owner credits exists.
