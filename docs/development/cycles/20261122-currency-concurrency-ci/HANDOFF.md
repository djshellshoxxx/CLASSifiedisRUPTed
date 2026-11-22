# ClassRup continuation — repair exact-head Alpha qualification race

Date: 2026-11-22 UTC. Draft stacked candidate; not merged or released.

## Frozen remote identity and ownership

- Parent: open draft PR #116, `codex/classrup-deadletter-preflight-20261122`, observed exact head `cfc7c04549172048c373af715e6da14f5d9654f6` (no forced ref update).
- Child: `codex/classrup-currency-concurrent-test-race-20261122`, created from that *published remote commit*. The immediate test-only repair commit is `9fb93b960dc37b5a679b5c2f3d2e57ec603c5189`; obtain final head/tree and PR CI separately after this handoff.
- Changed source: only `packages/commerce/src/valuation/currency/currency.test.ts`; this handoff is the additional file. No production source, v1 wire/signature, identity, encryption, feature limits, or test budgets change. No old local unpublished commits were merged.
- The previous chain back through PR #57 and PR #8 remains unmerged except explicitly documented qualified historical merges; do not infer qualified ancestor integration.

## Exact failed qualification, root cause and fix

At PR #116's unchanged head, [Alpha workflow #45019120389](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/45019120389) **completed failure**. Its domain job `137197909857` passed install, typecheck, spec/dependency/registry checks, money vectors and budget, and 27 tooling tests. It **failed at the complete domain test step**; downstream full setup, build and browser jobs were skipped, not passed. The uploaded `browser-failures` artifact ID `14753072114` contains `domain.json`, downloaded and inspected. Its result is **905 passed, 1 failed, 906 total**. The precise failure: `packages/commerce/src/valuation/currency/currency.test.ts`, `TEST-PS-073-09.T09`, assertion at line 167: expected decimals `6`, received `18`. Preserve this entire original failure; do not call PR #116 qualified.

At the same PR #116 head, [CLI workflow #45019120427](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/45019120427) **completed success** across its plan and both Ubuntu Node 22.18.0 and 24.x clean-install jobs (including browser smoke). CLI success does not replace failed Alpha.

**Source-confirmed test race**: the T09 test issues two concurrent registrations of the same code, one with 6 decimals and one with 18. The implementation serializes registration and rejects the duplicate; it does *not* guarantee which competing request first acquires the transaction. T09 correctly asserts one success and one `COMMERCE_CURRENCY_EXISTS`, but then incorrectly hardcodes that the persisted record must have 6 decimals. A valid winner of the second request persists 18, producing the recorded failure. This is a nondeterministic test expectation, **not evidence that the product admitted duplicate registrations**.

**Bounded repair**: compute `winnerDecimals = concurrent[0]?.ok ? 6 : 18` after asserting exactly one success, and compare persisted decimals with the winning request. This retains the essential concurrent duplicate, idempotency replay, revision conflict and event-count assertions. No production logic changed and no assertions were skipped or weakened to accept an unrelated number. Source inspection only: a local `git ls-remote` failed to resolve `github.com`; no local Vitest, browser or full suite was run, and there is no executed RED/GREEN claim. PR #116's hosted failure is the actual RED evidence; obtain new-child hosted GREEN at its exact head.

## Distinct successor tasks; not independent approvals

1. **Fresh code auditor:** verify the patch only changes the winner-dependent assertion, inspect the dispatch transaction order and idempotency scope; check that a 6 or 18 outcome is accepted only when the matching command succeeded. Identify source head/tree, tests and anything needing independent review.
2. **Fresh functional bug hunter:** execute T09 repeatedly under the exact child source, using isolated nonoverlapping workers; confirm both valid winner orders when feasible. Then run full domain suite and check failed or skipped steps. Do not retry the unchanged failed source without a changed condition (this candidate is the condition).
3. **Fresh defensive security reviewer:** inspect concurrent registration for duplicate code enforcement, authenticated vault scope, status revision checks, idempotency replay and audit metadata without invasive attack reproduction. Record confirmed findings only, patch with focused regression where supported and identify exact commits.

These assignments are **unexecuted** because the available GitHub connector does not launch independent subagents. They are neither reviews nor approvals. The source inspection of the candidate is not an independent review.

## Qualification/integration gate and historical evidence

- Verify this child PR's own Alpha domain/typecheck/static/build/browser and CLI jobs at its final exact commit. A queued or partially completed run is not success; a successful descendant does not rewrite PR #116's failed Alpha evidence.
- Require actual independent reviewers; no draft chain integration until frozen ancestor sources and their required current-source gates/reviews qualify. Verify any resulting merge commit tree and *separate* main push CI.
- Preserve PR #105's Firefox checkbox failure, the original full local domain suite killed with exit 137 without its report, PR #56's cancelled main-push Alpha and setup/cancelled jobs, along with all exact executed checks and skips.
- The realistic full 15-codec encrypted record backup/restore/reopen acceptance already exists among older candidates; do not duplicate it. P1 attachment/reference and delivery/lease recoverability, rotation, device interruption and native WebKit existing-key import remain in `docs/development/REMAINING_WORK.md`.
- Do not merge draft PR #8 wholesale. No release, deployment, force push, branch deletion, paid external API or modifications to older paused/unrelated automations. The owner's credit balance is unobservable and no exhausted-budget signal has been reported.
