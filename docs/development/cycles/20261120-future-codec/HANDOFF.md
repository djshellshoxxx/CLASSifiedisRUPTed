# ClassRup engineering continuation — unknown future codec compatibility

## Source, ownership and scope

This is an isolated stacked acceptance candidate, parented on the exact published draft PR #63 head `0f3288c8589ae8d3316c2a4cb21b4ceb306fd320` (tree `8fe1965ae60c385042f09c690eabe7d0828b36e8`). The branch is `codex/classrup-future-codec-guard-20261120`. PR #63 and predecessors #58–#62 are not modified by this work.

The **only executable addition** is `tests/integration/production-future-codec-rejection.test.ts`. It exercises an actual v1 signed, passphrase-encrypted export from a registered future codec and attempts recovery with the existing production PWA codec registry. It expects a fail-closed unsupported-scope rejection, an uninitialized destination and the same uninitialized result after reopening the encrypted IndexedDB vault.

The fixture uses the normal vault exporter; it does not forge a signature, alter a ciphertext, import a historical backup, run a security exploit, or loosen the existing 30-second case limit. No production code, v1 wire format, crypto parameters, code registry, workflow or release configuration is changed. This is one unexecuted regression test until a current-source runner completes.

## Qualification and concurrent ownership

At branch preparation, PR #63 was draft at `0f3288c8589ae8d3316c2a4cb21b4ceb306fd320`, its Alpha run 44697459332 and CLI run 44697459426 were queued at the initial plan jobs. Their status is not a pass and must be refreshed before any integration. Earlier 9-case and full-TypeScript local evidence belongs to PR #63's earlier executed test blob and is not a result for this new test. Previous compiler exit -9, incomplete local domain exit 137, older cancelled jobs and their independent historical evidence remain unchanged.

Direct git worktrees could not be created in the current container because the GitHub hostname did not resolve; this candidate is therefore isolated as new remote Git objects and its own branch, not a claimed local checkout. This run did not execute the new test, build, native browser or CLI matrix. Do not merge this candidate on a source review alone.

## Fresh review lanes

1. **Code audit:** inspect the new test's real export fixture, record index tuple and ordinary `vaultFromStorage`/IndexedDB boundary against the exact current parent; check the generated commit tree and no production changes
2. **Functional bug hunt:** execute the new case serially under the normal test runner, verify the failure is the unknown type rather than a setup exception, and independently compare recovery with the existing valid legacy subset scenario
3. **Defensive security review:** statically verify the pre-identity scope admission and rejection path in `packages/vault/src/vault.ts`, confirm no partial identity/domain-row write, and avoid interrupted reproduction follow-ups

These are assignments for subsequent independent workers, **not completed independent reviews**. Each worker must record source SHA/tree, executed commands (or static-only scope), findings, and a handoff. Keep any new repairs in isolated commits and do not alter a pending predecessor's source simply to regenerate CI.

## Next action

Inspect live predecessor heads and CI without repeated queue polling or restarts. Qualify PR #63 independently; this stacked test can then qualify against its actual parent. If source drifts, reconcile before a merge. Only after current-head required Alpha/browser/CLI gates and independent review pass should normal integration be considered. No release, deployment, force push, branch deletion or paid API is authorized.
