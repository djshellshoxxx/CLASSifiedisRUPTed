# PS-135-04 — Commands, queries and events: Integration testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S01.M03 Integration testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/integration` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-135-04.R01** The module exposes pnpm test:integration, pnpm test:integration --flow <name> and pnpm test:contract.
- **PS-135-04.R02** The 12 flows are named listing_paid, sale_local, barter_two, cycle_three, cycle_four, cycle_n, barter_mixed, dispute_cancel, fraud_moderation, messages_private, payments_claims, federation_io (two steps, federation and portability), each runnable with --mode relay or --mode direct.
- **PS-135-04.R03** Exit codes: 0 pass, 1 assertion failure, 2 contract mismatch, 3 isolation violation.
- **PS-135-04.R04** Flow mode table (FLOW id, suite, mode, reason): FLOW-01 listing_paid relay-only (promotion fee and the Promoted label are relay R hosting policy); FLOW-02 sale_local both; FLOW-03 barter_two both; FLOW-04 cycle_three both; FLOW-05 cycle_four both; FLOW-06 cycle_n both (direct is O(N^2) envelopes, relay is O(N) mailbox fan-out); FLOW-07 barter_mixed both; FLOW-08 dispute_cancel both (the mediator outcome is a signed statement that travels either way); FLOW-09 fraud_moderation relay-only (report review and index removal are relay R hosting policy); FLOW-10 messages_private both (relay mailbox, or a sealed envelope file in direct mode); FLOW-11 payments_claims both (chain verifiers are per-vault ports); FLOW-12 federation_io federation step relay-only (relay-to-relay federation by definition) and portability step both (vault A to vault A' with no relay contacted in either mode).

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
| QUALITY_IT_FAULT_SUITE_MISSING | 422 | no | a mandatory trust-fault suite is missing or failing (exit 1) |
| QUALITY_IT_STATEMENT_UNREGISTERED | 422 | no | a statement type sent in a flow is not registered with its signer role, or its payload, cid or ext violates the contract (exit 2) |
| QUALITY_IT_OVERCLAIM | 422 | no | a flow report or status uses verified or paid as a state or claims more than the reached sync state (exit 1) |
| QUALITY_IT_RELAY_PRIVATE_DATA | 422 | no | a relay received an export bundle or P2+ plaintext during a flow (exit 1) |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Tooling module: exposes no relay commands or queries and emits no domain events; the interface is the pnpm scripts and CLI exit codes listed in the example.

### Example

```
$ pnpm test:integration --flow payments_claims
  TEST-PS-135-09.T17 crypto claim reorg depth 2 returns to pending_confirmation   OK  (1.4 s)
  steps: commerce.payment.claimed -> commerce.payment.confirming -> commerce.payment.confirmed -> commerce.payment.reorged -> commerce.payment.confirming (pending) -> commerce.payment.finalized
  deal: completed only after final per both verifiers (6/6) and payee-signed payment_ack (verification.source chain)
  outbox drained: yes
$ pnpm test:integration --flow federation_io --mode direct
  federation step: relay-only (skipped in direct mode per flow mode table)
  portability step: vault A -> vault A' dry-run 214 records, 0 conflicts; relay received 0 export bundles  OK
$ pnpm test:contract
  412 commands/events/errors and 96 statement registry entries (plus 96 wrong-role negatives) validated  OK
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-135-09.T03 | integration | PS-135-02.R01, PS-135-04.R02, PS-135-04.R04 | list flows from the harness | exactly the 12 documented flow names exist, each mapped to its FLOW-nn ID and mode exactly as the flow mode table, and each asserts state, ordered events and no unexpected events |
| TEST-PS-135-09.T06 | integration | PS-135-03.R01, PS-135-03.R02, PS-135-04.R01 | run barter_two, cycle_three, cycle_four, cycle_n, barter_mixed to completion and to expiry | terminal states reached or expired exactly once |
| TEST-PS-135-09.T07 | integration | PS-135-04.R03, PS-135-06.R03 | run with scripted consumer crash and redelivery | single net effect and outbox drained |
| TEST-PS-135-09.T14 | integration | PS-135-09.R01, PS-135-09.R02, PS-135-04.R04 | assert the flow list and the flow mode table equal the reference in this spec and every spec requirement maps to a test | no missing flow, no mode mismatch and no uncovered requirement |
| TEST-PS-135-09.T19 | integration | PS-135-04.R04 | run all flows with --mode relay and --mode direct | same final vault state in both modes except the flows and steps the flow mode table marks relay-only; QUALITY_IT_MODE_DIVERGENCE otherwise |

## Dependencies

Module depends on: CTR-TST-001, CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-IDM-001, CTR-COM-001, CTR-FED-001, CTR-ID-001, CTR-PRV-001, CTR-CAP-001, CTR-IOX-001, F17.S01.M01, F15.S02.M02, F15.S02.M03, F15.S01.M01, F11.S01.M01, F11.S01.M02, F11.S01.M03, F11.S02.M01, F11.S02.M03, F09.S01.M01, F09.S01.M03, F16.S02.M02, F07.S02.M01, F10.S01.M03, F06.S02.M01. Predecessor: [domain_schema.md](domain_schema.md).
