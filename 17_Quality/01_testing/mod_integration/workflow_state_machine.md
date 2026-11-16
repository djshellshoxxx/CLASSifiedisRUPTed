# PS-135-03 — Workflow state machine: Integration testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S01.M03 Integration testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/integration` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-135-03.R01** There is no entity lifecycle for the module; each flow drives the lifecycles of the entities it exercises (Offer, Proposal, Cycle, Deal, Receipt).
- **PS-135-03.R02** A flow is complete only when its terminal state is reached or its documented timeout fires on the FakeClock.
- **PS-135-03.R03** Every flow ends by asserting outbox drained: zero undelivered events and zero stuck inbox entries.

## Specification

**Note:** Tooling module: no domain entity has a lifecycle. Runs are stateless processes that exit 0 (pass) or non-zero (fail).

### Timeouts and scheduled transitions

_None._

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-135-09.T01 | integration | PS-135-01.R01, PS-135-03.R03 | boot harness and tear down 20 times | each database is isolated and removed; outbox drained assertion runs |
| TEST-PS-135-09.T06 | integration | PS-135-03.R01, PS-135-03.R02, PS-135-04.R01 | run barter_two, cycle_three, cycle_four, cycle_n, barter_mixed to completion and to expiry | terminal states reached or expired exactly once |
| TEST-PS-135-09.T17 | integration | PS-135-03.R03 | payments_claims: cash claim then crypto claim with reorg depth 2 via FakeChainVerifierPort | crypto claim returns to pending after reorg and completes after reconfirmation; platform never holds funds |

## Dependencies

Module depends on: CTR-TST-001, CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-IDM-001, CTR-COM-001, CTR-FED-001, CTR-ID-001, F17.S01.M01, F15.S02.M02, F15.S02.M03. Predecessor: [domain_schema.md](domain_schema.md).
