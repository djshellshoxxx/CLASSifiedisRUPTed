# PS-018-09 — Contract and acceptance tests: N-party cycle engine

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S02.M03 N-party cycle engine](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_matching/n` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-018-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-018-09.R02** Property tests prove every suggested cycle is elementary, uses each participant once, uses each item at most once, respects Lmax and budgets, and is deterministic for the same input.
- **PS-018-09.R03** Contract tests check command output and event payloads against the schema registry and verify relay signatures.
- **PS-018-09.R04** Fixtures include explicit 2-, 3-, 4- and 6-party cycles and a greedy conflict case.

## Specification

See the module test table below (all processes).

**Fixtures:** Graphs g2 (a1<->a2), g3 (a3,a4,a5), g4 (b1..b4), g6 (c1..c6 ring), gG (n1..n4 greedy case), gDense (1000 nodes, 5000 edges, seed 42); fixed clock 2026-11-04T10:00:00Z; seeded fast-check with 200 runs per PR and 10000 nightly.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-018-09.T01 | unit | PS-018-01.R01, PS-018-01.R02, PS-018-04.R01, PS-018-09.R04 | run on g2, g3, g4 | suggestions of length 2, 3, 4 with stable cycleKey rotated to smallest DID; no statement emitted |
| TEST-PS-018-09.T02 | unit | PS-018-01.R04, PS-018-02.R01, PS-018-02.R02 | Lmax 1 and 9, and graph with 2001 nodes | MUTINY_LMAX_INVALID and MUTINY_GRAPH_TOO_LARGE respectively |
| TEST-PS-018-09.T03 | property | PS-018-09.R02, PS-018-01.R01 | random graphs up to 60 nodes | every suggestion is elementary, has distinct participants, distinct items, length ≤ Lmax and receiverId of leg i equals giverId of leg i+1 |
| TEST-PS-018-09.T04 | property | PS-018-09.R02, PS-018-06.R02 | same random graph and parameters run twice, and with shuffled input order | byte-identical output and equal inputHash |
| TEST-PS-018-09.T05 | unit | PS-018-03.R01, PS-018-03.R02, PS-018-03.R03 | g6 with Lmax 5 and Lmax 8, and gG | no cycle at Lmax 5, 6-party cycle at Lmax 8, greedy picks the 4-party cycle and drops the overlapping 2-party one |
| TEST-PS-018-09.T06 | unit | PS-018-02.R02 | edges violating V03..V07 in turn | no edge is built for each violation and an explanation reason code is recorded |
| TEST-PS-018-09.T07 | unit | PS-018-02.R03, PS-018-02.R01 | relay suggestion with bad signature, with tombstoned listing, and valid one | first two MUTINY_SUGGESTION_UNVERIFIED or stored unverified and not proposable, third verified |
| TEST-PS-018-09.T08 | integration | PS-018-03.R03, PS-018-06.R01 | two consecutive runs on same graph | second run keeps suggestion id and refreshes expiresAt; no duplicate cycleKey |
| TEST-PS-018-09.T09 | integration | PS-018-04.R02, PS-018-04.R03, PS-018-06.R01 | replay generate with same key, different body, and parallel generate | stored result replayed; IDEMPOTENCY_KEY_REUSED; second parallel gets MUTINY_RUN_IN_PROGRESS |
| TEST-PS-018-09.T10 | contract | PS-018-04.R02, PS-018-09.R03 | each command and event | payloads validate against registry schemas classrup.mutiny.cycle_suggestion/v1 and event payloads |
| TEST-PS-018-09.T11 | integration | PS-018-04.R04, PS-018-03.R02 | consume want.withdrawn, block.added, cycle.declined | suggestions superseded, and declined cycleKey suppressed 30 days |
| TEST-PS-018-09.T12 | abuse | PS-018-05.R01, PS-018-05.R02, PS-018-05.R03 | other principal calls commands, relay operator reads suggestions | FORBIDDEN or NOT_FOUND; relay stats contain no edges |
| TEST-PS-018-09.T13 | abuse | PS-018-07.R01, PS-018-07.R04 | want younger than 15 minutes, implausible valuation, 7th run in an hour | excluded from graph and RATE_LIMITED respectively |
| TEST-PS-018-09.T14 | integration | PS-018-07.R02, PS-018-07.R03 | suggestion older than 30 days; relay compute_public delivery | purged by retention sweep; relay envelope is ciphertext only; relay ring store empty after delivery and absent from relay logs; no proposal or accept message is sent to the relay |
| TEST-PS-018-09.T15 | chaos | PS-018-06.R03, PS-018-03.R03 | kill the vault mid-run | previous suggestion set intact after restart, no partial records |
| TEST-PS-018-09.T16 | load | PS-018-08.R01, PS-018-08.R02, PS-018-08.R03 | gDense on reference relay, 100 runs | p95 ≤ 250 ms, truncation flagged when budget forced, metrics exported |
| TEST-PS-018-09.T17 | property | PS-018-09.R02, PS-018-02.R02 | budget 100000 expansions on adversarial dense graph | expansions never exceed 100000 and truncated is expansions or time |
| TEST-PS-018-09.T18 | unit | PS-018-09.R01 | traceability tool run | every PS-018 requirement maps to a passing test |
| TEST-PS-018-09.T19 | e2e | PS-018-05.R03 | mobile user opens suggestion, dismisses it | ring diagram text alternative present, badge reads 'rechecked against signed listings on this device' and never 'verified', axe zero serious issues, no network call made |
| TEST-PS-018-09.T20 | integration | PS-018-10.R01, PS-018-10.R02, PS-018-10.R03 | export, import into fresh vault, schema rollback | unexpired suggestions round-trip as unverified until re-verified; graph caches absent |
| TEST-PS-018-09.T21 | integration | PS-018-01.R03 | graph built at T0, clock injected to T0 + 24 h + 1 s | CompatibilityGraph purged by the retention sweep and get_stats returns NOT_FOUND for that run |
| TEST-PS-018-09.T22 | abuse | PS-018-07.R04, PS-018-02.R02 | 2-Sybil ring: two fresh did:key identities sharing a device key form a 3-ring with a real member | with default settings the ring is not suggested; with includeUnknownIdentities on it is flagged keyLinked, trust panel shows first seen 0 days and 0 completed trades, MUTINY_RING_KEY_LINKED without confirmation, simultaneous handover recommended |
| TEST-PS-018-09.T23 | unit | PS-018-02.R02, PS-018-01.R01 | pair distance from L2 cells u4pru and u4prv, an L1-only listing cell, and a 6-character cell | ordinal 0, at least 3, and DISCOVERY_PRECISION_FORBIDDEN rejection of the projection edge |
| TEST-PS-018-09.T24 | contract | PS-018-04.R05 | registry entry of classrup.mutiny.cycle_suggestion/v1 and relay push hook | signer role relay; compute_public calls notify.notification.dispatch once per delivered envelope with no content |
| TEST-PS-018-09.T25 | integration | PS-018-07.R05 | F10 export, deletion and retention sweep | section mutiny.suggestions exported; erased principal's suggestions and graphs deleted; graph caches purged at 24 h |
| TEST-PS-018-09.T26 | unit | PS-018-02.R05, PS-018-02.R02 | own want from list_open and peer want projection with minCondition good against items in like_new, good and fair; a want with budgetVisible false whose private maxBudget is below the item value; the same want with budgetVisible true | edges for like_new and good only; the private budget is ignored and the edge is built in vault and relay mode alike; with budgetVisible true the edge is refused with reason MUTINY_EDGE_INVALID |
| TEST-PS-018-09.T27 | contract | PS-018-02.R04, PS-018-02.R01 | relay tenant with maxCycleLength 3 and default 5; compute_public with lmax 4, without lmax, and with a TenantPort stub that fails; vault generate with lmax 8 | lmax 4 refused with MUTINY_LMAX_INVALID; without lmax the run uses lmax 3 and returns no 4-cycle, and with the default limit it uses lmax 5; failing TenantPort gives DEPENDENCY_UNAVAILABLE and no run; vault run with lmax 8 allowed |

## Acceptance criteria

- All tests T01–T27 pass in CI with seeds recorded.
- No suggestion is ever created as a proposal, reservation, consent or signed statement by the engine.
- Same inputHash and parameters produce identical suggestions on two different devices.

## Dependencies

Module depends on: F02.S02.M04, F02.S02.M05, F02.S04.M03, F01.S01.M01, F01.S02.M02, F01.S03.M01, F06.S02.M01, F07.S02.M02, F07.S02.M01, F07.S03.M01, F07.S03.M02, F09.S03.M02, F09.S03.M03, F11.S01.M01, F11.S01.M02, F16.S02.M03, F15.S01.M01, F15.S04.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-OBS-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
