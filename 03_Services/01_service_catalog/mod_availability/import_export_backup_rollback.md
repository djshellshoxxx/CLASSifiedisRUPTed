# PS-028-10 — Import, export, backup and rollback: Service availability

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S01.M02 Service availability](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_catalog/availability` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-028-10.R01** The vault export contains calendars, exceptions and holds; expired holds are exported only as history.
- **PS-028-10.R02** Import validates the zone against the bundled tz database and flags holds whose local time moved.
- **PS-028-10.R03** Schema changes follow expand and contract and keep v1 readable for 180 days.

## Specification

- **export:** Section services.calendars in classrup-export/v1; one line per calendar and per hold (schemas classrup.services.availability/v1 and classrup.services.slot_hold/v1).
- **import:** Calendars import as saved-local without publishing; held holds with expiresAt in the past import as expired; committed holds import as is.
- **backup:** Vault export is the primary backup (IOX-6); relays hold only the signed summary (IOX-7).
- **migration rollback:** Additive fields only in v1; the stored tzdbVersion lets a rollback regenerate slots with the earlier database without losing committed intervals.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-028-09.T13 | integration | PS-028-10.R01, PS-028-10.R02, PS-028-10.R03 | export, import into fresh vault, change tz database version | calendars round-trip; moved holds flagged needs_reconfirmation |

## Dependencies

Module depends on: F03.S01.M01, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
