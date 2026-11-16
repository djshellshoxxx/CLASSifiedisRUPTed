# PS-087-09 — Contract and acceptance tests: Federated dedup

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S02.M02 Federated dedup](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/relay_sync/dedup` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-087-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-087-09.R02** Property tests prove convergence of any arrival permutation of a valid chain and rejection of every splice.
- **PS-087-09.R03** Boundary tests cover each numeric limit at limit and limit plus one.

## Specification

See the module test table below (all processes).

**Fixtures:** Chain of 120 valid envelopes for author X from fixed seeds; second author Y; fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-087-09.T01 | unit | PS-087-09.R02, PS-087-01.R01, PS-087-01.R02, PS-087-02.R01 | decide for next, duplicate, buffer, fork, reject cases from the example | decision kinds as documented |
| TEST-PS-087-09.T02 | property | PS-087-01.R02, PS-087-03.R01, PS-087-03.R02, PS-087-09.R03 | random permutations and duplicates of a 50-envelope chain through decide and drain | final accepted order equals seq order; every arrival yields at most one next per seq |
| TEST-PS-087-09.T03 | unit | PS-087-02.R02, PS-087-02.R03, PS-087-01.R03 | gap of 100 and 101; 50th and 51st buffered for one author; 5000th and 5001st total | boundary accepted at limit, FEDERATION_GAP_TOO_LARGE or FEDERATION_BUFFER_FULL above |
| TEST-PS-087-09.T04 | property | PS-087-01.R01, PS-087-02.R01, PS-087-07.R03 | random splices of prev values and duplicated seq with different cid | never next; always fork or reject |
| TEST-PS-087-09.T05 | unit | PS-087-02.R01, PS-087-03.R03, PS-087-04.R01 | order of unrelated authors permuted | each author's decision identical regardless of order |
| TEST-PS-087-09.T06 | unit | PS-087-05.R03, PS-087-09.R02, PS-087-04.R02, PS-087-04.R03, PS-087-05.R01 | inspect exports and signatures | only pure functions; no events; Result type; VerifiedEnvelope required by type |
| TEST-PS-087-09.T07 | unit | PS-087-03.R01, PS-087-06.R01, PS-087-06.R02 | expired() with buffer rows at 23 h 59 min and 24 h 00 min; backwards clock jump | only the 24 h row expires; jump does not extend the window |
| TEST-PS-087-09.T08 | unit | PS-087-06.R03, PS-087-05.R02 | repeat decide 1000 times and drain twice | identical results; second drain returns duplicates; no state written |
| TEST-PS-087-09.T09 | abuse | PS-087-07.R01, PS-087-07.R02, PS-087-07.R03 | forge 10 000 future seq numbers for one author | at most 50 buffered; counters and peer report recorded; payload never read |
| TEST-PS-087-09.T10 | load | PS-087-08.R01, PS-087-08.R02, PS-087-08.R03 | 100 000 decisions and 5000-row expiry scan | decide p95 ≤ 0.2 ms, expired ≤ 10 ms, metrics exported |
| TEST-PS-087-09.T11 | unit | PS-087-09.R01 | traceability tool run | every PS-087 requirement maps to a passing test |
| TEST-PS-087-09.T12 | unit | PS-087-10.R01, PS-087-10.R02, PS-087-10.R03 | decisions on golden chains from the previous release | identical decisions after upgrade; constants are exported for audit |

## Acceptance criteria

- All tests T01–T12 pass in CI.
- Any arrival order of a valid chain converges to the same accepted order (property test).
- No input can make the buffer exceed 50 per author or 5000 total.

## Dependencies

Module depends on: F11.S01.M03, CTR-FED-001, CTR-ERR-001, CTR-OBS-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
