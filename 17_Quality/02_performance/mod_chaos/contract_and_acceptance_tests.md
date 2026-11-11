# PS-138-09 — Contract and acceptance tests: Chaos testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S02.M02 Chaos testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/chaos` · **Contracts:** [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-138-09.R01** Every requirement of this module is covered by at least one automated test using the mapping in section 09.
- **PS-138-09.R02** A planted bug (consumer applies effect twice on redelivery) must be caught by the duplicate_delivery scenario.
- **PS-138-09.R03** A planted bug (expiry uses wall clock without monotonic guard) must be caught by clock_skew.

## Specification

See the module test table below (all processes).

**Fixtures:** Seeds 31, 32, 33 (smoke) and 1..30 (nightly); FakeClock 2026-11-04T10:00:00Z; FaultyStore wrapper around SQLite; FakePeer with scripted outage 10 min; offers and cycle execution as workload.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-138-09.T01 | unit | PS-138-01.R01, PS-138-01.R02, PS-138-02.R03 | validate a scenario file without seed or recovery | rejected with QUALITY_CHAOS_SCENARIO_INVALID |
| TEST-PS-138-09.T02 | integration | PS-138-01.R03, PS-138-02.R02, PS-138-04.R03 | scan production bundles and run with out-of-bound parameters | no chaos hooks; QUALITY_CHAOS_SCENARIO_INVALID for 31 s BUSY and 25 h skew |
| TEST-PS-138-09.T03 | chaos | PS-138-02.R01, PS-138-06.R01 | db_busy: SQLITE_BUSY for 12 s during accept commands | commands retried or DEPENDENCY_UNAVAILABLE; no half-commit; exactly-once after replay |
| TEST-PS-138-09.T04 | chaos | PS-138-03.R01, PS-138-03.R02, PS-138-06.R03 | consumer_crash: crash before and after ack on a cycle execution | no duplicate effect; orphan holds zero; recovery within 60 s |
| TEST-PS-138-09.T05 | chaos | PS-138-03.R03, PS-138-04.R02 | run each scenario twice in sequence | each starts from a fresh relay and database |
| TEST-PS-138-09.T06 | chaos | PS-138-04.R01, PS-138-04.R03, PS-138-09.R02 | duplicate_delivery with planted double-apply bug | invariant violated and exit 1 |
| TEST-PS-138-09.T07 | chaos | PS-138-06.R02, PS-138-09.R03 | clock_skew: minus 24 h then plus 24 h with planted wall-clock expiry bug | bug detected; correct implementation keeps expiries and revisions monotonic |
| TEST-PS-138-09.T08 | chaos | PS-138-05.R03 | peer_outage 10 min then recovery | local commands keep succeeding; federation deliveries resume without duplicate import; audit entries intact |
| TEST-PS-138-09.T09 | chaos | PS-138-05.R01, PS-138-05.R02 | scan relay for HTTP exposure of injection endpoints | none reachable; fake ports only |
| TEST-PS-138-09.T10 | abuse | PS-138-07.R02, PS-138-07.R03 | grep captured logs for P3 canary after each scenario | none found; retention config 30 days |
| TEST-PS-138-09.T11 | chaos | PS-138-07.R01, PS-138-08.R01, PS-138-08.R03 | run all scenarios and read the report | metrics present, recovery times recorded, seeds listed |
| TEST-PS-138-09.T12 | load | PS-138-08.R02 | smoke and nightly timing | 2 min and 30 min budgets met |
| TEST-PS-138-09.T13 | integration | PS-138-09.R01 | traceability tool run | every requirement maps to a passing test |
| TEST-PS-138-09.T14 | integration | PS-138-10.R01, PS-138-10.R02, PS-138-10.R03 | replay a failed run from its exported seed and fault schedule | same violation reproduced; v1 scenario schema enforced |
| TEST-PS-138-09.T15 | chaos | PS-138-06.R01 | combined_busy_crash: busy writes while consumer crashes | invariants hold and outbox drained |
| TEST-PS-138-09.T16 | chaos | PS-138-03.R04 | fork_conflict: conflicting signed reservations delivered in both orders | both vaults freeze; no last-writer-wins; renegotiation required |
| TEST-PS-138-09.T17 | chaos | PS-138-03.R04 | relay_tamper and revocation_lag scenarios | tampered statement quarantined with signature_invalid; statement by revoked key refused after revocation arrives |
| TEST-PS-138-09.T18 | chaos | PS-138-03.R04 | relay_down mid-flow | local records intact; status prepared; no claim of delivery |

## Acceptance criteria

- All five fault types (DB busy, consumer crash, duplicate delivery, clock skew, peer outage) are covered by passing scenarios.
- After each fault the invariant set holds and the outbox drains within 60 s.
- A planted double-apply bug is caught within the smoke profile.
- A failed run can be replayed exactly from its exported seed and fault schedule.

## Dependencies

Module depends on: CTR-EVT-001, CTR-IDM-001, CTR-ERR-001, CTR-FED-001, CTR-TST-001, CTR-OBS-001, F17.S01.M01, F17.S01.M03, F15.S02.M03. Predecessor: [domain_schema.md](domain_schema.md).
