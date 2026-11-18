# ClassRup documentation/planning PR deep review

Reviewed against `50abc470139a613f4404bdb9fb442f4011c13932` (runnable main before current consolidation). Source heads and original PR bodies are in `open-prs.json`; path/ancestry/patch calculations are in `docs-history-analysis.json`. Source files were read directly from Git, and the final documentation worktree is clean.

## Delivered branch

- Branch: `codex/pr-docs-consolidation-20261117`
- Full head: `7259cb1ce190848ca8ef54ca10ea09ca9a276011`
- Worktree: `/workspace/scratch/f78bd6f6beec/classrupted-docs`
- Root can merge this branch normally onto the current root candidate. Preserve merge ancestry; do not squash if the aim is to let GitHub recognize source PRs #12/#13/#14/#25/#34 as merged.
- Five actual source-head merges: #12 -> `9a426f4675d9dbb09726445a0b0ca430b7b8a273`; #13 -> `d39d4c8deda40d075b2b2516e90f3f2b99a3a987`; #14 -> `f50fe613350314e14fa8d259c9ec15649370b0fc`; #25 -> `6f80272761ab3088e7472ece7e1447e346183448`; #34 -> `30ed69e172b30a8d3942a304d11f2b1195e279ef`.
- No GitHub mutations, pushes or merges performed by this agent.

## PR dispositions

| PR | Exact head | Unique change shape against common ancestor | Recommendation / result |
|---|---|---|---|
| 1 | `39ac847870746e14b466d5706ebe5b00dddbaadb` | 29 files, +651/-428; early 34-commit planning lane | Close as superseded after recording source. Original contracts and process progress belong to old planning architecture; generated/YAML contracts supersede them. Preserved in descendant `continuation/classrup-20261101` at `fa0cf0c33c80e71787539b964a03c0e8a561c718`. |
| 2 | `d804b49d262bdb87f1eabd0a15bfbb9d1d3e831a` | 371 files, +14788/-10980; includes #1 and four later commits | Close as superseded, not content merged. The client-owned constraint is captured in active ADR-0016; importing hand-written process scaffolds would undo generated sources. Same historical descendant preserves source. |
| 6 | `59028d1d962e6c4f113e19d77abf73a045a2318d` | Four files, +71/-8 | Close as obsolete. README/TODO planning-only wording conflicts with runnable alpha; the sole new path is `planning/DOCS_SWEEP_HANDOFF.md`, a paused cross-repository sweep, not current ClassRup scope. Record source; do not copy unrelated project task queue. |
| 8 | `a403614bb34d3d176d4693730e512e14959718b8` | 1914 paths, +49770/-27763 after common foundation; last commit modifies 34 runtime paths | Keep open as selective-qualification candidate. Common original checkpoint is inherited, but later head is not integrated. Missing generated registry and security/tenant imports corroborate prior inventory. Runtime review delegated to parked-modules agent; its execution report supplies stronger blockers. |
| 12 | `4620d244e79e4cefbeade9cf59149ea1c3f7e5c2` | One unique additive historical handoff, 482 lines | Integrated with actual merge ancestry and explicit historical notice. Original body retained. |
| 13 | `19edded385d4aaa2fea9f482cf3a0fdc7cd0a806` | Six unique additive wiki/maintenance files, 385 lines | Integrated with actual merge ancestry; all originals archived byte-for-byte; current wiki rewritten against main and latest encryption/lifecycle scopes. Live Wiki was not published. |
| 14 | `1ee040492345e607b431707fd7f08528bbf2db77` | One unique additive source audit ledger, 202 lines | Integrated with actual merge ancestry and historical notice. Does not close findings. |
| 18 | `e402bd56352ae62cb3adcd3ba201a94a06b6217d` | 20 hand-written process docs, +1918/-494 | Preserve exact proposal patch + manifest; close as superseded/deferred source proposal if parent agrees. Do not describe as adopted canonical specification. Accepted requirements must be ported into current YAML. |
| 25 | `566778cdf72399df4696e1d6f6675412813e6d5a` | 25 additive planning files, 3920 lines | Integrated with actual merge ancestry. Every Markdown file has historical scope notice; source workflow code/data bytes retained. No workflow executed. |
| 34 | `6406a0369098fdb7aa58b5a4e85325560857815f` | 14 additive handoff/lane/probe/workflow files, 1475 lines | Integrated with actual merge ancestry. Historical pause, incomplete design and original lane status clearly scoped. No workflow executed. |
| 36 | `3a5c9e36e22a635104dfecf41641b438c95fa239` | 169 changed paths, +9971/-4401 | Contract index, review, eight contract draft bodies and security tracker already preserved in main (some unchanged from branch base). Preserve only 159 unadopted changed-path proposals as source diff; close as archived planning source, not runtime merge. |

## Standards findings

1. **Generated-source adoption blocker — #18 and #36.** `planning/SPEC_FORMAT.md` begins by declaring `module.spec.yaml` the approved source (ADR-0015); ten process documents, module SPEC/TODO/checklist and registry are generated. #18 edits 20 generated Markdown files without YAML. #36 edits generated process docs without YAML. Direct merge would leave source and generated output inconsistent. Exact patches were retained under `docs/history/planning-proposals-20261117/`, not applied.
2. **Historical evidence presented as current — #12/#13/#34.** `LATEST` handoff names and generic `docs/status/HANDOFF.md` contain dated statements about planning-only main, original owner pauses, parked work and unreviewed lanes. Historical notices now identify exact source and link current status. Current wiki source no longer carries obsolete installation/privacy claims.
3. **No runtime qualification can be inferred from planning code.** #25 contains candidate designs and workflow scripts but no finalized synthesis or implementation; #34 reviewer probes are inert `.test.ts.txt` reference material. Preserving them does not execute validation or complete a feature.

## Spec findings

1. **#13 guides materially stale.** Original `docs/wiki/User-Guide.md` said main was planning-only, advised checkout of `429fcfc`, and claimed domain rows remained plaintext. Current README/vault code describes runnable main and AES-GCM protected row storage, authenticated inventory and atomic migration. Refreshed guides now match this, while preserving explicit missing recovery/relay/settlement boundaries.
2. **#36 risk proposals have incompatible authority assumptions.** Proposed R11 calls for "server-side checks" and R14 for revocation as an "ordered server transition". These are not adopted as new requirements for a user-held local vault. Archived diff retains them for explicit reconciliation. Existing findings remain OPEN.
3. **#8 later head has missing foundations.** `packages/platform/src/configuration/feature/registry.ts` imports absent `registry.generated.ts`; `packages/security/src/cryptography/signatures/index.ts` is absent. Peer runtime agent independently reproduced numerous type and execution failures. No declaration of completion or source adoption is appropriate.

## Preservation and verification

- Verified all five integrated source heads are ancestors of the delivered branch.
- Checked original bodies of all #12/#14/#25/#34 Markdown against source after removing only added historical notice and leading blank-line normalization; non-Markdown artifacts are byte-identical.
- Checked all six #13 originals byte-for-byte against the source commit. Stored under `docs/history/pr-13-20261110/`.
- Verified the ten existing archive files under `docs/security-planning/20261116/planning/` match source #36 blobs exactly; the existing security tracker also matches. No duplicate copy of those artifacts was created.
- #18 and #36 patches reproduce `git diff --no-ext-diff --unified=0 <recorded-base> <head> -- <manifest-paths>` byte-for-byte; SHA-256 matches manifest. Patches preserve 20 and 159 source paths respectively, approximately 1.47 MB total. These are inert documentation proposals.
- Checked 69 relative Markdown targets and 11 sidebar/heading anchors in current wiki and new archive/provenance navigation: zero missing.
- `git diff --check` passed before all commits.
- No active runtime (`packages`, `apps`, `tools`, `tests`), `.github`, dependency manifest, lockfile or module YAML changed. README gained wiki links; CLI setup removed obsolete pre-merge branch advice and labels old qualification table historical.
- Final branch delta: 61 files, +23918/-2 lines, mostly preserved original historical evidence and zero-context source proposals.

No runtime tests were added or run for documentation-only changes. Root should run its existing combined-candidate gates and inspect the final documentation branch before integration.
