# PS-014-10 — Import, export, backup and rollback: Proposal party roster

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S01.M02 Proposal party roster](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/trade_proposals/party` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-014-10.R01** Export contains rosters of the user's subjects including status and coarse leave reasons.
- **PS-014-10.R02** Import checks each roster against its head revision and marks mismatches as read-only history.
- **PS-014-10.R03** Schema changes follow expand and contract and keep v1 readable for 180 days.

## Specification

- **export:** Section mutiny.parties in classrup-export/v1; one line per ProposalParty (schema classrup.mutiny.proposal_party/v1).
- **import:** Rows import only when the matching revision is imported and the roster equals its party list; otherwise they are kept as read-only history.
- **backup:** The vault export is the primary backup (IOX-6); relays never hold rosters in plaintext (IOX-7).
- **migration rollback:** Additive optional fields only in v1; rollback ignores unknown fields; the leave reason enum only gains values and unknown values read as unavailable.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-014-09.T13 | integration | PS-014-10.R01, PS-014-10.R02, PS-014-10.R03 | export, import, rollback | rosters round-trip; mismatching imports flagged |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M02, F12.S03.M04, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
