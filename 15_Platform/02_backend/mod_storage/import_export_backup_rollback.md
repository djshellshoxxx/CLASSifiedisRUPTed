# PS-119-10 — Import, export, backup and rollback: Storage

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S02.M03 Storage](SPEC.md) · **Scope:** MVP · **Code:** `packages/kernel/src/storage` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-119-10.R01** Records are exported by their owning modules (IOX-5); storage provides an ordered cursor scan per tenant and type and a restore that keeps IDs, revisions and timestamps and rejects conflicting copies.
- **PS-119-10.R02** Relay SQLite schema changes are forward-only kernel migrations recorded in schema_migrations, and data migrations run once each in their own transaction.
- **PS-119-10.R03** Rollback to N-1 is safe because kernel schema changes are additive, and drift between code and recorded kernel migrations stops startup with PLATFORM_STORE_MIGRATION_DRIFT.

## Specification

- **export:** No section of its own; owning modules page through repo.query (cursor scan) and write classrup-export/v1 lines; blobs referenced by exported records are exported by the owning module with their refs.
- **import:** repo.restore writes absent records as-is, skips identical ones and returns CONFLICT_REVISION for conflicting copies (IOX-2); blob refs of restored records are re-attached.
- **backup:** Relay: SQLite online backup and WAL archiving (F15.S03.M02, IOX-3). Vault: the user's export is the primary backup (IOX-6); IndexedDB itself is not backed up by the relay.
- **migration rollback:** Kernel migrations kernel:0001_base and kernel:0002_media_blobs are additive; the IndexedDB vault creates missing object stores on upgrade; data rollback only by restore to a new instance (IOX-4).

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-119-09.T13 | integration | PS-119-10.R01 | export 120 records from memory by cursor scan and restore into SQLite, then restore identical and forged copies | identical export; identical restore skipped; forged copy CONFLICT_REVISION |
| TEST-PS-119-09.T14 | integration | PS-119-10.R02, PS-119-10.R03 | reopen a database, run data migrations twice and a failing one, then tamper with a kernel checksum | kernel migrations recorded once; data migrations once; failing one not recorded; PLATFORM_STORE_MIGRATION_DRIFT on open |

## Dependencies

Module depends on: F15.S03.M01, CTR-ID-001, CTR-SCH-001, CTR-IDM-001, CTR-EVT-001, CTR-ERR-001, CTR-PRV-001, CTR-IOX-001, CTR-FLG-001, CTR-OBS-001, CTR-TST-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
