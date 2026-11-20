# ClassRup engineering continuation — production-registry downgrade export safety

## Source, ownership and scope

This bounded candidate starts from independently verified current main at merge commit `449a619f1ae7b66cb42d9cab43dd5493bfe42c2e`, tree `8fe1965ae60c385042f09c690eabe7d0828b36e8`. It is isolated from PR #64, PR #60 and incompatible draft #8. The intended executable delta is only `tests/integration/production-downgrade-export.test.ts`.

The new test models a vault written by a hypothetical *newer* application with the complete production PWA codecs plus one additional private codec. After persisting a real archive and a new private record in encrypted fake-IndexedDB, it closes the owner session, reopens the **same database** using only the older PWA production codec set, and checks that:
- Both types are still present in the bounded inventory; only the newer type is unsupported.
- The old application refuses to export a kit that would omit the unknown record; known and unknown encrypted domain rows remain intact.
- Reopening the same vault with the newer registry preserves the signing identity, both records and the ability to export a normal sealed v1 backup.

This is complementary to draft PR #64's **new-backup-to-old-empty-vault restore rejection** and positive newer-registry import; it specifically exercises **already-saved data across an app-version downgrade**. The existing memory-storage omission tests do not exercise encrypted same-database reopen across different codec registries. Do not claim historical backup corpus coverage or actual native IndexedDB/browser behavior from fake-IndexedDB.

## Qualification facts at preparation

Current main's own post-PR-#63 push qualification completed successfully: Alpha run `44713847841` and six-platform CLI run `44713847763`, both at commit `449a619f1ae7b66cb42d9cab43dd5493bfe42c2e`. Draft PR #64 head `f598dc52937449764703b5048ba71a77239c9ded`, tree `d83f2c74a191dfc8eca717f4bb8aa6b79f3e483b`, has completed current-source Alpha run `44706815089` with 820 passed domain assertions and 26 Chromium Playwright journeys; its CLI run `44706814923` has both selected Ubuntu Node 22 and 24 jobs successful. PR #64 still has **zero independent submitted reviews** and remains draft; do not merge based only on hosted passing jobs.

The new candidate has not been locally executed. This container's `git ls-remote` failed because `github.com` could not resolve; the isolated branch is prepared through GitHub's repository object interface, not by pretending that a local worktree existed. The GitHub-hosted gates for **this** exact candidate, when created, must be read separately. The original full local domain-suite exit 137, earlier cancelled runs and old branch failures are retained; no timeouts, encryption parameters, product caps, release files or workflow selections are changed.

## Required independent fresh-review lanes and next handoff

1. **Code auditor:** inspect the exact new head/tree, compare the test against main's `vaultFromStorage` export and codec closure semantics and PR #64 without duplicating existing assertions. Check for immutable source references, valid archive indexes, clean cleanup, no production or signature change. Record source identity, findings and a next reviewer handoff.
2. **Functional bug hunter:** run the new case alone with normal unchanged 30-second limit, then full TypeScript, focused backup tests and necessary GitHub Alpha/CLI. Verify that a successful old export is **not** accepted. Test a fresh genuine IndexedDB browser path when available; do not conflate fake-indexeddb and native coverage.
3. **Defensive security reviewer:** review only source admission, unknown-type fail-closed inventory and export, passphrase/identity preservation and private-data exposure. Do not resume interrupted reproduction follow-ups. Treat static-only findings separately from product tests.

These are outstanding assignments, not completed independent worker reviews. Keep this PR draft; require exact current-source required hosted checks and independent reviews before normal merging. After merge, verify merge tree and separate main-push checks. No release, deployment, paid APIs, force push or branch deletion.
