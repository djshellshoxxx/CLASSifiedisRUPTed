# PS-131-10 — Import, export, backup and rollback: Incident records

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S03.M02 Incident records](SPEC.md) · **Scope:** MVP · **Code:** `apps/relay/src/ops/incident` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-131-10.R01** Operators can export incidents with timelines as JSON lines for auditors, excluding any redacted text.
- **PS-131-10.R02** Import is allowed only for relay migration and re-validates all text for secrets and all references.
- **PS-131-10.R03** Schema changes follow expand/contract and keep v1 readable for 180 days.

## Specification

- **export:** Section security.incidents in the relay operator export: incident rows with timeline, severity history, notification decisions and postmortem links.
- **import:** Incidents import into a fresh relay as closed or triaged history; open automatic incidents are not re-armed; text is re-scanned and flagged entries are rejected.
- **backup:** Covered by relay SQLite backup (CTR-IOX-001 IOX-3); losing a relay loses no user-owned private data (IOX-7).
- **migration rollback:** Additive fields only in v1; rollback is safe because older readers ignore new optional fields and unknown categories display as other.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-131-09.T14 | integration | PS-131-10.R01, PS-131-10.R02, PS-131-10.R03 | export incidents, import to fresh relay, restore backup | records round-trip; imported open incidents become triaged history with a note |

## Dependencies

Module depends on: F16.S01.M01, F16.S02.M02, F16.S03.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
