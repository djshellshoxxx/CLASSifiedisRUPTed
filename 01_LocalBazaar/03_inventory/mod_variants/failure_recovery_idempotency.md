# PS-009-06 — Failure recovery and idempotency: Listing variants

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S03.M02 Listing variants](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/inventory/variants` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-009-06.R01** Commands are idempotent per CTR-IDM-001 and use expectedRevision when changing an existing variant.
- **PS-009-06.R02** The variant write, quantity change in the inventory module, revision record and outbox event commit in one transaction or not at all.
- **PS-009-06.R03** Offline edits are committed locally; buyers see them only after a new signed projection has been sent and accepted.

## Specification

- **idempotency:** Idempotency-Key required on every command; keys and request hashes kept 24 h; replay returns the stored result.
- **concurrency:** expectedRevision on update, retire, reactivate, remove; the unique indexes on attributes and positions enforce limits under races; two tabs adding the 50th variant give one success and one BAZAAR_VARIANT_LIMIT. The open-offer check reads the offers module inside the same transaction.
- **retries:** Only IndexedDB aborts are retried (max 3); validation and conflict errors are not retried.
- **offline:** Fully available offline; the UI shows unsent changes until the listing projection is re-sent through F01.S01.M03.
- **partial failure:** If set_quantity fails (for example below reserved, or the listing-level item still has a hold), the variant change is rolled back and the inventory error code is returned unchanged or mapped to BAZAAR_VARIANT_LISTING_HELD.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-009-09.T06 | integration | PS-009-04.R02, PS-009-06.R02 | update variant price on published listing | listing revision recorded as material in the same transaction; event emitted once |
| TEST-PS-009-09.T08 | integration | PS-009-06.R01, PS-009-06.R03 | replay add with same key; edit offline | one variant; unsent changes shown until projection re-sent |
| TEST-PS-009-09.T09 | chaos | PS-009-06.R02, PS-009-06.R03 | inventory set_quantity fails below reserved | variant change rolled back, inventory error returned unchanged |
| TEST-PS-009-09.T10 | integration | PS-009-06.R02 | two tabs add the 50th variant | one succeeds, other BAZAAR_VARIANT_LIMIT |

## Dependencies

Module depends on: F01.S03.M01, F01.S01.M01, F01.S01.M02, F01.S01.M03, F01.S02.M01, F01.S04.M01, F09.S03.M01, F09.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
