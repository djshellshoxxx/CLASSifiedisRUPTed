# PS-008-10 — Import, export, backup and rollback: Inventory availability

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S03.M01 Inventory availability](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/inventory/availability` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-008-10.R01** The user export contains InventoryItem and InventoryHold rows, including peer reservation statements, in section bazaar.inventory.
- **PS-008-10.R02** Import imports active holds as expired when their expiresAt has passed and never revives a lease; frozen holds stay frozen.
- **PS-008-10.R03** Schema changes follow expand/contract and keep v1 readable for 180 days.

## Specification

- **export:** Sections bazaar.inventory_items, bazaar.inventory_holds and bazaar.peer_reservations in classrup-export/v1, one line per record, with reservation and release statements as separate lines.
- **import:** Items imported if the listing exists; holds whose holder module is absent are kept read-only; peer reservations re-verified; conflicting ids are rejected with a dry-run report.
- **backup:** Vault export is the primary backup (IOX-6); no relay holds inventory.
- **migration rollback:** Expand/contract: earlier InventoryHold rows with origin peer_statement are migrated into PeerReservation and kept readable for 180 days; rollback to the previous release is safe because older readers ignore new fields and leases are recomputed from expiresAt.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-008-09.T17 | integration | PS-008-10.R01, PS-008-10.R02, PS-008-10.R03 | export, import to fresh vault with expired and frozen holds and peer reservations | items round-trip; expired imported as expired; frozen imported frozen; peer reservations read-only |

## Dependencies

Module depends on: F01.S01.M01, F16.S02.M03, F11.S01.M01, F11.S01.M02, F11.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
