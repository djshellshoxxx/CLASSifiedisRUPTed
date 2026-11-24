# ClassRup engineering continuation — protect outbox event identities

Checkpoint: 2026-11-22 UTC. Isolated stacked candidate; draft only, not merged or released.

## Exact frozen source and ownership

- Repository: `djshellshoxxx/CLASSifiedisRUPTed`.
- Frozen parent: open draft PR #117, `codex/classrup-currency-concurrent-test-race-20261122`, observed published head `3a58d5355a85807afe7ba4d87a91e98310a34450`, base PR #116 at `cfc7c04549172048c373af715e6da14f5d9654f6`; no reviews submitted at inspection. Parent was not modified.
- This child: `codex/classrup-outbox-event-id-guard-20261122`, created directly from the frozen remote parent SHA, **not** a local-only mapped history. No force push, deletion or ancestor rewrite.
- Test-first GitHub commit: `9d22bb2165217d5dc981f3dbe44268db1838df34`, exclusively `packages/kernel/src/storage/contract-suite.ts`.
- Minimal production repair: `1da498a7db0c40344aa85e9f10cece546232ceb3`, exclusively `packages/kernel/src/storage/tx.ts`, tree `fd5198d4f17bc9ef5858f62eb7026a240d862fcf` before this documentation commit.
- Read actual final published head, tree, compare and workflow IDs after PR creation; these earlier source identities must not be substituted for final CI identities.

## Confirmed source discrepancy and bounded repair

The shared `tx.outbox.append` previously forwarded events without a duplicate-ID guard. The SQLite driver runs `INSERT INTO outbox` against a unique `event_id`, so collisions fail. The memory driver, also used by IndexedDB as a working set, unconditionally increments `outbox_seq` and writes `outbox` keyed by `eventId`, replacing the earlier event. That inconsistency can destroy a previously delivered or pending event, change its tenant and payload while retaining a consumer inbox row, and consume sequence numbers without adding a new event.

The shared boundary now checks `d.outbox.get(env.eventId)` and throws `Error('outbox event id already exists')` **before any write** on a repeated ID, preserving the existing SQLite uniqueness and normal unique-event append behavior. No v1 signatures, signing identities, encryption, product caps, event wire fields or test limits were modified. This is a source-confirmed correctness finding, not an external exploit or live-data incident.

The committed shared regression (memory, SQLite, fake IndexedDB) creates a delivered event, snapshots its envelope, inbox and other-consumer pending queue, and attempts three collisions: an exact duplicate, same-ID altered payload and same-ID foreign-tenant event. Each must reject without changing storage; a distinct subsequent event must retain the next sequential ID and normal pending order. The test was committed **before** the implementation, but the local host still cannot resolve `github.com` for checkout; therefore **no executed local RED/GREEN, Vitest, TypeScript, browser or full-suite result** is claimed. The source difference and SQLite schema were inspected through the connected GitHub repository, not via a runtime probe.

## Current qualification — source-specific evidence only

- Parent PR #117 exact head `3a58d5355a85807afe7ba4d87a91e98310a34450`: [Alpha #45024608984](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/45024608984) **completed success**, including plan, typecheck, specification/dependency/registry gates, money vectors/budget, tooling, full domain runner, setup/build and browser journeys; [CLI #45024609024](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/45024609024) **completed success**, including plan, Ubuntu Node 22.18.0 and 24.x installs, setup/build and browser smoke.
- Both successes are **parent-only**; require this new child's exact final head and all required jobs before qualification. No genuinely independent reviews exist for the parent or child at this checkpoint.
- Preserve PR #116's **failed** [Alpha #45019120389](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/45019120389) with 905 domain assertions passed and 1 failed (the concurrent currency test), despite its passing CLI. PR #117's correction does not retroactively turn that source green.
- Preserve PR #105's historical failed Firefox checkbox Alpha, the complete 2026-11-19 local domain run **exit 137 without a final report**, PR #56's cancelled separate main-push Alpha, and all original skipped/setup evidence. Do not restart unchanged queued or killed jobs without a changed condition and remedy.
- Main at last inspection was `449a619f1ae7b66cb42d9cab43dd5493bfe42c2e` (merged #63). The long draft chain after that source has **not been independently approved/integrated**. Do not merge merely because a descendant is green.

## Distinct successor-worker assignments — unexecuted, not approvals

1. **Fresh independent code auditor:** compare the new PR's exact head with #117, inspect adapter semantics, verify `get` uses a global event key and that the guard precedes the memory `meta.outbox_seq` update and SQLite insert. Review whether valid distinct appends, pending ordering and retained event histories are unchanged. Record source SHA/tree and static-vs-executed evidence.
2. **Fresh normal functional bug hunter:** in an isolated checkout/worktree at the documented test-first commit (without the repair), execute the targeted contract suite for RED, then execute GREEN at the published child head across memory/SQLite/IndexedDB. Verify cross-tenant collision, exact duplicate, delivered-inbox preservation, sequence continuity and normal append, then run repository gates serially. Do not run heavy suites concurrently or inflate claim counts.
3. **Fresh defensive security reviewer:** source-focused review of globally keyed outbox identities and consumer inbox binding, cross-tenant substitution, idempotency/event replay, retention and transaction rollback semantics. Do defensive hardening only if a defect is confirmed with a bounded regression. Do not resume interrupted reproduction campaigns. Leave exact findings and a handoff.

The current connector can inspect/edit GitHub and hosted CI but **does not launch independent agents**. None of these assignments has been executed or accepted as independent approval.

## Continuing the engineering and integration mission

Verify the child's own CI at its exact head, investigate any failure with logs rather than polling or blind reruns, solicit actual independent reviews, and reconcile ancestor review/qualification before merging. If qualified integration occurs, verify actual resulting merge tree and separate main-push Alpha/CLI. Resume the next unblocked bounded recovery feature using the updated `docs/development/REMAINING_WORK.md`; the production 15-codec mixed encrypted restore/reopen acceptance already exists, while attachment/reference, delivery/lease, key rotation, interrupted-device recovery and existing-key native WebKit compatibility remain distinct. Never blindly merge incompatible draft #8.

No release, deployment, force push, branch deletion, paid external API or paused/unrelated automation change is authorized. No exhausted-credit or exhausted-budget condition was reported; owner balance is not observable.
