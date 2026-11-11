# PS-011-09 — Contract and acceptance tests: Purchase offers

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S04.M01 Purchase offers](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/pricing/offers` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-011-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-011-09.R02** Contract tests check command input/output and event payloads against the schema registry.
- **PS-011-09.R03** The accept race is covered by a deterministic concurrency test.

## Specification

See the module test table below (all processes).

**Fixtures:** Seeded tenant, seller S with published sell listing L (EUR 50.00, qty 1), buyers B1 and B2; fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-011-09.T01 | unit | PS-011-01.R01, PS-011-01.R03, PS-011-02.R01 | make offer with valid input | Offer stored with status made, revision 1, amount unchanged |
| TEST-PS-011-09.T02 | unit | PS-011-02.R02, PS-011-02.R03 | each rule V02–V09 violated in turn | the documented error code is returned and nothing is stored |
| TEST-PS-011-09.T03 | property | PS-011-03.R01 | random sequences of commands on one offer | only declared transitions succeed; others return CONFLICT_STATE |
| TEST-PS-011-09.T04 | integration | PS-011-03.R02, PS-011-06.R03 | Deal port fails during accept | offer stays made, no hold exists, DEPENDENCY_UNAVAILABLE returned |
| TEST-PS-011-09.T05 | integration | PS-011-03.R03, PS-011-06.R02, PS-011-09.R03 | B1 and B2 offers accepted concurrently for qty 1 | one accepted, other CONFLICT_STATE, then expired superseded |
| TEST-PS-011-09.T06 | contract | PS-011-04.R01, PS-011-04.R02, PS-011-09.R02 | each command executes | output and emitted event payloads validate against registry schemas |
| TEST-PS-011-09.T07 | integration | PS-011-04.R03 | listing unpublished and block added events delivered | open offers expire or reject with documented reasons |
| TEST-PS-011-09.T08 | abuse | PS-011-05.R01, PS-011-05.R02, PS-011-07.R01 | non-owner accepts; third party queries offers; public listing view | FORBIDDEN or NOT_FOUND; no offer data in public payloads |
| TEST-PS-011-09.T09 | abuse | PS-011-05.R03 | moderator reads offers with and without an open case | allowed only with case |
| TEST-PS-011-09.T10 | integration | PS-011-06.R01 | same Idempotency-Key replayed with same and different body | original response replayed; IDEMPOTENCY_KEY_REUSED |
| TEST-PS-011-09.T11 | integration | PS-011-07.R02 | buyer deletes account | offer pseudonymized, seller still sees amount |
| TEST-PS-011-09.T12 | abuse | PS-011-07.R03 | 21 offers in one hour by one buyer | 21st returns RATE_LIMITED |
| TEST-PS-011-09.T13 | load | PS-011-08.R01, PS-011-08.R02 | 50 req/s mixed make/accept for 5 minutes | p95 ≤ 300 ms, metrics exported |
| TEST-PS-011-09.T14 | integration | PS-011-08.R03 | 10 000 overdue offers | sweep completes ≤ 5 s and lag gauge returns to 0 |
| TEST-PS-011-09.T15 | unit | PS-011-09.R01 | traceability tool run | every PS-011 requirement maps to a passing test |
| TEST-PS-011-09.T16 | integration | PS-011-10.R01, PS-011-10.R02, PS-011-10.R03 | export, re-import into fresh relay, and restore from backup | offers round-trip identical; import rejects conflicting IDs |
| TEST-PS-011-09.T17 | e2e | PS-011-01.R02, PS-011-04.R01 | mobile buyer makes offer, seller accepts on another device | both see accepted state; screen passes axe with zero serious issues |

## Acceptance criteria

- All tests T01–T17 pass in CI.
- No offer data appears in public, search or federation payloads (privacy test suite).
- Concurrent acceptance never produces two accepted offers for one unit (property and integration tests).

## Dependencies

Module depends on: F01.S01.M03, F01.S02.M01, F01.S03.M01, F09.S01.M01, F09.S03.M03, F07.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-MNY-001, CTR-IDM-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
