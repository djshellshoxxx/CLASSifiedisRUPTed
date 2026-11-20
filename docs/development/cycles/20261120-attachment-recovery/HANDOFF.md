# ClassRup engineering handoff — attachment/reference recovery Phase A

**Checkpoint date:** 2026-11-20. **Scope:** new isolated documentation/design candidate; no runtime change, local test execution or completed independent review.
**Observed main:** `449a619f1ae7b66cb42d9cab43dd5493bfe42c2e` (tree `8fe1965ae60c385042f09c690eabe7d0828b36e8`).
**Draft candidate ownership:** this branch only; do not edit PR #64 (`f598dc52937449764703b5048ba71a77239c9ded`), #65 (`5a742b5c4f1068f8bbd51d84de6a3de054df57e7`) or #66 (`5bae3058bffec53c0fe04700c84232b8d7a5a84a`), nor PR #60 or incompatible draft #8, without refreshing remote ownership.

## Evidence at this checkpoint

- PR #63 merged normally at `449a619f1ae7b66cb42d9cab43dd5493bfe42c2e`; its separate main-push Alpha and CLI completed successfully.
- PR #64 exact-head Alpha `44706815089`, CLI `44706814923`: success at their own source. PR #65 Alpha `44724087255`, CLI `44724087247`: success at its own source. PR #66 Alpha `44731448829`, CLI `44731448932`: **newly verified success** with domain job `136288684424` and Ubuntu CLI Node 22/24 jobs `136286688877` and `136286689018`. PR #66 domain log reports 820 passed, 0 failed/pending/skipped and selected 26 Chromium journeys passed; source-specific Firefox/WebKit were not selected.
- At inspection, PRs #64, #65 and #66 each have zero submitted independent GitHub reviews and remain draft/unmerged. Do not treat successful CI as review or earlier PRs' tests as current-head qualification.
- The prior 2026-11-19 local complete domain attempt exited 137 without final report; original failed, interrupted, cancelled and queued observations remain historical evidence. No workflow reruns were initiated.
- Local `git ls-remote` still fails DNS resolution of `github.com`, so this checkpoint is published through the GitHub connector. No isolated local worktree or executed local test is claimed.

## Fresh next-generation reviewer lanes (not launched)

1. **Code auditor (source-only first):** review `packages/vault/src/vault.ts`, `packages/vault/src/encrypted-storage.ts`, `docs/development/BACKUP_SCOPE.md`, the actual kernel `blobs` and `blob_refs` schemas, and every reference writer/reader. Test design consistency, existing v1 compatibility and whether a read-only reference inventory can be principal-scoped without exposing bytes. Record exact source SHAs and whether any code executed.
2. **Functional bug hunter:** independently inspect currently excluded attachment records and find real user journeys that lose access after records-only restore. Propose one minimal reference-coverage acceptance test grounded in the actual schema and test it on an isolated checkout when available; do not run concurrent heavy suites. Record exact assertion totals, commands, host limitations and handoff.
3. **Defensive security reviewer:** check principal/reference ownership, durable row address binding, checksum/signed manifest design, cross-tenant leakage and rollback/atomicity. Review/hardening only, not the interrupted reproduction follow-ups. Keep v1 signatures, signing keys and device recovery authority unchanged.

Next engineering action: source-inventory actual blob/ref model, then implement the **read-only reference coverage** slice with unit/integration tests on a new isolated code PR. The spec is not approval to add binary backups or change wire v1. Source identity and each executed check must be frozen in an updated handoff. Complete open PR #64-66 independent review gates before any merge and verify exact merge tree and main-push qualification after any eventual integration.

No current user's credit balance is observable; no exhaustion is inferred. No release/deployment/force push/deletion, paid API or unrelated automation mutation.
