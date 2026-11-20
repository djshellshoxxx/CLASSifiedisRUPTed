# Backup guidance semantic review

Reviewed the three working-tree documentation edits relative to parent
`93dae3705fe4d8d63e2a34401e3352e1e9c5cbbc`, tree
`f9af3b6d0468a10bca56195d51a14b426688aa18`.

**No concrete correction or blocking semantic finding.**

The new guidance matches the inspected `attachmentCoverage()` contract and its
memory/SQLite counters: references are distinct, holder rows are counted
separately, missing means no matching owner blob, and present blobs remain
excluded. The 10,000-holder bound is separate from record coverage; exceeding it
makes every attachment count unavailable rather than returning partial totals.
Zero counts cannot establish completeness because unheld blobs are uncounted.
Holder labels supply no authenticated parent-record authority, and v1 excludes
both bytes and references.

The PWA description matches the current action: record and attachment reads are
successive and session-guarded; the old report clears before reading; display
occurs after the guarded work; lock clears it. The text grants neither export
admission nor an atomic/completeness certificate. These additions claim no native
acceptance, portability or device-recovery completion. Publication/status facts
are outside this review's assignment.

Inspected source paths: `packages/vault/src/vault.ts`,
`packages/kernel/src/storage/memory-driver.ts`,
`packages/kernel/src/storage/sqlite.ts`, `apps/pwa/src/main.ts`,
`apps/pwa/src/backup-coverage.ts`, and `apps/pwa/src/vault-session.ts`.
Their working-tree diff from the parent is empty.

| Reviewed file | SHA-256 |
|---|---|
| `packages/vault/README.md` | `fcece3576ea9e58064d115050e634611c3dcea74714548740c5478fed341698a` |
| `docs/wiki/User-Guide.md` | `1cd898f7d6dc7526d7c94f6cf68f105b78b0bee4ecba13c0e9ae31dfbb249aa0` |
| `docs/development/BACKUP_SCOPE.md` | `882388b34656b16c7150092e381a5e75fb67744b3933e9ad8471c1283475b5ec` |

Read-only source and documentation review; no tests, compiler, browser, commits,
remote writes or security reproduction. Only this scratch review was written.
