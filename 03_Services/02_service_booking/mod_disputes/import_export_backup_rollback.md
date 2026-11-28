# PS-030-10 — Import, export, backup and rollback: Service disputes

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S02.M03 Service disputes](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_booking/disputes` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-030-10.R01** The vault export contains links, notices and evidence packs so a dispute can be reconstructed without the relay.
- **PS-030-10.R02** Import verifies notice signatures and cids; unverifiable notices are kept as read-only history.
- **PS-030-10.R03** Schema changes follow expand and contract and keep v1 readable for 180 days.

## Specification

- **export:** ExportSectionPort section services.disputes in classrup-export/v1; one line per ServiceDisputeLink with the signed notice and withdrawal envelopes.
- **import:** Resolved, withdrawn and failed links import as history; pending_link imports as pending_link and resumes case creation with the same link id; linked imports as linked and re-links when the case is imported.
- **backup:** The vault export is the primary backup (IOX-6); relays hold only ciphertext (IOX-7).
- **migration rollback:** Additive optional fields only in v1; rollback is safe because notices are immutable and older readers ignore unknown fields.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-030-09.T14 | integration | PS-030-10.R01, PS-030-10.R02, PS-030-10.R03 | export, import into fresh vault, restore | links and notices round-trip; in-flight pending_link re-enters retry with the same link id |

## Dependencies

Module depends on: F03.S02.M01, F03.S02.M02, F09.S02.M02, F09.S01.M01, F08.S01.M01, F08.S01.M03, F07.S01.M01, F07.S02.M02, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
