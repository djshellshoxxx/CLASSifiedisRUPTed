# PS-012-09 — Contract and acceptance tests: Barter counteroffers

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S01.M04 Barter counteroffers](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/trade_proposals/counteroffer` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-012-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-012-09.R02** Contract tests verify the statement envelope against CTR-FED-001 and hash equality with an independent JCS implementation.
- **PS-012-09.R03** Fork, turn-taking and 20-revision cap are covered by deterministic tests with an injected clock.

## Specification

See the module test table below (all processes).

**Fixtures:** Alice, Bob, Carol DIDs with device keys; trade_proposal P1 (Alice, Bob); cycle C1 (Alice coordinator, Bob, Carol); legs L1..L3; fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-012-09.T01 | unit | PS-012-01.R01, PS-012-01.R02, PS-012-02.R02 | create revision 1 then verify stored fields | snapshot, contentHash and sig immutable; hash equals independent JCS cid |
| TEST-PS-012-09.T02 | unit | PS-012-02.R01, PS-012-02.R03 | each rule V01..V11 violated in turn | documented code returned and nothing stored |
| TEST-PS-012-09.T03 | property | PS-012-01.R03, PS-012-03.R01 | random sequences of create and ingest | revision numbers contiguous, chain prev matches, never above 20 |
| TEST-PS-012-09.T04 | integration | PS-012-01.R03, PS-012-03.R02, PS-012-09.R03 | Alice and Bob both counter as revision 3 offline, then sync | both quarantined as fork, subject frozen, mutiny.revision.forked emitted once |
| TEST-PS-012-09.T05 | integration | PS-012-03.R03, PS-012-04.R03 | revise after accepted and after cancelled | CONFLICT_STATE; all earlier consents voided on an accepted revision of a different open subject |
| TEST-PS-012-09.T06 | contract | PS-012-04.R01, PS-012-04.R02, PS-012-09.R02 | create and ingest | statement validates against classrup.mutiny.proposal_revision/v1 and events against registry |
| TEST-PS-012-09.T07 | abuse | PS-012-05.R01, PS-012-05.R02, PS-012-05.R03, PS-012-07.R03 | forged signature, non-party author, wrong-turn author, other principal reads | quarantine or FORBIDDEN or NOT_FOUND |
| TEST-PS-012-09.T08 | integration | PS-012-06.R01, PS-012-06.R02 | replay create with same key, deliver same envelope twice, crash mid-transaction | one revision, duplicate skipped, no partial record |
| TEST-PS-012-09.T09 | integration | PS-012-06.R03, PS-012-01.R04 | offline create then reconnect | syncState prepared then transport_acknowledged; plaintext absent from relay fixture |
| TEST-PS-012-09.T10 | abuse | PS-012-07.R01, PS-012-07.R02, PS-012-07.R03 | tampered snapshot with unchanged hash; replayed older revision; swapped participant in cycle revision | MUTINY_REVISION_HASH_MISMATCH, duplicate or fork, MUTINY_REVISION_MATERIAL_FORBIDDEN |
| TEST-PS-012-09.T11 | abuse | PS-012-07.R03 | createdAtClaim 6 minutes in the future and backdated | first quarantined, second accepted but not used for ordering or deadline |
| TEST-PS-012-09.T12 | load | PS-012-08.R02, PS-012-08.R03 | 8-leg revision create and ingest on emulated Moto G | p95 within budgets, snapshot under 64 KiB |
| TEST-PS-012-09.T13 | unit | PS-012-08.R01 | diagnostics sink | codes recorded, no DIDs or values, nothing transmitted |
| TEST-PS-012-09.T14 | unit | PS-012-09.R01 | traceability tool run | every PS-012 requirement maps to a passing test |
| TEST-PS-012-09.T15 | unit | PS-012-04.R03, PS-012-01.R01 | diff between revision 1 and 2 of 3-party cycle | exactly the compensation line added; all earlier consents void |
| TEST-PS-012-09.T16 | integration | PS-012-10.R01, PS-012-10.R02, PS-012-10.R03 | export, import to fresh vault, rollback | revisions round-trip with signatures valid; conflicting IDs rejected; forked flag preserved |
| TEST-PS-012-09.T17 | a11y | PS-012-01.R04 | diff and history screens | axe zero serious issues; text labels for added, removed, changed |

## Acceptance criteria

- All tests T01–T17 pass in CI.
- A consent can only ever bind a contentHash that equals the hash of the displayed snapshot.
- No revision can add, remove or replace a participant of an existing cycle, and forks always freeze the subject.

## Dependencies

Module depends on: F02.S01.M02, F02.S01.M03, F02.S02.M05, F02.S04.M01, F02.S04.M02, F07.S01.M01, F16.S02.M03, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
