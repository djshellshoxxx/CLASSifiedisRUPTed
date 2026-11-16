# PS-023-10 — Import, export, backup and rollback: Cycle locks

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S03.M02 Cycle locks](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_execution/lock` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-023-10.R01** Export contains the user's own and verified peer reservation statements of non-purged subjects because they are signed evidence.
- **PS-023-10.R02** Imported active reservations never revive holds; they are imported as expired unless the subject is re-confirmed and reserved again.
- **PS-023-10.R03** Schema changes follow expand and contract and keep v1 readable for 180 days.

## Specification

- **export:** Section mutiny.locks in classrup-export/v1; one line per CycleLock (schema classrup.mutiny.cycle_lock/v1) without local holdId values.
- **import:** Statements are verified by signature and cid; active ones import with status expired and reason imported, closed ones import as history; holdId values are never imported.
- **backup:** The vault export is the primary backup (IOX-6); relays hold only ciphertext copies in mailboxes (IOX-7).
- **migration rollback:** Additive optional fields only in v1; rollback ignores unknown fields; the status enum only grows and unknown states read as expired.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-023-09.T17 | integration | PS-023-10.R01, PS-023-10.R02, PS-023-10.R03 | export, import into fresh vault, rollback | active locks import as expired-unverified to avoid stale promises; history round-trips |

## Dependencies

Module depends on: F01.S03.M01, F01.S01.M01, F07.S01.M01, F16.S02.M03, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
