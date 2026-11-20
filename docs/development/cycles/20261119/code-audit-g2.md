# Code audit — generation 2, November 19, 2026

## Source and ownership

- Started from combined integration `30526fb2745e8d6e2bb15efae5b8106bcdcf53d0`,
  including the generation 1 blob/scope repairs and root's backup-coverage feature.
- Followed the record-index and migration-row leads in generation 1's handoff
  `af3633ed7400353f88594cb415fb2b114e4bca86`.
- Isolated branch: `codex/classrup-code-g2-20261119`.
- Frozen repair: `085aa1e4f10184e3dd549d5577e2415b92ee77f1`.
- Frozen tree: `158158ac41adce78c5b324551564c41c43a4e3cd`.

Only `packages/kernel/src/storage/tx.ts` and a new focused regression file changed
in the source commit. The root worker owns integration, remote publication and
combined qualification. This worker did not push, merge, deploy, alter another
worktree or change dependency versions.

## Confirmed defects

### Caller-owned index tuples changed stored query indexes — repaired

`recordStore.put` and `recordStore.restore` passed the caller's index tuple into
the driver without copying it. The memory driver, also used as IndexedDB's
working set, retained that array. Mutating the array after the write returned or
after its transaction completed changed query membership without changing the
stored data, revision or update timestamp. Mutations before commit also replaced
the originally submitted index values. SQLite copied the scalar values through
its SQL parameter binding and served as the unaffected adapter control.

The repair copies the four index values when constructing the row for either
write path. It preserves the existing CAS, record data, indexes, ordering and
restore-conflict behavior. It does not rely on callers honoring TypeScript's
compile-time `readonly` annotation.

### Migration inputs and returned rows exposed live storage references — repaired

`migrationStore.insert` forwarded the caller's row object, and `list` returned
the driver's row objects directly. On memory and IndexedDB, changing an inserted
object changed the recorded ID/checksum/time without a new transaction.
Changing a row returned by `Storage.read()` changed migration metadata even when
the read callback threw and its transaction rolled back. The retained row could
also change storage after that read ended. SQLite's value conversion prevented
these aliases.

The repair copies the three declared migration fields on insert and on every
list result. This protects the metadata consumed by `runMigrations` and
`migrationStatus` while preserving their existing forward-only and checksum
behavior. The reproduction establishes an API integrity defect; no remote
attacker path, production data loss or execution of an unauthorized migration
was demonstrated. Current repository/vault callers ordinarily construct fresh
index tuples, and the migration runner ordinarily constructs fresh rows.

## Executed validation

| Invocation | Result |
|---|---|
| New reference-isolation file on unchanged production source | 8 failed, 4 passed; memory/IndexedDB reproduced the four cases, SQLite passed its four controls |
| Fixed reference-isolation, shared storage contracts and transaction lifetime files | 73 passed; zero failed/skipped |
| Existing `TEST-PS-119-09.T14` migration workflow/checksum-drift regression | 1 passed; 3 other tests excluded by the explicit name filter |
| Frozen offline install | Passed with unchanged lockfile |
| `git diff --check` | Passed |

The selected migration test checks forward-only recording, repeated invocation,
failed-step rollback, duplicate migration IDs and checksum-drift refusal. It is
separate from the 73-test invocation. No full-suite, full TypeScript, native
browser, encrypted-vault, performance or hardware qualification is claimed.

The regression cases exercise both record write paths, mutation before and after
commit, migration input mutation, attempted mutation during a failing read, and
retained output mutation after the read ends. All use the real memory, SQLite or
fake-IndexedDB storage adapters. No cryptographic mock or timeout increase is
involved.

Complete raw logs are compressed without changing their bytes and accompanied by
byte lengths and SHA-256 hashes in
[the validation record](evidence/code-audit-g2-validation.json).

## Fresh-worker handoff

1. Review the frozen source and test commit above independently before final
   integration qualification. Confirm it composes with the root's new
   `records.listTypes` method and generation 1 blob snapshot changes.
2. Preserve value isolation at the public transaction boundary and the original
   asynchronous callback lifetime contract. Do not substitute object freezing
   alone for copies of caller-owned inputs.
3. Use the root's combined typecheck, browser and hosted results for the exact
   final candidate. These focused passes do not qualify backup recovery or a
   release.
4. No further confirmed defect remains in this bounded index/migration audit.
   Lower-level driver snapshots/persistence callbacks are trusted adapter seams;
   any future audit of those seams must establish its own caller boundary and
   concrete reproduction rather than extrapolating this finding.
