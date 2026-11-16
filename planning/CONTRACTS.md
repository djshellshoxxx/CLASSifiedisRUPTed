# Canonical cross-module contracts

**Status:** APPROVED for implementation (Stage 3). Each contract has one owner; consumers reference the ID and must not redefine it.

| ID | Title | Owner |
|---|---|---|
| [CTR-ID-001](contracts/CTR-ID-001.md) | Identifiers, revisions and schema names | F15.S02.M02 (mod_api) |
| [CTR-EVT-001](contracts/CTR-EVT-001.md) | Domain event envelope and delivery | F15.S02.M02 (mod_api) |
| [CTR-ERR-001](contracts/CTR-ERR-001.md) | Typed errors | F15.S02.M02 (mod_api) |
| [CTR-CAP-001](contracts/CTR-CAP-001.md) | Capabilities and authorization | F16.S01.M01 (mod_authorization) with F07.S01 identity |
| [CTR-SCH-001](contracts/CTR-SCH-001.md) | Schema registry, compatibility and migration | F15.S02.M03 (mod_storage) |
| [CTR-PRV-001](contracts/CTR-PRV-001.md) | Privacy, location and retention classes | F10.S01 (data_controls) and F10.S02 (security_boundaries) |
| [CTR-COM-001](contracts/CTR-COM-001.md) | Payment evidence, claims and finality | F09.S01.M01 (mod_noncustodial) and F09.S02 (settlement) |
| [CTR-FED-001](contracts/CTR-FED-001.md) | Federation envelope, provenance and tombstones | F11.S01.M02 (mod_records) |
| [CTR-MNY-001](contracts/CTR-MNY-001.md) | Money, currencies, FX quotes and rounding | F09.S03.M03 (mod_precision) with F09.S03.M01 currency registry and F09.S03.M02 rates |
| [CTR-IDM-001](contracts/CTR-IDM-001.md) | Idempotency, concurrency, retries and offline writes | F15.S02.M02 (mod_api) with F15.S01.M01 (mod_offline) |
| [CTR-OBS-001](contracts/CTR-OBS-001.md) | Observability and performance budgets | F15.S03.M01 (mod_observability) |
| [CTR-IOX-001](contracts/CTR-IOX-001.md) | Export, import, backup and rollback | F10.S01.M03 (mod_export) and F15.S03.M02 (mod_backups) |
| [CTR-TST-001](contracts/CTR-TST-001.md) | Test identifiers and verification conventions | F17.S01 (testing) |
| [CTR-UX-001](contracts/CTR-UX-001.md) | Accessibility, localization and UX states | F14 (accessibility and localization) |
| [CTR-FLG-001](contracts/CTR-FLG-001.md) | Feature flags and module configuration | F15.S04 (configuration) |

Related decisions: [ADR index](../ADR_INDEX.md).

