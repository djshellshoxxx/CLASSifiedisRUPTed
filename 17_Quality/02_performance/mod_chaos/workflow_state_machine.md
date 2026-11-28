# PS-138-03 — Workflow state machine: Chaos testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S02.M02 Chaos testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/chaos` · **Contracts:** [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-138-03.R01** There is no entity lifecycle; a scenario runs phases arrange, inject, observe, recover, assert.
- **PS-138-03.R02** Recovery is time-boxed per scenario on the FakeClock (06.R04): 60 s for local faults (db_busy, idb_abort, consumer_crash, duplicate_delivery, combined_busy_crash); for peer_outage the next scheduled F11.S02.M01 round plus one IDM-4 cycle (about 16 min of fake time) or 60 s after federation.peer.reinstated; otherwise the scenario fails.
- **PS-138-03.R03** Scenarios are independent: each starts from a fresh relay and database.
- **PS-138-03.R04** Trust-fault scenarios are mandatory reruns of the F17.S01.M03 suites with the same names and that module's oracle, which owns the expected outcomes: relay_down, fork_conflict, revocation_lag, relay_tamper, signer_role_mismatch, relay_replay and relay_withhold_equivocate, each with 3 seeds in the PR profile and 30 seeds nightly of randomised fault timing.

## Specification

**Note:** Tooling module: no domain entity has a lifecycle. Runs are stateless processes that exit 0 (pass) or non-zero (fail).

### Timeouts and scheduled transitions

_None._

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-138-09.T04 | chaos | PS-138-03.R01, PS-138-03.R02, PS-138-06.R03 | consumer_crash - crash before and after ack on a cycle execution | no duplicate effect; no hold past expiresAt in any participant vault reservation store; no stuck vault saga; recovery within 60 s |
| TEST-PS-138-09.T05 | chaos | PS-138-03.R03, PS-138-04.R02 | run each scenario twice in sequence | each starts from a fresh relay and database |
| TEST-PS-138-09.T16 | chaos | PS-138-03.R04 | fork_conflict: conflicting signed reservations delivered in both orders | both vaults freeze; no last-writer-wins; renegotiation required |
| TEST-PS-138-09.T17 | chaos | PS-138-03.R04 | reruns of relay_tamper and revocation_lag with random timing - (a) received before the revocation arrives and before revocationEffectiveFrom; (b) received after it arrives with a backdated createdAt; (c) received inside [effectiveFrom, arrival]; (d) effectiveFrom 31 days back | tampered statement rejected with FED_SIGNATURE_INVALID and quarantined; (a) valid; (b) refused with FEDERATION_SIGNER_ROLE_INVALID and listed in quarantine; (c) re-marked signed during claimed compromise with the dependent coordination frozen; (d) VALIDATION_FAILED; lag reported as arrival minus effectiveFrom, at most 30 days; same verdicts as the F17.S01.M03 oracle |
| TEST-PS-138-09.T18 | chaos | PS-138-03.R04 | relay_down mid-flow rerun with random timing | local records intact; OutboxEntry prepared; no claim of delivery; same verdict as the F17.S01.M03 oracle |
| TEST-PS-138-09.T21 | chaos | PS-138-03.R04 | reruns of signer_role_mismatch, relay_replay and relay_withhold_equivocate with 3 seeds each | each passes the F17.S01.M03 oracle; a missing rerun fails with QUALITY_CHAOS_TRUST_SCENARIO_MISSING |

## Dependencies

Module depends on: CTR-EVT-001, CTR-IDM-001, CTR-ERR-001, CTR-FED-001, CTR-TST-001, CTR-OBS-001, F17.S01.M01, F17.S01.M03, F15.S02.M03, F15.S01.M01, F11.S02.M01, F11.S01.M02, F01.S03.M01, F16.S02.M02, F16.S01.M01. Predecessor: [domain_schema.md](domain_schema.md).
