# PS-066-10 — Import, export, backup and rollback: Safe meetup guidance

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S03.M01 Safe meetup guidance](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/meetups/safe` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-066-10.R01** A user's vault export contains the cached spot statements they use, their checklist progress and their local trust settings, and a curator's export contains their drafts and signed spots.
- **PS-066-10.R02** Import re-verifies signatures and curator-list membership; spots from curators not in the hosting relay's list are dropped and counted.
- **PS-066-10.R03** Schema changes follow expand and contract; new venue kinds are additive enum values.

## Specification

- **export:** Section comms.safe_spots in classrup-export/v1, registered through ExportSectionPort; one line per SafeSpot statement (schema classrup.comms.safe_spot/v1) plus checklist progress and trust settings.
- **import:** Signatures, assertPublicCell and curator-list membership are re-verified; existing IDs and older versions are skipped; retired tombstones are kept; pinned curators are restored.
- **backup:** Vault export is the backup (IOX-6); the relay index and curator list are covered by relay SQLite backup (IOX-3, IOX-7) and can be rebuilt from curator exports.
- **migration rollback:** Additive fields only in v1; older readers show unknown kinds as other public place; rollback is safe because statements are immutable and versioned.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-066-09.T12 | integration | PS-066-10.R01, PS-066-10.R02, PS-066-10.R03 | export, import into fresh vault, restore relay from backup | spots and trust settings round trip; imported spots are re-verified against the curator list |

## Dependencies

Module depends on: F06.S02.M01, F16.S01.M01, F16.S02.M03, F11.S01.M01, F11.S01.M03, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
