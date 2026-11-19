# Comprehensive branch consolidation

## Latest qualification checkpoint — November 18, 2026

PR [#54](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/54) merged into
main at **2026-11-19 07:30:13 UTC**, as
`d7c03a28c93db0d6a0b33a7127b35f10b6faa5a8`. The actual merge preserves parents
`044c213d90d62f1f06edb8ca1b9c2141d3991c27` and
`a111eefb907a9f039f56777715e20b4976ea3d87`; its tree
`7a791921eb6a820bf4cd4d203e31a76f6fe5cd4a` exactly matches the tested candidate.
This checkpoint supersedes the initial publication-state observations below.
Actual post-merge main qualification and the documentation closeout are still
pending; completion is not yet claimed.

- Source PR [#53](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/53) at `d81094688ac116c84c09f3105c7b3f6b4c472793` and its PR [#51](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/51) ancestor `7b729df38dddf59c4e60e245bdf1ca43546b1e7b` are verified ancestors of actual main. GitHub automatically marked #53 merged at `07:30:15 UTC` and #51 at `07:30:16 UTC`. These are two incorporated source heads and two automatic PR resolutions, from one explicit consolidation merge action.
- Dedicated integration head: `a111eefb907a9f039f56777715e20b4976ea3d87`. Remote source merge `098d970dd9515d6c43b779aee07cab6d696acd8d` retains the original source parents. Local source merge `2401a6cc` is a distinct commit with the same source tree and parents.
- Fresh [CLI workflow 44474363663](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44474363663): **success**, first attempt, all six OS/Node jobs. **190 repeated platform assertions passed, zero failed, two intentional Windows POSIX-only skips**. Setup, repeat setup, doctor, production build, real development/preview browser smoke and tracked-file checks passed everywhere.
- Fresh [Alpha workflow 44474363888](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44474363888): **success**, first attempt. **701 domain assertions, 27 tooling tests and 72 Chromium/Firefox/WebKit journeys passed**, with zero failed/skipped tests. Typecheck, all 148 specifications, dependency/registry checks, 331 independent money vectors, bundle budget, setup and build passed. Both workflows tested `101265f1fa9dee9e59d177174e4b55bd3ce3bf26`, whose tree is identical to actual main.
- [Complete combined qualification and nine raw job logs](evidence/20261118/pr54-ci/final-qualification.json) preserve exact checkouts, job identities, counts, byte sizes and SHA-256 digests. [Alpha excerpts](evidence/20261118/pr54-ci/alpha-excerpts.txt) and [CLI excerpts](evidence/20261118/pr54-ci/cli-excerpts.txt) provide concise output. The prior CLI-only checkpoint remains archived separately.
- Actual main push runs [Alpha 44480107217](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44480107217) and [CLI 44480107222](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44480107222) were queued at the first post-merge observation. Their own results remain required. [Merge and initial post-main state](evidence/20261118/post-integration-state.json) records the boundary.
- [Local qualification](evidence/20261118/LOCAL_QUALIFICATION.md): typecheck, 148 specifications, boundaries, registry, vectors/bundle budget, dependency audit, setup/build, 27 tooling tests, 32 CLI tests and ten independent probes passed. The complete domain invocation had 699 passes and two timeouts; both cases subsequently passed individually at the original limits. All 24 local browser cases failed at launch because the command sandbox denied Chromium's socket; zero app journeys ran locally. The standard escalation request was rejected by the environment policy. Initial unsuccessful/incomplete observations remain archived.

### Dispositions at this checkpoint

The two initial A source histories are now fully incorporated into main. The
initial 50 D, four C and one E classifications remain immutable discovery
observations. No new partial recovery or source repair is counted; prior
registry extraction and the prior macOS rerun are historical work. All
pre-existing remote branches are preserved.

The [completed ref/PR reconciliation](evidence/20261118/final-reconciliation.md)
confirms **52 original cleanup candidates**: the 50 initial D histories plus
the two newly incorporated A source heads. All 57 original non-main refs
remain unchanged and no candidate is needed as an open PR source or base.
**34 original non-main heads are now ancestors of main**, comprising 32 prior
heads plus the two newly integrated sources. Four unfinished product/specification
heads and one diagnostic head remain preserved. No branches have been deleted. The two new task branches,
`integration/comprehensive-consolidation` and
`docs/consolidation-qualification-20261118`, are outside the original 58-branch
discovery denominator. Documentation PR [#55](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/55)
now targets main and awaits post-main evidence before closeout.

The remaining execution steps and exact merge guards are in the
[continuation handoff](CONSOLIDATION_HANDOFF.md). Product priorities remain in
[REMAINING_WORK.md](REMAINING_WORK.md). No deployment or release occurred.

## Scope and initial publication checkpoint

This is the November 18, 2026 (America/Los_Angeles) consolidation of
[`djshellshoxxx/CLASSifiedisRUPTed`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed).
The supplied `classrupted` repository URL was a shorthand, not a second repository.
GitHub timestamps in the evidence retain UTC as returned by the service.

- Starting `main`: `044c213d90d62f1f06edb8ca1b9c2141d3991c27`.
- Dedicated integration branch: `integration/comprehensive-consolidation`.
- Local history-preserving source merge: `2401a6cc2b200445d21da3268bd526f2ca19cb17`.
- Discovery: **58 pre-existing branches**, **53 PRs** across all states, **zero open non-PR issues**, **zero exposed tags**, and **zero published releases**.
- All 53 PR head names remain represented among the 58 live branches. PR-head refs were also enumerated; no additional deleted branch name was discoverable through those records.
- All 51 non-main heads from the original 52-branch historical audit retain their recorded SHAs. Later branches and updated main were examined separately.

The integration incorporates PR #53 at `d81094688ac116c84c09f3105c7b3f6b4c472793`,
including its PR #51 ancestor `7b729df38dddf59c4e60e245bdf1ca43546b1e7b`.
Both source histories remain intact. No pre-existing remote branch is deleted or
rewritten. No deployment or release is part of this task.

## Discovery and classification method

The audit combined GitHub branch and all-state PR collections, all advertised
PR-head refs, local full-history Git objects, commit ancestry, `git cherry` patch
equivalence, changed-path comparisons, read-only `git merge-tree`, and the earlier
source-pinned consolidation reviews. A shared merge base is recorded as an
inference about lineage; Git does not preserve the name of a branch's creation
base. PR target branches supply additional, explicit base evidence.

Historical test results are labeled historical. Being an ancestor of a tested
main establishes integration, not a new test execution of every old head. A
clean textual merge is insufficient where protocol, authorization, storage or
specification semantics differ.

| Initial classification | Branches | Meaning and disposition |
|---|---:|---|
| A — Ready to merge | 2 | PR #53 and its PR #51 ancestor; independently reviewed and merged locally for final combined qualification. |
| B — Repairable integration blocker | 0 | No current source repair was required for the eligible batch. The reported macOS failure was a cancelled job, subsequently passed. |
| C — Partially reusable / retained evidence | 4 | PR #8 remainder, two later specification drafts, and the WebKit diagnostic branch; preserve with explicit prerequisites. |
| D — Already integrated / superseded | 50 | 32 ancestral heads, six content-integrated module/CI histories, ten superseded historical references, one adapted CLI proposal, one superseded stacked documentation branch. |
| E — Incompatible current runtime | 1 | Alternate `claude/busy-cerf-vg3hz3` implementation; requires redesign against current client-owned authority. |
| F — Discardable abandoned work | 0 | No unique source was silently discarded or labeled valueless. |
| G — Observed concurrent modification | 0 | No concurrent head change was established; this is not a guarantee that another worker is inactive. |
| Integration baseline | 1 | `main`. |
| **Total** | **58** | New branches created by this run are reported separately. |

## Integration order and decisions

1. Preserve the verified current alpha, encrypted persistence, owner history,
   identity-generation mitigation and already extracted feature registry.
2. Integrate PR #51's strict Base64url tests, shared test helper, CI symlink
   enforcement and obsolete discovery-path cleanup through its existing PR #53
   ancestry.
3. Integrate PR #53's bounded public-record CLI and shared payload validation.
4. Add this complete inventory, source/CI review evidence and the prioritized
   [remaining-work register](REMAINING_WORK.md); correct stale project TODO links.
5. Qualify the combined branch, open a consolidation PR, require its actual
   checks to succeed, synchronize with current main, then merge with an expected
   head SHA. Re-read the resulting main and its own push checks.

The source merge is clean. The new CLI reads one explicit regular local file
with a real 1 MiB byte cap, verifies its existing envelope and payload, and
reports chain history/revocation as unchecked. It creates no private key or
vault and performs no admission. Shared validation preserves the PWA's existing
owner binding, expiry, retained-history, tombstone-target and conflict behavior.
This delivers public verification F1a, not full CLI parity.

Independent source review found no blocking regression. Ten additional
adversarial probes passed against the local source merge, including file swaps,
descriptor stability, exact size boundaries, partial reads, async mutation,
control-character metadata and malformed UTF-8. See the review evidence linked
below. Removed test globs currently contain no tests; restore a relevant glob if
a future recovery introduces tests into those directories.

## Preserved blockers and recoverable work

| Branch / source | Remaining obstacle | Decision |
|---|---|---|
| `claude/bold-mccarthy-qklhl6` / PR #8 | Old transaction code calls removed `syncStore`; driver contracts and missing imports disagree. Public IDs, canonical signatures, delegated authority, relay secrets and tenant settings need real consumers and migrations. | Keep draft. Registry already recovered through PR #48; no additional safe drop-in runtime slice established in this review. |
| `claude/busy-cerf-vg3hz3` | Alternate IDs/kernel interfaces, relay-asserted sender authority and historical consent semantics conflict with the running client-owned system. | Preserve as design/test reference; do not replace current runtime. |
| `claude/happy-newton-4yttpa` | 150 later Markdown proposal paths beyond the archived PR checkpoint; ULID/booking-service assumptions conflict with current contracts. | Reconcile chosen requirements in source `module.spec.yaml` before regenerating documents. |
| `claude/wonderful-cori-ynhlsb` | 1,770 later Markdown/CSV proposal paths; old OPEN decisions and provisional NO-GO statements conflict with subsequently accepted ADRs. | Preserve proposal; selectively reconcile without overwriting current evidence. |
| `diagnostic/webkit-keygen-20261118` | Strict native probes still fail valid leading-zero/all-zero private-key imports and intermittent native generation. Its unique workflow is tied to the diagnostic branch. | Preserve diagnostic source and failure evidence. Product mitigation is not an existing-key import repair. |

Historical PR #8 exact-head qualification recorded 86 TypeScript diagnostics and
20 passed / 73 failed tests. Those executions were not rerun or relabeled as new
results. Fresh static comparisons found the same defective source unchanged.
Its 34 runtime paths comprise two identical, twelve different and twenty absent
paths relative to starting main; eight of the present paths are the already
recovered/adapted registry. Absence alone does not establish that a proposed
implementation belongs in current main.

## CI diagnosis and verification

PR #53's original macOS Node 22 job
[134903492477](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44320887774/job/134903492477)
was cancelled before executing any step. Replacement job
[135369195854](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44320887774/job/135369195854)
passed all 32 CLI tests, setup, repeat setup, doctor, build and browser smoke.
No source defect was established and no assertions were relaxed.

At source `d810946`, the existing
[Alpha run](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44320887748)
passed 701 domain assertions, 27 tooling assertions, 72 browser journeys and
the static/build/vector gates. The
[CLI run](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44320887774)
passed all six Ubuntu/Windows/macOS × Node 22.18.0/24.x jobs: 190 repeated
platform assertions passed, with two intentional Windows skips of the POSIX
FIFO/device case. Its second attempt retained five earlier successful jobs and
reran only macOS Node 22. These results are source evidence; final integration
and post-merge runs are recorded separately below.

PR #37 is already merged and its final Alpha/CLI checks passed. The independent
[raw WebKit diagnostic](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44268543372)
still has two failed probes (seven generation errors in 512 trials; deterministic
private-import failures). Main already retries at most three new-key generation
attempts only for genuine `OperationError` DOMExceptions. Existing-key restore,
import, export and decryption are not retried or silently replaced.

### Execution record

Final local, consolidation-PR and post-merge evidence will be recorded here as
each stage completes. A queued, killed or cancelled check is not a passing test.
No dedicated lint script is configured in this repository; type/spec/dependency
checks and existing security regressions are the available automated gates.

## Branch cleanup

The 50 initial D branches are review candidates, not deletion instructions.
Once PR #53/51 are confirmed on main, their two source branches may join that
candidate list. Before any later deletion, re-read the exact head, open PRs and
recent activity; verify ancestry or the documented semantic replacement and
confirm no release or concurrent worker still needs the branch. A candidate
list does not authorize overwriting new work.

Preserve the four product/specification branches needing development, the native
diagnostic branch, main, and any newly active branch. No pre-existing remote
branch was deleted during this consolidation.

## Detailed inventory and evidence

The complete branch-by-branch inventory and historical PR ledger are appended
below and stored with machine-readable source evidence. Prior audit documents
remain unchanged as historical checkpoints.

## Initial discovery snapshot

Baseline: [`044c213d90d62f1f06edb8ca1b9c2141d3991c27`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/commit/044c213d90d62f1f06edb8ca1b9c2141d3991c27).

This inventory covers all **58 branch names** returned at discovery and every head named by the **53 historical pull requests**. All PR objects are locally available; no PR head branch name is missing from the live branch collection. Different historical PR snapshots are retained in the separate PR table. No undiscoverable deleted ref is claimed to have been recovered.

Initial classification counts: **A 2, B 0, C 4, D 50, E 1, F 0, G 0**, plus **main as the integration target**. Active development is not inferred only from a recent timestamp. The two A branches share one candidate history: PR53 includes PR51. Their integration outcome belongs to the execution record; this snapshot does not pre-claim a remote merge.

Of the 50 D branches, **32 heads are already ancestors of initial main**, **6 contributions are integrated by content**, **10 are superseded historical references**, **1 CLI proposal was adapted**, and **1 stacked documentation branch was superseded**. All 51 non-main branch heads from the preceding 52-branch audit remain byte-identical SHA snapshots, so its source-pinned semantic reviews remain applicable. Fresh ancestry, merge bases, tree comparisons, patch equivalence and textual merge simulations were recomputed.

The machine-readable inventory contains full heads, exact source commit lists, declared PR bases, merge bases, last meaningful activity, changed paths, patch-equivalence counts and hashes, CI observations, security/compatibility concerns, conflict paths and review references. Git does not record an originating branch name; a declared PR base is given where known, otherwise the merge-base is the factual reference. Historical CI is labeled as historical, not reported as a new run.

### Branch-by-branch disposition

| Branch | Source head | PR | Initial class | Unique commits / source paths | Text conflicts | Disposition |
|---|---|---|---|---:|---:|---|
| `agents/ci/trim-workflows` | [`3f41b81accf0`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/3f41b81accf062b2031504bd2e98d2913fb17fb8) | [#33](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/33) | D | 1 / 4 | 0 | Already integrated by reviewed content |
| `agents/discovery/coarse-filters` | [`4f60ff9fa121`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/4f60ff9fa121435b962801d6594d9fca413d5bb7) | [#26](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/26) | D | 2 / 9 | 4 | Already integrated by reviewed content |
| `agents/discovery/ranking` | [`de8f44d52cfc`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/de8f44d52cfccf4f1496a885cd4ac70894ff3847) | [#27](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/27) | D | 0 / 0 | 0 | Already integrated by ancestry |
| `agents/governance/taxonomy-prohibited` | [`997249164e4b`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/997249164e4b32df443dbbe2e07f729311c9cdeb) | [#30](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/30) | D | 2 / 14 | 2 | Already integrated by reviewed content |
| `agents/i18n/languages-currencies` | [`a0f9422d91b9`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/a0f9422d91b91d147405c17730d49350e87fc3ce) | [#28](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/28) | D | 0 / 0 | 0 | Already integrated by ancestry |
| `agents/moderation/rate-limits-signals` | [`c098f1bf9175`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/c098f1bf91759afd8ab0519ba04fa27671605de5) | [#32](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/32) | D | 2 / 10 | 6 | Already integrated by reviewed content |
| `agents/notify/prefs-inapp` | [`d6076d18621e`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/d6076d18621e16ec5b6a87e210f99bd305cf6243) | [#29](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/29) | D | 2 / 10 | 10 | Already integrated by reviewed content |
| `agents/orchestration/wave1-handoff` | [`6406a0369098`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/6406a0369098fdb7aa58b5a4e85325560857815f) | [#34](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/34) | D | 0 / 0 | 0 | Already integrated by ancestry |
| `agents/privacy/classification-metadata-consent` | [`2752f04dd27c`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/2752f04dd27c6df90ffa5d22d479e77ae2688a86) | [#31](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/31) | D | 2 / 19 | 5 | Already integrated by reviewed content |
| `chatgpt/zero-codex/audit-observability-20261110` | [`1ee040492345`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/1ee040492345e607b431707fd7f08528bbf2db77) | [#14](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/14) | D | 0 / 0 | 0 | Already integrated by ancestry |
| `chatgpt/zero-codex/barter-discovery-status-20261110` | [`e0f153fd9185`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/e0f153fd9185eaa5b52882931eac1c694d54abc5) | [#20](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/20) | D | 0 / 0 | 0 | Already integrated by ancestry |
| `chatgpt/zero-codex/cli-nested-assets-20261110` | [`3a66e440847d`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/3a66e440847d7e1234e5a82674decdacb3efb954) | [#19](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/19) | D | 0 / 0 | 0 | Already integrated by ancestry |
| `chatgpt/zero-codex/cli-public-symlink-20261110` | [`f8ed3a9324de`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/f8ed3a9324de83bd5116b1d7a4a8cfdb8682b88f) | [#17](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/17) | D | 0 / 0 | 0 | Already integrated by ancestry |
| `chatgpt/zero-codex/diagnostic-privacy-regression-20261110` | [`9bb03390b269`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/9bb03390b2692d8fad80dbf653c28e36bef76c28) | [#22](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/22) | D | 0 / 0 | 0 | Already integrated by ancestry |
| `chatgpt/zero-codex/docs-wiki-20261110` | [`19edded385d4`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/19edded385d4aaa2fea9f482cf3a0fdc7cd0a806) | [#13](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/13) | D | 0 / 0 | 0 | Already integrated by ancestry |
| `chatgpt/zero-codex/federation-recovery-trace-20261110` | [`20691f1cce36`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/20691f1cce36b1254644ea16bb438ca91221a872) | [#15](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/15) | D | 0 / 0 | 0 | Already integrated by ancestry |
| `chatgpt/zero-codex/noscript-vault-guard-20261110` | [`968d63d8aeba`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/968d63d8aebac1055ffc911fcceec519f30c8855) | [#21](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/21) | D | 0 / 0 | 0 | Already integrated by ancestry |
| `chatgpt/zero-codex/outbox-isolation-20261110` | [`a294dd21715e`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/a294dd21715edf501aac75bee69f785951985cd5) | [#16](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/16) | D | 0 / 0 | 0 | Already integrated by ancestry |
| `chatgpt/zero-codex/qualify-pr10-20261110` | [`4620d244e79e`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/4620d244e79e4cefbeade9cf59149ea1c3f7e5c2) | [#12](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/12) | D | 0 / 0 | 0 | Already integrated by ancestry |
| `chatgpt/zero-codex/review-ranking-i18n-20261112` | [`d16abeef4dfa`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/d16abeef4dfab4f6376436f944f88a25d5a1bf8f) | [#35](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/35) | D | 0 / 0 | 0 | Already integrated by ancestry |
| `chatgpt/zero-codex/sync-expiry-head-boundary-20261110` | [`12558435a307`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/12558435a307415ba0332777f87b1603abba5268) | [#23](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/23) | D | 0 / 0 | 0 | Already integrated by ancestry |
| `chatgpt/zero-codex-continuation-spec-20261109` | [`d52b29369271`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/d52b29369271f39a4873ace47c76b1b92d0750b3) | [#11](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/11) | D | 0 / 0 | 0 | Already integrated by ancestry |
| `claude/bold-mccarthy-qklhl6` | [`a403614bb34d`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/a403614bb34d3d176d4693730e512e14959718b8) | [#8](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/8) | C | 31 / 1914 | 63 | Registry recovered earlier; preserve unfinished remainder |
| `claude/busy-cerf-vg3hz3` | [`34a6892cff8b`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/34a6892cff8babb01c41f42d04df85bf6860fa34) | — | E | 7 / 339 | 111 | Architecture port required; preserve source |
| `claude/classifiedisrupted-continue-lcuuwg` | [`ab6541552827`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/ab6541552827b82c7bbbcbba282b2836f92cdd37) | [#5](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/5) | D | 56 / 409 | 336 | Historical source superseded; retain provenance |
| `claude/difficult-project-parts-dcqlup` | [`566778cdf723`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/566778cdf72399df4696e1d6f6675412813e6d5a) | [#25](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/25) | D | 0 / 0 | 0 | Already integrated by ancestry |
| `claude/gallant-goodall-9cc7yb` | [`cc55f8ad1534`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/cc55f8ad153468ed6523ded1a59dfdf84215ce6b) | — | D | 1 / 1 | 0 | Historical source superseded; retain provenance |
| `claude/haiku-classrupted-features-cc9qmr` | [`7b729df38ddd`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/7b729df38dddf59c4e60e245bdf1ca43546b1e7b) | [#51](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/51) | A | 1 / 11 | 0 | Verified candidate; integrate through PR53 |
| `claude/happy-newton-4yttpa` | [`8d5f66f75411`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/8d5f66f75411debbfe9377679005cfadb6b679c0) | [#18](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/18) | C | 3 / 169 | 169 | Reconcile later specification drafts; preserve source |
| `claude/pensive-mendel-30x81m` | [`52bed39dda52`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/52bed39dda52c680a4299e20aaefe0f4695b2d58) | [#3](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/3) | D | 1 / 25 | 0 | Historical source superseded; retain provenance |
| `claude/vigilant-newton-nva2l6` | [`59028d1d962e`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/59028d1d962e6c4f113e19d77abf73a045a2318d) | [#6](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/6) | D | 2 / 4 | 2 | Historical source superseded; retain provenance |
| `claude/wonderful-cori-ynhlsb` | [`c9bd8933ff51`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/c9bd8933ff519e97ed97bb132432103a2ad29fe4) | [#36](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/36) | C | 24 / 1939 | 1932 | Reconcile later specification drafts; preserve source |
| `codex/classrup-completion-20261116` | [`a189787ab6cc`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/a189787ab6cc0741743da0cd0cf8b0a9cd2e39dc) | [#37](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/37) | D | 0 / 0 | 0 | Already integrated by ancestry |
| `codex/classrup-consolidation-audit-20261104` | [`59324a42e2dd`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/59324a42e2ddf933eeef8c9363e33ef41690a31a) | [#9](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/9) | D | 0 / 0 | 0 | Already integrated by ancestry |
| `codex/classrup-features-20261116` | [`560b328dd335`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/560b328dd335aebdc12de01ec339c43ebd164be3) | [#41](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/41) | D | 0 / 0 | 0 | Already integrated by ancestry |
| `codex/consolidate-keyboard-focus-20261117` | [`0c2e9e2992c3`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/0c2e9e2992c359fd60f827983bd5e3f432bc8771) | [#45](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/45) | D | 0 / 0 | 0 | Already integrated by ancestry |
| `codex/encrypted-domain-storage-20261116` | [`afa6952b50d9`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/afa6952b50d97e46e8e54d950db92a3593f1e5bd) | [#38](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/38) | D | 0 / 0 | 0 | Already integrated by ancestry |
| `codex/listing-history-20261116` | [`3f814c03a8c0`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/3f814c03a8c09652c79312959d0225ee0742457b) | [#39](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/39) | D | 0 / 0 | 0 | Already integrated by ancestry |
| `codex/local-alpha-20261109` | [`429fcfca9735`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/429fcfca9735a323a6ce709d8605429d6c850fdb) | [#10](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/10) | D | 0 / 0 | 0 | Already integrated by ancestry |
| `codex/parallel-completion-20261116` | [`64cfc398ea3b`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/64cfc398ea3ba2449da0ed7adbfe8d99261bbc05) | [#43](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/43), [#42](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/42) | D | 0 / 0 | 0 | Already integrated by ancestry |
| `codex/verified-status-20261116` | [`edcb583afc2c`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/edcb583afc2cba40f32b0cbdbce765d65febbd21) | [#40](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/40) | D | 0 / 0 | 0 | Already integrated by ancestry |
| `continuation/classrup-20261101` | [`fa0cf0c33c80`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/fa0cf0c33c80e71787539b964a03c0e8a561c718) | — | D | 61 / 417 | 336 | Historical source superseded; retain provenance |
| `diagnostic/webkit-keygen-20261118` | [`764557187d51`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/764557187d51903630d3f864c4ee2fa56c3b7c6a) | — | C | 2 / 1 | 0 | Retain diagnostic; no runtime repair in branch |
| `docs/client-owned-foundations-20261024` | [`d804b49d262b`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/d804b49d262bdb87f1eabd0a15bfbb9d1d3e831a) | [#2](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/2) | D | 38 / 371 | 336 | Historical source superseded; retain provenance |
| `docs/pr-consolidation-results-20261117` | [`f75baf6240d2`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/f75baf6240d2c6eb4fb2261b91148152451db2fb) | [#47](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/47) | D | 0 / 0 | 0 | Already integrated by ancestry |
| `docs/prompt3-foundations-20261022` | [`39ac84787074`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/39ac847870746e14b466d5706ebe5b00dddbaadb) | [#1](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/1) | D | 34 / 29 | 15 | Historical source superseded; retain provenance |
| `integration/classrup-completion` | [`75d4bf51433e`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/75d4bf51433ebddef56c86c4065d9619ebe02058) | [#24](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/24) | D | 0 / 0 | 0 | Already integrated by ancestry |
| `integration/classrupted-audit-record-20261117` | [`7d5a8e620e7f`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/7d5a8e620e7f91cf9d4d73ae2f9aea4eabc8b298) | [#52](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/52), [#50](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/50) | D | 0 / 0 | 0 | Already integrated by ancestry |
| `integration/classrupted-consolidation-20261117` | [`ccff8d8aab96`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/ccff8d8aab9640163d143a470e6e5e2eee04926f) | [#49](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/49) | D | 1 / 10 | 2 | Stacked PR49 superseded by PR50 |
| `integration/classrupted-continuation-20261118` | [`d81094688ac1`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/d81094688ac116c84c09f3105c7b3f6b4c472793) | [#53](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/53) | A | 2 / 20 | 0 | Verified candidate; integrate through PR53 |
| `integration/feature-registry-20261117` | [`e331e5616530`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/e331e56165304c98a1c2bdd26692772b586e499d) | [#48](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/48) | D | 0 / 0 | 0 | Already integrated by ancestry |
| `integration/pr-docs-consolidation-20261117` | [`43fb20ffd6c7`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/43fb20ffd6c7b1a055db90dca8893a217b9834bb) | [#46](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/46) | D | 0 / 0 | 0 | Already integrated by ancestry |
| `integration/qualified-listing-vault-stack-20261116` | [`d020237d6acf`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/d020237d6acf7180c2ccea9681a01ff4d700d1bb) | [#44](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/44) | D | 0 / 0 | 0 | Already integrated by ancestry |
| `main` | [`044c213d90d6`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/044c213d90d62f1f06edb8ca1b9c2141d3991c27) | — | baseline | 0 / 0 | 0 | Integration target |
| `milestone/framework-browser-verification` | [`25fa6f0a9972`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/25fa6f0a997253aedb53e0d106b2c0a08b050228) | [#7](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/7) | D | 59 / 415 | 336 | Historical source superseded; retain provenance |
| `planning/future-cli-specs-20261110` | [`af4dcc546e63`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/af4dcc546e6342fb34d717d4050b52b8ffe7ffa3) | — | D | 1 / 1 | 1 | Proposal adapted through PR50 |
| `work/classrup-framework` | [`52bed39dda52`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/52bed39dda52c680a4299e20aaefe0f4695b2d58) | — | D | 1 / 25 | 0 | Historical source superseded; retain provenance |
| `work/classrup-haiku-framework` | [`0ac7f962aaa6`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/0ac7f962aaa65e17cf1bd0a6d4b6a5438bd5e108) | [#4](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/4) | D | 52 / 406 | 336 | Historical source superseded; retain provenance |

Unique commits are ancestry counts against initial main; they can include merge commits and superseded patches. Source paths are changed paths from that branch’s merge-base. Neither count establishes missing useful work. A clean textual merge also does not establish semantic compatibility.

### Integration and deferral decisions

1. Preserve PR51 history by integrating its descendant PR53. Validate the combined candidate and current base before a protected merge. The new public-record verifier and test improvements are the only newly qualified runtime/test candidate in this inventory.
2. Retain the six content-integrated source branches without replaying obsolete files: **66 original changed-path entries remain present, 38 identical and 28 enhanced, none missing**. Their prior semantic review covers the retained fixes; byte equality alone is not offered as proof.
3. Keep PR8 open for selective ports. Its original foundation and feature registry are already recovered. The remaining storage, IDs, signatures, relay secret helpers and tenant schema need compatibility work; the full textual merge has **63 conflicting paths**.
4. Preserve the alternate busy-cerf runtime (**111 conflicts**) for explicit workflow redesign. Its relay-asserted identity, prefixed IDs and old storage cannot replace current vault authority; its image parsing would regress current validation.
5. Preserve later happy-newton (**169 conflicts**) and wonderful-cori (**1,932 conflicts**) specification drafts. Reconcile selected requirements with canonical YAML and accepted decisions; do not replace generated output.
6. Preserve the diagnostic branch. It contains a branch-specific workflow and an empty trigger commit; direct native tests and failure evidence already exist on main. Raw Ed25519 failures remain a compatibility issue, and a branch merge does not repair them.

### Cleanup candidates

**50 pre-existing D branches are candidates only; no deletion is performed.** Re-read their exact refs, PR states and active work before any future approved deletion. The list excludes main, the two candidate branches awaiting verified main inclusion, all four product/source deferrals and the diagnostic branch. Superseded historical source may still be kept for convenient provenance.

| Candidate | Pinned source | Evidence |
|---|---|---|
| `agents/ci/trim-workflows` | `3f41b81accf062b2031504bd2e98d2913fb17fb8` | Already integrated by reviewed content; [#33](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/33) |
| `agents/discovery/coarse-filters` | `4f60ff9fa121435b962801d6594d9fca413d5bb7` | Already integrated by reviewed content; [#26](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/26) |
| `agents/discovery/ranking` | `de8f44d52cfccf4f1496a885cd4ac70894ff3847` | Already integrated by ancestry; [#27](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/27) |
| `agents/governance/taxonomy-prohibited` | `997249164e4b32df443dbbe2e07f729311c9cdeb` | Already integrated by reviewed content; [#30](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/30) |
| `agents/i18n/languages-currencies` | `a0f9422d91b91d147405c17730d49350e87fc3ce` | Already integrated by ancestry; [#28](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/28) |
| `agents/moderation/rate-limits-signals` | `c098f1bf91759afd8ab0519ba04fa27671605de5` | Already integrated by reviewed content; [#32](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/32) |
| `agents/notify/prefs-inapp` | `d6076d18621e16ec5b6a87e210f99bd305cf6243` | Already integrated by reviewed content; [#29](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/29) |
| `agents/orchestration/wave1-handoff` | `6406a0369098fdb7aa58b5a4e85325560857815f` | Already integrated by ancestry; [#34](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/34) |
| `agents/privacy/classification-metadata-consent` | `2752f04dd27c6df90ffa5d22d479e77ae2688a86` | Already integrated by reviewed content; [#31](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/31) |
| `chatgpt/zero-codex/audit-observability-20261110` | `1ee040492345e607b431707fd7f08528bbf2db77` | Already integrated by ancestry; [#14](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/14) |
| `chatgpt/zero-codex/barter-discovery-status-20261110` | `e0f153fd9185eaa5b52882931eac1c694d54abc5` | Already integrated by ancestry; [#20](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/20) |
| `chatgpt/zero-codex/cli-nested-assets-20261110` | `3a66e440847d7e1234e5a82674decdacb3efb954` | Already integrated by ancestry; [#19](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/19) |
| `chatgpt/zero-codex/cli-public-symlink-20261110` | `f8ed3a9324de83bd5116b1d7a4a8cfdb8682b88f` | Already integrated by ancestry; [#17](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/17) |
| `chatgpt/zero-codex/diagnostic-privacy-regression-20261110` | `9bb03390b2692d8fad80dbf653c28e36bef76c28` | Already integrated by ancestry; [#22](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/22) |
| `chatgpt/zero-codex/docs-wiki-20261110` | `19edded385d4aaa2fea9f482cf3a0fdc7cd0a806` | Already integrated by ancestry; [#13](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/13) |
| `chatgpt/zero-codex/federation-recovery-trace-20261110` | `20691f1cce36b1254644ea16bb438ca91221a872` | Already integrated by ancestry; [#15](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/15) |
| `chatgpt/zero-codex/noscript-vault-guard-20261110` | `968d63d8aebac1055ffc911fcceec519f30c8855` | Already integrated by ancestry; [#21](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/21) |
| `chatgpt/zero-codex/outbox-isolation-20261110` | `a294dd21715edf501aac75bee69f785951985cd5` | Already integrated by ancestry; [#16](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/16) |
| `chatgpt/zero-codex/qualify-pr10-20261110` | `4620d244e79e4cefbeade9cf59149ea1c3f7e5c2` | Already integrated by ancestry; [#12](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/12) |
| `chatgpt/zero-codex/review-ranking-i18n-20261112` | `d16abeef4dfab4f6376436f944f88a25d5a1bf8f` | Already integrated by ancestry; [#35](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/35) |
| `chatgpt/zero-codex/sync-expiry-head-boundary-20261110` | `12558435a307415ba0332777f87b1603abba5268` | Already integrated by ancestry; [#23](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/23) |
| `chatgpt/zero-codex-continuation-spec-20261109` | `d52b29369271f39a4873ace47c76b1b92d0750b3` | Already integrated by ancestry; [#11](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/11) |
| `claude/classifiedisrupted-continue-lcuuwg` | `ab6541552827b82c7bbbcbba282b2836f92cdd37` | Historical source superseded; retain provenance; [#5](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/5) |
| `claude/difficult-project-parts-dcqlup` | `566778cdf72399df4696e1d6f6675412813e6d5a` | Already integrated by ancestry; [#25](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/25) |
| `claude/gallant-goodall-9cc7yb` | `cc55f8ad153468ed6523ded1a59dfdf84215ce6b` | Historical source superseded; retain provenance; — |
| `claude/pensive-mendel-30x81m` | `52bed39dda52c680a4299e20aaefe0f4695b2d58` | Historical source superseded; retain provenance; [#3](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/3) |
| `claude/vigilant-newton-nva2l6` | `59028d1d962e6c4f113e19d77abf73a045a2318d` | Historical source superseded; retain provenance; [#6](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/6) |
| `codex/classrup-completion-20261116` | `a189787ab6cc0741743da0cd0cf8b0a9cd2e39dc` | Already integrated by ancestry; [#37](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/37) |
| `codex/classrup-consolidation-audit-20261104` | `59324a42e2ddf933eeef8c9363e33ef41690a31a` | Already integrated by ancestry; [#9](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/9) |
| `codex/classrup-features-20261116` | `560b328dd335aebdc12de01ec339c43ebd164be3` | Already integrated by ancestry; [#41](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/41) |
| `codex/consolidate-keyboard-focus-20261117` | `0c2e9e2992c359fd60f827983bd5e3f432bc8771` | Already integrated by ancestry; [#45](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/45) |
| `codex/encrypted-domain-storage-20261116` | `afa6952b50d97e46e8e54d950db92a3593f1e5bd` | Already integrated by ancestry; [#38](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/38) |
| `codex/listing-history-20261116` | `3f814c03a8c09652c79312959d0225ee0742457b` | Already integrated by ancestry; [#39](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/39) |
| `codex/local-alpha-20261109` | `429fcfca9735a323a6ce709d8605429d6c850fdb` | Already integrated by ancestry; [#10](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/10) |
| `codex/parallel-completion-20261116` | `64cfc398ea3ba2449da0ed7adbfe8d99261bbc05` | Already integrated by ancestry; [#43](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/43), [#42](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/42) |
| `codex/verified-status-20261116` | `edcb583afc2cba40f32b0cbdbce765d65febbd21` | Already integrated by ancestry; [#40](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/40) |
| `continuation/classrup-20261101` | `fa0cf0c33c80e71787539b964a03c0e8a561c718` | Historical source superseded; retain provenance; — |
| `docs/client-owned-foundations-20261024` | `d804b49d262bdb87f1eabd0a15bfbb9d1d3e831a` | Historical source superseded; retain provenance; [#2](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/2) |
| `docs/pr-consolidation-results-20261117` | `f75baf6240d2c6eb4fb2261b91148152451db2fb` | Already integrated by ancestry; [#47](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/47) |
| `docs/prompt3-foundations-20261022` | `39ac847870746e14b466d5706ebe5b00dddbaadb` | Historical source superseded; retain provenance; [#1](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/1) |
| `integration/classrup-completion` | `75d4bf51433ebddef56c86c4065d9619ebe02058` | Already integrated by ancestry; [#24](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/24) |
| `integration/classrupted-audit-record-20261117` | `7d5a8e620e7f91cf9d4d73ae2f9aea4eabc8b298` | Already integrated by ancestry; [#52](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/52), [#50](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/50) |
| `integration/classrupted-consolidation-20261117` | `ccff8d8aab9640163d143a470e6e5e2eee04926f` | Stacked PR49 superseded by PR50; [#49](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/49) |
| `integration/feature-registry-20261117` | `e331e56165304c98a1c2bdd26692772b586e499d` | Already integrated by ancestry; [#48](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/48) |
| `integration/pr-docs-consolidation-20261117` | `43fb20ffd6c7b1a055db90dca8893a217b9834bb` | Already integrated by ancestry; [#46](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/46) |
| `integration/qualified-listing-vault-stack-20261116` | `d020237d6acf7180c2ccea9681a01ff4d700d1bb` | Already integrated by ancestry; [#44](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/44) |
| `milestone/framework-browser-verification` | `25fa6f0a997253aedb53e0d106b2c0a08b050228` | Historical source superseded; retain provenance; [#7](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/7) |
| `planning/future-cli-specs-20261110` | `af4dcc546e6342fb34d717d4050b52b8ffe7ffa3` | Proposal adapted through PR50; — |
| `work/classrup-framework` | `52bed39dda52c680a4299e20aaefe0f4695b2d58` | Historical source superseded; retain provenance; — |
| `work/classrup-haiku-framework` | `0ac7f962aaa65e17cf1bd0a6d4b6a5438bd5e108` | Historical source superseded; retain provenance; [#4](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/4) |

After successful verified integration, the two PR53/PR51 source refs can be added as candidates if they still point to the audited heads and no pending work requires them. They are not included in the initial 50 count.

### Historical PR snapshots

Initial discovery found **17 merged**, **33 closed without direct merge**, and **3 open draft** PRs. Closed without direct merge does not mean missing code: ancestry/content integration and archived proposals are recorded separately. PR18 and PR36 snapshot heads differ from their later live branch heads.

| PR | State at discovery | Head branch | PR snapshot | In initial main by ancestry | Disposition |
|---|---|---|---|---|---|
| [#1](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/1) | closed | `docs/prompt3-foundations-20261022` | [`39ac84787074`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/39ac847870746e14b466d5706ebe5b00dddbaadb) | no | Historical source superseded; retain provenance |
| [#2](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/2) | closed | `docs/client-owned-foundations-20261024` | [`d804b49d262b`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/d804b49d262bdb87f1eabd0a15bfbb9d1d3e831a) | no | Historical source superseded; retain provenance |
| [#3](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/3) | closed | `claude/pensive-mendel-30x81m` | [`52bed39dda52`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/52bed39dda52c680a4299e20aaefe0f4695b2d58) | no | Historical source superseded; retain provenance |
| [#4](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/4) | closed | `work/classrup-haiku-framework` | [`0ac7f962aaa6`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/0ac7f962aaa65e17cf1bd0a6d4b6a5438bd5e108) | no | Historical source superseded; retain provenance |
| [#5](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/5) | closed | `claude/classifiedisrupted-continue-lcuuwg` | [`ab6541552827`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/ab6541552827b82c7bbbcbba282b2836f92cdd37) | no | Historical source superseded; retain provenance |
| [#6](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/6) | closed | `claude/vigilant-newton-nva2l6` | [`59028d1d962e`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/59028d1d962e6c4f113e19d77abf73a045a2318d) | no | Historical source superseded; retain provenance |
| [#7](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/7) | closed | `milestone/framework-browser-verification` | [`25fa6f0a9972`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/25fa6f0a997253aedb53e0d106b2c0a08b050228) | no | Historical source superseded; retain provenance |
| [#8](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/8) | open draft | `claude/bold-mccarthy-qklhl6` | [`a403614bb34d`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/a403614bb34d3d176d4693730e512e14959718b8) | no | Registry recovered earlier; preserve unfinished remainder |
| [#9](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/9) | merged | `codex/classrup-consolidation-audit-20261104` | [`59324a42e2dd`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/59324a42e2ddf933eeef8c9363e33ef41690a31a) | yes | Head included in main |
| [#10](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/10) | closed | `codex/local-alpha-20261109` | [`429fcfca9735`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/429fcfca9735a323a6ce709d8605429d6c850fdb) | yes | Head included in main |
| [#11](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/11) | merged | `chatgpt/zero-codex-continuation-spec-20261109` | [`d52b29369271`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/d52b29369271f39a4873ace47c76b1b92d0750b3) | yes | Head included in main |
| [#12](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/12) | merged | `chatgpt/zero-codex/qualify-pr10-20261110` | [`4620d244e79e`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/4620d244e79e4cefbeade9cf59149ea1c3f7e5c2) | yes | Head included in main |
| [#13](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/13) | merged | `chatgpt/zero-codex/docs-wiki-20261110` | [`19edded385d4`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/19edded385d4aaa2fea9f482cf3a0fdc7cd0a806) | yes | Head included in main |
| [#14](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/14) | merged | `chatgpt/zero-codex/audit-observability-20261110` | [`1ee040492345`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/1ee040492345e607b431707fd7f08528bbf2db77) | yes | Head included in main |
| [#15](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/15) | closed | `chatgpt/zero-codex/federation-recovery-trace-20261110` | [`20691f1cce36`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/20691f1cce36b1254644ea16bb438ca91221a872) | yes | Head included in main |
| [#16](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/16) | closed | `chatgpt/zero-codex/outbox-isolation-20261110` | [`a294dd21715e`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/a294dd21715edf501aac75bee69f785951985cd5) | yes | Head included in main |
| [#17](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/17) | closed | `chatgpt/zero-codex/cli-public-symlink-20261110` | [`f8ed3a9324de`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/f8ed3a9324de83bd5116b1d7a4a8cfdb8682b88f) | yes | Head included in main |
| [#18](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/18) | closed | `claude/happy-newton-4yttpa` | [`e402bd56352a`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/e402bd56352ae62cb3adcd3ba201a94a06b6217d) | no | Reconcile later specification drafts; preserve source; historical snapshot differs from live head |
| [#19](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/19) | closed | `chatgpt/zero-codex/cli-nested-assets-20261110` | [`3a66e440847d`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/3a66e440847d7e1234e5a82674decdacb3efb954) | yes | Head included in main |
| [#20](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/20) | closed | `chatgpt/zero-codex/barter-discovery-status-20261110` | [`e0f153fd9185`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/e0f153fd9185eaa5b52882931eac1c694d54abc5) | yes | Head included in main |
| [#21](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/21) | closed | `chatgpt/zero-codex/noscript-vault-guard-20261110` | [`968d63d8aeba`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/968d63d8aebac1055ffc911fcceec519f30c8855) | yes | Head included in main |
| [#22](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/22) | closed | `chatgpt/zero-codex/diagnostic-privacy-regression-20261110` | [`9bb03390b269`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/9bb03390b2692d8fad80dbf653c28e36bef76c28) | yes | Head included in main |
| [#23](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/23) | closed | `chatgpt/zero-codex/sync-expiry-head-boundary-20261110` | [`12558435a307`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/12558435a307415ba0332777f87b1603abba5268) | yes | Head included in main |
| [#24](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/24) | merged | `integration/classrup-completion` | [`75d4bf51433e`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/75d4bf51433ebddef56c86c4065d9619ebe02058) | yes | Head included in main |
| [#25](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/25) | closed | `claude/difficult-project-parts-dcqlup` | [`566778cdf723`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/566778cdf72399df4696e1d6f6675412813e6d5a) | yes | Head included in main |
| [#26](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/26) | closed | `agents/discovery/coarse-filters` | [`4f60ff9fa121`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/4f60ff9fa121435b962801d6594d9fca413d5bb7) | no | Already integrated by reviewed content |
| [#27](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/27) | closed | `agents/discovery/ranking` | [`de8f44d52cfc`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/de8f44d52cfccf4f1496a885cd4ac70894ff3847) | yes | Head included in main |
| [#28](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/28) | closed | `agents/i18n/languages-currencies` | [`a0f9422d91b9`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/a0f9422d91b91d147405c17730d49350e87fc3ce) | yes | Head included in main |
| [#29](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/29) | closed | `agents/notify/prefs-inapp` | [`d6076d18621e`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/d6076d18621e16ec5b6a87e210f99bd305cf6243) | no | Already integrated by reviewed content |
| [#30](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/30) | closed | `agents/governance/taxonomy-prohibited` | [`997249164e4b`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/997249164e4b32df443dbbe2e07f729311c9cdeb) | no | Already integrated by reviewed content |
| [#31](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/31) | closed | `agents/privacy/classification-metadata-consent` | [`2752f04dd27c`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/2752f04dd27c6df90ffa5d22d479e77ae2688a86) | no | Already integrated by reviewed content |
| [#32](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/32) | closed | `agents/moderation/rate-limits-signals` | [`c098f1bf9175`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/c098f1bf91759afd8ab0519ba04fa27671605de5) | no | Already integrated by reviewed content |
| [#33](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/33) | closed | `agents/ci/trim-workflows` | [`3f41b81accf0`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/3f41b81accf062b2031504bd2e98d2913fb17fb8) | no | Already integrated by reviewed content |
| [#34](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/34) | closed | `agents/orchestration/wave1-handoff` | [`6406a0369098`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/6406a0369098fdb7aa58b5a4e85325560857815f) | yes | Head included in main |
| [#35](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/35) | closed | `chatgpt/zero-codex/review-ranking-i18n-20261112` | [`d16abeef4dfa`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/d16abeef4dfab4f6376436f944f88a25d5a1bf8f) | yes | Head included in main |
| [#36](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/36) | closed | `claude/wonderful-cori-ynhlsb` | [`3a5c9e36e22a`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/3a5c9e36e22a635104dfecf41641b438c95fa239) | no | Reconcile later specification drafts; preserve source; historical snapshot differs from live head |
| [#37](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/37) | merged | `codex/classrup-completion-20261116` | [`a189787ab6cc`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/a189787ab6cc0741743da0cd0cf8b0a9cd2e39dc) | yes | Head included in main |
| [#38](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/38) | merged | `codex/encrypted-domain-storage-20261116` | [`afa6952b50d9`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/afa6952b50d97e46e8e54d950db92a3593f1e5bd) | yes | Head included in main |
| [#39](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/39) | merged | `codex/listing-history-20261116` | [`3f814c03a8c0`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/3f814c03a8c09652c79312959d0225ee0742457b) | yes | Head included in main |
| [#40](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/40) | closed | `codex/verified-status-20261116` | [`edcb583afc2c`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/edcb583afc2cba40f32b0cbdbce765d65febbd21) | yes | Head included in main |
| [#41](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/41) | closed | `codex/classrup-features-20261116` | [`560b328dd335`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/560b328dd335aebdc12de01ec339c43ebd164be3) | yes | Head included in main |
| [#42](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/42) | closed | `codex/parallel-completion-20261116` | [`64cfc398ea3b`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/64cfc398ea3ba2449da0ed7adbfe8d99261bbc05) | yes | Head included in main |
| [#43](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/43) | merged | `codex/parallel-completion-20261116` | [`64cfc398ea3b`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/64cfc398ea3ba2449da0ed7adbfe8d99261bbc05) | yes | Head included in main |
| [#44](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/44) | merged | `integration/qualified-listing-vault-stack-20261116` | [`d020237d6acf`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/d020237d6acf7180c2ccea9681a01ff4d700d1bb) | yes | Head included in main |
| [#45](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/45) | merged | `codex/consolidate-keyboard-focus-20261117` | [`0c2e9e2992c3`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/0c2e9e2992c359fd60f827983bd5e3f432bc8771) | yes | Head included in main |
| [#46](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/46) | merged | `integration/pr-docs-consolidation-20261117` | [`43fb20ffd6c7`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/43fb20ffd6c7b1a055db90dca8893a217b9834bb) | yes | Head included in main |
| [#47](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/47) | merged | `docs/pr-consolidation-results-20261117` | [`f75baf6240d2`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/f75baf6240d2c6eb4fb2261b91148152451db2fb) | yes | Head included in main |
| [#48](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/48) | merged | `integration/feature-registry-20261117` | [`e331e5616530`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/e331e56165304c98a1c2bdd26692772b586e499d) | yes | Head included in main |
| [#49](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/49) | closed | `integration/classrupted-consolidation-20261117` | [`ccff8d8aab96`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/ccff8d8aab9640163d143a470e6e5e2eee04926f) | no | Stacked PR49 superseded by PR50 |
| [#50](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/50) | merged | `integration/classrupted-audit-record-20261117` | [`486778817f65`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/486778817f65011d0d24f2ebff647143139524f9) | yes | Head included in main; historical snapshot differs from live head |
| [#51](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/51) | open draft | `claude/haiku-classrupted-features-cc9qmr` | [`7b729df38ddd`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/7b729df38dddf59c4e60e245bdf1ca43546b1e7b) | no | Verified candidate; integrate through PR53 |
| [#52](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/52) | merged | `integration/classrupted-audit-record-20261117` | [`7d5a8e620e7f`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/7d5a8e620e7f91cf9d4d73ae2f9aea4eabc8b298) | yes | Head included in main |
| [#53](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/53) | open draft | `integration/classrupted-continuation-20261118` | [`d81094688ac1`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/d81094688ac116c84c09f3105c7b3f6b4c472793) | no | Verified candidate; integrate through PR53 |

### Verification limits

This inventory performs read-only Git analysis and source review. It does not itself execute runtime tests, claim deployment, close PRs, rewrite branches or delete remote refs. CI results for candidate PR53 were independently checked by the separate CI reviewer; earlier branch-specific runs are explicitly historical. Main/product test results and final commit SHAs belong to the parent consolidation execution record.

Machine-readable evidence: [complete inventory](evidence/20261118/inventory.json), [compact inventory](evidence/20261118/inventory-summary.json), [PR history](evidence/20261118/pull-request-history.json), [merge simulations](evidence/20261118/merge-tree.json), [initial cleanup candidates](evidence/20261118/cleanup-candidates.json), [CI diagnosis](evidence/20261118/ci-summary.json), [independent CLI review](evidence/20261118/pr53-review.md), [selective recovery](evidence/20261118/recovery-review.md), and [dependency audit](evidence/20261118/dependency-audit.json).

## Publication checkpoint

At this source commit the integration merge is complete locally; the combined
PR and post-merge checks are not yet claimed. Existing PR #53 CI is green as
recorded above. Local pinned dependency installation passed with pnpm 10.28.0
and Node 24.22.3; specification validation (148 modules), dependency boundaries,
registry staleness, independent money vectors and money bundle budget passed.
The dependency audit reported zero advisories across 142 dependency entries.

Initial concurrent local validation had a typecheck process termination (exit
137), one CLI subprocess reaching its unchanged 15-second timeout (31 other
assertions passed), and one tooling file-level child failure (23 assertions
passed; four inner outcomes were unreported). These failures are preserved in
[the triage](evidence/20261118/local-qualification-triage.md),
[initial command outcomes](evidence/20261118/local-initial-checks.json), and the
adjacent logs. A memory-bounded typecheck retry passed without source changes.
The domain attempts were interrupted without a completed report. Sequential
validation is in progress; no unfinished result is counted as a pass.

Pinned local browser installation failed on invalid/truncated ZIP responses
before tests could start. System Chromium is available for supplemental local
journeys. The consolidation PR's hosted checks must establish the pinned
Chromium/Firefox/WebKit and six-platform matrix. Publication is a draft until
its actual results are reviewed; no merge or release is pre-claimed here.

Final execution evidence will supersede this publication checkpoint without
rewriting its failed or incomplete observations.

