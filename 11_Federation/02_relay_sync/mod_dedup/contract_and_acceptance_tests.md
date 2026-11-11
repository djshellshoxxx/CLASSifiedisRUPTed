# PS-087-09 — Contract and acceptance tests: Federated dedup

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S02.M02 Federated dedup](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/relay_sync/dedup` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-087-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-087-09.R02** Property tests prove convergence of any arrival permutation of a valid chain at a fresh receiver and rejection of every splice.
- **PS-087-09.R03** Boundary tests cover each numeric limit at limit and limit plus one.

## Specification

See the module test table below (all processes).

**Fixtures:** Chain of 220 valid envelopes for author X on stream pub from fixed seeds (some createdAt older than 180 days, some tombstoned), seller S with 56 earlier thread envelopes, second author Y, 200 Sybil authors from one source, fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-087-09.T01 | unit | PS-087-01.R01, PS-087-01.R02, PS-087-02.R01 | decide for the duplicate, anchor, next, backfill, buffer, reanchor, fork and held_on_fork cases of the example | decision kinds as documented |
| TEST-PS-087-09.T02 | property | PS-087-03.R01, PS-087-03.R02, PS-087-09.R02 | random permutations and duplicates of a 50-envelope chain arriving at a fresh receiver | anchor at the first arrival; final accepted set equals the chain in seq order; every arrival yields at most one placement per seq; nothing lost |
| TEST-PS-087-09.T03 | unit | PS-087-01.R03, PS-087-02.R02, PS-087-02.R03, PS-087-09.R03 | gap of 100 and 101; 50th and 51st buffered for an author with history; 5th and 6th for a fresh author; 500th and 501st for one source; 5000th and 5001st total | at limit accepted; 101 returns reanchor with reason FEDERATION_GAP_TOO_LARGE; above the caps FEDERATION_BUFFER_FULL or eviction of the offending source |
| TEST-PS-087-09.T04 | property | PS-087-01.R04, PS-087-07.R03 | random splices of prev values, duplicated seq with different cid, and gaps without collisions | splices and collisions always fork; non-colliding gaps never fork and are eventually accepted |
| TEST-PS-087-09.T05 | unit | PS-087-03.R03, PS-087-04.R01 | order of unrelated authors permuted | each author's decision identical regardless of order |
| TEST-PS-087-09.T06 | unit | PS-087-04.R02, PS-087-04.R03, PS-087-05.R01, PS-087-05.R02, PS-087-05.R03 | inspect exports and signatures | only pure functions; no events; Result type; VerifiedEnvelope required by type; no key material reachable |
| TEST-PS-087-09.T07 | unit | PS-087-02.R01, PS-087-06.R01, PS-087-07.R03 | expired() with buffer rows at 23 h 59 min and 24 h 00 min; backwards clock jump | only the 24 h row is released with chainGap (none dropped); the jump does not extend the window |
| TEST-PS-087-09.T08 | unit | PS-087-06.R02, PS-087-06.R03 | repeat decide 1000 times and drain twice | identical results; second drain returns duplicates; no state written |
| TEST-PS-087-09.T09 | abuse | PS-087-07.R01, PS-087-07.R02 | one freshly anchored author forges 10 000 future seq numbers | at most 5 buffered, the rest refused; payload never read; no peer health report |
| TEST-PS-087-09.T10 | load | PS-087-08.R01, PS-087-08.R02, PS-087-08.R03 | 100 000 decisions and 5000-row expiry scan | decide p95 ≤ 0.2 ms, expired ≤ 10 ms, metrics exported, alert at 80 percent occupancy |
| TEST-PS-087-09.T11 | unit | PS-087-09.R01 | traceability tool run | every PS-087 requirement maps to a passing test |
| TEST-PS-087-09.T12 | unit | PS-087-10.R01, PS-087-10.R02, PS-087-10.R03 | decisions on golden chains from the previous release | identical decisions after upgrade; constants are exported for audit |
| TEST-PS-087-09.T13 | integration | PS-087-01.R02, PS-087-01.R04 | fresh vault receives an offer from stranger S at seq 37 of thread stream thr:A, then seq 38 | seq 37 anchor and accepted; seq 38 next |
| TEST-PS-087-09.T14 | integration | PS-087-02.R05, PS-087-01.R04 | peer relay joins after author X published 200 records, some older than 180 days and beyond their type maxAge and some tombstoned | aged-out and tombstoned predecessors become continuity stubs; every live record is accepted; the peer converges to the origin's live set |
| TEST-PS-087-09.T15 | abuse | PS-087-02.R04 | 200 Sybil authors from source P send 10 future-seq envelopes each while author Y with history sends 3 out-of-order envelopes through source Q | P capped at 500 with its oldest rows evicted first; Y's envelopes buffered and drained in order; none of Y's refused |
| TEST-PS-087-09.T16 | unit | PS-087-03.R02 | open conflict at (X, k1, pub, 7) with candidates A and B; envelope seq 8 with prev = A | held_on_fork, not buffered and not released at 24 h; after resolution keeping A it drains as next |

## Acceptance criteria

- All tests T01–T16 pass in CI.
- Any arrival order of a valid chain converges to the same accepted set at a fresh receiver, and a stranger's statement at any seq is accepted (property and integration tests).
- No input can make the buffer exceed its per-author, per-source or total caps, and a Sybil flood from one source cannot refuse another source's envelopes.

## Dependencies

Module depends on: F11.S01.M03, CTR-FED-001, CTR-ERR-001, CTR-OBS-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
