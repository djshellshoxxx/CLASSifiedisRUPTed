# PS-140-03 — Workflow state machine: Offline testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S02.M03 Offline testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/offline` · **Contracts:** [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-140-03.R01** There is no entity lifecycle for the module; tests walk the sync outbox states local committed, prepared, transport_acknowledged, peer_accepted, quarantined and stale as defined by F15.S01.M01 and CTR-IDM-001 IDM-7.
- **PS-140-03.R02** Transitions are asserted in both unit tests with the fake network and a browser run with Playwright network emulation.
- **PS-140-03.R03** A test ends only after the outbox is empty or in an explicit expected terminal state.

## Specification

**Note:** Tooling module: no domain entity has a lifecycle. Runs are stateless processes that exit 0 (pass) or non-zero (fail).

### Timeouts and scheduled transitions

_None._

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-140-09.T03 | integration | PS-140-02.R02, PS-140-03.R01 | two devices edit the same entity offline then reconnect | second gets CONFLICT_REVISION and the three-action prompt appears; no overwrite |
| TEST-PS-140-09.T05 | integration | PS-140-03.R02, PS-140-03.R03 | walk local committed, prepared, transport_acknowledged, peer_accepted, quarantined and stale states with both harnesses | every state reached and outbox ends empty or in expected terminal state |
| TEST-PS-140-09.T15 | e2e | PS-140-03.R01 | reload the page during replay | outbox resumes, no lost and no duplicate commands |

## Dependencies

Module depends on: CTR-IDM-001, CTR-ERR-001, CTR-UX-001, CTR-TST-001, CTR-OBS-001, F17.S01.M01, F17.S01.M04, F15.S01.M01, F15.S01.M02. Predecessor: [domain_schema.md](domain_schema.md).
