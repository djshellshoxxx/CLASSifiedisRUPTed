# Documentation PR consolidation — November 17, 2026

## Scope and source

This review used runnable main `50abc470139a613f4404bdb9fb442f4011c13932` as its fixed comparison point. It reconciles the documentation/planning subset of the open-PR queue; runtime integration and final candidate validation are recorded separately. No deployment or live GitHub Wiki publication is implied.

The additive PR heads below are included by actual merge ancestry. Original dated evidence and inert workflow artifacts are preserved; prominent historical notices distinguish their old session instructions and status from the current project. Current wiki guides were rewritten against the consolidated implementation, with original PR #13 pages retained byte-for-byte.

| PR | Reviewed head | Disposition |
|---|---|---|
| [#12](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/12) | `4620d244e79e4cefbeade9cf59149ea1c3f7e5c2` | Merge dated alpha qualification and handoff ledger with historical notice. Old CI links describe their original sources. |
| [#13](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/13) | `19edded385d4aaa2fea9f482cf3a0fdc7cd0a806` | Merge wiki source ancestry, archive all six original files and reconcile live repository guides with main, encrypted rows and current limitations. |
| [#14](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/14) | `1ee040492345e607b431707fd7f08528bbf2db77` | Merge source-pinned audit ledger as historical evidence. Its findings require current-source verification before disposition. |
| [#25](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/25) | `566778cdf72399df4696e1d6f6675412813e6d5a` | Merge 25 hard-slices planning/map/workflow artifacts as reference material. Candidate designs were not finalized or implemented by that PR. |
| [#34](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/34) | `6406a0369098fdb7aa58b5a4e85325560857815f` | Merge 14 wave-one handoff/lane artifacts as history. The November 11 pause and parked-lane status are not the present task state. |

## Superseded planning lines and selective preservation

| PR | Reviewed head | Review result |
|---|---|---|
| [#1](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/1) | `39ac847870746e14b466d5706ebe5b00dddbaadb` | Early contract/NO-GO planning is superseded by the approved Stage 3/4 line and current alpha. Retain Git history; do not replace current generated documents or runtime architecture. |
| [#2](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/2) | `d804b49d262bdb87f1eabd0a15bfbb9d1d3e831a` | Extends #1 into early client-owned planning. The client-owned constraint is represented by active ADR-0016; wholesale merging would rewrite 371 historical paths. |
| [#6](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/6) | `59028d1d962e6c4f113e19d77abf73a045a2318d` | Planning-only README/TODO wording is obsolete. Its later cross-repository screenshot-sweep handoff does not belong in ClassRup's current task queue. Source remains recoverable in Git. |
| [#18](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/18) | `e402bd56352ae62cb3adcd3ba201a94a06b6217d` | Preserve its 20 hand-written process-document changes in the [proposal archive](../history/planning-proposals-20261117/README.md); accepted requirements need reconciliation into YAML. |
| [#36](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/36) | `3a5c9e36e22a635104dfecf41641b438c95fa239` | Contract/review/tracker content is already preserved. Archive the remaining planning proposals without overwriting runtime contracts or generated process documents. |
| [#8](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/8) | `a403614bb34d3d176d4693730e512e14959718b8` | The original foundation checkpoint is inherited by main, but the later head adds unreconciled specification changes and incomplete runtime work. Keep this head for selective qualification; this documentation consolidation does not adopt it. |

The #1 → #2 historical line is also retained by `continuation/classrup-20261101` at `fa0cf0c33c80e71787539b964a03c0e8a561c718`, together with the old mock-demo ancestry. Closing an obsolete PR does not delete those commits or establish feature completion.

## Standards findings

**Generated-source integrity:** [SPEC_FORMAT.md](../../planning/SPEC_FORMAT.md) makes `module.spec.yaml` the approved source for process documents, module `SPEC.md`, checklists and TODOs. PR #18 edits 20 generated targets directly; PR #36 also edits generated process targets without matching YAML changes. These are adoption blockers until the proposals are reconciled through the generator.

**Evidence provenance:** Historical handoffs use names such as `LATEST` and describe the repository as planning-only. They now carry source-specific historical notices. Current guidance lives in the [wiki source](../wiki/Home.md), [main README](../../README.md) and [project status](PROJECT_STATUS.md).

## Specification findings

PR #13's original guides describe plaintext domain rows and tell readers to check out the old draft alpha. Those statements apply to the old source, while current main contains encrypted row storage and the merged alpha. The live repository guides now describe the implemented behavior; the original six files are retained in the dated archive.

PR #25 retains candidate designs for canonical federation, device recovery, import preflight, encryption and value balancing. It contains no new product implementation. PR #34 records a paused workflow and originally unreviewed module output; its notes must not undo the subsequent content integrations and fixes.

The remaining #36 risk proposals contain server-authority wording. Their archival preservation does not amend ADR-0016, close any of the 51 historical findings or authorize changes to the client-owned architecture.

## Verification

- All five additive source heads are ancestors of this documentation branch after reconciliation.
- Every original historical document body and inert workflow artifact from #12/#14/#25/#34 is preserved; only explicit historical notices were added to Markdown.
- All six original #13 files are preserved byte-for-byte. Current wiki links and sidebar anchors are checked independently.
- The #18/#36 proposal manifests record exact source bases/heads, path selections and patch digests; the original active specification paths are unchanged.
- No `packages/`, `apps/`, `tools/`, `tests/`, lockfile, dependency manifest, workflow or module YAML changed in this documentation work. The only setup edit removes obsolete pre-merge guidance and labels the original verification table as historical.

These checks validate documentation preservation and navigation. Runtime, browser, operating-system and release evidence belong to the final integrated candidate's validation record.
