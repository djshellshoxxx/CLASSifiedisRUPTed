# PS-026-09 — Contract and acceptance tests: Mixed-value compensation

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S04.M01 Mixed-value compensation](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/value_balancing/mixed` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-026-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-026-09.R02** The planner is tested with golden fixtures for 2-, 3-, 4- and 6-party cycles and as a property test that residuals are within tolerance and sums are conserved.
- **PS-026-09.R03** Payment status handling is tested with fake F09 events including crypto without a verifier.

## Specification

See the module test table below (all processes).

**Fixtures:** 3-party values 20000, 14000, 16000 EUR minor (plan above); 2-party 5000 vs 5600; 4-party 20000, 15000, 18000, 17000; 6-party ring; fake F09 claim and acknowledgement events; fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-026-09.T01 | unit | PS-026-01.R01, PS-026-01.R03, PS-026-03.R01 | planner on 3-party fixture | legs p2 to p1 4000 and p2 to p3 2000, all residuals zero |
| TEST-PS-026-09.T02 | property | PS-026-01.R03, PS-026-02.R03 | random value vectors for 2..8 participants | sum of payments conserved, at most N-1 legs, residuals within tolerance, deterministic output |
| TEST-PS-026-09.T03 | unit | PS-026-02.R01, PS-026-02.R02 | each rule V01..V08 violated in turn | documented error code and nothing stored |
| TEST-PS-026-09.T04 | unit | PS-026-01.R02, PS-026-03.R02 | planner with acceptedImbalance covering one gap | that participant omitted and fewer legs produced |
| TEST-PS-026-09.T05 | integration | PS-026-03.R01, PS-026-03.R04 | cycle committed then claim then acknowledged | proposed to due to claimed to settled; settled event emitted; Deal opened |
| TEST-PS-026-09.T06 | integration | PS-026-03.R02, PS-026-03.R03 | cycle cancelled before handover; cycle partially executed | due legs withdrawn in first case, kept in second |
| TEST-PS-026-09.T07 | integration | PS-026-01.R04, PS-026-02.R03 | crypto claim without verifier | stays claimed, never settled; cycle cannot complete; recovery waiver path available |
| TEST-PS-026-09.T08 | contract | PS-026-04.R01, PS-026-04.R02, PS-026-04.R03, PS-026-09.R02 | commands, events and statement | outputs and payloads validate against classrup.mutiny.compensation_leg/v1, F09 claim statement and registry |
| TEST-PS-026-09.T09 | abuse | PS-026-05.R01, PS-026-05.R02, PS-026-05.R03, PS-026-07.R01 | payee tries to claim; non-participant acknowledges; forged claim | rejected; relay cannot alter any state |
| TEST-PS-026-09.T10 | integration | PS-026-06.R01, PS-026-06.R02, PS-026-06.R03 | replay claim; crash mid-transaction; F09 unavailable | one PaymentClaim; no partial state; leg stays due |
| TEST-PS-026-09.T11 | abuse | PS-026-07.R03, PS-026-07.R02 | payer claims falsely, payee disputes | disputed state, dispute outcome required; no custody feature exists in UI or API |
| TEST-PS-026-09.T12 | unit | PS-026-03.R03, PS-026-07.R02 | leg without progress for 14 days with injected clock | expired and not counted as settled |
| TEST-PS-026-09.T13 | load | PS-026-08.R02, PS-026-08.R03 | planner 8 participants and claim on emulated Moto G | within budgets |
| TEST-PS-026-09.T14 | unit | PS-026-08.R01, PS-026-09.R01, PS-026-09.R03 | diagnostics and traceability tool | no amounts or DIDs in diagnostics; every PS-026 requirement maps to a passing test |
| TEST-PS-026-09.T15 | e2e | PS-026-01.R04, PS-026-07.R02 | mobile payer and payee flow | status labels as text; notice that no funds are held; axe zero serious issues |
| TEST-PS-026-09.T16 | integration | PS-026-10.R01, PS-026-10.R02, PS-026-10.R03 | export, import, rollback | legs round-trip with claim status; imported due legs flagged for re-confirmation with F09 |

## Acceptance criteria

- All tests T01–T16 pass in CI.
- No leg is ever settled without payee acknowledgement, chain finality, or a received extra item, and ClassRup never holds funds.
- The planner is deterministic, conserves sums and leaves every participant within tolerance or with an explicit signed acceptance.

## Dependencies

Module depends on: F02.S04.M02, F02.S04.M03, F02.S02.M03, F09.S01.M01, F09.S03.M03, F16.S02.M03, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
