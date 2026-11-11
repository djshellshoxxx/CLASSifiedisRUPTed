# PS-021-10 — Import, export, backup and rollback: Cycle consent

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S03.M01 Cycle consent](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_execution/consent` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-021-10.R01** Export contains the user's cycles with all consents and the statements they depend on, because they are signed evidence of what was agreed.
- **PS-021-10.R02** Import verifies every consent signature and hash, skips identical records, rejects conflicting IDs, and imports non-terminal cycles as frozen so no stale consent or deadline is acted upon.
- **PS-021-10.R03** Schema changes follow expand and contract and keep v1 readable for 180 days.

## Specification

- **export:** Section mutiny.cycles in classrup-export/v1; one line per Cycle (schema classrup.mutiny.cycle/v1) and per CycleConsent (schema classrup.mutiny.cycle_consent/v1) with embedded statements and provenance.
- **import:** Terminal cycles import as read-only history; opening, proposed and committed cycles import as frozen with closeReason recovery; reservations never revive.
- **backup:** The vault export is the primary backup (IOX-6); relays hold only ciphertext in mailboxes (IOX-7).
- **migration rollback:** Additive optional fields only in v1; rollback to the previous release ignores unknown fields; the status enum only grows and unknown states read as frozen.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-021-09.T20 | integration | PS-021-10.R01, PS-021-10.R02, PS-021-10.R03 | export, import into fresh vault, schema rollback | cycles and consents round-trip with signatures verified; open cycles import as frozen |

## Dependencies

Module depends on: F02.S03.M02, F02.S02.M03, F02.S02.M05, F02.S01.M02, F02.S01.M03, F02.S01.M04, F02.S04.M02, F08.S02.M02, F07.S01.M01, F07.S02.M02, F07.S03.M01, F12.S03.M04, F16.S02.M03, F15.S01.M01, F11.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
