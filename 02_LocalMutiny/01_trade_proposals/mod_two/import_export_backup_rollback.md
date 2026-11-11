# PS-015-10 — Import, export, backup and rollback: Two-party barter

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S01.M01 Two-party barter](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/trade_proposals/two` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-015-10.R01** Export contains the user's proposals with all referenced signed statements, because they are evidence of what was signed.
- **PS-015-10.R02** Import verifies every statement and hash, skips identical records, rejects conflicting IDs and imports non-terminal proposals as frozen so no stale consent is acted upon.
- **PS-015-10.R03** Schema changes follow expand and contract and keep v1 readable for 180 days.

## Specification

- **export:** Section mutiny.proposals in classrup-export/v1; one line per TradeProposal (schema classrup.mutiny.trade_proposal/v1) followed by its statements with provenance.
- **import:** Terminal proposals import as read-only history; open and draft proposals import as frozen with reason import, the user may start a new proposal that cites them.
- **backup:** The vault export is the primary backup (IOX-6); relays hold only ciphertext in mailboxes and can be lost without losing user data (IOX-7).
- **migration rollback:** Additive optional fields only in v1; rollback to the previous release ignores unknown fields; the state enum only grows and unknown states read as frozen.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-015-09.T17 | integration | PS-015-10.R01, PS-015-10.R02, PS-015-10.R03 | export, import into fresh vault, rollback | proposals round-trip with statements verified; open proposals import frozen |

## Dependencies

Module depends on: F02.S01.M02, F02.S01.M03, F02.S01.M04, F02.S02.M05, F02.S03.M02, F01.S03.M01, F07.S01.M01, F07.S02.M02, F08.S02.M02, F12.S03.M04, F16.S02.M03, F15.S01.M01, F11.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
