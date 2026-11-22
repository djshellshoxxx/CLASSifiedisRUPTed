# ClassRup — prevent sync-outbox ID collision overwrite

Checkpoint: 2026-11-22 UTC. Isolated candidate stacked on draft PR #112; **not merged into main**.

## Frozen sources and actual ownership

- At fork, PR #112 branch `codex/classrup-sync-error-admission-20261122` was observed at head `5702de45e2391ec3af755834f03aca54b37c0747`, tree `f6158e8f8e2b6407ef79bbb3265afe56ea007a57`.
- Child branch: `codex/classrup-sync-enqueue-unique-id-20261122`; forked from that exact published remote ref without rebasing or merging local-only history.
- Test-first commit `30b80f4ad958781cab81a7041858bda89254b525`: `packages/kernel/src/storage/contract-suite.ts`.
- Implementation commit `c150de7dc42b793b3692550b56fad980718f0216`: `packages/kernel/src/storage/tx.ts`.
- The final handoff commit, head/tree and GitHub Actions run IDs are recorded after publication in the PR checkpoint. Parent ownership is unchanged. No other worker was assigned ownership of these files by this continuation.

## Source-confirmed integrity defect

`tx.sync.enqueue` formerly called `d.sync.upsert(row)` unconditionally. The SQLite adapter uses `INSERT OR REPLACE INTO sync_outbox` keyed by global `id`, and memory/IndexedDB use a map keyed by the same `id`. A repeated ID, even for another tenant, silently **replaced an already acknowledged delivery** with a fresh `prepared` row, erasing stored peer acknowledgement, retry/receipt history and original tenant/destination metadata. Type-level IDs do not enforce unique runtime input. This is a source-confirmed data-integrity failure, not a claim of demonstrated exploitation or a product-level collision incidence.

The minimal fix checks `d.sync.get(input.id)` before any mutation and throws `Error('sync enqueue id already exists')` when a row exists. This retains the current unique-ID generation model and doesn't change signed v1 envelopes, public identities, cryptography, FIFO ordering, product caps or test timeouts. New independent IDs still enqueue normally.

Shared adapter regression: create a delivery, move it to `peer_accepted` with a receipt, then try three colliding enqueues: changed ref in same tenant, changed tenant/destination, and exact duplicate. Each must reject with no row mutation. A distinct ID remains valid. The contract runs for memory, SQLite and fake IndexedDB.

## Verification evidence and limits

- Parent #112 exact-head [Alpha run 45000084659](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/45000084659): completed **success**, including domain/typecheck/static/build/browser steps; [CLI run 45000084656](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/45000084656): completed **success**, including Ubuntu Node 22.18 and 24 clean-install jobs. These qualify only frozen parent #112, **not this child**.
- New regression was committed before fix but **not executed RED**. No local product suite, native browser, TypeScript workspace typecheck or independent reviewer has run for this candidate yet. `git ls-remote` failed with `Could not resolve host: github.com`. Do not describe static source analysis or isolated syntax checks as executed product tests.
- GitHub compare from frozen parent after implementation: **2 commits ahead, 0 behind**, exactly `contract-suite.ts` and `tx.ts`; compare again after the docs commit.
- Historic PR #105 [failed Firefox Alpha 44968879520](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44968879520) and 2026-11-19 full local domain runner exit 137 before final report remain failed/incomplete evidence. Passing descendants do not retrospectively change those outcomes.
- Independent review approvals: zero for parent #112 at review inspection and none completed for this new candidate. No exhaustion of a credit/usage budget has been reported.

## Fresh distinct worker assignments — **not executed**

1. **Code audit:** at the exact final child head, review all `tx.sync.enqueue` callers, ID generator assumptions, SQLite global primary key and memory/IndexedDB keying. Check duplicate error semantics and transaction rollback. Record exact source SHA/tree, static vs runtime evidence, and any regression risks.
2. **Functional bug hunt:** use an isolated checkout of the published remote ref. Execute the test-first commit against pre-fix source for genuine RED if feasible, then this candidate for GREEN, testing all three adapters, repeat ID and normal FIFO/ack/retry/read flows. Run focused tests and typecheck/static/build/browser/CLI gates, serializing heavy suites. Record failures separately.
3. **Defensive security review:** review low-level cross-tenant ID collision impact, receipt integrity, tenant-scoped acknowledgement and state transitions from source; propose and verify only bounded hardening. Do **not** resume interrupted offensive reproduction follow-ups.

The API connector does not provide an agent executor here, so these are *handoffs*, not independently executed worker reviews or approvals. Do not merge this candidate or its draft ancestors until actual current-head CI and independent qualification gates pass, then verify the merge tree and main's separate push qualification. Preserve incompatible PR #8 and unrelated paused automations. No release, deployment, force push, branch deletion or paid API was authorized.

## Broader incomplete-feature priorities

Current `docs/development/REMAINING_WORK.md` says full-registry encrypted backup restore/reopen has existing draft acceptance; remaining P1 recovery work includes attachment/reference portability, delivery/lease-state recovery, owner-authorized rotation and interrupted-device/load acceptance, plus native WebKit imported-key compatibility. A small sync ID integrity repair must not be counted as implementing those broader milestones.
