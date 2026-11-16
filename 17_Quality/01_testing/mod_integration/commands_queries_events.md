# PS-135-04 — Commands, queries and events: Integration testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S01.M03 Integration testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/integration` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-135-04.R01** The module exposes pnpm test:integration, pnpm test:integration --flow <name> and pnpm test:contract.
- **PS-135-04.R02** The 12 flows are named listing_paid, sale_local, barter_two, cycle_three, cycle_four, cycle_n, barter_mixed, dispute_cancel, fraud_moderation, messages_private, payments_claims, federation_io, each runnable with --mode relay or --mode direct.
- **PS-135-04.R03** Exit codes: 0 pass, 1 assertion failure, 2 contract mismatch, 3 isolation violation.

## Specification

### Commands

_None._

### Queries

_None._

### Events produced

_None._

### Events consumed

_None._

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| QUALITY_IT_FLOW_MISSING | 422 | no | a reference flow has no passing suite (exit 1) |
| QUALITY_IT_ISOLATION | 422 | no | flow performed network, real clock or out-of-sandbox write (exit 3) |
| QUALITY_IT_EVENT_UNREGISTERED | 422 | no | emitted event type is not registered (exit 2) |
| QUALITY_IT_CONTRACT_MISMATCH | 422 | no | payload or error does not match its registered schema (exit 2) |
| QUALITY_IT_OUTBOX_NOT_DRAINED | 422 | no | undelivered outbox events at flow end (exit 1) |
| QUALITY_IT_MODE_DIVERGENCE | 422 | no | relay and direct runs ended in different vault states (exit 1) |
| QUALITY_IT_FAULT_SUITE_MISSING | 422 | no | a mandatory fault suite is missing or failing (exit 1) |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Tooling module: exposes no relay commands or queries and emits no domain events; the interface is the pnpm scripts and CLI exit codes listed in the example.

### Example

```
$ pnpm test:integration --flow payments_claims
  TEST-PS-135-09.T08 crypto claim reorg depth 2 returns to pending   OK  (1.4 s)
  steps: commerce.claim.submitted -> verified -> reorged -> pending
  outbox drained: yes
$ pnpm test:contract
  412 commands/events/errors validated against registry  OK
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-135-09.T03 | integration | PS-135-02.R01, PS-135-04.R02 | list flows from the harness | exactly the 12 documented flow names exist and each asserts state, ordered events and no unexpected events |
| TEST-PS-135-09.T06 | integration | PS-135-03.R01, PS-135-03.R02, PS-135-04.R01 | run barter_two, cycle_three, cycle_four, cycle_n, barter_mixed to completion and to expiry | terminal states reached or expired exactly once |
| TEST-PS-135-09.T07 | integration | PS-135-04.R03, PS-135-06.R03 | run with scripted consumer crash and redelivery | single net effect and outbox drained |

## Dependencies

Module depends on: CTR-TST-001, CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-IDM-001, CTR-COM-001, CTR-FED-001, CTR-ID-001, F17.S01.M01, F15.S02.M02, F15.S02.M03. Predecessor: [domain_schema.md](domain_schema.md).
