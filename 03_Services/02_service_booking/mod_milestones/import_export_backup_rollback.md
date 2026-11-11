# PS-031-10 — Import, export, backup and rollback: Service milestones

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S02.M02 Service milestones](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_booking/milestones` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-031-10.R01** The vault export contains milestones, submissions and the signed statements with their cids so approval evidence survives vault loss.
- **PS-031-10.R02** Import verifies each signature and cid before restoring and keeps unverifiable records as read-only history.
- **PS-031-10.R03** Schema changes follow expand and contract and keep v1 readable for 180 days.

## Specification

- **export:** ExportSectionPort section services.milestones in classrup-export/v1 with one line per Milestone and the original statement envelopes, including completion statements.
- **import:** Verified milestones import as is; milestones in disputed state import as disputed and are re-linked when the dispute case is imported; deliverable attachments import by reference and show missing when absent; dealIds are re-derived from the contextRef.
- **backup:** The vault export is the primary backup (IOX-6); relays hold only ciphertext (IOX-7).
- **migration rollback:** Additive optional fields only in v1; rollback is safe because statements are immutable and older readers ignore unknown fields.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-031-09.T13 | integration | PS-031-10.R01, PS-031-10.R02, PS-031-10.R03 | export, import into fresh vault, restore | milestones and statements round-trip; unverifiable statements kept as read-only history |

## Dependencies

Module depends on: F03.S02.M01, F09.S01.M01, F09.S01.M03, F08.S01.M03, F07.S01.M01, F07.S02.M02, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
