# PS-056-10 — Import, export, backup and rollback: Profiles

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S02.M02 Profiles](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/profiles/profiles` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-056-10.R01** The vault export contains the own profile, received profile cache entries the user kept (contacts), and the block list.
- **PS-056-10.R02** Import revalidates avatar and statement limits and signatures of received profiles, and restores blocks as active entries up to the 1 000 cap.
- **PS-056-10.R03** Schema changes follow expand/contract and keep v1 readable for 180 days.

## Specification

- **export:** Sections identity.profiles and identity.blocks in classrup-export/v1 (schemas classrup.identity.profile/v1 and classrup.identity.block_entry/v1); blocks are included only in the owner's own export; avatar MediaBlobs are included by reference and bytes.
- **import:** Received profiles are re-verified and skipped if invalid; blocks beyond the cap are reported and skipped; own profile replaces the default only when seq is higher; publishState and tombstones are restored.
- **backup:** The vault export is the primary backup (IOX-6); relays hold public profile statements and P0 avatar blobs only (IOX-7) and never blocks.
- **migration rollback:** Additive optional fields only in v1 (under ext for signed statements); rollback is safe because older readers ignore unknown fields.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-056-09.T14 | integration | PS-056-10.R01, PS-056-10.R02, PS-056-10.R03 | export, import in a fresh vault, vault erase, and a statement with an unknown ext field | profile and blocks round-trip; received profiles re-verified; erase removes all; older reader ignores the ext field |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M01, F06.S02.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F10.S02.M03, F15.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-UX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
