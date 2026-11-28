# PS-148-10 — Import, export, backup and rollback: Transparency reports

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S02.M02 Transparency reports](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/community/transparency` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-148-10.R01** The operator export contains reports (all versions) and imported snapshots of unpublished periods; counters stay on the relay; a user export contains reports from trusted publishers that the user stored.
- **PS-148-10.R02** Import re-verifies both signatures, operator-list membership, suppression and reviewer separation; failing reports are quarantined.
- **PS-148-10.R03** Schema changes follow expand/contract and keep v1 readable for 180 days.

## Specification

- **export:** Sections governance.transparency_reports and governance.transparency_snapshots in classrup-export/v1, one line per record (schemas classrup.governance.transparency_report/v1 and classrup.governance.transparency_counts/v1); snapshots only in an operator's own export.
- **import:** Signatures, operator list, suppression rules and reviewer separation re-verified; snapshots import only into a vault holding an operator key of that relay; duplicates by contentCid are skipped.
- **backup:** Vault export is the primary backup (IOX-6); counters and checkpoints are relay-local operational data covered by the relay backup (IOX-3, IOX-7), and the relay holds public signed reports.
- **migration rollback:** Additive optional fields only in v1; rollback is by reinstalling the previous release; published reports stay valid because their schema is unchanged and corrections are new versions.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-148-09.T15 | integration | PS-148-10.R01, PS-148-10.R02, PS-148-10.R03 | export operator vault, import to fresh vault, import tampered report and a self-reviewed report | reports and snapshots round-trip; tampered statement quarantined; self-reviewed report quarantined with GOVERNANCE_TRANSPARENCY_SELF_REVIEW; cell between 1 and 9 rejected |

## Dependencies

Module depends on: F18.S02.M01, F16.S02.M03, F11.S01.M01, F15.S02.M01, F15.S04.M03, F07.S02.M01, F12.S01.M01, F12.S01.M03, F12.S02.M01, F12.S02.M02, F10.S01.M02, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
