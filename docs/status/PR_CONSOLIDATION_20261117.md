# Pull-request consolidation review — November 17, 2026

## Scope and outcome

This review began with **25 open PRs** in `djshellshoxxx/CLASSifiedisRUPTed` and main at `50abc470139a613f4404bdb9fb442f4011c13932`. Three parallel reviewers examined actual Git history, complete changed-path inventories, current file contents, contracts and relevant tests. Integration decisions distinguish source already present, useful new work, obsolete implementations, and preserved proposals.

**24 of the original 25 PRs are resolved; only #8 remains open.** The queued location-save fix in #43 is merged as `2b3193148029a4af64e8f3fe68373b6ca55620f9`. Documentation consolidation #46 is merged as `0a467556436cf2f4ad154fe3694e3d158458b83c`, retaining all five additive source histories and the unadopted proposal archives. Nine already-integrated module/stack PRs, seven obsolete planning/mock PRs and two archived-proposal PRs were closed with explicit dispositions. **PR #8 remains a draft with substantive unintegrated work and reproduced failures.**

The extra visible-focus coverage recovered from the old mock line is **merged through #45** as `03145774e5865fd7eac6ff6c4751a25ce6aa9422`. Its corrected source passed all **66 Chromium/Firefox/WebKit journeys** and both Linux CLI jobs. The only remaining open PR is #8.

This is consolidation of existing work, not completion of all product features. Source preservation does not mean a proposal is adopted or a security finding is closed. Historical branches remain available; none was deleted or force-pushed.

## Complete disposition of the original queue

Exact reviewed heads are retained in the [machine-readable review record](PR_CONSOLIDATION_20261117.json). The actions below describe the reviewed integration outcome; GitHub records the final merge/closure event for each PR.

| PR | Work | Disposition and evidence |
|---|---|---|
| [#1](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/1) | Original contract foundations / NO-GO audit | Superseded early planning. Preserve source history; active canonical contracts and generated specifications take precedence. |
| [#2](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/2) | Client-owned foundation contracts | Superseded planning line. Client ownership remains established by ADR-0016; avoid overwriting 371 historical paths. |
| [#3](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/3) | First mock framework | Superseded by the real encrypted-vault application. Retained in the historical mock lineage. |
| [#4](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/4) | Mock framework checkpoint | Superseded mock architecture, not missing production functionality. |
| [#5](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/5) | Mock UX continuation | Superseded; useful visible-focus assertions ported into the real app's browser suite in [#45](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/45). |
| [#6](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/6) | Planning README/TODO refresh | Superseded status text. Its later cross-project handoff does not become an active ClassRup task. |
| [#7](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/7) | Mock three-browser verification | Superseded harness; preserve useful acceptance evidence and the focused test port in #45. |
| [#8](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/8) | Later specification / partial foundation work | **Keep open, draft.** Original foundation is inherited by main, but the later unique work fails qualification and needs isolated ports. |
| [#12](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/12) | Alpha qualification ledger | Consolidate with real source ancestry and a prominent historical notice. |
| [#13](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/13) | User/developer wiki source | Consolidate ancestry; preserve six original files byte-for-byte; refresh live repository guides for current main. |
| [#14](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/14) | Observability audit ledger | Consolidate as source-pinned historical audit evidence. |
| [#18](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/18) | Hand-written process specifications | Preserve all 20 proposed paths in an exact source-diff archive; close as archived proposal, not adopted specifications. |
| [#25](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/25) | Hard-slices planning | Consolidate 25 design/map/workflow artifacts as historical reference, with source ancestry. |
| [#26](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/26) | Coarse location / search filters | Closed as superseded: all changed paths already on main with later correctness fixes and adapters. |
| [#29](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/29) | Notifications / channel consent | Closed as superseded: main retains source plus revocation, signer-chain, backup and inbox fixes. |
| [#30](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/30) | Taxonomy / prohibited items | Closed as superseded: all 12 code/test files are byte-identical on main; notes describe later integration. |
| [#31](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/31) | Classification / metadata minimization | Closed as superseded: main retains all source and stronger PNG validation with regressions. |
| [#32](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/32) | Rate limits / account limits / signals | Closed as superseded: main retains source plus enforcement, policy immutability, clock and diagnostic fixes. |
| [#33](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/33) | Change-aware CI planning | Closed as superseded: planner/CLI files match; main additionally enforces money vectors and bundle size. |
| [#34](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/34) | Wave-one handoff | Consolidate 14 source-scoped historical artifacts; the old pause is not a current instruction. |
| [#36](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/36) | Later planning / contract drafts | Preserve 159 remaining proposed paths as an exact diff; 10 other source blobs were already preserved. Close as archived planning. |
| [#40](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/40) | Executed feature inventory | Closed: exact head was already an ancestor of main through #44. |
| [#41](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/41) | Archive recovery / pagination | Closed: exact head was already an ancestor of main through #44. |
| [#42](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/42) | Listing / vault / location / commerce stack | Closed after #43: #44 incorporated its checkpoint and #43 incorporated its sole later correction. |
| [#43](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/43) | Queued location-save revision | **Merged** after independent review, regression verification, exact-source CI and merge-tree equality checks. |

## Standards findings

### Preserve current source over obsolete branches

For the six parked module/CI PRs, **66 of 66 changed paths already exist on main**. Of these, 38 are byte-identical and 28 retain the old implementation alongside later corrections, exports, integration, tests or notes. Their commits were not all ancestors because the work had been integrated by content. An ancestry-only review would incorrectly classify the entire set as missing.

The later controls include notification revocation beyond the grant/edit budget and beyond 500 historical records, signed sequence/previous-CID checks, stricter PNG structure validation, rate enforcement unaffected by throwing diagnostics, immutable validated policies, and rollback-safe refill accounting. Taking old branch files wholesale would risk discarding those controls. See the [complete path comparison](../reviews/20261117-pr-consolidation/parked-modules-review.md).

The retired `app/` framework used plaintext localStorage, synthetic listings and mock barter. That was its explicit demonstration scope. It is preserved in Git, not installed as a competing application alongside the real `apps/pwa` encrypted-vault implementation. Relevant visible-focus checks were adapted to the real app; saved-listing mock cases remain references for future matching workflows.

### Keep generated specifications reproducible

[SPEC_FORMAT.md](../../planning/SPEC_FORMAT.md) establishes `module.spec.yaml` as the source for generated process documents. PRs #18 and #36 directly edit generated targets without corresponding YAML. Their proposed content is preserved in the [proposal archive](../history/planning-proposals-20261117/README.md), with exact bases, heads, path selections and SHA-256 digests. No active YAML, generated process specification or runtime contract is replaced by those drafts.

Baseline code-smell heuristics did not justify additional refactors. The findings that affect consolidation are concrete source-integrity, compatibility and runtime defects.

## Specification and behavior findings

### Correct queued location updates

Before #43, two saves submitted while the first was pending could both capture revision 1. The first save advanced the stored revision to 2, then the second rejected its stale revision. The fix captures the user's submitted values but reads the saved revision inside the serialized callback, after the previous callback's refresh. Optimistic concurrency, session disposal and unsaved-draft guards remain enforced.

The regression uses the actual action queue and delayed first save. It passes on the candidate and fails when only the old implementation is substituted: the second command receives 1 instead of 2. All ten location-preference tests pass on the corrected source. See the [independent review](../reviews/20261117-pr-consolidation/feature-stack-review.md).

### Reconcile documentation with the implemented alpha

The original wiki described main as planning-only and domain rows as plaintext. Those were statements about its historical checkpoint. Current [user](../wiki/User-Guide.md) and [developer](../wiki/Developer-Guide.md) guides now describe runnable main, encrypted rows, current listing/history/archive/location/inbox workflows and their remaining limits. The six original files remain byte-identical in a dated archive. Repository wiki-source integration does not publish the live GitHub Wiki.

Old handoffs with names such as `LATEST`, pause instructions, design workflows and unreviewed-lane status carry explicit historical notices. Hard-slices designs remain candidate plans, not completed implementations. Archived server-authority wording in later risk proposals does not amend the client-owned architecture. See the [documentation consolidation ledger](PR_DOCS_CONSOLIDATION_20261117.md).

### Why #8 remains open

Exact head `a403614bb34d3d176d4693730e512e14959718b8` was installed and tested independently. Its latest runtime commit changes 34 files (+3,920/-221 lines) and adds no tests. Qualification produced **86 TypeScript diagnostics and 73 failing tests out of 93**; 20 passed, zero were pending. The registry stale check fails while importing the kernel.

Concrete blockers include:

1. `createTx()` still calls deleted `syncStore()` at `packages/kernel/src/storage/tx.ts:640`, breaking storage and its consumers.
2. The new transaction environment, blob/dead-letter interfaces and SQLite adapter are inconsistent; sync consumers still require removed types/operations.
3. `syncMachine` is removed but still exported. `registry.generated.ts`, tenant `text.ts` and package entrypoints are missing.
4. New canonical signature helpers use a different CID/first-record format from the experimental alpha. A direct substitution would require deliberate protocol/admission migration and independent vectors.
5. The new helpers lack acceptance tests. Existing passing kernel tests do not qualify new cryptographic, secret-handling or registry behavior.

The old memory driver also predates main's tenant/type/aggregate retry-isolation fix. This is a reason to retain current implementations while porting future changes, not to resolve conflicts in favor of the old branch. Full findings and a bounded salvage order are in the [PR #8 review](../reviews/20261117-pr-consolidation/pr8-runtime-review.md).

Recommended subsequent order: feature-registry generation and queries; hour-floored public IDs with explicit record/migration boundaries; canonical signatures with versioned admission; optional relay secret adapters; then storage changes with all adapter/migration/rollback tests. These are future implementation tasks, not completed consolidation work.

## Verification and its limits

| Evidence | Result / source |
|---|---|
| Current application domain/integration run | **632 passed, 0 failed, 0 pending**, on source tree `0e28f4284ca1e23c9d36bb03ea1aae21b8f39bc7` (merged #43 runtime) |
| Location-preference regression suite | 10/10 passed; new regression also demonstrated failure against the old implementation |
| TypeScript | Passed on #43; the focused browser-test addition also passed full bounded typechecking |
| Specification generation consistency | 148/148 modules, 0 errors, 0 warnings, including the documentation candidate |
| Dependency boundaries | 0 errors |
| #43 GitHub Alpha | [43981540981](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/43981540981): passed domain/build/checks and **63/63 browser journeys** on `64cfc39` |
| #43 GitHub CLI/platform matrix | [43981539765](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/43981539765): all six Windows/macOS/Linux × Node 22/24 jobs passed |
| #43 merge-tree check | Proposed merge tree exactly equaled the qualified source tree before merging |
| Documentation candidate CI | [Alpha 44226493644](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44226493644) passed domain/build/specification checks and 21 Chromium journeys; [CLI 44226493549](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44226493549) passed both Linux Node 22/24 jobs |
| Documentation preservation | Five source heads retained as ancestors; six original wiki files byte-identical; 179 archived proposal paths checked with exact source diffs/digests |
| Independent documentation checks | 92 navigation/anchor targets and 32 historical-banner links passed; active source boundaries unchanged |
| New visible-focus browser coverage | [#45](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/45), corrected source `0c2e9e2992c359fd60f827983bd5e3f432bc8771`: [Alpha 44227269816](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44227269816) passed **66/66 Chromium/Firefox/WebKit journeys**; [CLI 44227269875](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44227269875) passed Linux Node 22/24; merged as `03145774` |

The local host could not launch Chromium because its process-singleton socket was denied; its pinned download returned an invalid archive. Pinned Firefox subsequently installed through the official fallback and executed the focused tests. The original programmatic-focus harness reproduced both hosted Firefox failures; native Tab navigation from the password input passed both viewports with every focus/outline assertion retained. The revised test explicitly verifies the button's keyboard-visible focus before Enter. Hosted browser evidence is identified by source SHA and run, not inferred from test discovery.

The documentation integration changes no active application/package code, tests, tools, workflows, dependency manifests, lockfile or module YAML. It retains the #43 fix through a normal three-way merge. The focused browser-test port was qualified and merged separately through #45. The combined merge tree is `4fe932b5f4bd2fea15654031ef85d9c21367b677`; its application, tooling, test, workflow and dependency paths match the qualified corrected source exactly. Subsequent changes to this evidence record are documentation only.

Manual accessibility, target-device performance, full canonical federation/recovery, payment settlement, private messaging, services/rentals/auctions and whole-product security/release qualification remain separate work. Neither closing old PRs nor preserving their source marks these complete.

## Detailed review evidence

- [Parked modules and CI](../reviews/20261117-pr-consolidation/parked-modules-review.md)
- [Feature stack and historical mock framework](../reviews/20261117-pr-consolidation/feature-stack-review.md)
- [Documentation and planning branches](../reviews/20261117-pr-consolidation/docs-history-review.md)
- [PR #8 remaining runtime](../reviews/20261117-pr-consolidation/pr8-runtime-review.md)
- [Machine-readable source inventory and validation](PR_CONSOLIDATION_20261117.json)

The detailed reviews preserve their original fixed comparison point. The summary above records integration decisions against the later qualified main.
