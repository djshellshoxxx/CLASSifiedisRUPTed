# ClassRup attachment reference coverage — executable Phase A candidate

Date: 2026-11-20. This isolated source candidate is based on remotely observed main
`449a619f1ae7b66cb42d9cab43dd5493bfe42c2e` (tree `8fe1965ae60c385042f09c690eabe7d0828b36e8`).
The published commit/tree and exact hosted runs must be recorded in the PR conversation
after Git object publication. Code review, tests, qualification and merge are **not**
implied by creation of this candidate.

## Scope and contracts

- Introduce read-only, tenant-bound holder-row counts in the kernel driver
  interface, memory-backed IndexedDB working set, and SQLite relay adapter.
  The read has an unchanged 10,000-row upper bound; overflow returns null
  counts rather than potentially misleading partial totals. SQLite queries
  never select blob bytes, and neither driver returns ref or holder IDs.
- Expose the diagnostic only through `UnlockedVault.attachmentCoverage()` using
  its existing storage read lifetime and session guard, scoped to the active
  signing principal. Count distinct held refs, holder rows, missing referenced
  blobs and present referenced blobs **excluded** from the existing v1 record
  backup. Missing and present refs both remain outside v1.
- Holder labels are arbitrary strings, not authenticated owner-record pointers.
  The report explicitly sets `holderAuthorityVerified: false`, and is **not**
  a completeness certificate, integrity check, portable attachment format or
  authorization to copy peer data. Unheld/orphan blobs and readers that bypass
  `blob_refs` are not inventoried here; `includedInV1Backup: false`.
- Preserve v1 backup wire bytes, identity/signature conventions, encryption
  constraints and existing record/test/timeout caps. This patch changes no
  restore, attachment bytes, orphan cleanup, delivery or lease behavior.

## Executable acceptance added (not yet run at publication)

`tests/integration/attachment-reference-coverage.test.ts` asserts on three
adapters: two owner holders sharing one stored ref, one missing owner ref,
one valid foreign-tenant ref sharing a digest but not tenant identity,
non-disclosing bounded overflow and unchanged holder state. Another test
verifies principal-only vault reporting, explicit v1 exclusion and rejection
after session lock.

## Independent next-worker lanes (outstanding; not claimed completed)

1. **Code audit:** inspect actual candidate commit against main, driver and
   storage lifetime contracts, SQLite query index/row bounds and IndexedDB
   encrypted snapshot behavior; record exact SHA, tests and any corrections.
2. **Functional bug hunt:** attempt cross-adapter test execution in an isolated
   checkout, run current-source compiler and affected suites serially, then
   explore missing/unheld refs, duplicate attachments, rollback and session
   lock races. Separate setup failure from product assertion failure.
3. **Defensive security review:** assess tenant bounds, holder impersonation,
   overflow/denial potential, absence of bytes/ref identifiers, and whether
   any callers might misinterpret coverage as an authenticated attachment
   backup. Review and hardening only; do not resume interrupted repro work.

All lanes must leave exact source commit/tree, executed test/log IDs, failed or
incomplete observations and instructions for subsequent fresh reviewers.
Independent submitted reviews and exact-source Alpha/CLI gates remain required
before merge. PRs #64-#67 and incompatible #8 retain independent ownership.
No release, deployment, force push, deletion or paid API is authorized.

The original 2026-11-19 complete local domain suite exited 137 before a final
report; do not upgrade it to success or restart unchanged full suites.
Local git checkout on this host remained blocked by github.com DNS resolution;
no isolated worktree or local runtime execution is claimed here.
