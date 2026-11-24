# ClassRup — repair transition-issuance interface qualification (2026-11-24 UTC)

## Fresh remote and ownership
Open PR census: 93; main remained 94c272197bc6968a079d0bb626b1e0f6dce04f2d. #158 combined head 3c051fec4082f071a6adb45c5fc934882e3fda43, reported tree 06c24d485ac2574e14e11fe18fb29b91f79d6580, targets main. #159 head 8400f48d046599cd71ed7a3cc152824910e0a3f1; #160 head 9f68cf10b9444860e05d3b93feb96d7f6d445cc9, verified unchanged immediately before creating isolated branch codex/classrup-transition-fixture-contract-20261124. The active continuation is distinct from the paused consolidation task. No older automation modified. PRs #157–160 had zero submitted reviews; #158 conversation also empty. The #158 handoff reports independent reviews of preceding tree 2390845e9d58b4480a9ff7a58335924921af2d33, not newly submitted independent review of final tree. Do not infer approval from CI. Worker ownership outside published records is not fully observable.

Read initial 20261119 handoff and qualification, remaining-work register and recent combined/issuance/acceptance handoffs and exact fixture/issuer source. Exhaustive reread of all historical handoffs was not completed. Initial #57 merged; its original 44663370115 and 44663370114 now confirmed successful from commit-associated CI, and original full local runner exit 137 without report remains incomplete. #56 separate main Alpha 44658477772 cancellation and CLI 44658477821 success retained from prior qualification records. #63 mixed production-codec recovery and #69 previously merged. #150 cancellation and original #157 cancellations are not replaced by later passes.

## New exact-source CI observations
| PR / head | Alpha | CLI |
| --- | --- | --- |
| #157 fdb1def1bd84733d7aecf18a01c0fed5d8ac06a3 | 45313108318 success | 45313108282 success |
| #158 3c051fec4082f071a6adb45c5fc934882e3fda43 | 45314360042 success | 45314360035 success |
| #159 8400f48d046599cd71ed7a3cc152824910e0a3f1 | 45315395923 **failure** | 45315395700 success |
| #160 9f68cf10b9444860e05d3b93feb96d7f6d445cc9 | 45322284670 queued | 45322284621 queued |

#158 actual job steps inspected: plan 138177496586, domain 138205244104 completed typecheck, static, money, tooling, full domain, setup/build and browser journeys successfully. CLI plan 138177496499 and Ubuntu Node 22.18.0/24.x jobs 138202690032/138202690051 completed, including real development and production browser smoke. Do not infer additional matrix platforms or exact assertion counts from step status. #158 review history needs binding to its final tree before ordinary integration; no main merge or main-push verification claimed. Retain prior local full-domain interruption, browser download 403, Chromium exit 137 and socket setup failure separately.

## Confirmed current qualification blocker and repair
#159 failed actual domain job 138206017432 at TypeScript, after frozen-lockfile installation. Decoded job log:
```
tests/integration/barter-want-intent.test.ts(35,9): error TS2741: Property 'exportAttachmentZeroRefTransition' is missing ... but required in type 'UnlockedVault'.
tests/integration/production-barter-recovery.test.ts(448,11): error TS2741: Property 'exportAttachmentZeroRefTransition' is missing ... but required in type 'UnlockedVault'.
```
All subsequent domain/build/browser gates were skipped. Source inspection at #160 confirmed both typed fixtures still missing the method. Added a deliberately throwing async exportAttachmentZeroRefTransition stub alongside existing throwing verifyAttachmentZeroRefTransition stubs; this preserves the unsupported-operation behavior, fixture isolation and strong interface, without relaxing the compiler, casting around the contract, or silently issuing evidence.
- barter-want-intent.test.ts commit 0818d81604bc509b1156548ec7237f80f824271a; resulting blob 2e83f2e3b0f8761e9e1c5f7d4b145930f1d79880
- production-barter-recovery.test.ts commit 44ce1ec858968be1a7977a4a4a1486c51b1779de; resulting blob 156a72073341ffb255b24003688299b2af0a1086

No production behavior, v1, signing identity, encryption, caps, dependencies, timeouts or assertion weakening. Inherited issuance tests remain unchanged. Native git ls-remote actually failed exit 128 Could not resolve host: github.com. No local worktree, typecheck, test or independent worker execution in this run. The targeted repair addresses both recorded diagnostics by source inspection, not an executed successful rerun. No explicit exhausted-credit report.

## Fresh independent successor tasks (unexecuted assignments)
- Code audit: verify exact child diff, full UnlockedVault contract and both fixture error paths; inspect #158 independent review evidence and compare reviewed tree with final source. Preserve exact commit/tree and commands.
- Functional bug hunt: full typecheck first on isolated current child; run issuance/verification and both barter integration files serially, then actual hosted Alpha/CLI. If additional compiler/test errors arise, record logs and fix narrowly; do not rerun unchanged queues. Verify prior tests still run unchanged.
- Defensive security review: source-only check that throwing stubs do not become production callers or grant mutation authority; verify trusted owner, lock guards, snapshot-only semantics, incarnation/replay limitations. No interrupted reproduction follow-ups.
No independent review is claimed by this assignment. Require distinct actual worker evidence. Prioritize integrating qualified #158 with verified reviewed code/tree and main's own push qualification before downstream consolidation. Durable incarnation tracking and authenticated mutation journal remain the next feature, but no irreversible retirement until replay, retention and private-key contracts are accepted. No release, deployment, force push, deletion or paid API.
