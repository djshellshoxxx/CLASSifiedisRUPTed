# TODO: F15.S03.M02 backups

**Status:** IMPLEMENTED; blob storage and scheduling are relay work.

## Implemented
- [x] Snapshot v1 with per-collection and event hashes, Ed25519-signed manifest (`packages/platform/src/ops/backups.ts`; `packages/platform/test/backups.test.ts`)
- [x] `verifyBackup` collects every integrity problem; `restoreBackup` into empty stores only, preserving record versions (same files)
- [x] Tenant-scoped export; GFS retention 7/4/12 as a pure function with properties (same files)
- [x] Ops create/verify/purge_due/list with catalog records (`packages/platform/src/ops/backup-service.ts`)

## Remaining
- [ ] Durable `BackupStore` implementation (files/object storage) that encrypts at rest
- [ ] Scheduling `platform.backup.create` and offsite copy
- [ ] Incremental backups

Package overview: `packages/platform/README.md`. Traceability: `packages/platform/traceability.json`.
