# PS-036-10 — Import, export, backup and rollback: Anti-shill controls

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S02.M01 Anti-shill controls](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_integrity/anti` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-036-10.R01** ShillChecks are host operator data; they are exported only in the host operator's audit export and never in a user's vault export.
- **PS-036-10.R02** Import of a host audit export validates ids and schema version and restores checks as read-only history.
- **PS-036-10.R03** Schema changes follow expand and contract and keep v1 readable for 180 days.

## Specification

- **export:** Section auctions.shill_checks in the host operator export (classrup-export/v1, operator scope); excluded from every user export.
- **import:** Checks import as read-only history with status preserved; open checks import as flagged and are re-linked to reviews by review id.
- **backup:** Host relay SQLite backup (IOX-3, IOX-7); no vault backup exists for this module.
- **migration rollback:** Additive optional fields only in v1; the scoring table is a versioned constant (shill-v1) so rollback restores the earlier table with the earlier code.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-036-09.T13 | integration | PS-036-10.R01, PS-036-10.R02, PS-036-10.R03 | operator export for audit, restore host backup | checks round-trip; restore keeps the open-check unique index |

## Dependencies

Module depends on: F04.S01.M01, F07.S01.M01, F07.S01.M02, F07.S02.M01, F07.S03.M02, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
