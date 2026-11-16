# PS-023-06 — Failure recovery and idempotency: Cycle locks

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S03.M02 Cycle locks](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_execution/lock` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-023-06.R01** Reserve and release are idempotent, and all holds plus the statement are written in one IndexedDB transaction so there are no orphan holds and no statements without holds.
- **PS-023-06.R02** Concurrent reserve attempts inside one vault are serialized by an IndexedDB transaction and a Web Locks mutex; the first transaction to commit wins and the others fail with a conflict.
- **PS-023-06.R03** After a crash, expiry and orphan-hold reconciliation run first on vault open.
- **PS-023-06.R04** Cross-vault double promises are detected on evidence and frozen, never silently resolved.

## Specification

- **idempotency:** Idempotency-Key replay 24 h; reserve is also idempotent by (subjectId, revisionHash); ingest dedupes by cid.
- **concurrency:** Web Locks mutex 'mutiny-lock' plus IndexedDB readwrite transaction; items are processed in ascending inventoryItemId order inside one transaction so partial acquisition is impossible; the first committed transaction wins, so concurrent proposals over one item resolve first-commit-wins within the vault.
- **retries:** Release and reserve statements go through the sync outbox with IDM-4 backoff; reserve is never retried against inventory automatically after MUTINY_LOCK_UNAVAILABLE.
- **offline:** Reserve and release work offline; the statements stay local_committed or prepared, and the peers' view of this reservation is unknown until transport acknowledgement.
- **partial failure:** If statement signing fails, the transaction aborts and no hold remains; if the outbox cannot deliver, the local reservation stays valid and the peers treat the missing statement as absent, so the subject cannot commit at their vaults.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-023-09.T03 | property | PS-023-03.R01, PS-023-06.R02 | random reserve, release, supersede, expire sequences | status only moves forward; active own locks always have active holds; sum of quantities within availability |
| TEST-PS-023-09.T04 | integration | PS-023-06.R02, PS-023-01.R02, PS-023-09.R03 | two concurrent reserves of the same quantity-1 item for different subjects | exactly one succeeds, the other MUTINY_LOCK_CONFLICT without naming the first |
| TEST-PS-023-09.T05 | integration | PS-023-02.R01, PS-023-06.R03 | reserve [I1, I2, I3] where I3 is unavailable | MUTINY_LOCK_UNAVAILABLE and I1, I2 holds absent |
| TEST-PS-023-09.T06 | integration | PS-023-03.R03, PS-023-06.R03 | vault closed beyond expiry then opened | lock expired before any command runs, holds released, unlocked emitted |
| TEST-PS-023-09.T13 | chaos | PS-023-06.R01, PS-023-06.R03, PS-023-06.R04 | crash between hold and statement signing | transaction aborted, no orphan hold or statement on restart |

## Dependencies

Module depends on: F01.S03.M01, F01.S01.M01, F07.S01.M01, F16.S02.M03, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
