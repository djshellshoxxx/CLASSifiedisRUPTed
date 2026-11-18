# Preserved planning proposals — November 17, 2026

This archive preserves unadopted documentation proposals from PRs #18 and #36 as source-pinned diffs. **These patches have not been applied to the active specifications and are not implementation plans approved by this consolidation.** They are reference material for deliberate future reconciliation.

The source and destination commits, included paths, already-preserved paths and SHA-256 digests are listed in [manifest.json](manifest.json). The patches use zero context so they store the original changes without duplicating complete generated documents. They can be read directly; any reconstruction belongs in an isolated checkout at the recorded base, not in the running alpha.

## PR #18: developer-ready process drafts

[PR #18](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/18), head `e402bd56352ae62cb3adcd3ba201a94a06b6217d`, changes 20 process documents covering services, rentals, currencies, languages, keyboard accessibility and governance. [Its preserved proposal diff](pr-18-unadopted-proposals.patch) retains the details without overwriting the generated specification tree.

The active project uses `module.spec.yaml` as the source of those documents. Adoption must compare each proposal with current canonical contracts, express accepted requirements in YAML and regenerate documents using `pnpm spec:render`. Copying the historical Markdown directly would create source/generator drift. See [SPEC_FORMAT.md](../../../planning/SPEC_FORMAT.md).

## PR #36: later planning review

[PR #36](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/36), head `3a5c9e36e22a635104dfecf41641b438c95fa239`, contains later contract and process-document proposals. The contract drafts and review are already preserved byte-for-byte in [the November 16 planning archive](../../security-planning/20261116/README.md), and the security tracker is already preserved in the active tree.

[The remaining proposal diff](pr-36-unadopted-proposals.patch) captures only source paths whose complete head content was not already preserved in those locations. It includes the proposed dependency/TODO/risk edits and hand-written process changes. Some risk mitigations refer to server authority, while the active alpha uses user-held identity and local-vault authorization. Reconcile those assumptions explicitly rather than treating the wording as a new runtime requirement.

Preservation does not close any security finding or supersede the active contracts. The [current security evidence matrix](../../status/SECURITY_EVIDENCE_20261116_PARALLEL.md) distinguishes implementation controls from outstanding evidence.
