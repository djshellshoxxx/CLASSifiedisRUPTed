# PS-014-09 — Contract and acceptance tests: Proposal party roster

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S01.M02 Proposal party roster](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/trade_proposals/party` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-014-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-014-09.R02** Contract tests verify that block failures leak no identifying parameter.
- **PS-014-09.R03** Fixtures include 2-, 3-, 4- and 8-party rosters.

## Specification

See the module test table below (all processes).

**Fixtures:** DIDs Alice, Bob, Carol, Dan, Erin..Hal (8); local block Alice->Mallory; mailbox hints for all but Zed; fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-014-09.T01 | unit | PS-014-01.R01, PS-014-01.R03, PS-014-02.R01 | join valid 2, 3, 4 and 8 party rosters | rows stored with unique positions and one coordinator |
| TEST-PS-014-09.T02 | unit | PS-014-02.R01, PS-014-02.R02 | each rule V01..V07 violated in turn | documented error code and no rows stored |
| TEST-PS-014-09.T03 | contract | PS-014-02.R02, PS-014-07.R01 | roster containing a locally blocked DID | BLOCKED_PARTY with params that do not include any DID |
| TEST-PS-014-09.T04 | property | PS-014-03.R01, PS-014-03.R02 | random leave and removal sequences | left or removed never reactivates, positions never change, no substitution |
| TEST-PS-014-09.T05 | integration | PS-014-03.R03, PS-014-04.R03 | consume block.added, cycle.declined, participant_dropped, proposal.revised | rows marked with coarse reasons; roster mismatch detected on altered revision |
| TEST-PS-014-09.T06 | contract | PS-014-04.R01, PS-014-04.R02, PS-014-09.R02 | join and leave | events validate against registry and no statement is produced |
| TEST-PS-014-09.T07 | abuse | PS-014-05.R01, PS-014-05.R02, PS-014-05.R03 | other principal calls join; leave notice signed by wrong key | FORBIDDEN and notice ignored; roster unreadable by others |
| TEST-PS-014-09.T08 | integration | PS-014-06.R01, PS-014-06.R02 | replay join; crash mid-transaction | one roster; no partial rows |
| TEST-PS-014-09.T09 | integration | PS-014-06.R03, PS-014-01.R02, PS-014-02.R03 | tampered revision with different party order | MUTINY_ROSTER_MISMATCH and consent blocked |
| TEST-PS-014-09.T10 | abuse | PS-014-07.R02, PS-014-07.R03 | 11 proposals from one DID in 24 h; 6th open subject by one proposer | quarantine and MUTINY_PARTY_LIMIT |
| TEST-PS-014-09.T11 | load | PS-014-08.R02 | join 8 parties on emulated Moto G | p95 ≤ 30 ms |
| TEST-PS-014-09.T12 | unit | PS-014-08.R01, PS-014-08.R03, PS-014-09.R01, PS-014-09.R03 | diagnostics and traceability tool | no DIDs in diagnostics; every PS-014 requirement maps to a passing test |
| TEST-PS-014-09.T13 | integration | PS-014-10.R01, PS-014-10.R02, PS-014-10.R03 | export, import, rollback | rosters round-trip; mismatching imports flagged |
| TEST-PS-014-09.T14 | a11y | PS-014-01.R01 | roster and ring screens | axe zero serious issues; ring text alternative present |

## Acceptance criteria

- All tests T01–T14 pass in CI.
- No error, event or log reveals who blocked whom.
- A left party is never replaced and ring positions never change after a revision is sealed.

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M02, F12.S03.M04, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
