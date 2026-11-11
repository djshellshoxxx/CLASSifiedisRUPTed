# PS-138-09 — Contract and acceptance tests: Chaos testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S02.M02 Chaos testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/chaos` · **Contracts:** [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-138-09.R01** Every requirement of this module is covered by at least one automated test using the mapping in section 09.
- **PS-138-09.R02** A planted bug (consumer applies effect twice on redelivery) must be caught by the duplicate_delivery scenario.
- **PS-138-09.R03** A planted bug (an expired reservation is resurrected after the clock moves back) must be caught by clock_skew.

## Specification

See the module test table below (all processes).

**Fixtures:** Seeds 31, 32, 33 (smoke) and 1..30 (nightly); FakeClock 2026-11-04T10:00:00Z with one skewable clock per vault and one for the relay; FaultyStore wrapper around SQLite; FaultyIndexedDb wrapper around the vault storage/indexeddb adapter on fake-indexeddb; FakePeer with scripted outage 10 min; an unreachable vault outbox destination; the F17.S01.M03 trust-fault scenario definitions and oracle; offers, reservations, cycle execution and one hosted auction as workload.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-138-09.T01 | unit | PS-138-01.R01, PS-138-01.R02, PS-138-02.R03 | validate a scenario file without seed or recovery | rejected with QUALITY_CHAOS_SCENARIO_INVALID |
| TEST-PS-138-09.T02 | integration | PS-138-01.R03, PS-138-02.R02, PS-138-04.R03 | scan the production relay bundle and the vault (PWA) bundles, and run with out-of-bound parameters | no chaos hooks in either; QUALITY_CHAOS_SCENARIO_INVALID for 31 s BUSY and 25 h skew |
| TEST-PS-138-09.T03 | chaos | PS-138-02.R01, PS-138-06.R01 | db_busy: SQLITE_BUSY for 12 s during accept commands | commands retried or DEPENDENCY_UNAVAILABLE; no half-commit; exactly-once after replay |
| TEST-PS-138-09.T04 | chaos | PS-138-03.R01, PS-138-03.R02, PS-138-06.R03 | consumer_crash - crash before and after ack on a cycle execution | no duplicate effect; no hold past expiresAt in any participant vault reservation store; no stuck vault saga; recovery within 60 s |
| TEST-PS-138-09.T05 | chaos | PS-138-03.R03, PS-138-04.R02 | run each scenario twice in sequence | each starts from a fresh relay and database |
| TEST-PS-138-09.T06 | chaos | PS-138-04.R01, PS-138-04.R03, PS-138-06.R02, PS-138-09.R02 | duplicate_delivery - events and statements delivered twice and reordered, correct code then a planted double-apply bug | correct code dedupes by event ID and cid with one effect; the planted bug violates the invariant and exits 1 |
| TEST-PS-138-09.T07 | chaos | PS-138-06.R05, PS-138-09.R03 | clock_skew - vault Bob -24 h after reservation r1 expired; vault Carol +24 h holding live reservation r2 in an open cycle; vault clock skewed during a relay-hosted auction close lease; planted bug resurrecting an expired reservation | the planted bug is detected; with correct code ordering by seq, revision and outbox order is unchanged, r1 stays expired with its expiry event fired once, Carol expires r2 and the cycle by her own clock and the other vaults receive her signed withdrawal, and the auction lease follows the relay clock only |
| TEST-PS-138-09.T08 | chaos | PS-138-06.R04 | peer_outage 10 min then recovery, once by schedule and once with federation.peer.reinstated | local commands keep succeeding; deliveries resume at the next scheduled round within about 16 min of fake time, or within 60 s of reinstatement, without duplicate import |
| TEST-PS-138-09.T09 | chaos | PS-138-05.R01, PS-138-05.R02 | scan relay for HTTP exposure of injection endpoints | none reachable; fake ports only |
| TEST-PS-138-09.T10 | abuse | PS-138-07.R02, PS-138-07.R03 | grep captured logs for P3 canary after each scenario | none found; retention config 30 days |
| TEST-PS-138-09.T11 | chaos | PS-138-07.R01, PS-138-08.R01, PS-138-08.R03 | run all scenarios and read the report | metrics present, recovery times recorded, seeds listed |
| TEST-PS-138-09.T12 | load | PS-138-08.R02 | smoke and nightly timing | 2 min and 30 min budgets met |
| TEST-PS-138-09.T13 | integration | PS-138-09.R01 | traceability tool run | every requirement maps to a passing test |
| TEST-PS-138-09.T14 | integration | PS-138-10.R01, PS-138-10.R02, PS-138-10.R03 | replay a failed run from its exported seed and fault schedule | same violation reproduced; v1 scenario schema enforced |
| TEST-PS-138-09.T15 | chaos | PS-138-06.R01 | combined_busy_crash: busy writes while consumer crashes | invariants hold and outbox drained |
| TEST-PS-138-09.T16 | chaos | PS-138-03.R04 | fork_conflict: conflicting signed reservations delivered in both orders | both vaults freeze; no last-writer-wins; renegotiation required |
| TEST-PS-138-09.T17 | chaos | PS-138-03.R04 | reruns of relay_tamper and revocation_lag with random timing - (a) received before the revocation arrives and before revocationEffectiveFrom; (b) received after it arrives with a backdated createdAt; (c) received inside [effectiveFrom, arrival]; (d) effectiveFrom 31 days back | tampered statement rejected with FED_SIGNATURE_INVALID and quarantined; (a) valid; (b) refused with FEDERATION_SIGNER_ROLE_INVALID and listed in quarantine; (c) re-marked signed during claimed compromise with the dependent coordination frozen; (d) VALIDATION_FAILED; lag reported as arrival minus effectiveFrom, at most 30 days; same verdicts as the F17.S01.M03 oracle |
| TEST-PS-138-09.T18 | chaos | PS-138-03.R04 | relay_down mid-flow rerun with random timing | local records intact; OutboxEntry prepared; no claim of delivery; same verdict as the F17.S01.M03 oracle |
| TEST-PS-138-09.T19 | abuse | PS-138-05.R03 | issue a command the actor is not authorized for before and after db_busy and peer_outage faults | both attempts denied with the same code; both decisions have audit entries after recovery and none is lost |
| TEST-PS-138-09.T20 | chaos | PS-138-06.R04 | vault_outbox_outage - destination relay unreachable for 10 min, then Retry now after it returns | each of the 6 attempt delays lies in [0, min(30 s, 500 ms x 2^(n-1))], retryAfterMs honoured; entry failed with retry_exhausted after attempt 6 and no 7th attempt; after Retry now it reaches transport_acknowledged |
| TEST-PS-138-09.T21 | chaos | PS-138-03.R04 | reruns of signer_role_mismatch, relay_replay and relay_withhold_equivocate with 3 seeds each | each passes the F17.S01.M03 oracle; a missing rerun fails with QUALITY_CHAOS_TRUST_SCENARIO_MISSING |
| TEST-PS-138-09.T22 | chaos | PS-138-01.R03, PS-138-06.R03 | idb_abort - the vault storage/indexeddb adapter aborts the 3rd write of an offer-accept transaction | the whole transaction rolls back (no hold without a Deal); the sweep of each vault reservation store, saga state and sync outbox and of the relay queues shows nothing stuck |

## Acceptance criteria

- All five fault types (DB busy, consumer crash, duplicate delivery, clock skew, peer outage) are covered by passing scenarios.
- After each fault the invariant set holds within the scenario recovery bound (60 s for local faults; next scheduled round plus one IDM-4 cycle for peer outage; failed then Retry now for a vault outbox outage).
- Every F17.S01.M03 trust-fault suite passes its oracle under randomised fault timing.
- A planted double-apply bug is caught within the smoke profile.
- A failed run can be replayed exactly from its exported seed and fault schedule.

## Dependencies

Module depends on: CTR-EVT-001, CTR-IDM-001, CTR-ERR-001, CTR-FED-001, CTR-TST-001, CTR-OBS-001, F17.S01.M01, F17.S01.M03, F15.S02.M03, F15.S01.M01, F11.S02.M01, F11.S01.M02, F01.S03.M01, F16.S02.M02, F16.S01.M01. Predecessor: [domain_schema.md](domain_schema.md).
