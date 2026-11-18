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

The six content-integrated branches account for 66 changed paths: 38 are
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

The remote candidate `336839cdf5fb912e3f2eb84c2fecba12243b26ec` has exactly the
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
diagnostic suite passed. No cryptographic fallback, generation retry or test skip
was added.

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
| `corepack pnpm install --frozen-lockfile` | Passed; no dependency or lockfile changes |
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

## Remaining work and decisions

| Contribution or feature | What remains | Dependency / next action |
|---|---|---|
| Draft #8 after the registry extraction | Public-ID privacy boundary, canonical signature helpers, optional relay secret adapters and storage/dead-letter/blob redesign | Keep draft open. Port each into current interfaces with migration, independent vectors and adapter parity; never replace the current kernel wholesale. |
| `claude/busy-cerf-vg3hz3` | Alternate comms/federation/recovery implementation | Requires an architecture port from synchronous collections, prefixed IDs and relay accounts to current scoped vault authority. Preserve current image validation. |
| `claude/happy-newton-4yttpa` live head `8d5f66f75411` | 150 documentation paths beyond the archived PR #18 snapshot | Reconcile selected requirements into canonical module YAML before regeneration. |
| `claude/wonderful-cori-ynhlsb` live head `c9bd8933ff51` | 1,770 documentation/CSV paths beyond PR #36's preserved snapshot | Review unresolved proposal decisions against accepted contracts; do not overwrite live specifications. |
| Feature registry beyond this bounded port | PWA Settings, flag adapters, optional relay endpoint, backup diagnostics/quarantine and target-device budgets | Integrate against actual enabled handlers and existing vault recovery contracts. Catalog presence cannot enable functionality. |
| Domain CLI | Encrypted file vault, signed-record commands and tested UI/CLI parity | Follow the extracted F0–F4 specification and compatible backup/authority boundaries. |
| Browser crypto qualification | Execute dedicated primitive probes on a capable host and adopt a verified released upstream repair | Product journeys and crypto probes remain separate evidence. Preserve native cryptography and all assertions. |
| Toolchain advisory | Picomatch high-severity ReDoS finding | Adopt a reviewed fixed version/mitigation when available; preserve provenance, compatibility tests and an honest audit result. |
| Wider product | Full recovery/federation, private messaging, offers/deals/receipts, services/rentals/auctions, retention/purge, manual accessibility and target-device qualification | Separate feature work remains. The repository stays a development alpha. |

No deployment, release publication, remote branch deletion, force push, shared
history rewrite or approval bypass was performed. No user-vault migration or
existing signed-record format changed. Every original source branch remains
available with an explicit disposition.

## Integration outcome

The runtime contribution in PR #48 remains pending its actual GitHub execution
jobs. Both workflow planning jobs passed, but the domain/browser job and all six
platform jobs remained queued without assigned runners after approximately
18 minutes. No runtime merge is authorized by that pending state.

The documentation and adapted CLI proposal are isolated from #48 on a branch
starting at the unchanged main. They add only Markdown and evidence JSON under
`docs/`; no application, package, tooling, test, workflow or dependency path changes.
The repository excludes such documentation changes from its Actions workflows.
Their source/JSON/link review can therefore finish independently while the
runtime checks continue. The earlier stacked draft #49 is superseded only after
this independent documentation PR is verified and merged.

The starting inventory above remains source-pinned and does not count earlier
sessions' merges as work done in this execution. Final remote commit references
and any later runtime integration are recorded through the PRs and the final
execution summary; pending checks are never reported as passing.
