# PS-135-02 — Validation rules: Integration testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S01.M03 Integration testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/integration` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-135-02.R01** Each flow suite must assert the final state, the ordered list of emitted event types and that no unexpected event types appear.
- **PS-135-02.R02** The harness rejects a flow that makes a real network call, writes outside the temp directory or uses a real clock with QUALITY_IT_ISOLATION.
- **PS-135-02.R03** Contract validation fails with a typed code when a command, event or error does not match its registered schema or CTR-ERR-001 shape.
- **PS-135-02.R04** Fault cases are mandatory suites: relay_down_midflow, forked_vault, revocation_lag and relay_tamper; each asserts the documented outcome: local records intact, fork frozen and not last-writer-wins, tampered statement quarantined with reason signature_invalid, and sync state never above the state reached.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | Each of the 12 reference flows exists, runs and asserts final state, events and drained outbox | QUALITY_IT_FLOW_MISSING |
| V02 | Flow makes no outbound network call, uses only the injected clock and writes only to its temp dir | QUALITY_IT_ISOLATION |
| V03 | Every emitted event type is registered in the catalog and its payload validates against its schema | QUALITY_IT_EVENT_UNREGISTERED |
| V04 | Every command output and error response validates against the registry and CTR-ERR-001 | QUALITY_IT_CONTRACT_MISMATCH |
| V05 | Outbox and inbox are empty at the end of each flow | QUALITY_IT_OUTBOX_NOT_DRAINED |
| V06 | Each flow runs in relay mode and, unless declared relay-only, in direct mode with identical final states per vault | QUALITY_IT_MODE_DIVERGENCE |
| V07 | Fault suites relay_down_midflow, forked_vault, revocation_lag and relay_tamper exist and pass | QUALITY_IT_FAULT_SUITE_MISSING |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-135-09.T03 | integration | PS-135-02.R01, PS-135-04.R02 | list flows from the harness | exactly the 12 documented flow names exist and each asserts state, ordered events and no unexpected events |
| TEST-PS-135-09.T04 | integration | PS-135-02.R02, PS-135-07.R03 | flow attempts fetch to a public URL and Date.now | QUALITY_IT_ISOLATION raised, exit 3 |
| TEST-PS-135-09.T05 | contract | PS-135-02.R03, PS-135-09.R03 | validate every registered command, event and error | all validate; a mutated schema produces QUALITY_IT_CONTRACT_MISMATCH |
| TEST-PS-135-09.T18 | integration | PS-135-02.R01 | fraud_moderation and messages_private flows | moderation action recorded with audit entry; message payloads absent from public views |
| TEST-PS-135-09.T19 | integration | PS-135-02.R04, PS-135-06.R04 | run all flows with --mode relay and --mode direct | same final vault state in both modes except declared relay-only flows; QUALITY_IT_MODE_DIVERGENCE otherwise |
| TEST-PS-135-09.T20 | integration | PS-135-02.R04 | relay_down_midflow: stop relay between prepared and transport_acknowledged | local records intact; status prepared; completes via direct exchange |
| TEST-PS-135-09.T21 | integration | PS-135-02.R04 | forked_vault: two signed conflicting reservations delivered in both orders | fork detected and coordination frozen in both vaults; no last-writer-wins |
| TEST-PS-135-09.T22 | integration | PS-135-02.R04 | revocation_lag: statement signed by a revoked key before and after the revocation arrives | accepted before, quarantined after; lag window reported |
| TEST-PS-135-09.T23 | abuse | PS-135-02.R04 | relay_tamper: relay flips one byte of an envelope | signature_invalid, statement quarantined with provenance, no state change |

## Dependencies

Module depends on: CTR-TST-001, CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-IDM-001, CTR-COM-001, CTR-FED-001, CTR-ID-001, F17.S01.M01, F15.S02.M02, F15.S02.M03. Predecessor: [domain_schema.md](domain_schema.md).
