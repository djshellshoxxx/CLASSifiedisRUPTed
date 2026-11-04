# PS-037-10 — Import, export, backup and rollback: Auction fraud review

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S02.M03 Auction fraud review](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_integrity/fraud` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-037-10.R01** Reviews and evidence are host operator data exported only in the operator audit export; user vault exports contain only the void statements they received.
- **PS-037-10.R02** Import of an operator audit export validates ids, schema version and statement signatures and restores reviews as read-only history.
- **PS-037-10.R03** Schema changes follow expand and contract and keep v1 readable for 180 days.

## Specification

- **export:** Section auctions.reviews in the host operator export (classrup-export/v1, operator scope); user exports carry only received void statements under auctions.voids.
- **import:** Reviews import as read-only history; reviews that were open import as opened and must be re-assigned; void statements import after signature verification.
- **backup:** Host relay SQLite backup (IOX-3, IOX-7); vault export covers the received void statements.
- **migration rollback:** Additive optional fields only in v1; void reason enum values are append-only so rollback never loses a recorded reason.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-037-09.T14 | integration | PS-037-10.R01, PS-037-10.R02, PS-037-10.R03 | operator export, restore host backup | reviews round-trip; unique open-review index preserved; user exports contain no review data |

## Dependencies

Module depends on: F04.S01.M01, F04.S01.M03, F04.S02.M01, F12.S01.M01, F12.S01.M02, F12.S01.M03, F12.S02.M01, F11.S01.M03, F07.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
