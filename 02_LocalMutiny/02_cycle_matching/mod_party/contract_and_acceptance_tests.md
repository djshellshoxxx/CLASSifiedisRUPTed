# PS-019-09 — Contract and acceptance tests: Matching participant eligibility

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S02.M04 Matching participant eligibility](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_matching/party` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-019-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-019-09.R02** Contract tests verify the projection envelope against CTR-FED-001 and the schema registry, and that exclusions never appear in it.
- **PS-019-09.R03** Abuse tests cover forged, replayed and future-dated projections.

## Specification

See the module test table below (all processes).

**Fixtures:** Principal did:key:z6MkAlice with home region u0qj; peers Bob and Carol; fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-019-09.T01 | unit | PS-019-01.R01, PS-019-02.R01, PS-019-02.R02 | update with each of V01..V06 violated (V07..V10 in T03 and T20) in turn | documented error code and nothing stored |
| TEST-PS-019-09.T02 | contract | PS-019-01.R02, PS-019-04.R02, PS-019-07.R02, PS-019-09.R02, PS-019-09.R03 | opt in with 2 exclusions | projection validates against schema, contains exactly the public fields, excludedActorIds absent from projection, events and logs |
| TEST-PS-019-09.T03 | unit | PS-019-01.R03, PS-019-02.R03, PS-019-04.R04 | ingest valid, bad signature, lower seq, broken prev, future createdAt, and a projection of a DID the principal blocked | accepted once, other four quarantined or ignored with reasons, blocked DID dropped silently; signer role matches the F11.S01.M01 registry entry |
| TEST-PS-019-09.T04 | property | PS-019-03.R01, PS-019-03.R02 | random sequences of update commands | seq increments by exactly 1 per public change; opt-out always yields tombstone |
| TEST-PS-019-09.T05 | integration | PS-019-03.R02, PS-019-06.R03 | opt out while all relays unreachable | tombstone queued with state prepared and delivered on reconnect |
| TEST-PS-019-09.T06 | unit | PS-019-03.R03 | pausedUntil passes with injected clock | state returns to opted_in without any statement |
| TEST-PS-019-09.T07 | integration | PS-019-04.R01, PS-019-04.R03, PS-019-06.R01 | replay update with same key and different body | original response replayed; IDEMPOTENCY_KEY_REUSED |
| TEST-PS-019-09.T08 | abuse | PS-019-05.R01, PS-019-05.R02, PS-019-07.R01 | other actor updates profile; projection signed by wrong DID; request logs inspected | FORBIDDEN or quarantine; no exclusion in any log |
| TEST-PS-019-09.T09 | contract | PS-019-04.R02 | sync state progression with fake relay | UI model shows only the reached state among local_committed, prepared, transport_acknowledged, peer_accepted |
| TEST-PS-019-09.T10 | abuse | PS-019-07.R03, PS-019-07.R01 | opt-in without confirmation; replay of old projection after tombstone | MUTINY_OPTIN_REQUIRED; old projection ignored |
| TEST-PS-019-09.T11 | integration | PS-019-06.R02, PS-019-06.R01 | two devices update concurrently | resolve prompt surfaced, higher seq wins public projection after confirmation |
| TEST-PS-019-09.T12 | load | PS-019-08.R03 | check_eligible for 8 actors and list_known for 200 | within budgets on emulated Moto G |
| TEST-PS-019-09.T13 | unit | PS-019-09.R01 | traceability tool run | every PS-019 requirement maps to a passing test |
| TEST-PS-019-09.T14 | integration | PS-019-10.R01, PS-019-10.R02, PS-019-10.R03 | export, import to fresh vault, rollback | local profile round-trips with exclusions; peer mirrors imported read-only |
| TEST-PS-019-09.T15 | e2e | PS-019-07.R03 | mobile user opts in and out | disclosure shown with the relay matching limit, fetched-copy warning shown, axe zero serious issues |
| TEST-PS-019-09.T16 | unit | PS-019-08.R01 | local diagnostics after update and ingest | outcomes recorded without DIDs or exclusions; nothing transmitted |
| TEST-PS-019-09.T17 | contract | PS-019-08.R02 | relay deployment ingests valid, stale and invalid projections | classrup_mutiny_profile_ingest_total counts per outcome exported per CTR-OBS-001 without DIDs |
| TEST-PS-019-09.T18 | abuse | PS-019-05.R03 | relay refuses to index, rewrites or replays a projection | refusal removes only that relay's copy; rewritten projection fails signature; replay ignored; no relay request can change the local profile |
| TEST-PS-019-09.T19 | unit | PS-019-02.R01 | update with an unknown field and maxDistanceBucket 5 or '10_25' | VALIDATION_FAILED and nothing stored |
| TEST-PS-019-09.T20 | integration | PS-019-07.R04, PS-019-07.R02 | federation_publish granted for relay A only; regionL1 of 5 characters; consent withdrawn for A; vault erased | projection sent to A only; DISCOVERY_PRECISION_FORBIDDEN; tombstone queued to A; local profile purged after the tombstone |

## Acceptance criteria

- All tests T01–T20 pass in CI.
- Exclusions are never present in any projection, event payload, log line or relay request (privacy suite).
- Opt-in requires explicit versioned confirmation and opt-out always produces a signed tombstone.

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M02, F06.S02.M01, F06.S02.M02, F16.S02.M03, F12.S03.M04, F15.S01.M01, F11.S01.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
