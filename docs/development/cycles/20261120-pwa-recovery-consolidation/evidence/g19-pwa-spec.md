# PR #70 — spec and functional source review

Reviewed source: `eb9577bf9403741c53c2a53f6d5a67fd4e0825a9`.
Complete tree: `f709642281d1d5a29f00c05b0a155b0bdb4ad376`.
Fixed point: `6d4f6ea7ba9bcf886ae69edd0f167a621308d4b2`.
Diff: `git diff 6d4f6ea7ba9bcf886ae69edd0f167a621308d4b2...HEAD`.

## Spec

**No blocking implementation defect or unintended scope expansion found.** The new formatter and action match the bounded feature described in `docs/development/cycles/20261120-pwa-attachment-diagnostic/HANDOFF.md`.

- The handoff requires that the action “requests *both* record coverage and the unlocked principal's read-only attachment-reference diagnostic.” `apps/pwa/src/main.ts` calls both existing vault methods through the current session and renders ordinary text. The reads remain successive snapshots; they do not authorize export.
- `docs/development/BACKUP_SCOPE.md` requires “distinct held references” and “holder-row counts.” The formatter keeps those separate, distinguishes missing and present-but-excluded references, and renders every count as unavailable on overflow. Zero holders retains the explicit v1 exclusion and unheld-blob caveat. Production returns null counts only on overflow; the extra null guards do not suppress a valid production count.
- The handoff requires “Prior displayed inspection text is cleared before the new read.” That clearing occurs before either await. Existing `vaultAction`, `runForSession`, guarded vault reads and `clearVaultViews()` retain session revocation and lock clearing. A rejected read cannot publish a partial combined report; the existing action handler reports active-session failures and suppresses obsolete-session errors.

## Acceptance gap

**One non-blocking test-coverage finding:** the handoff requires that the action “renders the two reports,” but the three new tests exercise only the formatter. The existing browser journey in `tests/browser/alpha.spec.ts` checks record text and lock/reopen clearing; it does not require attachment text to appear. A missing attachment call/render could therefore escape those assertions. The smallest useful addition is an assertion for the zero-holder attachment diagnostic and its explicit v1 exclusion in that existing journey; retain the existing lock/reopen assertions.

Fresh current-source execution remains required. This review ran no tests, compiler, browser, remote operation or vulnerability reproduction and supplies no hosted or native-browser acceptance.

Spec findings: **0 implementation blockers; 1 test-coverage gap**.
