# PS-007-09 — Contract and acceptance tests: Wanted listing type

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S02.M02 Wanted listing type](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listing_types/wanted` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-007-09.R01** Every requirement is covered by at least one automated test.
- **PS-007-09.R02** Contract tests validate command outputs and event payloads against the registry.
- **PS-007-09.R03** Lifecycle tests run listing events in duplicated and out-of-order delivery.

## Specification

See the module test table below (all processes).

**Fixtures:** Vault with draft wanted listing W, published wanted listing X, categories C1 (active leaf) and C2 (retired), clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-007-09.T01 | unit | PS-007-01.R01, PS-007-01.R02, PS-007-02.R01, PS-007-02.R02 | define a valid want with private budget | stored; keywords normalized; budget absent from projection builder output |
| TEST-PS-007-09.T02 | unit | PS-007-01.R03, PS-007-02.R03 | violate each rule V01-V09 | documented error code returned and nothing stored |
| TEST-PS-007-09.T03 | property | PS-007-03.R01, PS-007-03.R02, PS-007-03.R03 | random owner commands and duplicated listing events | only declared transitions; terminal states never regress; open implies listing published |
| TEST-PS-007-09.T04 | contract | PS-007-04.R01, PS-007-04.R02, PS-007-09.R02 | define, fulfil and withdraw | outputs and events validate; event payloads carry no budget or keywords |
| TEST-PS-007-09.T05 | integration | PS-007-04.R03, PS-007-05.R03 | list_open as owner, as matching module and as relay-facing call | private fields for owner and matching module only; relay-facing path sees projection fields only |
| TEST-PS-007-09.T06 | abuse | PS-007-05.R01, PS-007-05.R02 | another principal defines or withdraws | FORBIDDEN or NOT_FOUND |
| TEST-PS-007-09.T07 | integration | PS-007-06.R01, PS-007-06.R02 | replay define; deliver bazaar.listing.published twice | one want, one declared event |
| TEST-PS-007-09.T08 | integration | PS-007-06.R03 | handler fails after transition | handler rolled back; retried; want never open while listing unpublished |
| TEST-PS-007-09.T09 | integration | PS-007-06.R03 | edit offline then send projection | unsent state shown; no relay-accepted claim without receipt |
| TEST-PS-007-09.T10 | abuse | PS-007-07.R01, PS-007-07.R02, PS-007-07.R03 | scan events, logs and projection; delete listing | budget absent everywhere; tombstone after purge; public-keywords notice present |
| TEST-PS-007-09.T11 | abuse | PS-007-07.R03 | create 101st open want and 31st define in an hour | BAZAAR_WANT_LIMIT and RATE_LIMITED |
| TEST-PS-007-09.T12 | load | PS-007-08.R01, PS-007-08.R02, PS-007-08.R03 | 100 wants on Moto G profile | define p95 <= 60 ms, list p95 <= 100 ms, event handling p95 <= 30 ms, no network |
| TEST-PS-007-09.T13 | unit | PS-007-09.R01, PS-007-09.R03 | traceability tool run, duplicate-event seed replay | every PS-007 requirement maps to a passing test |
| TEST-PS-007-09.T14 | integration | PS-007-10.R01, PS-007-10.R02, PS-007-10.R03 | export, import into fresh vault, import want for foreign listing | round-trip identical; foreign want rejected; open imports as paused |

## Acceptance criteria

- All tests T01-T14 pass in CI.
- Budget never appears in events, logs or projections unless the owner turned budgetVisible on.
- A want is open only while its listing is published, under duplicated and out-of-order events.

## Dependencies

Module depends on: F01.S01.M01, F18.S01.M03, F09.S03.M01, F09.S03.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
