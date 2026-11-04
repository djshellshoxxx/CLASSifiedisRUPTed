# PS-025-10 — Import, export, backup and rollback: Barter currency normalization

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S04.M02 Barter currency normalization](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/value_balancing/currency` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-025-10.R01** Export contains normalization records of the user's subjects because they document the numbers that were signed.
- **PS-025-10.R02** Import verifies hashes and arithmetic, keeps quote data exactly, and marks records whose quotes have lapsed as expired without altering them.
- **PS-025-10.R03** Schema changes follow expand and contract and keep v1 readable for 180 days.

## Specification

- **export:** Section mutiny.normalizations in classrup-export/v1; one line per NormalizationRecord (schema classrup.mutiny.normalization_record/v1) with quotes.
- **import:** Hash and arithmetic are re-verified; current records with lapsed quotes import as expired; conflicting IDs rejected.
- **backup:** The vault export is the primary backup (IOX-6); relays never hold plaintext records (IOX-7).
- **migration rollback:** Additive optional fields only in v1; the canonical form of the hashed fields is part of the schema major; rollback ignores unknown fields.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-025-09.T15 | integration | PS-025-10.R01, PS-025-10.R02, PS-025-10.R03 | export, import, rollback | records round-trip and keep hash; imported current records are marked expired when quotes lapsed |

## Dependencies

Module depends on: F02.S04.M03, F09.S03.M01, F09.S03.M02, F09.S03.M03, F16.S02.M03, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
