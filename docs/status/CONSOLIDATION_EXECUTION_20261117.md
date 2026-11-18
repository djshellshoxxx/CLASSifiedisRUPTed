# ClassRup consolidation execution — November 17, 2026

## Scope and source identity

The canonical repository is [`djshellshoxxx/CLASSifiedisRUPTed`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed),
repository ID `1429721366`. The supplied `Classrupted` alias returns 404. This
execution began from main `c4f733e8f2e13c38844acc84b2401209bedf4e24` and used the
Caveman investigation, surgical-patch, review and verification workflows with
parallel, separately scoped reviewers. Claude was not available in this session;
the work used the available native agents, terminal and connected GitHub tools.

The [exhaustive branch/PR assessment](BRANCH_CONSOLIDATION_20261117.md) and its
[JSON source inventory](BRANCH_CONSOLIDATION_20261117.json) contain every discovered
starting branch, full source SHA, activity date, ahead/behind counts, associated
PR, CI evidence, overlap, risk and disposition. This execution report records the
additional implementation and final integration outcome without rewriting that
starting snapshot.

The [complete 57-branch disposition table](CONSOLIDATION_BRANCH_DISPOSITIONS_20261118.md)
records each original branch, the four execution branches and the later concurrent
draft branch, with its purpose, action, result and pinned evidence.

## Starting inventory and disposition

| Measure | Verified starting result |
|---|---:|
| Remote branches, including main | 52 |
| Development branches | 51 |
| Pre-existing PRs reviewed | 47 |
| Previously merged PRs | 14 |
| Previously closed without direct merge | 32 |
| Open PRs | One: draft #8 |
| Development heads already ancestors of main | 30 |
| Additional branches already integrated by content | 6 |
| Obsolete historical branches retained as superseded references | 10 |
| Branches selected for isolated extraction | 2 |
| Branches deferred for incompatible architecture or unreconciled specifications | 3 |

The six content-integrated branches account for 66 changed-path entries: 38 are
byte-identical on main, 28 retain subsequent corrections, and none are missing.
No obsolete module implementation was replayed to increase the merge count.
All 47 existing discussions were inspected; draft #8 has no submitted review or
unresolved inline thread. The branch API reports no protection or required status
contexts. This task nevertheless requires the repository's actual CI to pass.
No branch protection was changed.

## Contributions completed in this execution

### Feature-registry generator and opt-in queries from PR #8

[PR #48](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/48) extracts the
isolated registry implementation from
`a403614bb34d3d176d4693730e512e14959718b8`. It supplies the missing generated
artifact, package boundary, build/CI checks and meaningful regression tests
against the current kernel. It does not import the old transaction replacement,
identifier format or cryptographic wire format.

The current catalog has **18 features, 148 modules and 565 dependency edges**.
Generation validates identifiers, specification binding, paths, missing specs,
self/unknown dependencies, cycles, core/FUTURE defaults and output size. Its
content digest is independently checked, and its output is deterministic and
deeply frozen. Query results are detached copies. Four read-only query definitions
preserve the kernel's capability, feature and supplied rate checks. Optional
metrics cannot turn a successful query into a failure.

Filesystem access rejects traversal and symbolic links. Output replacement is
atomic and preserves the prior file after validation or write failure. Independent
review reproduced a partial-write retry defect and a CRLF-only staleness defect;
both are repaired with explicit regression coverage. Scoped Git attributes keep
only the digest input/output classes at LF. These are **two reproduced integration
defects repaired**, rather than two demonstrated vulnerabilities in the existing PWA.

The package's `registered` and `defaultState` fields describe compiled catalog
policy, not runtime availability or user feature enablement. PWA Settings, relay
mounting, feature flags, unknown-module backup handling and target-device budgets
remain separate acceptance work. See the [package scope](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/blob/336839cdf5fb912e3f2eb84c2fecba12243b26ec/packages/platform/README.md)
and [independent review](../reviews/20261117-exhaustive-consolidation/registry-independent-review.md).

The initial registry candidate `336839cdf5fb912e3f2eb84c2fecba12243b26ec` has exactly the
same Git tree, `fb29e3eccc8541b1d23e2aa97b5acc8acfd08b13`, as tested local commit
`78d1894df53cb60e277df6b887ea7cc4f99acb78`. Native Git push lacked credentials;
the authorized connected GitHub API uploaded the same tree. Source equality was
verified again after fetching the remote branch.

### Client-owned domain CLI specification from the orphan planning branch

The [adapted CLI specification](../future-cli-spec.md) preserves useful work from
`planning/future-cli-specs-20261110` at
`af4dcc546e6342fb34d717d4050b52b8ffe7ffa3`. It retains command families, automation
output, staged delivery and acceptance requirements, while correcting obsolete
server-authority assumptions to the accepted user-held vault architecture.

It distinguishes existing setup/configure/doctor/build/dev/preview commands from
planned domain commands. Future private commands require an encrypted file-vault
adapter, explicit backup round trips and stale/forked signed-chain reconciliation.
They cannot silently read browser IndexedDB or turn a relay into user authority.
This is a completed specification extraction; domain CLI parity is not implemented
by this documentation change.

### WebKit/vault evidence correction

PR #37 was already merged as `3fd5fdbc89f81bc1267ca907a7a1fb9a13943828`.
The [updated diagnostic](WEBKIT_CRYPTO_DIAGNOSTIC_20261116.md) pins the original
failure to run `43844325449`, **attempt 1**, job `133233196047`. A latest-attempt
lookup shows a different Chromium failure and obscures the original WebKit result.
The original artifact confirms a native operation-specific error while creating
the vault, but does not identify the cryptographic stage.

The later source `0c2e9e2992c359fd60f827983bd5e3f432bc8771` passed all 66 product
journeys and has an identical application/test/tooling/configuration tree to the
starting main. That is valid source-equivalent acceptance evidence. It does not
prove that a separate upstream Ed25519 defect is fixed or that the separate crypto
diagnostic suite passed. That historical qualification added no cryptographic fallback or test skip.
The later native-generation failure and bounded mitigation are recorded below.

Local pinned WebKit installed but could not launch because six native libraries
are absent. Pinned Firefox timed out while creating the test page, before crypto
assertions. The report records these as host blockers. The required browser/OS
qualification for the new integration belongs to its actual GitHub Actions runs.

## Security audit

The [independent security review](../reviews/20261117-exhaustive-consolidation/security-review.md)
covers key lifecycle, signed-file admission, tenant isolation, restore authority,
PWA rendering and import bounds, matching-worker boundaries, static serving,
offline cache, CI permissions and the proposed registry port. No new high- or
critical-severity vulnerability was confirmed in the reviewed exposed main
implementation. This is bounded evidence, not whole-product security certification.

One **medium-severity privacy defect was confirmed in an unmerged candidate**:
`claude/busy-cerf-vg3hz3` retains JFIF thumbnails. It also accepts malformed JPEG
and bad-CRC PNG fixtures that main rejects. The executed
[comparison evidence](../reviews/20261117-exhaustive-consolidation/legacy-image-proof.json)
supports preserving main's stronger metadata parser. The old implementation is
not imported; its defect is not misreported as a new main vulnerability.

The live [dependency audit](../reviews/20261117-exhaustive-consolidation/dependency-audit.json)
exits 1 with **one pre-existing high advisory**, Picomatch 4.0.7 through Vitest:
[GHSA-fc5q-39xc-vjpf / CVE-2026-112366](https://github.com/advisories/GHSA-fc5q-39xc-vjpf).
The advisory and npm release state provide no verified patched release. Open
upstream PRs are not treated as approved remediation. No version, lockfile,
severity threshold or audit suppression changed.

The executed [browser dependency analysis](../reviews/20261117-exhaustive-consolidation/picomatch-exposure-proof.json)
found zero affected tooling packages among 201 production application/worker
bundle inputs. This establishes no observed production reachability within those
boundaries. It does not remove the installed vulnerable toolchain dependency or
justify a clean-audit claim. A reviewed upstream fix remains a concrete blocker
to a zero-high dependency audit.

The 51 historical security findings remain planning/readiness items with their
existing open evidence requirements. They are not reclassified as 51 demonstrated
runtime vulnerabilities or closed through branch consolidation.

## Local verification

Environment: Linux, Node `24.22.1`, pinned pnpm `10.28.0`, frozen lockfile.

| Command or evidence | Observed result |
|---|---|
| `corepack pnpm install --frozen-lockfile` | Passed in the registry checkout; the later mitigation worktree's local install limit is recorded below. No dependency or lockfile changes |
| `GOMEMLIMIT=256MiB GOMAXPROCS=2 corepack pnpm exec tsc -p tsconfig.json --noEmit --singleThreaded` | Passed for the full workspace, including the new tests |
| `corepack pnpm spec:check` | 148/148 modules, zero errors, zero warnings |
| `corepack pnpm deps:check` | Zero dependency-direction errors |
| `corepack pnpm run test:cli` | 18 passed at the baseline |
| `corepack pnpm run test:tooling` | Existing 14 passed; new 13 generator regressions also passed on the final candidate |
| Focused `vitest run packages/platform/src/configuration/feature/feature.test.ts --maxWorkers=1` | 40 passed, zero failed/pending; includes 120 independently checked graph cases |
| `corepack pnpm registry:check` | Deterministic current catalog matches committed generated output |
| `corepack pnpm run setup --non-interactive`, `corepack pnpm build` | Passed; stale gate enforced before the public PWA build |
| `python3 -I packages/commerce/test/check_money_vectors.py` | 331 independent money vectors passed |
| `node packages/commerce/test/check_money_bundle.mjs` | 2,355 gzip bytes against 12,288-byte budget |
| `corepack pnpm audit --json` | Exit 1: one unresolved pre-existing high advisory; see the audit section |
| `git diff --check` | Passed |

The initial typecheck (512 MiB Go heap target, two Go processors) and initial
two-worker full suite were host-killed. The later 256 MiB, single-threaded
typecheck passed.
The bounded baseline full-suite report contains 624 passing assertions and eight
unfinished assertions in `alpha-security.test.ts`; the runner exited 1 even
though its JSON incorrectly reports `success: true`. An isolated retry of that
file then passed all 19 tests, including those eight. Thus all 632 distinct baseline
assertions have passing local execution across runs; that statement is not a
claim that the initial combined run was green. A later single-worker candidate full-suite attempt was also host-killed before
producing a complete report. No local all-green combined-run result is claimed.
The exact-source GitHub checks are recorded in the integration outcome below.

### Additional local verification for the generation mitigation

The mitigation was verified at local commit
`0423d71ffb340c4dabb9931b705eccd628d3fe21`, tree
`0db30c0e66b263d42e05ca40040a62abc1b4888d`, identical to published candidate
`e331e56165304c98a1c2bdd26692772b586e499d`. These focused commands exited zero:

```sh
NODE_OPTIONS=--max-old-space-size=256 node node_modules/vitest/vitest.mjs run packages/identity/src/identity.test.ts --maxWorkers=1 --no-file-parallelism
NODE_OPTIONS=--max-old-space-size=256 node node_modules/vitest/vitest.mjs run tests/integration/identity-keygen-recovery.test.ts --maxWorkers=1 --no-file-parallelism
GOMEMLIMIT=256MiB GOMAXPROCS=2 node node_modules/typescript/lib/tsc.js -p tsconfig.json --noEmit --singleThreaded
corepack pnpm run setup --non-interactive
corepack pnpm build
corepack pnpm registry:check
```

The identity suite passed **23 tests** (three existing and 20 new), and the vault
suite passed **three**. Typechecking covered the entire workspace. Browser
discovery listed 72 product journeys, including the six new recovery cases;
discovery alone is not browser execution.

Two installation attempts in this separate mitigation worktree were host-killed
with exit 137. The focused checks used unchanged dependencies copied from the
already installed frozen-lockfile checkout, with the workspace links verified to
resolve the mitigation's own source. No dependency declaration or lockfile was
edited. The candidate's subsequent hosted jobs performed fresh frozen installs;
their actual execution results are recorded below. The local checks do not
establish a complete green local combined-suite run.

### Exact PR platform environments

[Platform run 44271649100](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44271649100)
qualified source `e331e56165304c98a1c2bdd26692772b586e499d` in all six matrix jobs.
Each log records 18 CLI assertions passed, zero failed, cancelled, skipped or
todo, followed by successful setup, repeated setup, diagnostics, build, real
development/production browser smoke and the unchanged-tracked-files check.

| Hosted operating system | Node 22 selector resolved to | Node 24 selector resolved to | CLI assertions in each job |
|---|---|---|---|
| Ubuntu 26.04.1 LTS | 22.18.0 | 24.22.2 | 18 passed |
| Windows Server 2025, build 10.0.26100 | 22.18.0 | 24.22.2 | 18 passed |
| macOS 26.7.2, arm64 runner | 22.18.0 | 24.22.3 | 18 passed |

The [platform environment record](../reviews/20261117-exhaustive-consolidation/platform-environments.json)
pins each job URL, runner image, source and decoded-log digest. These exact patch
versions describe the PR executions; the separate post-merge workflow records
identify main's own execution without assuming rolling runner versions are fixed.

## Remaining work and decisions

| Contribution or feature | What remains | Dependency / next action |
|---|---|---|
| Draft #8 after the registry extraction | Public-ID privacy boundary, canonical signatures, optional relay secret adapters, storage/dead-letter/blob redesign and unfinished platform configuration | Keep draft open. Port accepted pieces into current interfaces. The partial Tenants/LocalSettings schema imports missing ./text.ts and depends on future relay configuration/rules; it is not a ready independent feature. |
| Concurrent draft #51, `claude/haiku-classrupted-features-cc9qmr` at `7b729df38dddf59c4e60e245bdf1ca43546b1e7b` | Compatible test/helper/tooling maintenance created after the runtime merge | Preserve the active draft for its own exact-head qualification. Source review found no confirmed defect; its Alpha/platform runs were queued at the 09:51 UTC source-review snapshot. Author-claimed local results are not independent hosted evidence. See the [concurrent review](../reviews/20261117-exhaustive-consolidation/concurrent-pr51-review.md). |
| `claude/busy-cerf-vg3hz3` | Alternate comms/federation/recovery implementation | Requires an architecture port from synchronous collections, prefixed IDs and relay accounts to current scoped vault authority. Preserve current image validation. |
| `claude/happy-newton-4yttpa` live head `8d5f66f75411` | 150 documentation paths beyond the archived PR #18 snapshot | Reconcile selected requirements into canonical module YAML before regeneration. |
| `claude/wonderful-cori-ynhlsb` live head `c9bd8933ff51` | 1,770 documentation/CSV paths beyond PR #36's preserved snapshot | Review unresolved proposal decisions against accepted contracts; do not overwrite live specifications. |
| Feature registry beyond this bounded port | PWA Settings, flag adapters, optional relay endpoint, backup diagnostics/quarantine and target-device budgets | Integrate against actual enabled handlers and existing vault recovery contracts. Catalog presence cannot enable functionality. |
| Domain CLI | Encrypted file vault, signed-record commands and tested UI/CLI parity | Follow the extracted F0–F4 specification and compatible backup/authority boundaries. |
| Browser crypto qualification | Retain failed native probes and qualify a Playwright build containing the released native fix | Product journeys and raw crypto probes remain separate evidence. Bounded generation recovery does not fix native import. |
| Toolchain advisory | Picomatch high-severity ReDoS finding | Adopt a reviewed fixed version/mitigation when available; preserve provenance, compatibility tests and an honest audit result. |
| Wider product | Full recovery/federation, private messaging, offers/deals/receipts, services/rentals/auctions, retention/purge, manual accessibility and target-device qualification | Separate feature work remains. The repository stays a development alpha. |

No deployment, release publication, remote branch deletion, force push, shared
history rewrite or approval bypass was performed. No user-vault migration or
existing signed-record format changed. Every original source branch remains
available with an explicit disposition.

## Integration outcome — main verification completed

### Contributions already integrated

[PR #50](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/50) merged as
`aca990e480a4ed586c1af5cf95a205e5adbfd84b`, tree
`95dfa8f5d6b8727010177d81a158a45fbe024f08`. Its ten documentation/evidence files
and adapted future CLI specification were independently reviewed. The fetched
tree matched the candidate and had no changes outside `docs/` from the starting
main. Stacked draft [#49](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/49)
was then closed as superseded after comparison of nine byte-identical documents
and the corrected execution report. Both source branches remain available.

[PR #48](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/48) merged qualified
head `e331e56165304c98a1c2bdd26692772b586e499d` as runtime main
`5a502aa9ebccb3de9cf78332e9ae6335ed6b6a54`, tree
`12fd6bc887a1091310491f85435278ad39aecb2f`. Before merging, the exact head passed
[Alpha 44271649063](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44271649063):
**695 domain assertions, 27 tooling tests and 72 browser journeys**. All
[six platform jobs in run 44271649100](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44271649100)
also passed. The expected-head merge was conflict-free, preserved the audit
documents and produced the reviewed prospective tree. No new runtime differences
from the qualified candidate appeared in the merge.

The [completed PR qualification record](../reviews/20261117-exhaustive-consolidation/pr48-qualification.json)
pins the source, actual job outcomes, six new browser-case evidence and decoded-log
digests. It explicitly makes no post-merge main qualification claim.

### Native failure and mitigation evidence

The initial registry candidate `336839cdf5fb912e3f2eb84c2fecba12243b26ec`
failed one of 66 browser journeys at native key generation. Its failure remains
in [run 44260769800](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44260769800).
The subsequent unchanged native probes also failed: seven generation
`OperationError` values in 512 trials and deterministic leading-zero/all-zero
private-key import `DataError` values. The nonzero control passed.

The merged mitigation allows at most three sequential native Ed25519 generation
calls, retrying only genuine `DOMException` values named `OperationError`, before
export or persistence. It preserves existing identities and all downstream
failure behavior. The [native review](../reviews/20261117-exhaustive-consolidation/native-keygen-review.md)
retains exact source/artifact provenance and the unresolved native import
limitation. The two raw probes remain failed evidence; passing product journeys
do not repair the browser engine.

### Completed main verification and documentation delivery

At **2026-11-18 10:05:16 UTC**, re-reading both post-merge main workflow attempts
and their check-runs still showed the main workflows
[Alpha 44275307064](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44275307064)
and [CLI 44275307098](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44275307098)
**queued**. They were created for a `push` to the exact runtime merge SHA above.
The [main CI queue checkpoint](../reviews/20261117-exhaustive-consolidation/main-ci-queue-checkpoint.json)
preserves that historical pending-state evidence separately from completed PR
qualification. Its later 10:12:13 UTC observation also remains unchanged.

The continuation re-read the same first-attempt push workflows after completion.
Main [Alpha 44275307064](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44275307064)
completed successfully at **12:53:11 UTC**. Its domain job `134745437853` executed
**695 passing domain assertions, 27 passing tooling tests and all 72 browser
journeys** across Chromium, Firefox and WebKit. Domain and tooling counts contain
zero failures, pending or skipped assertions. Typecheck, strict specifications,
dependency boundaries, registry freshness, 331 independent money vectors and the
2,355-byte gzip money bundle check also passed.

Main [CLI 44275307098](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44275307098)
completed successfully at **13:20:58 UTC**. All six Ubuntu/Windows/macOS ×
Node 22.18.0/24.x jobs executed **18 passing CLI tests each, without skips**, and
passed real development/production browser startup, reload and offline smoke.
The [completed main qualification record](../reviews/20261117-exhaustive-consolidation/main-qualification-20261118.json)
contains exact source, attempt and job identities, parsed log counts, decoded-log
SHA-256 digests and the refreshed branch/PR snapshot. These are actual main push
executions, not reused PR results. This closes the pending main-verification gate
for `5a502aa9ebccb3de9cf78332e9ae6335ed6b6a54`; broader release and native-import
compatibility requirements remain open.

This audit/status continuation has been published as the actual
[draft PR #52](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/52), with
observed head `78a88d8276e67e7a07cd32e34cbe2a59eb01f2c1` and tree
`9595b6a281489932c19c7af6a482a24b2fbaaf2d`, based on runtime main
`5a502aa9ebccb3de9cf78332e9ae6335ed6b6a54`. Its earlier published checkpoint was
`a1c676760e3f4c9a74f37124e7724348edb33415`. This continuation records the now
completed prerequisite for final documentation review. These source references
describe observed drafts; they do not claim this update's own future commit SHA
or merge outcome.

The refreshed remote reads completed before **2026-11-18 13:55:41 UTC** contain
**57 branches and 52 PRs**. Branch accounting is the original 52, four branches
created by this consolidation, and the concurrent draft #51 branch. PR accounting
is the original 47 plus #48, #49, #50, concurrent #51 and the actual audit draft
#52. All 51 original non-main heads remain unchanged. The open PRs are:

| Open draft | Observed source head | Current disposition |
|---|---|---|
| [#8](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/8) | `a403614bb34d3d176d4693730e512e14959718b8` | Keep its unported work separate; the bounded registry contribution is integrated through #48. A [cleanup comment](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/8#issuecomment-6975235188) has been posted. |
| [#51](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/51) | `7b729df38dddf59c4e60e245bdf1ca43546b1e7b` | Preserve the compatible concurrent test/tooling contribution for its own qualification; it is outside #48's integrated runtime. |
| [#52](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/52) | `78a88d8276e67e7a07cd32e34cbe2a59eb01f2c1` | Complete final documentation review with the successful exact-main execution evidence supplied by this continuation. |

The three incompatible/unreconciled historical live heads retain their separate
documented deferrals. The [complete branch disposition table](CONSOLIDATION_BRANCH_DISPOSITIONS_20261118.md)
preserves the original sources and distinguishes later execution and concurrent
branches. The completed-main JSON records the refreshed snapshot separately;
the historical inventory and queue observations are not rewritten.

Two registry integration defects were repaired: partial-write retry cleanup
and checkout line-ending staleness. Bounded generation recovery is an additional
availability mitigation. No merge conflict required resolution. The high
Picomatch toolchain advisory, native import compatibility and wider product
acceptance remain unresolved. No release, deployment, remote branch deletion,
force push or shared-history rewrite occurred.
