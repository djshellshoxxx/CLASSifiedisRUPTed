# PS-064-10 — Import, export, backup and rollback: Meetup coordination

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S03.M03 Meetup coordination](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/meetups/coordination` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-064-10.R01** A user's vault export contains their meetups, proposal statements and the agreement references.
- **PS-064-10.R02** Import re-verifies proposal and consent signatures; failures are quarantined and meetups with passed windows import as elapsed.
- **PS-064-10.R03** Schema changes follow expand and contract and keep v1 readable for 180 days.

## Specification

- **export:** Section comms.meetups in classrup-export/v1; one line per Meetup (schema classrup.comms.meetup/v1) with signed proposal statements.
- **import:** Signatures are re-verified; existing IDs skipped; open meetups whose window has passed import as expired or elapsed; agreements link to imported consent statements.
- **backup:** Vault export is the backup (IOX-6); relays hold no meetup data.
- **migration rollback:** Additive fields only in v1; rollback is safe because proposals are immutable statements and derived status is recomputed on load.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-064-09.T13 | integration | PS-064-10.R01, PS-064-10.R02, PS-064-10.R03 | export, import into fresh vault, restore from backup | meetups and agreements round trip; invalid statements quarantined |

## Dependencies

Module depends on: F08.S01.M01, F08.S01.M02, F08.S02.M02, F08.S03.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
