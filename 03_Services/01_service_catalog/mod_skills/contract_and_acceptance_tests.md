# PS-029-09 — Contract and acceptance tests: Service skills catalog

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S01.M01 Service skills catalog](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_catalog/skills` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-029-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-029-09.R02** Contract tests validate command inputs, outputs and event payloads against the schema registry.
- **PS-029-09.R03** Privacy tests prove that no credential evidence or area finer than L2 appears in the signed projection and that unverified inbound projections are quarantined.

## Specification

See the module test table below (all processes).

**Fixtures:** Seeded tenant, provider P with published service listing L, taxonomy codes svc.plumbing.repair and svc.tutoring.math, fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-029-09.T01 | unit | PS-029-01.R01, PS-029-01.R03, PS-029-02.R01 | create offering with valid input then revise the currency after publish | stored with revision 1; currency change returns SERVICES_RATE_IMMUTABLE |
| TEST-PS-029-09.T02 | unit | PS-029-02.R02, PS-029-02.R03 | each rule V01–V08 violated in turn | the documented code is returned and nothing is stored |
| TEST-PS-029-09.T03 | property | PS-029-03.R01 | random command sequences on one offering | only declared transitions succeed; withdrawn never leaves terminal state |
| TEST-PS-029-09.T04 | integration | PS-029-03.R02 | publish with listing unpublished and with missing calendar | PRECONDITION_FAILED or SERVICES_LISTING_NOT_SERVICE and no event |
| TEST-PS-029-09.T05 | integration | PS-029-03.R03, PS-029-04.R03 | bazaar.listing.unpublished event delivered twice and a relay refusal received | offering withdrawn once with reason listing_unavailable; relay refusal changes only sync state |
| TEST-PS-029-09.T06 | contract | PS-029-04.R01, PS-029-04.R02, PS-029-09.R02 | execute each command and read both queries | outputs and event payloads validate against registry schemas |
| TEST-PS-029-09.T07 | abuse | PS-029-05.R01, PS-029-05.R02, PS-029-05.R03 | foreign principal revises; inbound projection with bad signature and with wrong author key | FORBIDDEN; both inbound items quarantined and not returned by read_public |
| TEST-PS-029-09.T08 | integration | PS-029-06.R01, PS-029-06.R02, PS-029-06.R03 | replay same key with same and different body; crash between state change and outbox | original response replayed; IDEMPOTENCY_KEY_REUSED; atomic outcome |
| TEST-PS-029-09.T09 | abuse | PS-029-07.R01, PS-029-07.R02 | public read of published offering with credential evidence | no evidence reference and no cell finer than L2 in payload |
| TEST-PS-029-09.T10 | abuse | PS-029-07.R03 | 31 offering writes in one hour in one vault | 31st returns RATE_LIMITED |
| TEST-PS-029-09.T11 | load | PS-029-08.R01, PS-029-08.R02, PS-029-08.R03 | 1 000 offerings in vault, 100 mixed writes and reads on a throttled mobile profile | write p95 ≤ 100 ms, read p95 ≤ 50 ms, no network request made |
| TEST-PS-029-09.T12 | unit | PS-029-09.R01 | traceability tool run | every PS-029 requirement maps to a passing test |
| TEST-PS-029-09.T13 | integration | PS-029-10.R01, PS-029-10.R02, PS-029-10.R03 | export, import to a fresh relay, restore from backup | offerings round-trip identical; conflicting IDs rejected |
| TEST-PS-029-09.T14 | e2e | PS-029-01.R02, PS-029-03.R02, PS-029-09.R03 | mobile provider creates and publishes an offering and a client views it | credentials show self-attested; screen passes axe with zero serious issues |

## Acceptance criteria

- All tests T01–T14 pass in CI.
- No credential is ever displayed without the self-attested label and no verified flag exists in any payload.
- No public payload carries a service area finer than geohash 5.

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M03, F18.S01.M03, F09.S03.M01, F06.S02.M01, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
