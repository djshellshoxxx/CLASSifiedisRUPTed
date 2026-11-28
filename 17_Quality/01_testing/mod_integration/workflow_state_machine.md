# PS-135-03 — Workflow state machine: Integration testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S01.M03 Integration testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/integration` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

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
| TEST-PS-135-09.T17 | integration | PS-135-03.R02, PS-135-02.R06 | payments_claims - cash claim acknowledged by the payee; crypto claim under the BTC 6-confirmation policy with reorg depth 2 at 3 of 6; a vault with no verifier configured | events follow commerce.payment.claimed, confirming, confirmed, reorged, confirming, finalized; after the reorg the claim returns to pending_confirmation; the deal does not complete at 5 of 6; it completes only when both vaults' verifiers report final and the payee-signed payment_ack with verification.source chain is received; the unverified vault shows claimed (unverified); no step is named verified or paid; platform never holds funds |

## Dependencies

Module depends on: CTR-TST-001, CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-IDM-001, CTR-COM-001, CTR-FED-001, CTR-ID-001, CTR-PRV-001, CTR-CAP-001, CTR-IOX-001, F17.S01.M01, F15.S02.M02, F15.S02.M03, F15.S01.M01, F11.S01.M01, F11.S01.M02, F11.S01.M03, F11.S02.M01, F11.S02.M03, F09.S01.M01, F09.S01.M03, F16.S02.M02, F07.S02.M01, F10.S01.M03, F06.S02.M01. Predecessor: [domain_schema.md](domain_schema.md).
