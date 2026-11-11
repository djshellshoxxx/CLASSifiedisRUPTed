# PS-014-02 — Validation rules: Proposal party roster

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S01.M02 Proposal party roster](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/trade_proposals/party` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-014-02.R01** Roster creation validates size, uniqueness, reachability, blocks and limits before anything is stored.
- **PS-014-02.R02** Block failures return BLOCKED_PARTY without parameters that identify the pair.
- **PS-014-02.R03** Roster rows must equal the party list of the head revision snapshot whenever a revision is sealed or ingested.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | roster has 2..8 DIDs, exactly 2 for trade_proposal | MUTINY_ROSTER_SIZE |
| V02 | all DIDs are distinct (participant uniqueness) | MUTINY_PARTICIPANT_DUPLICATE |
| V03 | exactly one coordinator and positions are 0..N-1 without gaps | MUTINY_ROSTER_SIZE |
| V04 | no party is in the principal's own block list (F07.S02.M02 filterBlocked over the roster, own list only; other parties' blocks are applied silently in their own vaults, N7) | BLOCKED_PARTY |
| V05 | every party has 1..3 mailbox hints from a verified signed projection | MUTINY_PARTY_UNREACHABLE |
| V06 | the principal's open subjects after joining are ≤ 5 and within the F12.S03.M04 local participation limit | MUTINY_PARTY_LIMIT |
| V07 | roster equals the head revision's party list in DIDs, positions and roles | MUTINY_ROSTER_MISMATCH |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-014-09.T01 | unit | PS-014-01.R01, PS-014-01.R03, PS-014-02.R01 | join valid 2, 3, 4 and 8 party rosters | rows stored with unique positions and one coordinator |
| TEST-PS-014-09.T02 | unit | PS-014-02.R01, PS-014-02.R02 | each rule V01..V07 violated in turn | documented error code and no rows stored |
| TEST-PS-014-09.T03 | contract | PS-014-02.R02, PS-014-07.R01 | roster containing a locally blocked DID | BLOCKED_PARTY with params that do not include any DID |
| TEST-PS-014-09.T09 | integration | PS-014-06.R03, PS-014-01.R02, PS-014-02.R03 | tampered revision with different party order | MUTINY_ROSTER_MISMATCH and consent blocked |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M02, F12.S03.M04, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
