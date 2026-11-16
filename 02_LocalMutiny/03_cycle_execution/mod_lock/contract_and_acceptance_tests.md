# PS-023-09 — Contract and acceptance tests: Cycle locks

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S03.M02 Cycle locks](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_execution/lock` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-023-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-023-09.R02** Concurrency inside a vault is tested deterministically with two simulated transactions, and all-or-nothing is tested by failing the last item.
- **PS-023-09.R03** Cross-vault tests use in-memory vaults and a fake relay with drops, delays and duplicates.

## Specification

See the module test table below (all processes).

**Fixtures:** Vault A with items I1 (qty 1), I2 (qty 3), I3 (qty 1, held elsewhere); vaults B and C; fixed clock 2026-11-04T10:00:00Z; 4-party and 6-party subject fixtures.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-023-09.T01 | unit | PS-023-01.R01, PS-023-01.R03, PS-023-02.R01 | reserve I1 and I2 | both holds active, statement signed, expiry equals deadline plus execution window |
| TEST-PS-023-09.T02 | unit | PS-023-02.R01, PS-023-02.R03 | each rule V01..V09 violated in turn | documented error code and no hold left behind |
| TEST-PS-023-09.T03 | property | PS-023-03.R01, PS-023-06.R02 | random reserve, release, supersede, expire sequences | status only moves forward; active own locks always have active holds; sum of quantities within availability |
| TEST-PS-023-09.T04 | integration | PS-023-06.R02, PS-023-01.R02, PS-023-09.R03 | two concurrent reserves of the same quantity-1 item for different subjects | exactly one succeeds, the other MUTINY_LOCK_CONFLICT without naming the first |
| TEST-PS-023-09.T05 | integration | PS-023-02.R01, PS-023-06.R03 | reserve [I1, I2, I3] where I3 is unavailable | MUTINY_LOCK_UNAVAILABLE and I1, I2 holds absent |
| TEST-PS-023-09.T06 | integration | PS-023-03.R03, PS-023-06.R03 | vault closed beyond expiry then opened | lock expired before any command runs, holds released, unlocked emitted |
| TEST-PS-023-09.T07 | integration | PS-023-03.R02, PS-023-04.R03 | leg.received for all items, then for part of the items | lock converted only when all items received; holds converted in inventory |
| TEST-PS-023-09.T08 | contract | PS-023-04.R01, PS-023-04.R02, PS-023-09.R02 | commands and events | statements and event payloads validate against classrup.mutiny.cycle_lock/v1 and registry |
| TEST-PS-023-09.T09 | integration | PS-023-02.R02, PS-023-07.R01 | peer statements: valid, bad signature, wrong signer, expiry too short, duplicated | only valid one stored; others quarantined; duplicate skipped |
| TEST-PS-023-09.T10 | integration | PS-023-07.R03, PS-023-02.R03 | peer double promise for one quantity-1 item in two subjects | both conflicted, conflict_detected emitted, both subjects frozen |
| TEST-PS-023-09.T11 | abuse | PS-023-05.R01, PS-023-05.R02, PS-023-05.R03, PS-023-07.R03 | other principal reserves; reservation for another person's item; relay inspects mailbox | FORBIDDEN or quarantine; relay sees ciphertext only |
| TEST-PS-023-09.T12 | abuse | PS-023-07.R02, PS-023-07.R03 | 6th active set; replay of old release against newer reservation | MUTINY_LOCK_LIMIT; release ignored |
| TEST-PS-023-09.T13 | chaos | PS-023-06.R01, PS-023-06.R03, PS-023-06.R04 | crash between hold and statement signing | transaction aborted, no orphan hold or statement on restart |
| TEST-PS-023-09.T14 | load | PS-023-08.R02, PS-023-08.R03 | reserve 5 items; sweep 200 locks on emulated Moto G | within budgets |
| TEST-PS-023-09.T15 | unit | PS-023-08.R01, PS-023-09.R01 | diagnostics and traceability tool | no identifiers in diagnostics; every PS-023 requirement maps to a passing test |
| TEST-PS-023-09.T16 | integration | PS-023-04.R03, PS-023-01.R01 | 2-, 3-, 4- and 6-party fixtures | all-givers-reserved flag true only when every giver has a valid unexpired statement |
| TEST-PS-023-09.T17 | integration | PS-023-10.R01, PS-023-10.R02, PS-023-10.R03 | export, import into fresh vault, rollback | active locks import as expired-unverified to avoid stale promises; history round-trips |

## Acceptance criteria

- All tests T01–T17 pass in CI.
- A reservation never leaves a partial item set, and no module claims that a peer's reservation prevents that peer from double-promising.
- Expiry is always evaluated on the local clock and terminal lock states never reopen.

## Dependencies

Module depends on: F01.S03.M01, F01.S01.M01, F07.S01.M01, F16.S02.M03, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
