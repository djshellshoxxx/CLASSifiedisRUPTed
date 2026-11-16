# PS-119-02 — Validation rules: Storage

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S02.M03 Storage](SPEC.md) · **Scope:** MVP · **Code:** `packages/kernel/src/storage` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-119-02.R01** A put whose expectedRevision differs from the stored revision returns CONFLICT_REVISION with params.currentRevision; expectedRevision 0 creates and fails when the record exists.
- **PS-119-02.R02** Updating or removing a missing record returns NOT_FOUND; repository definitions declare a type named <slug>.<entity> and at most four indexes, and queries accept limit 1 to 500 and only declared index names.
- **PS-119-02.R03** Acquiring a lease held by another holder until expiresAt returns PRECONDITION_FAILED, and renewing an expired lease returns EXPIRED.
- **PS-119-02.R04** A blob larger than 5 MiB returns PAYLOAD_TOO_LARGE, a malformed content type or ref returns VALIDATION_FAILED, and relay storage rejects non-P0 plaintext blobs.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | expectedRevision equals the stored revision (0 when absent) | CONFLICT_REVISION |
| V02 | the record exists for update or remove with expectedRevision ≥ 1 | NOT_FOUND |
| V03 | the lease is not held by another holder until expiresAt | PRECONDITION_FAILED |
| V04 | a lease is renewed by its holder before expiresAt | EXPIRED |
| V05 | the sync-outbox transition is declared from the current state | CONFLICT_STATE |
| V06 | each recorded kernel migration checksum equals the code's checksum | PLATFORM_STORE_MIGRATION_DRIFT |
| V07 | query limit is 1..500, index names are declared and the cursor decodes | VALIDATION_FAILED |
| V08 | blob size ≤ 5 MiB | PAYLOAD_TOO_LARGE |
| V09 | blob content type is type/subtype, ref is blob:sha256-<43 base64url chars>, relay blobs are P0 or encrypted | VALIDATION_FAILED |
| V10 | the SQLite write lock is obtained within busy_timeout | DEPENDENCY_UNAVAILABLE |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-119-09.T01 | contract | PS-119-01.R01, PS-119-01.R03, PS-119-02.R01, PS-119-02.R02, PS-119-04.R02, PS-119-09.R01 | create, duplicate create, stale update, remove, equality, range, ordered and cursor queries on memory, SQLite and IndexedDB | identical results; CONFLICT_REVISION with currentRevision; NOT_FOUND; VALIDATION_FAILED for bad cursor or limit |
| TEST-PS-119-09.T03 | contract | PS-119-02.R03, PS-119-03.R03, PS-119-05.R03 | acquire, competing acquire, non-holder release, renew, expiry, late renew, re-acquire | PRECONDITION_FAILED, EXPIRED, fence 1 then 2 then 3 |
| TEST-PS-119-09.T17 | contract | PS-119-01.R04, PS-119-02.R04, PS-119-04.R05, PS-119-05.R02, PS-119-07.R04 | put, dedupe, oversize, bad type, plaintext P2 on relay, shared photos across two listings, rollback, last removal, encrypted detach, orphan sweep, privacy lowering on each adapter | content address format; refcounts 2 then 1; blob deleted with last holder; shred true; relay rejects plaintext P2 |

## Dependencies

Module depends on: F15.S03.M01, CTR-ID-001, CTR-SCH-001, CTR-IDM-001, CTR-EVT-001, CTR-ERR-001, CTR-PRV-001, CTR-IOX-001, CTR-FLG-001, CTR-OBS-001, CTR-TST-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
