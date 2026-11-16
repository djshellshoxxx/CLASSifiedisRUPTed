# PS-051-09 — Contract and acceptance tests: Relevance ranking

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S03.M01 Relevance ranking](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/ranking/relevance` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-051-09.R01** Every requirement is covered by at least one automated test, including golden score vectors.
- **PS-051-09.R02** Determinism is proven by repeated runs and by cross-platform comparison between browser and Node.
- **PS-051-09.R03** Promotion cap and label rules have dedicated tests.

## Specification

See the module test table below (all processes).

**Fixtures:** Candidate set of 100 documents with known bm25, ages, buckets and promotion flags; default config version 1; fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-051-09.T01 | unit | PS-051-01.R01, PS-051-02.R01 | publish valid config | version 4 active, previous version 3 retired, one active row |
| TEST-PS-051-09.T02 | unit | PS-051-02.R01, PS-051-02.R02, PS-051-02.R03 | weights sum 1.1, boost 0.3, half-life 0, non-monotonic distance weights | RANKING_CONFIG_INVALID each time, nothing stored |
| TEST-PS-051-09.T03 | unit | PS-051-01.R02, PS-051-01.R03 | golden score vectors for text, recency, distance, promotion | final scores equal the golden values to 6 decimals; promoted multiplier never above 1.25 |
| TEST-PS-051-09.T04 | property | PS-051-03.R01, PS-051-03.R02, PS-051-03.R03 | random concurrent publish and rollback attempts | at every point exactly one active version; retired never reactivated |
| TEST-PS-051-09.T05 | property | PS-051-01.R02, PS-051-06.R03 | 200 runs of the same ranking | identical order; ties resolved by firstSeenAt then documentId |
| TEST-PS-051-09.T06 | contract | PS-051-04.R01, PS-051-04.R02, PS-051-04.R03, PS-051-09.R02 | commands, query and event run | outputs and statement validate against registry schemas and the signature verifies |
| TEST-PS-051-09.T07 | abuse | PS-051-05.R01, PS-051-05.R02, PS-051-05.R03 | member publishes; anonymous reads; operator of relay A publishes on relay B | FORBIDDEN for the first and last; read allowed |
| TEST-PS-051-09.T08 | integration | PS-051-06.R01, PS-051-06.R02 | same Idempotency-Key replayed; crash between insert and retire | original response replayed; exactly one active version after restart |
| TEST-PS-051-09.T09 | abuse | PS-051-07.R01, PS-051-07.R02, PS-051-01.R03 | document with future claimedPublishedAt and expired promotion flag | recency uses firstSeenAt; no multiplier and no label |
| TEST-PS-051-09.T10 | abuse | PS-051-07.R03, PS-051-02.R03 | 11th publication in 24 h and tampered signed config | RATE_LIMITED; client rejects the tampered statement |
| TEST-PS-051-09.T11 | load | PS-051-08.R01, PS-051-08.R02, PS-051-08.R03 | score 1 000 candidates on emulated device and relay | p95 <= 20 ms and <= 10 ms; metrics exported |
| TEST-PS-051-09.T12 | integration | PS-051-02.R03, PS-051-06.R03 | vault without relay config | bundled default used and explanation says default ranking |
| TEST-PS-051-09.T13 | unit | PS-051-09.R01, PS-051-09.R03 | traceability run over PS-051 | every requirement maps to a passing test |
| TEST-PS-051-09.T14 | integration | PS-051-10.R01, PS-051-10.R02, PS-051-10.R03 | restore relay from backup and import a config statement into a vault | active version preserved; vault ignores relay config for local ranking |

## Acceptance criteria

- All tests T01-T14 pass in CI.
- Golden score vectors match on Node and in the browser test runner.
- No configuration can produce a promotion multiplier above 1.25 or an unlabelled promoted result.

## Dependencies

Module depends on: F06.S02.M01, F06.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
