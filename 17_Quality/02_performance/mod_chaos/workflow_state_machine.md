# PS-138-03 — Workflow state machine: Chaos testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S02.M02 Chaos testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/chaos` · **Contracts:** [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-138-03.R01** There is no entity lifecycle; a scenario runs phases arrange, inject, observe, recover, assert.
- **PS-138-03.R02** Recovery is time-boxed: invariants must hold within 60 s of fault removal, otherwise the scenario fails.
- **PS-138-03.R03** Scenarios are independent: each starts from a fresh relay and database.
- **PS-138-03.R04** Trust-fault scenarios are mandatory: fork_conflict (freeze and renegotiate, never last-writer-wins), relay_tamper (signature failure leads to quarantine), revocation_lag (statements by a revoked key accepted only until the revocation arrives) and relay_down (local records intact, delivery status unknown or prepared).

## Specification

**Note:** Tooling module: no domain entity has a lifecycle. Runs are stateless processes that exit 0 (pass) or non-zero (fail).

### Timeouts and scheduled transitions

_None._

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-138-09.T04 | chaos | PS-138-03.R01, PS-138-03.R02, PS-138-06.R03 | consumer_crash: crash before and after ack on a cycle execution | no duplicate effect; orphan holds zero; recovery within 60 s |
| TEST-PS-138-09.T05 | chaos | PS-138-03.R03, PS-138-04.R02 | run each scenario twice in sequence | each starts from a fresh relay and database |
| TEST-PS-138-09.T16 | chaos | PS-138-03.R04 | fork_conflict: conflicting signed reservations delivered in both orders | both vaults freeze; no last-writer-wins; renegotiation required |
| TEST-PS-138-09.T17 | chaos | PS-138-03.R04 | relay_tamper and revocation_lag scenarios | tampered statement quarantined with signature_invalid; statement by revoked key refused after revocation arrives |
| TEST-PS-138-09.T18 | chaos | PS-138-03.R04 | relay_down mid-flow | local records intact; status prepared; no claim of delivery |

## Dependencies

Module depends on: CTR-EVT-001, CTR-IDM-001, CTR-ERR-001, CTR-FED-001, CTR-TST-001, CTR-OBS-001, F17.S01.M01, F17.S01.M03, F15.S02.M03. Predecessor: [domain_schema.md](domain_schema.md).
